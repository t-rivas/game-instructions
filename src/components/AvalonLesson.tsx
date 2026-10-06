"use client";

import { GlossaryText } from "./GlossaryText";
import { useEffect, useLayoutEffect, useRef } from "react";
import { avalonExampleRoster, avalonExampleQuest, avalonExampleTeam, avalonExampleVote } from "@/generated/avalon-model";
import type { AvalonTeaching, Language, LessonCard, ToolState, Translation } from "@/lib/types";
import { useLearningState } from "@/lib/learning-state";
import { LessonCardArt } from "./LessonCardArt";
import { WatchTurn, watchWords } from "./WatchTurn";

type ExampleRole = {id: string; side: string; name: Translation; text: Translation; seat: number; targets: number[]};

export function AvalonLesson({data, cards, lang, options, script, ruleHref, temporary = false}: {
  data: AvalonTeaching; cards: Record<string, LessonCard>; lang: Language;
  options: ToolState; script: string; ruleHref: (section: string) => string; temporary?: boolean;
}) {
  const config = `${options.players}:${options.avalonMode}:${[...options.optional].sort().join(",")}`;
  const stageIds = ["team","vote","quest","resolve","assassination"];
  const [saved, setSaved] = useLearningState("avalon", "quest", {config, stage:"team", quest:4, fails:1, votes:false, ending:"", voteMode:"approve", leader:1}, temporary, value => value.config === config);
  const stage = Math.max(0,stageIds.indexOf(saved.stage));
  const quest = [1,4,5].includes(saved.quest) ? saved.quest : 4;
  const fails = [0,1,2].includes(saved.fails) ? saved.fails : 1;
  const votes = saved.votes, ending = saved.ending, voteMode = saved.voteMode;
  const leader = saved.leader >= 1 && saved.leader <= options.players ? saved.leader : 1;
  const setStage = (stage: number) => setSaved(old => ({...old,stage:stageIds[Math.max(0, Math.min(4, stage))]}));
  const setQuest = (quest: number) => setSaved(old => ({...old,quest}));
  const setFails = (fails: number) => setSaved(old => ({...old,fails}));
  const setVotes = (votes: boolean) => setSaved(old => ({...old,votes}));
  const setEnding = (ending: string) => setSaved(old => ({...old,ending}));
  const setVoteMode = (voteMode: string) => setSaved(old => ({...old,voteMode}));
  const setLeader = (value: number | ((n: number) => number)) => setSaved(old => ({...old,leader:typeof value === "function" ? value(old.leader) : value}));
  const heading = useRef<HTMLHeadingElement>(null), pendingFocus = useRef(false);
  useLayoutEffect(() => {
    if (pendingFocus.current) {pendingFocus.current = false; heading.current?.focus();}
  }, [stage, votes]);
  const t = (key: string) => data.copy[key][lang];
  const w = watchWords(lang);
  const roster: ExampleRole[] = avalonExampleRoster(data, options);
  const roles = [...new Map(roster.map(r => [r.id, r])).values()];
  const outcome = avalonExampleQuest(data, options.players, quest, fails);
  const team: ExampleRole[] = avalonExampleTeam(roster, outcome.size);
  const vote = avalonExampleVote(options.players, voteMode);
  const seats = team.map(r => `${t("seat")} ${r.seat}`).join(", ");
  const art = (id: string) => <LessonCardArt id={`avalon-${id}`} art={cards[`avalon-${id}`].art} lang={lang} />;
  const move = (next: number) => {
    if (next === stage) heading.current?.focus();
    else {pendingFocus.current = true; setStage(next);}
  };
  useEffect(() => {
    const revisit = (event: Event) => {
      const detail = (event as CustomEvent).detail;
      if (detail.game === "avalon") {
        setSaved(old => ({...old,stage:detail.example === "vote" ? "vote" : "quest"}));
        requestAnimationFrame(() => heading.current?.focus());
      }
    };
    window.addEventListener("tablefolk-revisit-example", revisit);
    return () => window.removeEventListener("tablefolk-revisit-example", revisit);
  }, [temporary, config]);
  function replay() {setVotes(false); setEnding(""); setVoteMode("approve"); setLeader(1); setFails(1); move(0);}
  function changeQuest(value: number) {setQuest(value); setStage(0); setVotes(false); setEnding(""); setVoteMode("approve"); setLeader(1); setFails(1);}
  const rejected = stage === 1 && votes && !vote.approved;
  return <section id="avalon-lesson" className="block avalon-lesson" aria-labelledby="avalon-lesson-title">
    <h2 id="avalon-lesson-title">{t("title")}</h2>
    <details className="example-intro"><summary>{lang === "es" ? "Personajes y quién reconoce a quién" : "Roles & who recognizes whom"}</summary>
    <p className="callout">{t("fiction")}</p>
    <h3>{t("roles")}</h3><p>{t("roleIntro")}</p>
    <div className="avalon-teaching-roles">
      {roles.map(role => <article key={role.id} data-avalon-role={role.id}>
        {cards[`avalon-${role.id}`] ? art(role.id) : <div className="avalon-role-tile">{role.name[lang]}</div>}
        <div><h4>{role.name[lang]} · {t(role.side)}</h4>
          <p><strong>{t("goal")}: </strong>{t(`${role.side}Goal`)}</p>
          <p><strong>{t("knows")}: </strong>{role.text[lang]}{role.side === "evil" && !["oberon","minion"].includes(role.id) ? ` ${data.generic.evil.text[lang]}` : ""}</p>
          <p><strong>{t("unknown")}: </strong>{(data.unknown[role.id] || data.unknown.evil)[lang]}</p>
          <small>{t(cards[`avalon-${role.id}`] ? "portrait" : "tile")}</small>
        </div>
      </article>)}
    </div>
    {options.players === 5 && options.optional.includes("percival") ? <p className="callout">{t("balance")}</p> : null}
    <h3>{t("diagram")}</h3><p>{t("diagramIntro")}</p>
    <ol className="avalon-knowledge">
      {roster.map(role => <li key={role.seat} data-avalon-seat={role.seat}>
        <strong>{t("seat")} {role.seat}: {role.name[lang]}</strong><span aria-hidden="true"> → </span>
        <span>{t("sees")}: {role.targets.length ? role.targets.map(n => `${t("seat")} ${n}`).join(", ") : t("none")}
          {role.targets.length ? ` — ${t(role.id === "percival" ? (options.optional.includes("morgana") ? "seesPair" : "seesMerlin") : "seesEvil")}` : ""}.</span>
      </li>)}
    </ol>
    <details className="avalon-opening-script"><summary>{t("script")}</summary><div dangerouslySetInnerHTML={{__html:script}} /></details>
    </details>
    <h3>{t("sequence")}</h3>
    <label htmlFor="avalon-example-quest">{t("quest")}</label>
    <select id="avalon-example-quest" value={quest} onChange={event => changeQuest(+event.target.value)}>
      {[1,4,5].map(n => <option key={n} value={n}>{n}</option>)}
    </select>
    <ol className="avalon-stages">{[0,1,2,3,4].map(n => <li key={n} aria-current={stage === n ? "step" : undefined}>{t(`stage${n}`)}</li>)}</ol>
    <div className="avalon-scene" data-avalon-stage={stage}>
      <WatchTurn lang={lang} kind="avalon" progress={`${w.step} ${stage + 1} / 5`}>
      <h4 id="avalon-scene-title" ref={heading} tabIndex={-1}>{t(`stage${stage}`)}</h4>
      {stage <= 1 ? <>
        <p>{<GlossaryText game="avalon" text={t("team")} lang={lang} explain={true} />}</p><p><strong>{t("leader")}: {t("seat")} <span data-avalon-leader>{leader}</span> · {outcome.size}: {seats}</strong></p>
      </> : null}
      {stage <= 2 ? <>
        <div className="watch-table-label">{w.public} · {stage === 2 ? t("onlyTeam") : t("leader") + ": " + t("seat") + " " + leader}</div>
        <ul className={`avalon-public-team ${stage === 1 && votes ? "avalon-public-votes" : ""}`} aria-label={t("publicTable")}>
          {roster.map(r => <li key={r.seat} data-avalon-team-seat={r.seat} data-on-team={team.some(member => member.seat === r.seat)}>
            <span className="watch-avatar" aria-hidden="true">{r.seat === leader ? "♛" : r.seat}</span>
            <strong>{t("seat")} {r.seat}</strong><span>{t(team.some(member => member.seat === r.seat) ? "onTeam" : "outsideTeam")}</span>
            {stage === 1 ? <span className="watch-vote" key={String(votes)}>{votes ? t(r.seat <= vote.approvals ? "approve" : "reject") : w.hidden}</span> : null}
          </li>)}
        </ul>
      </> : null}
      {stage === 1 ? <>
        {art("team")}<p className="image-note">{t("votePhoto")}</p><p>{t("votes")}</p><p>{t("everyoneVotes")}</p>
        <label htmlFor="avalon-example-vote">{t("voteExample")}</label>
        <select id="avalon-example-vote" value={voteMode} onChange={event => {setVoteMode(event.target.value); setVotes(false);}}>
          <option value="approve">{t("majorityExample")}</option><option value="reject">{t("rejectionExample")}</option>
        </select>
        {!votes ? <button type="button" data-avalon-votes onClick={() => {pendingFocus.current = true; setVotes(true);}}>{t("revealVotes")}</button> : null}
      </> : null}
      {stage === 2 ? <>
        {art("mission")}<p className="image-note">{t("questPhoto")}</p><p>{<GlossaryText game="avalon" text={t("submit")} lang={lang} explain={true} />}</p>
        <p><strong>{t("onlyTeam")}: {seats}.</strong></p>
        <div className="watch-quest-well"><strong>{t("quest")} {quest} · {lang === "es" ? "Entrega secreta" : "Secret submission"}</strong>
        <ul className="avalon-hidden-quest" aria-label={t("anonymousCards")}>{team.map((r, i) => <li key={r.seat} style={{"--card-origin": `${(i % 2 ? 1 : -1) * 55}px`} as React.CSSProperties}><span aria-hidden="true">✦</span>{t("hiddenCard")}</li>)}</ul></div>
        <p>{t("anonymous")}</p>
        <label htmlFor="avalon-example-fails">{t("fails")}</label><select id="avalon-example-fails" value={fails} onChange={event => setFails(+event.target.value)}>{[0,1,2].map(n => <option key={n}>{n}</option>)}</select>
      </> : null}
      {stage === 3 ? <>
        {art("mission")}<p className="image-note">{t("questPhoto")}</p>
        <div className="watch-quest-well"><strong>{t("quest")} {quest} · {t("anonymousCards")}</strong>
        <ul className="avalon-result-cards" aria-label={t("anonymousCards")}>{Array.from({length:outcome.size}, (_,i) => <li key={i} data-avalon-card={i < fails ? "fail" : "success"}><span aria-hidden="true">{i < fails ? "×" : "✓"}</span>{t(i < fails ? "fail" : "success")}</li>)}</ul></div>
        <p>{t("exception")}</p><p>{t("aftermath")}</p>
        <p className="watch-caption"><strong>{t("leader")}: {t("seat")} {leader % options.players + 1}.</strong> {lang === "es" ? "Si la partida continúa, propone el próximo equipo." : "If the game continues, they propose the next team."}</p>
      </> : null}
      {stage === 4 ? <>
        {art("assassin")}<p>{t("endIntro")}</p>
        <div className="watch-assassination"><span>{lang === "es" ? "Asesino" : "Assassin"}</span><span aria-hidden="true">→</span><div className="watch-target" key={ending || "hidden"}>{ending ? <><strong>{ending === "hit" ? (lang === "es" ? "Merlín" : "Merlin") : lang === "es" ? "No es Merlín" : "Not Merlin"}</strong><span>{t(ending === "hit" ? "evilWins" : "goodWins")}</span></> : <><strong>{lang === "es" ? "Persona elegida" : "Chosen player"}</strong><span>{w.hidden}</span></>}</div></div>
        <div className="avalon-example-controls">{["hit","miss"].map(id => <button type="button" key={id} id={`avalon-ending-${id}`} data-avalon-ending={id} aria-pressed={ending === id} onClick={() => setEnding(id)}>{t(id)}</button>)}</div>
      </> : null}
      <div className="avalon-feedback" role="status" aria-atomic="true">
        {stage === 1 && votes ? <><p><strong>{vote.approvals} {t("approve")} · {vote.rejects} {t("reject")}</strong></p><p>{t(vote.approved ? "approved" : "rejected")}</p>{vote.tied ? <p>{t("tie")}</p> : null}{!vote.approved ? <p>{t("fifthRejection")}</p> : null}</> : null}
        {stage === 3 ? <><p>{outcome.successes} {t("success")} + {fails} {t("fail")}</p><p><strong data-avalon-result={outcome.succeeds ? "success" : "fail"}>{t(outcome.succeeds ? "success" : "fail")}</strong> · {t("threshold")}: {outcome.threshold}</p></> : null}
        {stage === 4 && ending ? <p>{t(ending === "hit" ? "evilWins" : "goodWins")}</p> : null}
      </div>
      </WatchTurn>
    </div>
    <nav className="avalon-example-controls" aria-label={t("sequence")}>
      <button type="button" data-avalon-back disabled={!stage} onClick={() => move(stage-1)}>{w.previous}</button>
      <button type="button" data-avalon-replay onClick={replay}>{w.replay}</button>
      {rejected ? <button type="button" data-avalon-propose onClick={() => {pendingFocus.current = true; setSaved(old => old.stage === "vote" && old.votes && !avalonExampleVote(options.players, old.voteMode).approved ? {...old, leader:old.leader % options.players + 1, votes:false, voteMode:"approve", stage:"team"} : old);}}>{t("proposeAgain")}</button>
        : stage < 4 ? <button type="button" data-avalon-next disabled={stage === 1 && !votes} onClick={() => move(stage+1)}>{w.next} → {t(stage === 2 ? "revealQuest" : "continue")}</button> : null}
    </nav>
    <a href={ruleHref(stage === 4 ? "ending" : stage <= 1 ? "teams" : "quests")}>{t("rules")} →</a>
    <details className="avalon-example-sources"><summary>{t("sources")}</summary><a href="https://avalon.fun/pdfs/rules.pdf">{t("sourceName")}</a></details>
  </section>;
}
