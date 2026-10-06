"use client";
import type { Artwork, Language, LessonComparison as Comparison } from "@/lib/types";
import { useLearningState } from "@/lib/learning-state";
import { useRef } from "react";
import { LessonCardArt } from "./LessonCardArt";
import "./lesson-comparison.css";

/** Presentation of finite, verified pairs. No timers, deals or game mutations. */
export function LessonComparison({ game, data, artwork, lang, ruleHref, temporary = false }: {
  game: string; data: Comparison; artwork: Record<string, Artwork>; lang: Language;
  ruleHref: (section: string) => string; temporary?: boolean;
}) {
  const [state, setState] = useLearningState(game, `comparison-${data.id}`, {open:false, revealed:false}, temporary);
  const reveal = useRef<HTMLButtonElement>(null);
  const tr = (en: string, es: string) => lang === "es" ? es : en;
  return <details className="lesson-comparison" data-comparison={data.id} open={state.open}
    onToggle={event => {
      const open = event.currentTarget.open;
      if (open !== state.open) setState(old => ({...old,open}));
    }}>
    <summary>{tr("What changes the result?", "¿Qué cambia el resultado?")}</summary>
    <div className="comparison-body">
      <h4>{data.question[lang]}</h4>
      <p>{data.context[lang]}</p>
      <p className="comparison-difference"><b>↔ {tr("Changed fact", "Dato que cambia")}: {data.difference[lang]}</b></p>
      <div className="comparison-pair">
        {data.situations.map((s, i) => <article className="comparison-situation" key={i} data-situation={i}>
          <h5>{i === 0 ? "A" : "B"} · {s.label[lang]}</h5>
          <p className="comparison-fact">◆ {s.fact[lang]}</p>
          {s.groups.map((group, g) => <div className="comparison-group" key={g} data-after={!!group.after} hidden={group.after && !state.revealed}>
            <strong>{group.label[lang]}</strong>
            {group.quantity ? <p className="comparison-quantity">{group.quantity[lang]}</p> : null}
            <ul className="comparison-items">
              {group.items.map((item, n) => <li className="comparison-item" key={n} data-changed={!!item.changed} data-compact={!!item.compact}>
                {item.label ? <small>{item.label[lang]}</small> : null}
                {item.changed ? <span className="comparison-marker">◆ {tr("Changed", "Cambia")}</span> : null}
                {item.art && artwork[item.art] ? <LessonCardArt id={item.art} art={artwork[item.art]} lang={lang} /> : item.rank ?
                  <div className="comparison-schematic"><b>{item.rank}</b><span>{item.suit?.[lang]}</span></div> : item.symbol ?
                    <span className="comparison-symbol" aria-hidden={item.symbolLabel ? undefined : true}
                      role={item.symbolLabel ? "img" : undefined} aria-label={item.symbolLabel?.[lang]}>{item.symbol}</span> : null}
                <b>{item.name[lang]}</b>
                {item.note ? <small>{item.note[lang]}</small> : null}
              </li>)}
            </ul>
          </div>)}
          <div className="comparison-outcome" data-comparison-result={s.result} hidden={!state.revealed}>
            <strong>{tr("Outcome", "Resultado")}: {s.outcome[lang]}</strong>
            <p>{s.explanation[lang]}</p>
          </div>
        </article>)}
      </div>
      <div className="comparison-controls">
        <button type="button" ref={reveal} data-comparison-reveal disabled={state.revealed}
          onClick={() => setState(old => ({...old, revealed:true}))}>{tr("Reveal both outcomes", "Revelar ambos resultados")}</button>
        <button type="button" data-comparison-replay onClick={() => {
          setState(old => ({...old, revealed:false}));
          requestAnimationFrame(() => reveal.current?.focus());
        }}>{tr("Replay", "Repetir")}</button>
        <span role="status" aria-atomic="true">{state.revealed ? tr("Both outcomes revealed", "Ambos resultados revelados") : ""}</span>
      </div>
      <p className="comparison-exception">{data.exception[lang]}</p>
      <div className="comparison-links">
        <a href={ruleHref(data.rule)}>{tr("Full rules & exceptions", "Reglas completas y excepciones")} →</a>
        <a href={data.source.url}>{data.source.section[lang]}</a>
      </div>
      <noscript><style>{`.lesson-comparison [hidden]{display:block!important}.comparison-controls{display:none!important}`}</style></noscript>
    </div>
  </details>;
}
