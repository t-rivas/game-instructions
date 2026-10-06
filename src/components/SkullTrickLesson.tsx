"use client";
import { GlossaryText } from "./GlossaryText";
import { useEffect, useRef } from "react";
import { useLearningState } from "@/lib/learning-state";
import type { Language, SkullTrickTeaching } from "@/lib/types";
import { LessonCardArt } from "./LessonCardArt";
import { WatchTurn, WatchControls, watchWords } from "./WatchTurn";

export function SkullTrickLesson({ data, lang, expansion, ruleHref, temporary = false }: {
  data: SkullTrickTeaching; lang: Language; expansion: boolean; ruleHref: (section: string) => string; temporary?: boolean;
}) {
  const [context, setContext] = useLearningState("skull_king", "trick-context", {id:"follow-suit", baseOptions:false, powers:false}, temporary);
  const selected = context.id, baseOptions = context.baseOptions, powers = context.powers;
  const setSelected = (id: string) => setContext(old => ({...old,id}));
  const setBaseOptions = (baseOptions: boolean) => setContext(old => ({...old,baseOptions}));
  const setPowers = (powers: boolean) => setContext(old => ({...old,powers}));
  const [answers, setAnswers] = useLearningState<Record<string, { guess?: number; revealed?: boolean }>>("skull_king", "tricks", {}, temporary);
  const [positions, setPositions] = useLearningState<Record<string, number>>("skull_king", "watch-turn", {}, temporary);
  useEffect(() => {
    const revisit = (event: Event) => {
      const detail = (event as CustomEvent).detail;
      if (detail.game === "skull_king" && data.scenarios.some(s => s.id === detail.example)) {
        setSelected(detail.example);
        requestAnimationFrame(() => heading.current?.focus());
      }
    };
    window.addEventListener("tablefolk-revisit-example", revisit);
    return () => window.removeEventListener("tablefolk-revisit-example", revisit);
  }, [data]);
  const heading = useRef<HTMLHeadingElement>(null);
  const t = (key: string) => data.copy[key][lang];
  const scenarios = data.scenarios.filter(s => s.group === "base" ||
    (s.group === "options" && baseOptions) || (s.group === "powers" && powers) || (s.group === "expansion" && expansion));
  const scenario = scenarios.find(s => s.id === selected) || scenarios[0];
  const index = scenarios.indexOf(scenario);
  const answer = answers[scenario.id] || {};
  const beat = Math.max(0, Math.min(5, positions[scenario.id] || 0));
  const w = watchWords(lang);
  function advance(delta: number) {
    setPositions(old => ({...old, [scenario.id]: Math.max(0, Math.min(5, (old[scenario.id] || 0) + delta))}));
  }
  function replay() {
    setPositions(old => ({...old, [scenario.id]: 0}));
    setAnswers(old => ({...old, [scenario.id]: {}}));
    heading.current?.focus();
  }
  const players = ["Ana", "Bruno", "Cami"];
  const name = (i: number | null) => i === null || i === -1 ? t("nobody") : players[i];
  function update(value: { guess?: number; revealed?: boolean }) {
    setAnswers(old => ({ ...old, [scenario.id]: { ...old[scenario.id], ...value } }));
  }
  function move(id: string) { setSelected(id); requestAnimationFrame(() => heading.current?.focus()); }
  function card(id: string) {
    const entry = data.cards[id];
    return <>
      {entry.art && data.artwork[entry.art] ? <LessonCardArt id={entry.art} art={data.artwork[entry.art]} lang={lang} /> :
        <div className="trick-schematic"><small>{t("schematic")}</small><b>{entry.rank}</b><span>{entry.suit?.[lang]}</span></div>}
      <strong className="trick-card-name">{entry.name[lang]}</strong>
      {entry.declaration ? <span className="trick-declaration">{entry.declaration[lang]}</span> : null}
    </>;
  }
  return <section id="skull-trick-lesson" className="block skull-trick-lesson" aria-labelledby="skull-trick-title">
    <p className="eyebrow">{t("practice")}</p>
    <h2 id="skull-trick-title">{t("title")}</h2>
    <p>{<GlossaryText game="skull_king" text={t("intro")} lang={lang} explain={true} />}</p><p className="trick-order">{t("order")}</p>
    <details className="trick-options"><summary>{t("options")} / {t("powers")}</summary>
      <label><input type="checkbox" checked={baseOptions} onChange={e => {setBaseOptions(e.target.checked);setSelected("follow-suit");}} />{t("optionsToggle")}</label>
      <label><input type="checkbox" checked={powers} onChange={e => {setPowers(e.target.checked);setSelected("follow-suit");}} />{t("powersToggle")}</label>
      <p>{t("selectionNote")}</p>
    </details>
    <label className="trick-picker" htmlFor="trick-example">{t("example")}
      <select id="trick-example" value={scenario.id} onChange={e => setSelected(e.target.value)}>
        {scenarios.map(s => <option key={s.id} value={s.id}>{t(s.group)} · {s.title[lang]}</option>)}
      </select>
    </label>
    <div className="trick-example" data-scenario={scenario.id}>
      <p className="eyebrow">{t(scenario.group)} · {index + 1} / {scenarios.length}</p>
      <h3 ref={heading} tabIndex={-1}>{scenario.title[lang]}</h3>
      <WatchTurn lang={lang} kind="skull" progress={`${w.step} ${beat + 1} / 6`}>
        <div className="watch-skull-seats" aria-label={lang === "es" ? "Orden horario" : "Clockwise order"}>
          {players.map((player, i) => <div key={player} data-active={beat < 3 ? beat === i : beat === 5 && scenario.next === i}>
            <span className="watch-avatar" aria-hidden="true">{player[0]}</span><strong>{i + 1}. {player}</strong>
            <small>{beat === 5 && scenario.next === i ? t("nextLead") : i === 0 ? t("leader") : ""}</small>
          </div>)}
        </div>
        <ol className="trick-table watch-skull-table" aria-label={t("sequence")}>
          {scenario.plays.map((id, i) => <li className="trick-play" key={`${scenario.id}-${i}`} data-player={i} data-played={beat > i} data-winner={beat >= 4 && scenario.winner === i}>
            <p className="trick-player">{i + 1}. {players[i]}</p>
            {beat > i ? <div className="watch-played-card">{card(id)}</div> : <div className="watch-card-back"><span aria-hidden="true">✦</span><small>{w.hidden}</small></div>}
            {beat >= 4 && scenario.winner === i ? <strong className="watch-badge">✓ {t("winner")}</strong> : null}
          </li>)}
        </ol>
        <div className="watch-caption" role="status" aria-atomic="true" data-watch-beat={beat}>
          {beat === 0 ? <p><strong>Ana · {t("leader")}.</strong> {lang === "es" ? "Cada persona jugará una carta. Sigue el turno con Siguiente." : "Each player will play one card. Follow the turn with Next."}</p> : null}
          {beat >= 1 && beat <= 3 ? <><p><strong>{players[beat - 1]} → {data.cards[scenario.plays[beat - 1]].name[lang]}</strong></p><p>{scenario.lead[lang]}</p>
            <p>{beat < 3 ? `${lang === "es" ? "Ahora juega" : "Up next"}: ${players[beat]}.` : lang === "es" ? "Ya jugaron todos. Predice quién gana o continúa para ver el resultado." : "Everyone has played. Predict the winner or continue to the result."}</p>
          </> : null}
          {beat === 4 ? <><p><strong>{t("winner")}: {name(scenario.winner)}.</strong></p><ul>{scenario.reasons.map((reason, i) => <li key={i}>{players[i]}: {reason[lang]}</li>)}</ul></> : null}
          {beat === 5 ? <><p><strong>{t("nextLead")}: {name(scenario.next)}.</strong></p><p>{scenario.after[lang]}</p></> : null}
        </div>
        {beat === 2 ? <div className="watch-legal"><strong>{t("hand")}</strong>{scenario.hand.map(choice => <p key={choice.card}>{choice.legal ? "✓" : "×"} <strong>{data.cards[choice.card].name[lang]} · {t(choice.legal ? "legal" : "illegal")}</strong> — {choice.why[lang]}</p>)}</div> : null}
        <WatchControls lang={lang} previous={beat ? () => advance(-1) : undefined} next={beat < 5 ? () => advance(1) : undefined} replay={replay} />
      </WatchTurn>
      <details className="watch-reference"><summary>{lang === "es" ? "Consultar la mano y las jugadas permitidas" : "Review the hand and legal choices"}</summary>
      <p><strong>{t("lead")}: </strong>{<GlossaryText game="skull_king" text={scenario.lead[lang]} lang={lang} explain={false} />}</p>
      <h4>{t("hand")}</h4>
      <ul className="trick-hand">
        {scenario.hand.map(choice => <li key={choice.card} data-legal={choice.legal}>
          <strong>{data.cards[choice.card].name[lang]}</strong>
          <span>{choice.legal ? "✓ " + t("legal") : "× " + t("illegal")}</span>
          <p>{choice.why[lang]}</p>
          {choice.card === scenario.plays[2] ? <b>{t("played")}</b> : null}
        </li>)}
      </ul>
      </details>
      <fieldset className="trick-prediction"><legend>{t("predict")}</legend>
        {[0,1,2,-1].map(i => <label key={i}><input type="radio" name="trick-winner" value={i} checked={answer.guess === i}
          onChange={() => update({ guess: i, revealed: false })} />{name(i)}</label>)}
      </fieldset>
      <button type="button" className="accent-button" data-trick-reveal onClick={() => {update({revealed: true});setPositions(old => ({...old,[scenario.id]:4}));}}>{t("reveal")}</button>
      <div className="trick-result" role="status" aria-atomic="true">
        {answer.revealed && beat >= 4 ? <>
          {answer.guess !== undefined ? <p>{answer.guess === (scenario.winner ?? -1) ? t("correct") : t("incorrect")}</p> : null}
          <p><strong>{t("winner")}: {name(scenario.winner)}. {t("nextLead")}: {name(scenario.next)}.</strong></p>
          <p>{scenario.after[lang]}</p>
          <ul>{scenario.reasons.map((reason,i) => <li key={i}>{players[i]}: {reason[lang]}</li>)}</ul>
        </> : null}
      </div>
      <nav className="trick-controls" aria-label={t("example")}>
        <button type="button" disabled={index === 0} onClick={() => move(scenarios[index-1].id)}>{t("back")}</button>
        <button type="button" onClick={replay}>{t("replay")}</button>
        <button type="button" disabled={index === scenarios.length-1} onClick={() => move(scenarios[index+1].id)}>{t("next")}</button>
      </nav>
      <details className="trick-source"><summary>{t("source")}</summary><p><a href={scenario.sourceUrl}>{scenario.source}</a></p></details>
      <a className="trick-rule" href={ruleHref(scenario.rule)}>{t("fullRule")} →</a>
    </div>
    <p className="image-note">{t("artNote")}</p>
  </section>;
}
