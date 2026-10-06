"use client";
import { editionLabel } from "@/lib/guide-link";
import { GlossaryText } from "./GlossaryText";
import Link from "next/link";
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { learningSteps, migratedLesson, stageLabels, type LearningStage, type LearningStep } from "@/lib/learning-sequence";
import type { Game, Language, LessonCardTeaching, ToolState, Translation } from "@/lib/types";
import { LessonCardArt } from "./LessonCardArt";
import { LessonPractice } from "./LessonPractice";
import { useLearningState } from "@/lib/learning-state";

export function LearningSequence({ id, game, lang, options, steps: basics, temporary, ready, cardTeaching, readyHref, ruleHref, setup, examples, scoring, practiceHelper }: {
  id: string; game: Game; lang: Language; options: ToolState; steps: Translation[];
  temporary: boolean; ready: boolean; cardTeaching: LessonCardTeaching; readyHref: string;
  ruleHref: (section: string) => string; setup: (onContinue: () => void) => ReactNode; examples: ReactNode; scoring?: ReactNode; practiceHelper?: ReactNode;
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
  const heading = useRef<HTMLHeadingElement>(null), focusPending = useRef(false);
  useEffect(() => {
    if (!ready) return;
    try {
      const value = migratedLesson(id, sessionStorage.getItem(key));
      setSelected(value);
      sessionStorage.setItem(key, value);
    } catch {}
  }, [id, key, ready]);
  const index = Math.max(0, steps.findIndex(step => step.id === selected));
  const current = steps[index];
  const [practiceChoices, setPracticeChoices] = useLearningState<Record<string, string>>(id, "concepts", {}, temporary);
  const decisions = cardTeaching.practice.filter(decision => decision.lessons.includes(current.id));
  const decision = decisions.find(item => item.id === practiceChoices[current.id]) || decisions[0];
  const choose = (next: string) => {
    focusPending.current = true;
    setSelected(next);
    try { sessionStorage.setItem(key, next); } catch {}
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
  const stageSteps = steps.filter(step => step.stage === current.stage);
  const cardIds = current.card ? [current.card] : current.basic !== undefined && current.stage !== "setup" ? cardTeaching.steps[current.basic] || [] : [];
  const shownCards = cards.filter(card => cardIds.includes(card.id));
  return <section id="basics" className="block learning-sequence">
    <div className="lesson-heading"><h2>{tr("Learn at your pace", "Aprende a tu ritmo")}</h2>
      <span className="lesson-counter" role="status">{index + 1} / {steps.length}</span>
    </div>
    <div className="learning-shortcuts">
      <button id="already-set-up" type="button" onClick={() => choose(id === "chess" ? "piece-king" : turn)}>{tr("Already set up?", "¿Ya está todo preparado?")} →</button>
      <Link prefetch={false} href={ruleHref("")}>{tr("Full rules", "Reglas completas")}</Link>
    </div>
    <nav className="learning-stages" aria-label={tr("Learning stages", "Etapas de aprendizaje")}>
      {(Object.keys(stageLabels) as LearningStage[]).map((stage,i) => <button type="button" data-learning-stage={stage} key={stage}
        aria-current={stage === current.stage ? "step" : undefined} onClick={() => choose(steps.find(step => step.stage === stage)!.id)}>
        <span>{i + 1}</span>{stageLabels[stage][lang]}</button>)}
    </nav>
    {stageSteps.length > 1 ? <div className="learning-step-picker">
      <label htmlFor="learning-step">{tr("In this stage", "En esta etapa")}</label>
      <select id="learning-step" value={current.id} onChange={event => choose(event.target.value)}>
        {stageSteps.map(step => <option value={step.id} key={step.id}>{step.title[lang]}</option>)}
      </select>
    </div> : null}
    <div className="lesson" data-learning-step={current.id}>
      <div className="lesson-copy">
        {["coup", "skull_king", "sushi_go_party"].includes(id) ? <p className="muted lesson-setup-label">{editionLabel(id, game, options, lang)}</p> : null}
        <span className="eyebrow muted">{stageLabels[current.stage][lang]} · {stageSteps.findIndex(step => step.id === current.id) + 1} / {stageSteps.length}</span>
        <h3 ref={heading} tabIndex={-1}>{current.title[lang]}</h3>
        {current.text ? <p>{<GlossaryText game={id} text={current.text[lang]} lang={lang} />}</p> : null}
        {current.id === "components" ? <>
          <p>{tr("Find these components before continuing. The next steps show how to use them.", "Identifica estos componentes antes de seguir. Los próximos pasos muestran cómo usarlos.")}</p>
          {cardTeaching.components ? <LessonCardArt id={cardTeaching.components.officialId || `${id}-components`} art={cardTeaching.components} lang={lang} /> : null}
        </> : null}
        {current.art && cardTeaching.pieces?.[current.art] ? <LessonCardArt id={current.art} art={cardTeaching.pieces[current.art]} lang={lang} /> : null}
        {current.rule ? <><p>{tr("Every move must leave your king safe. You cannot land on your own piece.", "Toda jugada debe dejar a tu rey a salvo. No puedes ocupar una casilla con una pieza propia.")}</p>
          <Link prefetch={false} href={ruleHref(current.rule)}>{tr("Movement rules", "Reglas de movimiento")} →</Link>
          <details><summary>{tr("Special moves", "Jugadas especiales")}</summary>{game.sections.find(s=>s.id === "special")?.paragraphs.map((p,i)=><p key={i}>{p[lang]}</p>)}</details></> : null}
      </div>
      {shownCards.length ? <div className="lesson-cards" aria-label={tr("Cards in this step", "Cartas de este paso")}>
        <div className="lesson-cards-grid">{shownCards.map(card => <article className="lesson-card" data-lesson-card={card.id} key={card.id}>
          <LessonCardArt id={card.id} art={card.art} lang={lang} />
          <div className="lesson-card-copy"><h4>{(card.name || card.art.title)[lang]}</h4><p>{<GlossaryText game={id} text={card.effect[lang]} lang={lang} explain={current.card !== undefined} />}</p>
            <p><strong>{tr("When it matters:", "Cuándo importa:")}</strong> {<GlossaryText game={id} text={card.when[lang]} lang={lang} explain={current.card !== undefined} />}</p>
            {card.note ? <small>{card.note[lang]}</small> : null}
            <Link prefetch={false} href={ruleHref(card.rule)}>{tr("Read the full rule", "Leer la regla completa")} →</Link>
          </div>
        </article>)}</div>
      </div> : null}
      {/* Keep tools mounted: navigating a lesson must not reset setup or an example. */}
      <div hidden={current.stage !== "setup"}>{setup(() => choose(steps[index + 1]?.stage === "setup" ? steps[index + 1].id : turn))}</div>
      <div hidden={current.id !== "example"}>{examples}</div>
      <div hidden={current.id !== "basic-score"}>{scoring}</div>
      <div hidden={!({poker:["basic-streets","basic-showdown"],moth:["basic-discard"]} as Record<string,string[]>)[id]?.includes(current.id)}>
        {practiceHelper ? <section className="lesson-practice" aria-label={tr("Optional practice", "Práctica opcional")}>
          <p className="eyebrow">{tr("Optional · try the example", "Opcional · prueba el ejemplo")}</p>
          {practiceHelper}
          <div className="practice-actions"><button type="button" onClick={() => document.getElementById(id === "poker" ? "street-0" : "guess-1")?.focus()}>{tr("Revisit example", "Volver al ejemplo")}</button>
            <button type="button" data-practice-continue onClick={() => choose(steps[index+1]?.id || "finish")}>{tr("Skip / Continue", "Saltar / Seguir")} →</button></div>
        </section> : null}
      </div>
      {decision ? <>
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
      </> : null}
      {current.id === "finish" ? <p>{game.reminder[lang]}</p> : null}
      <div className="lesson-buttons">
        <button type="button" id="lesson-prev" disabled={index === 0} onClick={() => choose(steps[index-1].id)}>{tr("Previous", "Anterior")}</button>
        {index < steps.length-1 ? <button type="button" id="lesson-next" className="accent-button" onClick={() => choose(steps[index+1].id)}>
          {tr("Next", "Siguiente")}: {steps[index+1].title[lang]} →
        </button> : <Link prefetch={false} className="accent-button" href={readyHref}>{tr("Go to the table", "Ir a la mesa")} →</Link>}
      </div>
    </div>
    <details id="lesson-overview" className="lesson-overview"><summary>{tr("Choose any lesson", "Elige cualquier lección")}</summary>
      <ol className="learning-overview">{steps.map(step => <li key={step.id}><button type="button" onClick={() => choose(step.id)} aria-current={current.id === step.id ? "step" : undefined}>{stageLabels[step.stage][lang]} · {step.title[lang]}</button></li>)}</ol>
    </details>
  </section>;
}
