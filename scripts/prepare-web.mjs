import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (name) =>
  fs.readFileSync(path.join(root, name), "utf8").replace(/\r\n/g, "\n");
const sources = [
  "data.js",
  "dixit.js",
  "new-games.js",
  "more-games.js",
  "practice.js",
  "enhancements.js",
  "official.js",
  "card-guides.js",
  "table-guide.js",
  "chess-clock.js",
  "poker-timer.js",
  "coup-session.js",
  "skull-score.js",
  "truco-score.js",
  "moth-score.js",
];
const app = read("app.js");
// Share the proven game tools with the offline export. React owns the site,
// navigation, lessons and complete rules; the adapter only owns tool leaves.
const core = app
  .slice(0, app.indexOf("function header()"))
  .split("\n")
  .map((line) =>
    line.startsWith("function persist()")
      ? `function persist(){try{const saved=JSON.parse(localStorage.getItem('tablefolk-preferences')||'{}');localStorage.setItem('tablefolk-preferences',JSON.stringify({...saved,exchange:state.exchange,reformation:state.reformation,skullExpansion:state.skullExpansion}));}catch{}}`
      : line,
  )
  .join("\n");
const credits = app.slice(
  app.indexOf("function sources()"),
  app.indexOf("function normalizeRuleText("),
);
const helpers = app.slice(
  app.indexOf("function helper()"),
  app.indexOf("function bindDetail()"),
);
let source =
  sources.slice(0, 4).map(read).join("\n") +
  "\n" +
  core +
  "\n" +
  sources.slice(4).map(read).join("\n") +
  "\n" +
  helpers +
  "\n" +
  credits;
source = source
  .split("\n")
  .filter(
    (line) =>
      !line.includes("$$('[data-step]')") &&
      !line.includes("$('#lesson-prev')") &&
      !line.includes("$('#lesson-next')") &&
      !line.includes("$('#section-jump')"),
  )
  .join("\n");
