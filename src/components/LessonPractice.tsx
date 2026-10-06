"use client";
import { useRef } from "react";
import Link from "next/link";
import type { Language, LessonCard, PracticeDecision } from "@/lib/types";
import { useLearningState } from "@/lib/learning-state";
import { LessonCardArt } from "./LessonCardArt";

export function LessonPractice({ game, decision, lang, temporary, cards, onContinue, onRevisit, ruleHref }: {
  game: string; decision: PracticeDecision; lang: Language; temporary: boolean;
  cards: Record<string, LessonCard>; onContinue: () => void; onRevisit: () => void;
  ruleHref: (section: string) => string;
}) {
  const [answers, setAnswers] = useLearningState<Record<string, string>>(game, "decisions", {}, temporary);
  const first = useRef<HTMLButtonElement>(null);
  const tr = (en: string, es: string) => lang === "es" ? es : en;
  const selected = decision.optionIds.indexOf(answers[decision.id]);
  const heading = `practice-${decision.id}-heading`, feedback = `practice-${decision.id}-feedback`;
  return <section className="lesson-practice" data-lesson-practice={decision.id} aria-labelledby={heading}>
    <p className="eyebrow">{tr("Optional · try this decision", "Opcional · prueba esta decisión")}</p>
    <p className="muted">{game === "coup" ? tr("Fictional base-game example; character artwork is a reference, not a real hand.", "Ejemplo ficticio del juego base; las imágenes de personajes son referencias, no una mano real.") : game === "avalon" ? tr("Fictional example; no real secret roles are entered.", "Ejemplo ficticio; no se ingresan personajes secretos reales.") : null}</p>
    <h4 id={heading}>{decision.question[lang]}</h4>
    {decision.cards?.length ? <div className="practice-card-context">{decision.cards.map(id => cards[id] ?
      <div key={id}><LessonCardArt id={id} art={cards[id].art} lang={lang} /><strong>{(cards[id].name || cards[id].art.title)[lang]}</strong></div> : null)}</div> : null}
    <div className="scenario-choices" role="group" aria-labelledby={heading}>
      {decision.choices.map((choice, i) => <button key={decision.optionIds[i]} type="button" ref={i === 0 ? first : undefined}
        data-practice-option={decision.optionIds[i]} aria-pressed={selected === i} aria-describedby={feedback}
        onClick={() => setAnswers(old => ({...old, [decision.id]:decision.optionIds[i]}))}>{choice[lang]}</button>)}
    </div>
    <div className="practice-feedback" id={feedback} role="status" aria-atomic="true">
      {selected < 0 ? <p>{tr("Choose an answer to see why. You can also skip and continue.", "Elige una respuesta para ver por qué. También puedes saltar la práctica y seguir.")}</p> : <>
        <p><strong>{selected === decision.answer ? tr("Correct.", "Correcto.") : tr("Not quite.", "Todavía no.")}</strong> {decision.feedback[selected][lang]}</p>
        <p>{decision.explanation[lang]}</p>
      </>}
    </div>
    <Link prefetch={false} href={ruleHref(decision.section)}>{tr("Read the rule behind this example", "Leer la regla de este ejemplo")} →</Link>
    <div className="practice-actions">
      <button type="button" data-practice-retry onClick={() => {setAnswers(old => {const next = {...old}; delete next[decision.id]; return next;});first.current?.focus();}}>{tr("Try again", "Intentar de nuevo")}</button>
      <button type="button" data-practice-revisit onClick={onRevisit}>{tr("Revisit example", "Volver al ejemplo")}</button>
      <button type="button" data-practice-continue onClick={onContinue}>{selected < 0 ? tr("Skip / Continue", "Saltar / Seguir") : tr("Continue", "Seguir")} →</button>
    </div>
  </section>;
}
