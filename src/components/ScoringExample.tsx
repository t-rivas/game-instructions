"use client";
import { useEffect, useRef } from "react";
import type { Artwork, Language, ScoringTeaching } from "@/lib/types";
import { LessonCardArt } from "./LessonCardArt";
import { useLearningState } from "@/lib/learning-state";

export function ScoringExample({ data, artwork, lang, ruleHref, temporary = false, gameId }: {
  data: ScoringTeaching; artwork: Record<string, Artwork>; lang: Language; ruleHref: (section: string) => string; temporary?: boolean; gameId?: string;
}) {
  const game = gameId || data.title.en;
  const [context, setContext] = useLearningState(game, "scoring-context", {id:data.scenarios[0].id}, temporary);
  const selected = Math.max(0,data.scenarios.findIndex(s => s.id === context.id));
  const setSelected = (i: number) => setContext({id:data.scenarios[i].id});
  const [facts, setFacts] = useLearningState<Record<string, number>>(game, "scoring-facts", {}, temporary);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    const revisit = (event: Event) => {
      const detail = (event as CustomEvent).detail;
      if (detail.game === game && data.scenarios.some(s => s.id === detail.example)) {
        setContext({id:detail.example});
        if (Number.isInteger(detail.fact) && data.scenarios.find(s => s.id === detail.example)?.states[detail.fact]) {
          setFacts(old => ({...old,[detail.example]:detail.fact}));
        }
        requestAnimationFrame(() => heading.current?.focus());
      }
    };
    window.addEventListener("tablefolk-revisit-example", revisit);
    return () => window.removeEventListener("tablefolk-revisit-example", revisit);
  }, [data, game, temporary]);
  const scenario = data.scenarios[selected];
  const fact = Number.isInteger(facts[scenario.id]) && scenario.states[facts[scenario.id]] ? facts[scenario.id] : 0;
  const outcome = scenario.states[fact];
  const tr = (en: string, es: string) => lang === "es" ? es : en;
  return <section id="scoring-example" data-scoring-owner="react" className="scoring-example block" aria-labelledby="scoring-title">
    <h2 id="scoring-title">{data.title[lang]}</h2><p>{data.intro[lang]}</p>
    <label htmlFor="scoring-scenario">{tr("Choose an example", "Elige un ejemplo")}</label>
    <select id="scoring-scenario" value={selected} onChange={event => setSelected(Number(event.target.value))}>
      {data.scenarios.map((s,i) => <option key={s.id} value={i}>{s.title[lang]}</option>)}
    </select>
    <h3 id="scoring-heading" ref={heading} tabIndex={-1}>{scenario.title[lang]}</h3><p>{scenario.context[lang]}</p>
    <label htmlFor="scoring-fact">{scenario.control[lang]}</label>
    <select id="scoring-fact" value={fact} onChange={event => setFacts(old => ({...old, [scenario.id]:Number(event.target.value)}))}>
      {scenario.states.map((s,i) => <option key={i} value={i}>{s.label[lang]}</option>)}
    </select>
    <div className="scoring-outcome" aria-live="polite" aria-atomic="true">
      <p><strong>{outcome.condition[lang]}</strong></p>
      <ul className="scoring-cards">{outcome.cards.map((card,i) => <li key={`${scenario.id}-${i}`}>
        {card.art && artwork[card.art] ? <LessonCardArt id={card.art} art={artwork[card.art]} lang={lang} /> : null}
        <strong>{card.label[lang]}</strong><span>{tr("Quantity", "Cantidad")}: {card.count}</span>
        {!card.art ? <span className="scoring-counters" aria-hidden="true">{Array.from({length:card.count}, (_,i) => <b key={i}>▣</b>)}</span> : null}
        {card.note ? <small>{card.note[lang]}</small> : null}
      </li>)}</ul>
      {outcome.votes ? <ul className="scoring-votes">{outcome.votes.map(v => <li key={v.player}>{v.player} → {tr("card", "carta")} {v.card}</li>)}</ul> : null}
      <div className="scoring-totals">{outcome.rows.map(row => <article key={row.label.en}>
        <h4>{row.label[lang]}</h4><dl>{row.terms.map((term,i) => <div key={i}><dt>{term.label[lang]}</dt>
          <dd>{term.expression} = {term.value}</dd></div>)}</dl>
        <p className="scoring-sum">{row.terms.map(t => t.value).join(" + ")} = {row.terms.reduce((n,t) => n+t.value,0)}</p>
        <p className="scoring-total">{tr("Total", "Total")}: <strong data-scoring-total>{row.terms.reduce((n,t) => n+t.value,0)}</strong></p>
      </article>)}</div>
      <p className="scoring-explanation">{outcome.explanation[lang]}</p>
    </div>
    <button type="button" id="scoring-replay" onClick={() => {setFacts(old => ({...old,[scenario.id]:0}));heading.current?.focus();}}>{tr("Replay example", "Repetir ejemplo")}</button>
    <p>{data.ending[lang]}</p>
    <p><a href={ruleHref(scenario.rule)}>{tr("Full scoring rules", "Reglas completas de puntuación")}</a> · <a href={scenario.source.url} target="_blank" rel="noopener">{scenario.source.section}</a></p>
    <small>{tr("Artwork credits are available when you enlarge a picture. Labeled counters and cards without artwork are schematic.", "Los créditos de las imágenes están disponibles al ampliarlas. Los contadores y las cartas sin imágenes son esquemas.")}</small>
  </section>;
}
