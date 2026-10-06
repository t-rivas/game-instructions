"use client";
import { GlossaryText } from "./GlossaryText";
import Link from "next/link";
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { learningSteps, migratedLesson, stageLabels, type LearningStage, type LearningStep } from "@/lib/learning-sequence";
import type { Game, Language, LessonCardTeaching, ToolState, Translation } from "@/lib/types";
import { LessonCardArt } from "./LessonCardArt";
import { LessonPractice } from "./LessonPractice";
import { LessonComparison } from "./LessonComparison";
import { useChangeMotion } from "@/lib/use-change-motion";
import { useLearningState } from "@/lib/learning-state";

export function LearningSequence({ id, game, lang, options, steps: basics, temporary, ready, cardTeaching, readyHref, ruleHref, setupChoice, setup, examples, scoring, practiceHelper }: {
  id: string; game: Game; lang: Language; options: ToolState; steps: Translation[];
  temporary: boolean; ready: boolean; cardTeaching: LessonCardTeaching; readyHref: string;
  ruleHref: (section: string) => string; setupChoice?: (changeSetup: () => void) => ReactNode; setup: (lesson: string) => ReactNode; examples: ReactNode; scoring?: ReactNode; practiceHelper?: ReactNode;
}) {
  const tr = (en: string, es: string) => lang === "es" ? es : en;
  const cards = Object.values(cardTeaching.cards).filter(card =>
    (!card.exchange || card.exchange === options.exchange) &&
    (!card.expansion || options.skullExpansion) &&
    (!card.role || (options.avalonMode !== "basic" && options.optional.includes(card.role))));
  const steps = learningSteps(id, game, basics, options);
  // One recognizable card per lesson; reuse the same facts and image viewer as item 01.
  const recognize: LearningStep[] = cards.map(card => ({id:`card-${card.id}`, stage:"components", title:card.name || card.art.title, card:card.id}));
  steps.splice(2, 0, ...recognize);
  const key = `tablefolk-${temporary ? "shared-" : ""}lesson-${id}`;
  const [selected, setSelected] = useState("objective");
  const contents = useRef<HTMLDetailsElement>(null);
  const heading = useRef<HTMLHeadingElement>(null), focusPending = useRef(false);
  useEffect(() => {
    if (!ready) return;
    try {
      let value = migratedLesson(id, sessionStorage.getItem(key));
      // Recover the former nested Avalon setup flow under stable lesson IDs.
      if (id === "avalon" && value === "basic-roles") {
        const legacy = sessionStorage.getItem(temporary ? "tablefolk-shared-avalon-step" : "tablefolk-avalon-step");
        if (legacy === "1") value = "avalon-prepare";
        if (legacy === "2") value = "avalon-opening";
      }
      setSelected(value);
      sessionStorage.setItem(key, value);
    } catch {}
  }, [id, key, ready, temporary]);
  const index = Math.max(0, steps.findIndex(step => step.id === selected));
  const current = steps[index];
  const lesson = useRef<HTMLDivElement>(null);
  useChangeMotion(lesson, index, "step");
  const [practiceChoices, setPracticeChoices] = useLearningState<Record<string, string>>(id, "concepts", {}, temporary);
  const decisions = cardTeaching.practice.filter(decision => decision.lessons.includes(current.id));
  const decision = decisions.find(item => item.id === practiceChoices[current.id]) || decisions[0];
  const choose = (next: string) => {
    if (contents.current) contents.current.open = false;
    focusPending.current = true;
    setSelected(next);
    try {
      sessionStorage.setItem(key, next);
      if (id === "avalon" && ["basic-roles", "avalon-prepare", "avalon-opening"].includes(next)) {
        sessionStorage.setItem(temporary ? "tablefolk-shared-avalon-step" : "tablefolk-avalon-step", String(["basic-roles", "avalon-prepare", "avalon-opening"].indexOf(next)));
      }
    } catch {}
    if (next === selected) {focusPending.current = false; heading.current?.focus();}
  };
  useLayoutEffect(() => {
    if (focusPending.current) {focusPending.current = false; heading.current?.focus();}
  }, [selected]);
  const turn = steps.find(step => step.stage === "turn")!.id;
  const firstSetup = steps.find(step => step.stage === "setup")!.id;
  // Links to content that is now inside a stage must reveal that stage first.
  useEffect(() => {
    if (!ready) return;
    const reveal = () => {
      const hash = window.location.hash;
      const target = hash === "#learn-setup" || hash === "#setup-notes" ? firstSetup
        : hash === "#scoring-example" && scoring ? "basic-score"
        : hash === ({skull_king: "#skull-trick-lesson", coup: "#coup-lesson", avalon: "#avalon-lesson"} as Record<string, string>)[id]
          ? "example" : undefined;
      if (!target) return;
      focusPending.current = true;
      setSelected(target);
      try { sessionStorage.setItem(key, target); } catch {}
      const notes = document.getElementById("setup-notes");
      if (hash === "#setup-notes" && notes instanceof HTMLDetailsElement) notes.open = true;
      // Also handle repeated links to the already selected stage.
      requestAnimationFrame(() => {
        const content = document.getElementById(hash.slice(1));
        const title = content?.querySelector<HTMLElement>("h2, h3, summary");
        if (title) { title.tabIndex = -1; title.focus(); }
        else heading.current?.focus();
        content?.scrollIntoView({block: "start"});
      });
    };
    reveal();
    window.addEventListener("hashchange", reveal);
    window.addEventListener("tablefolk-guide-location", reveal);
    return () => {
      window.removeEventListener("hashchange", reveal);
      window.removeEventListener("tablefolk-guide-location", reveal);
    };
  }, [id, key, ready, firstSetup, !!scoring]);
  const cardIds = current.card ? [current.card] : current.basic !== undefined && current.stage !== "setup" ? cardTeaching.steps[current.basic] || [] : [];
  const shownCards = cards.filter(card => cardIds.includes(card.id));
  return <section id="basics" className="block learning-sequence">
    <div className="lesson-heading">
      <span className="lesson-counter" role="status" aria-atomic="true">{index + 1} / {steps.length} · {stageLabels[current.stage][lang]}</span>
      <details ref={contents} id="lesson-overview" className="lesson-overview" onKeyDown={event => {
        if (event.key === "Escape" && contents.current?.open) {
          event.preventDefault();
          contents.current.open = false;
          contents.current.querySelector("summary")?.focus();
        }
      }}>
        <summary>{tr("Contents", "Contenido")}</summary>
        <nav aria-label={tr("Lesson contents", "Contenido de las lecciones")}>
          <div className="learning-shortcuts">
            <button id="already-set-up" type="button" onClick={() => choose(id === "chess" ? "piece-king" : turn)}>{tr("Already set up?", "¿Ya está todo preparado?")} →</button>
          </div>
          {(Object.keys(stageLabels) as LearningStage[]).map(stage => <div className="contents-stage" key={stage}>
            <h3>{stageLabels[stage][lang]}</h3>
            <ol className="learning-overview">{steps.filter(step => step.stage === stage).map((step, i) => <li key={step.id}>
              <button type="button" data-lesson-target={step.id} data-learning-stage={i === 0 ? stage : undefined}
                onClick={() => choose(step.id)} aria-current={current.id === step.id ? "step" : undefined}>{step.title[lang]}</button>
            </li>)}</ol>
          </div>)}
        </nav>
      </details>
    </div>
    {setupChoice?.(() => choose(firstSetup))}
    <div ref={lesson} className="lesson" data-learning-step={current.id} data-current-stage={current.stage}>
      <div className="lesson-copy">
        <h3 ref={heading} tabIndex={-1}>{current.title[lang]}</h3>
        {current.text ? <p className="lesson-explanation">{<GlossaryText game={id} text={current.text[lang]} lang={lang} explain={false} />}</p> : null}
        {current.id === "components" ? <>
          {cardTeaching.components ? <LessonCardArt id={cardTeaching.components.officialId || `${id}-components`} art={cardTeaching.components} lang={lang} presentation="components" /> : null}
        </> : null}
        {current.art && cardTeaching.pieces?.[current.art] ? <LessonCardArt id={current.art} art={cardTeaching.pieces[current.art]} lang={lang} /> : null}
        {current.rule ? <><p>{tr("Every move must leave your king safe. You cannot land on your own piece.", "Toda jugada debe dejar a tu rey a salvo. No puedes ocupar una casilla con una pieza propia.")}</p>
          <Link prefetch={false} href={ruleHref(current.rule)}>{tr("Movement rules", "Reglas de movimiento")} →</Link>
          <details><summary>{tr("Special moves", "Jugadas especiales")}</summary>{game.sections.find(s=>s.id === "special")?.paragraphs.map((p,i)=><p key={i}>{p[lang]}</p>)}</details></> : null}
      </div>
      {shownCards.length ? <div className="lesson-cards" aria-label={tr("Cards in this step", "Cartas de este paso")}>
        <div className="lesson-cards-grid">{shownCards.map(card => <article className="lesson-card" data-lesson-card={card.id} key={card.id}>
          <LessonCardArt id={card.id} art={card.art} lang={lang} />
          <div className="lesson-card-copy">{!current.card ? <h4>{(card.name || card.art.title)[lang]}</h4> : null}<p>{<GlossaryText game={id} text={card.effect[lang]} lang={lang} explain={false} />}</p>
            <p><strong>{tr("When it matters:", "Cuándo importa:")}</strong> {<GlossaryText game={id} text={card.when[lang]} lang={lang} explain={false} />}</p>
            {card.note ? <small>{card.note[lang]}</small> : null}
            <Link prefetch={false} href={ruleHref(card.rule)}>{tr("Read the full rule", "Leer la regla completa")} →</Link>
          </div>
        </article>)}</div>
      </div> : null}
      {/* Keep tools mounted: navigating a lesson must not reset setup or an example. */}
      {cardTeaching.comparisons?.filter(comparison => comparison.lessons.includes(current.id)).map(comparison =>
        <LessonComparison key={comparison.id} game={id} data={comparison} artwork={cardTeaching.comparisonArtwork || {}}
          lang={lang} temporary={temporary} ruleHref={ruleHref} />)}
      <div hidden={current.stage !== "setup"}>{setup(current.id)}</div>
      <div hidden={current.id !== "example"}>{examples}</div>
      <div hidden={current.id !== "basic-score"}>{scoring}</div>
      <div hidden={!({poker:["basic-streets","basic-showdown"],moth:["basic-discard"]} as Record<string,string[]>)[id]?.includes(current.id)}>
        {practiceHelper ? <details className="optional-practice">
          <summary>{tr("Optional practice", "Práctica opcional")}</summary>
          {practiceHelper}
          <div className="practice-actions"><button type="button" onClick={() => document.getElementById(id === "poker" ? "street-0" : "guess-1")?.focus()}>{tr("Revisit example", "Volver al ejemplo")}</button>
            <button type="button" data-practice-continue onClick={() => choose(steps[index+1]?.id || "finish")}>{tr("Skip / Continue", "Saltar / Seguir")} →</button></div>
        </details> : null}
      </div>
      {decision ? <details className="optional-practice" key={current.id}>
        <summary>{tr("Optional practice", "Práctica opcional")}</summary>
        {decisions.length > 1 ? <label className="practice-picker">{tr("Choose a decision", "Elige una decisión")}<select value={decision.id}
          onChange={event => setPracticeChoices(old => ({...old,[current.id]:event.target.value}))}>{decisions.map(item => <option key={item.id} value={item.id}>{item.question[lang]}</option>)}</select></label> : null}
        <LessonPractice game={id} decision={decision} lang={lang} temporary={temporary} cards={cardTeaching.cards} ruleHref={ruleHref}
          onContinue={() => choose(steps[index+1]?.id || "finish")}
          onRevisit={() => {
            choose(decision.revisit);
            requestAnimationFrame(() => {
              window.dispatchEvent(new CustomEvent("tablefolk-revisit-example", {detail:{game:id, example:decision.example, fact:decision.exampleFact}}));
              if (decision.revisit === "basic-score" && scoring) {
                const title = document.getElementById("scoring-heading");
                title?.focus();
                title?.scrollIntoView({block:"start"});
              } else if (decision.revisit === current.id) heading.current?.focus();
            });
          }} />
      </details> : null}
      <div className="lesson-buttons">
        <button type="button" id="lesson-prev" disabled={index === 0} onClick={() => choose(steps[index-1].id)}>{tr("Previous", "Anterior")}</button>
        {index < steps.length-1 ? <button type="button" id="lesson-next" className="accent-button" onClick={() => choose(steps[index+1].id)}>
          {tr("Next", "Siguiente")} →
        </button> : <Link prefetch={false} className="accent-button" href={readyHref}>{tr("Go to the table", "Ir a la mesa")} →</Link>}
      </div>
    </div>
  </section>;
}
