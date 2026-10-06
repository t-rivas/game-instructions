"use client";

import { GlossaryText } from "./GlossaryText";
import { useEffect, useRef } from "react";
import { useLearningState } from "@/lib/learning-state";
import type { CoupTeaching, Language, LessonCard } from "@/lib/types";
import { LessonCardArt } from "./LessonCardArt";

export function CoupLesson({ data, cards, lang, exchange, reformation, ruleHref, temporary = false }: {
  data: CoupTeaching; cards: Record<string, LessonCard>; lang: Language;
  exchange: "ambassador" | "inquisitor"; reformation: boolean;
  ruleHref: (section: string) => string; temporary?: boolean;
}) {
  const [context, setContext] = useLearningState("coup", "branch-context", {id:"tax"}, temporary);
  const selected = data.scenarios.some(s => s.id === context.id) ? context.id : "tax";
  const setSelected = (id: string) => setContext({id});
  const [paths, setPaths] = useLearningState<Record<string, string[]>>("coup", "branches", {}, temporary);
  const heading = useRef<HTMLHeadingElement>(null);
  const scenario = data.scenarios.find(s => s.id === selected)!;
  const path = Array.isArray(paths[selected]) ? paths[selected].filter(id => Object.hasOwn(data.nodes, id)) : [];
  const current = path.at(-1) || scenario.start;
  const step = data.nodes[current];
  const t = (key: string) => data.copy[key][lang];
  const name = (id: string) => (cards[id].name || cards[id].art.title)[lang];
  function focusStep() { requestAnimationFrame(() => heading.current?.focus()); }
  function move(next: string[]) { setPaths(old => ({...old, [selected]: next})); focusStep(); }
  const art = (id: string) => <LessonCardArt id={id} art={cards[id].art} lang={lang} />;
  useEffect(() => {
    const revisit = (event: Event) => {
      const detail = (event as CustomEvent).detail;
      if (detail.game === "coup" && data.scenarios.some(s => s.id === detail.example)) {setSelected(detail.example); focusStep();}
    };
    window.addEventListener("tablefolk-revisit-example", revisit);
    return () => window.removeEventListener("tablefolk-revisit-example", revisit);
  }, [data]);

  return <section id="coup-lesson" className="block coup-lesson" aria-labelledby="coup-lesson-title">
    <h2 id="coup-lesson-title">{t("title")}</h2>
    <p>{<GlossaryText game="coup" text={t("intro")} lang={lang} explain={true} />}</p>
    <p>{t("distinction")}</p>
    <p className="coup-order">{t("order")}</p>
    <p className="image-note">{t("fiction")}</p>
    <div className="coup-example-picker" role="group" aria-label={t("examples")}>
      {data.scenarios.map(s => <button key={s.id} type="button" data-coup-example={s.id}
        aria-pressed={selected === s.id} onClick={() => {setSelected(s.id); focusStep();}}>{t(s.id)}</button>)}
    </div>
    <div className="coup-scene" data-coup-node={current}>
      <div className="coup-claim-art">
        {art(current.startsWith("block-") || current === "late-block" ? "coup-contessa" : scenario.art)}
        <p>{lang === "es" ? "Retrato de referencia para la declaración; no muestra la mano de nadie." : "Reference portrait for the claim; this does not show anyone’s hand."}</p>
      </div>
      <p className="eyebrow">{t(step.phase)}</p>
      <h3 id="coup-step-heading" tabIndex={-1} ref={heading}>{step.title[lang]}</h3>
      <div className="coup-explanation" role="status" aria-atomic="true"><p>{<GlossaryText game="coup" text={step.explanation[lang]} lang={lang} explain={false} />}</p></div>
      <h4>{t("table")}</h4>
      <ul className="coup-public-table">
        {step.players.map((player, i) => <li key={player.name} data-coup-example-player={i} data-coins={player.coins} data-influence={player.hidden}>
          <h5>{player.name}</h5>
          <p className="coup-counts"><strong>{player.coins} {t("coins")}</strong><span>{player.hidden} {t("influence")}</span></p>
          <ul className="coup-hand">
            {Array.from({length:player.hidden - (player.proof ? 1 : 0)}, (_, n) => <li className="coup-hidden" key={`hidden-${n}`}><span aria-hidden="true">?</span>{t("hidden")}</li>)}
            {player.proof ? <li className="coup-revealed" data-coup-proof={player.proof}>{art(player.proof)}<strong>{name(player.proof)}</strong><span>{t("proof")}</span></li> : null}
            {player.lost.map((id,n) => <li className="coup-revealed coup-lost" key={`${id}-${n}`} data-coup-lost={id}>{art(id)}<strong>{name(id)}</strong><span>{t("lost")}</span></li>)}
          </ul>
          {!player.hidden ? <p className="coup-eliminated">{t("out")}</p> : null}
        </li>)}
      </ul>
      {step.next !== null ? <p className="coup-outcome"><strong>{t("result")} · {t("next")}: {step.players[step.next].name}.</strong></p> : null}
      <div className="coup-choices">
        {step.choices.map(choice => <button key={choice.to} type="button" data-coup-choice={choice.to}
          onClick={() => move([...path, choice.to])}>{choice.label[lang]} →</button>)}
      </div>
      <nav className="coup-controls" aria-label={t("examples")}>
        <button type="button" data-coup-back disabled={!path.length} onClick={() => move(path.slice(0,-1))}>{t("back")}</button>
        <button type="button" data-coup-replay onClick={() => move([])}>{t("replay")}</button>
      </nav>
    </div>
    <p>{t("limit")}</p>
    <a className="coup-rule" href={ruleHref("challenges")}>{t("rules")} →</a>
    <h3>{t("reference")}</h3>
    <p>{t("referenceIntro")}</p>
    <div className="coup-role-grid">
      {data.roles.filter(role => !role.exchange || role.exchange === exchange).map(role => <article className="coup-role" data-coup-role={role.id} key={role.id}>
        {art(role.id)}
        <div><h4>{name(role.id)}</h4><p><strong>{t("action")}: </strong>{role.action[lang]}</p>
          <p><strong>{t("block")}: </strong>{role.block[lang]}</p>
          <small>{cards[role.id].note?.[lang]}</small>
          <a className="coup-rule" href={ruleHref(cards[role.id].rule)}>{t("rules")} →</a>
        </div>
      </article>)}
    </div>
    <h3>{t("general")}</h3><p>{t("generalCopy")}</p>
    {reformation ? <aside className="coup-variant"><p>{t("reformation")}</p><a className="coup-rule" href={ruleHref("reformation")}>Reformation →</a></aside> : null}
    <details className="coup-sources"><summary>{t("sources")}</summary>
      <p><a href="https://officialgamerules.org/wp-content/uploads/2025/02/Coup-Rulebook.pdf">{t("baseSource")}</a></p>
      <p><a href="https://www.spelhuis.be/Files/7/112000/112353/Attachments/Product/aD1jf4U81u46a97ia1719S97Nm9925v8.pdf">{t("variantSource")}</a></p>
    </details>
  </section>;
}