source = source.replace(/(['"])assets\//g, "$1/assets/");
source = source.replace(
  "target.outerHTML=html;",
  "target.outerHTML=webHTML(html);",
);
const adapter = `
const subscribers = new Set();
let restoreFocus = null;
try {
 const saved=JSON.parse(localStorage.getItem('tablefolk-avalon-setup-v1')||'null');
 if(saved&&Number.isInteger(saved.players)&&Object.hasOwn(AVALON_SETUPS,saved.players)&&['basic','optional'].includes(saved.avalonMode)&&Array.isArray(saved.optional)&&saved.optional.every(id=>AVALON_ROLES.slice(2).some(role=>role.id===id))&&typeof saved.lady==='boolean'){
  Object.assign(state,{players:saved.players,avalonMode:saved.avalonMode,optional:saved.avalonMode==='basic'?[]:[...new Set(saved.optional)],lady:saved.lady});normalizeAvalon();
 }
}catch{}
function webHTML(html){
 return html.replace(/href="#([^"]+)"/g, (match, hash)=>{
  const [game,tab,section] = hash.split('/');
  if(!Object.hasOwn(GAMES,game))return match;
  const view = ({learn:'learn',reference:'play',full:'rules'})[tab] || 'learn';
  return 'href="/'+state.lang+'/'+game+'/'+view+'/'+(section?'#'+section:'')+'"';
 });
}
function render(preserve=false){
 if(state.game==='avalon')try{localStorage.setItem('tablefolk-avalon-setup-v1',JSON.stringify({players:state.players,avalonMode:state.avalonMode,optional:state.optional,lady:state.lady}));}catch{}
 restoreFocus=preserve?{id:document.activeElement?.id,y:window.scrollY}:null;
 subscribers.forEach(notify=>notify());
}
function bindAuxiliary(){
 if($('#players'))$('#players').onchange=ev=>{state.players=+ev.target.value;normalizeAvalon();render(true);};
 if($('#avalon-mode'))$('#avalon-mode').onchange=ev=>{state.avalonMode=ev.target.value;state.optional=state.avalonMode==='basic'?[]:['percival','morgana'];normalizeAvalon();render(true);};
 $$('[data-role]').forEach(b=>b.onchange=()=>{state.optional=b.checked?[...state.optional,b.dataset.role]:state.optional.filter(id=>id!==b.dataset.role);normalizeAvalon();render(true);});
 if($('#lady-option'))$('#lady-option').onchange=ev=>{state.lady=ev.target.checked;render(true);};
 $$('[data-challenge]').forEach(b=>b.onclick=()=>{state.challenge=b.dataset.challenge;$('#challenge-result').textContent=challengeResult();$$('[data-challenge]').forEach(x=>x.setAttribute('aria-pressed',x.dataset.challenge===state.challenge));});
 $$('[data-number]').forEach(b=>b.onclick=()=>{state.mothTop=+b.dataset.number;$('#moth-result').textContent=mothResult();if($('#moth-practice'))patchTool('moth-practice',mothPractice());$$('[data-number]').forEach(x=>x.setAttribute('aria-pressed',+x.dataset.number===state.mothTop));});
 $$('[data-score]').forEach(input=>input.oninput=()=>{const n=+input.value;state.score[+input.dataset.score]=Number.isFinite(n)?Math.min(71,Math.max(0,Math.floor(n))):0;$('#score-result').textContent=scoreText();});
}
return {
 state, games:GAMES, official:OFFICIAL, artwork:GUIDE_ART, icons:paths,
 setRoute(lang,game,view){state.lang=lang;state.game=game;state.tab=({learn:'learn',play:'reference',rules:'full'})[view];render();},
 update(patch){Object.assign(state,patch);syncSkullKingGuide();normalizeAvalon();persist();render(true);},
 subscribe(notify){subscribers.add(notify);return ()=>subscribers.delete(notify);},
 view(kind){return webHTML(kind==='play'?tableGuide():kind==='setup'?avalonHelper('setup'):kind==='sources'?sources():helper());},
 lessonSteps,
 savedGames(){
  const games=[],chess=chessClock.snapshot(),poker=pokerTimer.snapshot(),coup=coupSession.snapshot(),truco=trucoScore.snapshot();
  if(['running','paused'].includes(chess.phase))games.push({id:'chess',phase:chess.phase,remaining:chess.remaining});
  if(['running','paused'].includes(poker.phase))games.push({id:'poker',phase:poker.phase,completed:poker.index,goal:poker.schedule.length,remaining:[poker.remaining]});
  if(coup.started&&!coup.finished)games.push({id:'coup',players:coup.standings.map(player=>({name:player.name,score:player.points})),completed:coup.results.length,goal:coup.planned});
  if(truco.started&&!truco.finished)games.push({id:'truco',players:truco.names.map((name,i)=>({name,score:truco.totals[i]}))});
  if(mothScoreGame){const summary=mothGameSummary(mothScoreGame);if(!summary.finished)games.push({id:'moth',players:mothScoreGame.players.map((name,i)=>({name,score:summary.totals[i]})),completed:mothScoreGame.rounds.length,goal:mothScoreGame.players.length});}
  if(skullScoreGame){const summary=skullGameSummary(skullScoreGame);if(!summary.finished)games.push({id:'skull_king',players:skullScoreGame.setup.players.map((name,i)=>({name,score:summary.totals[i]})),completed:skullScoreGame.rounds.length,goal:10});}
  return games;
 },
 playStatus(){
  const status=({chess:()=>({active:chessClock.snapshot().phase!=='ready',storage:true}),poker:()=>({active:pokerTimer.snapshot().phase!=='ready',storage:pokerTimerStorageOK}),coup:()=>({active:coupSession.snapshot().started,storage:coupStorageOK}),truco:()=>({active:trucoScore.snapshot().started,storage:trucoStorageOK}),moth:()=>({active:!!mothScoreGame,storage:mothStorageOK}),skull_king:()=>({active:!!skullScoreGame,storage:skullStorageOK})})[state.game]?.()||{active:false,storage:true};
  return {...status,storage:status.storage&&storageStatus.available};
 },
 bind(kind){
  if(kind==='play') {bindTableGuide();bindChessClock();bindPokerTimer();bindCoupSession();bindSkullScore();bindMothScore();bindTrucoScore();}
  if(kind==='play'||kind==='helper')bindLearningTools();
  if(kind!=='sources')bindAuxiliary();
  if(restoreFocus){document.getElementById(restoreFocus.id)?.focus({preventScroll:true});window.scrollTo({top:restoreFocus.y,behavior:'instant'});}
 }
};
`;
const factory = `/* Generated by scripts/prepare-web.mjs; edit the shared sources instead. */
export function createToolRuntime(platform={}) {
 const document=platform.document||{addEventListener(){},getElementById(){return null;}};
 const window=platform.window||{addEventListener(){}};
 const localStorage=platform.localStorage||{getItem(){return null;},setItem(){}};
 const storageStatus=platform.storageStatus||{available:true};
 const setInterval=platform.setInterval||(()=>null), clearInterval=platform.clearInterval||(()=>{});
 ${source}
 ${adapter}
}
`;
fs.mkdirSync(path.join(root, "src/generated"), { recursive: true });
fs.writeFileSync(path.join(root, "src/generated/tool-runtime.js"), factory);
const context = vm.createContext({});
vm.runInContext(
  factory.replace("export function", "function") +
    "\nvar runtime=createToolRuntime();",
  context,
);
const catalog = vm.runInContext(
  "JSON.stringify({games:runtime.games,official:runtime.official,artwork:runtime.artwork,icons:runtime.icons})",
  context,
);
fs.writeFileSync(path.join(root, "src/generated/catalog.json"), catalog + "\n");
fs.mkdirSync(path.join(root, "public"), { recursive: true });
fs.cpSync(path.join(root, "assets"), path.join(root, "public/assets"), {
  recursive: true,
});
fs.copyFileSync(
  path.join(root, "game-night.html"),
  path.join(root, "public/game-night.html"),
);
console.log("Prepared shared game data, tool adapter and public assets.");
