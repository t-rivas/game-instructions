"use client";

import { GlossaryText } from "./GlossaryText";
import { useEffect, useRef } from "react";
import { useLearningState } from "@/lib/learning-state";
import type { CoupTeaching, Language, LessonCard } from "@/lib/types";
import { LessonCardArt } from "./LessonCardArt";
import { WatchTurn, watchWords } from "./WatchTurn";

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
  const historyFor = (saved: Record<string, string[]>) => Array.isArray(saved[selected]) ? saved[selected].filter(id => Object.hasOwn(data.nodes, id)) : [];
  const path = historyFor(paths);
  const current = path.at(-1) || scenario.start;
  const step = data.nodes[current];
  const before = data.nodes[path.length > 1 ? path[path.length - 2] : scenario.start];
  const w = watchWords(lang);
  const t = (key: string) => data.copy[key][lang];
  const name = (id: string) => (cards[id].name || cards[id].art.title)[lang];
  function focusStep() { requestAnimationFrame(() => heading.current?.focus()); }
  function move(next: string[]) { setPaths(old => ({...old, [selected]: next})); focusStep(); }
  function choose(to: string) {
    setPaths(old => {
      const history = historyFor(old);
      const node = data.nodes[history.at(-1) || scenario.start];
      // Ignore a second click on a choice from a node that has already changed.
      return node.choices.some(choice => choice.to === to) ? {...old, [selected]: [...history, to]} : old;
    });
    focusStep();
  }
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
      <WatchTurn lang={lang} kind="coup" progress={`${w.step} ${path.length + 1} · ${t(step.phase)}`}>
      <details className="coup-claim-art"><summary>{lang === "es" ? "Retrato de la declaración" : "Claim reference portrait"}</summary>
        {art(current.startsWith("block-") || current === "late-block" ? "coup-contessa" : scenario.art)}
        <p>{lang === "es" ? "Retrato de referencia para la declaración; no muestra la mano de nadie." : "Reference portrait for the claim; this does not show anyone’s hand."}</p>
      </details>
      <p className="eyebrow">{t(step.phase)}</p>
      <h3 className="watch-claim" key={current} id="coup-step-heading" tabIndex={-1} ref={heading}>{step.title[lang]}</h3>
      <div className="coup-explanation" role="status" aria-atomic="true"><p>{<GlossaryText game="coup" text={step.explanation[lang]} lang={lang} explain={false} />}</p></div>
      <h4>{t("table")}</h4>
      <div className="watch-bank"><span>◉ {w.bank}</span><span>▤ {w.deck} · {w.hidden}</span></div>
      <ul className="coup-public-table">
        {step.players.map((player, i) => <li key={player.name} data-coup-example-player={i} data-coins={player.coins} data-influence={player.hidden}>
          <h5><span className="watch-avatar" aria-hidden="true">{player.name[0]}</span> {player.name}{step.next === i ? ` · ${t("next")}` : ""}</h5>
          <p className="coup-counts"><strong>{player.coins} {t("coins")}</strong><span>{player.hidden} {t("influence")}</span></p>
          <div className="watch-coins" aria-hidden="true" key={`${current}-coins-${i}`}>
            {Array.from({length:player.coins}, (_, n) => <span key={n} className={n >= before.players[i].coins ? "watch-coin watch-coin-in" : "watch-coin"}>◉</span>)}
            {player.coins < before.players[i].coins ? <span className="watch-coin-out">{Array.from({length:before.players[i].coins-player.coins}, () => "◉").join(" ")}</span> : null}
          </div>
          {player.coins !== before.players[i].coins ? <p className="watch-transfer">{player.coins < before.players[i].coins ? `${player.name} → ${w.bank}` : `${w.bank} → ${player.name}`} · {Math.abs(player.coins-before.players[i].coins)} {t("coins")}</p> : null}
          <ul className="coup-hand">
            {Array.from({length:player.hidden - (player.proof ? 1 : 0)}, (_, n) => <li aria-label={t("hidden")} className={`coup-hidden ${before.players[i].proof && !player.proof && n === player.hidden-1 ? "watch-replacement" : ""}`} key={`hidden-${n}`}><span aria-hidden="true">✦</span>{w.hidden}</li>)}
            {player.proof ? <li className="coup-revealed watch-proof" data-coup-proof={player.proof}>{art(player.proof)}<strong>{name(player.proof)}</strong><span>{t("proof")}</span></li> : null}
            {player.lost.map((id,n) => <li className={`coup-revealed coup-lost ${n >= before.players[i].lost.length ? "watch-lost" : ""}`} key={`${id}-${n}`} data-coup-lost={id}>{art(id)}<strong>{name(id)}</strong><span>{t("lost")}</span></li>)}
          </ul>
          {before.players[i].proof && !player.proof ? <><span className="watch-returned-card" aria-hidden="true">{name(before.players[i].proof!)} ↑</span><p className="watch-transfer">{name(before.players[i].proof!)} → {w.deck} → {player.name}. {lang === "es" ? "Reemplazo oculto; conserva su influencia." : "Hidden replacement; influence kept."}</p></> : null}
          {!player.hidden ? <p className="coup-eliminated">{t("out")}</p> : null}
        </li>)}
      </ul>
      {step.next !== null ? <p className="coup-outcome"><strong>{t("result")} · {t("next")}: {step.players[step.next].name}.</strong></p> : null}
      <div className="coup-choices">
        {step.choices.map(choice => <button key={choice.to} type="button" data-coup-choice={choice.to}
          onClick={() => choose(choice.to)}>{w.next}: {choice.label[lang]} →</button>)}
      </div>
      <nav className="coup-controls" aria-label={t("examples")}>
        <button type="button" data-coup-back disabled={!path.length} onClick={() => {setPaths(old => ({...old,[selected]:historyFor(old).slice(0,-1)}));focusStep();}}>{w.previous}</button>
        <button type="button" data-coup-replay onClick={() => move([])}>{w.replay}</button>
      </nav>
      </WatchTurn>
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
