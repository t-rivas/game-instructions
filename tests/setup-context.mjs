import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import vm from "node:vm";
import {spawn} from "node:child_process";
import {chromium, webkit} from "playwright";
import {guidePlayerCount, selectedSetup} from "../src/generated/setup-context.js";
let checks = 0;
const check = (value, message) => {assert.ok(value, message); checks++;};
const defaults = {exchange:"ambassador", reformation:false, skullExpansion:false};
// Expectations are from the rulebook tables, independently specified here.
for (const [n,copies,total] of [[2,3,15],[6,3,15],[7,4,20],[8,4,20],[9,5,25],[10,5,25]]) {
  const copy = selectedSetup("coup", {...defaults,guidePlayers:n});
  check(copy[0].en.includes(`${copies} copies`) && copy[0].en.includes(`${total} cards total`), `Coup ${n}: correct deck`);
  check(copy[1].en.includes("only one coin") === (n===2), `Coup ${n}: starting coin`);
}
for (const [n,deal,schedule] of [[2,10,"5, 3 and 2"],[3,10,"5, 3 and 2"],[4,9,"5, 3 and 2"],[5,9,"5, 3 and 2"],[6,8,"7, 5 and 3"],[7,8,"7, 5 and 3"],[8,7,"7, 5 and 3"]]) {
  const copy = selectedSetup("sushi_go_party", {...defaults,guidePlayers:n});
  check(copy[1].en.includes(`deal ${deal} cards each`) && copy[1].en.includes(schedule), `Party ${n}: deal and desserts`);
  check(copy[2].en.includes("Do not use Spoon or Edamame") === (n===2), `Party ${n}: two-player menu`);
  check(copy[2].en.includes("Do not use Menu or Special Order") === (n>=7), `Party ${n}: large menu`);
}
for (const id of ["coup","sushi_go_party"]) for (const value of [null,undefined,"4",1,11,4.5,{},[],NaN])
  check(guidePlayerCount(id,value)===null, `${id}: reject malformed count`);
for (const id of ["coup","sushi_go_party"]) {
  const {createToolRuntime} = await import(`../src/generated/runtime-${id}.js`);
  for (const raw of [null,"{broken", "null", "[]", JSON.stringify({exchange:"bad",guideCounts:{[id]:"4"}})]) {
    const backing = new Map(raw===null?[]:[["tablefolk-preferences",raw]]);
    const engine = createToolRuntime({localStorage:{getItem:key=>backing.get(key)||null,setItem:(key,value)=>backing.set(key,value)}});
    engine.setRoute("en",id,"learn");
    check(engine.state.guidePlayers===null, `${id}: old/invalid preferences give general guidance`);
    check(engine.state.exchange==="ambassador", `${id}: base default`);
  }
  const backing = new Map([["tablefolk-preferences",JSON.stringify({exchange:"inquisitor",guideCounts:{coup:4,sushi_go_party:6},seen:["chess"]})]]);
  const engine = createToolRuntime({localStorage:{getItem:key=>backing.get(key)||null,setItem:(key,value)=>backing.set(key,value)}});
  engine.setRoute("en",id,"learn");
  check(engine.state.guidePlayers===(id==="coup"?4:6), `${id}: restore count`);
  check(engine.state.exchange==="inquisitor", `${id}: preserve explicit Inquisitor`);
  const before = backing.get("tablefolk-preferences");
  engine.setRoute("es",id,"learn",{exchange:"ambassador",guidePlayers:2});
  engine.update({guidePlayers:8});
  check(backing.get("tablefolk-preferences")===before, `${id}: temporary shared choices never persist`);
  engine.setRoute("en",id,"play");
  check(engine.state.guidePlayers===(id==="coup"?4:6) && engine.state.exchange==="inquisitor", `${id}: restore local snapshot`);
  engine.update({guidePlayers:3});
  const saved = JSON.parse(backing.get("tablefolk-preferences"));
  check(saved.guideCounts[id]===3 && saved.guideCounts[id==="coup"?"sushi_go_party":"coup"]===(id==="coup"?6:4) && saved.seen[0]==="chess", `${id}: merge independent saved counts`);
}
// A scored Skull King game and unfinished draft keep their fixed base edition.
const model = vm.createContext({localStorage:{getItem:()=>null}});
vm.runInContext(fs.readFileSync("skull-score.js","utf8"),model);
const skullSaved = vm.runInContext(`const fixture=createSkullGame(['Ana','Bruno'],false);
saveSkullRound(fixture,1,1,[{bid:1,tricks:1,bonus:0,adjustment:0,explanation:''},{bid:0,tricks:0,bonus:0,adjustment:0,explanation:''}]);
JSON.stringify({version:1,game:fixture,draft:{round:2,cards:'2',entries:[{bid:'1',tricks:'',bonus:'',adjustment:'',explanation:''},{bid:'0',tricks:'',bonus:'',adjustment:'',explanation:''}]}})`,model);
const {createToolRuntime:createSkullRuntime}=await import("../src/generated/runtime-skull_king.js");
const skullStorage=new Map([["tablefolk-skull-score-v1",skullSaved]]);
const skull=createSkullRuntime({localStorage:{getItem:key=>skullStorage.get(key)||null,setItem:(key,value)=>skullStorage.set(key,value)}});
skull.setRoute("en","skull_king","play");
skull.update({skullExpansion:true});
check(skullStorage.get("tablefolk-skull-score-v1")===skullSaved, "Expansion guide choice preserves scored game and draft");
check(skull.savedGames()[0].completed===1, "Existing Skull King round remains active");
skull.setRoute("es","skull_king","learn",{skullExpansion:false});
skull.update({skullExpansion:true});
check(skullStorage.get("tablefolk-skull-score-v1")===skullSaved, "Shared expansion choice preserves running game");
const server = spawn(process.execPath,["scripts/serve-export.mjs"],{stdio:["ignore","pipe","inherit"]});
const browser = await (process.env.BROWSER === "webkit" ? webkit : chromium).launch({headless:true,...(process.env.CHROME_CHANNEL?{channel:process.env.CHROME_CHANNEL}:{})});
const output = fs.mkdtempSync(path.join(os.tmpdir(),"tablefolk-setup-context-"));
try {
  const base = await new Promise(resolve=>server.stdout.once("data",data=>resolve(data.toString().trim())));
  const page = await browser.newPage({viewport:{width:390,height:800},reducedMotion:"reduce"});
  const errors=[];page.on("pageerror",error=>errors.push(error.message));
  async function navigate(route) {await page.goto(base+route);await page.waitForSelector('[data-tool="sources"][data-ready="true"]');}
  await navigate("/en/coup/learn/");
  check(await page.locator("#guide-player-count").inputValue()==="", "Fresh count remains unknown");
  check(await page.locator("#inquisitor-toggle").getAttribute("aria-checked")==="false", "Fresh hosted Coup uses Ambassador");
  await page.locator("#guide-player-count").selectOption("4");
  await page.locator('[data-learning-stage="setup"]').click();
  check((await page.locator('.lesson-copy').innerText()).includes("15 cards total"), "Four-player lesson shows one applicable deck size");
  check(!(await page.locator('.lesson-copy').innerText()).includes("20 cards"), "Other counts stay out of main lesson");
  await page.reload();await page.waitForSelector('[data-tool="sources"][data-ready="true"]');
  check(await page.locator("#guide-player-count").inputValue()==="4", "Count reloads");
  await page.locator("#tab-play").click();await page.waitForSelector('[data-tool="play"][data-ready="true"]');
  check(await page.locator("#guide-player-count").inputValue()==="4", "Count follows guide views");
  await page.locator("#jump-to-tool").click();
  const names = page.locator('input[id^="coup-name-"]');
  for (let i=0;i<await names.count();i++) await names.nth(i).fill(`Player ${i+1}`);
  await page.locator("#coup-planned").fill("2");
  await page.locator("#coup-start").click();
  const sessionBefore = await page.evaluate(()=>localStorage.getItem("tablefolk-coup-session"));
  check(JSON.parse(sessionBefore).started, "Real test session started");
  await page.locator("#guide-player-count").selectOption("8");
  await page.locator("#inquisitor-toggle").click();
  check(await page.evaluate(()=>localStorage.getItem("tablefolk-coup-session"))===sessionBefore, "Guide count and exchange leave running session unchanged");
  await page.locator("#guide-player-count").selectOption("4");
  const savedBefore = await page.evaluate(()=>localStorage.getItem("tablefolk-preferences"));
  await navigate("/es/coup/learn/?shared=1&players=8&exchange=inquisitor&reformation=0");
  check(await page.locator("#guide-player-count").inputValue()==="8", "Shared count overrides local");
  await page.locator("#guide-player-count").selectOption("9");
  await page.waitForFunction(()=>new URL(location.href).searchParams.get("players")==="9");
  check(await page.evaluate(()=>localStorage.getItem("tablefolk-preferences"))===savedBefore, "Shared count preserves local storage");
  await page.locator("#tab-play").click();
  await page.waitForSelector('[data-tool="play"][data-ready="true"]');
  await page.locator("#lang-en").click();
  await page.waitForURL("**/en/coup/play/**");
  await page.waitForFunction(()=>document.querySelector("#guide-player-count")?.value==="9" && document.querySelector("main")?.dataset.route==="/en/coup/play/");
  check(await page.locator("#guide-player-count").inputValue()==="9" && new URL(page.url()).searchParams.get("exchange")==="inquisitor", "Shared setup follows language and view changes");
  await navigate("/en/coup/learn/");
  check(await page.locator("#guide-player-count").inputValue()==="4", "Local snapshot recovers after shared route");
  for(const invalid of ["99","-2","4.5","banana",""]) {
    await navigate(`/en/sushi_go_party/learn/?shared=1&players=${invalid}`);
    check(await page.locator("#guide-player-count").inputValue()==="", "Malformed shared count becomes unknown");
    check(!new URL(page.url()).searchParams.has("players"), "Malformed count stripped from canonical URL");
  }
  await navigate("/en/sushi_go_party/play/?players=8");
  check(await page.locator("#guide-player-count").inputValue()==="", "Nonshared count never becomes setup");
  for (const n of [2,3,4,5,6,7,8]) {
    await page.locator("#guide-player-count").selectOption(String(n));
    const expected = n<=3?10:n<=5?9:n<=7?8:7;
    check((await page.locator("#table-sheet .quick-list").innerText()).includes(`deal ${expected} cards each`), `Party ${n}: quick reference updates`);
  }
  await navigate("/en/sushi_go_party/learn/?shared=1&players=8");
  await page.locator('[data-learning-stage="setup"]').click();
  check((await page.locator('[data-setup-visual="sushi_go_party-2"]').innerText()).includes("7 secret cards to each of 8 players"), "Physical setup diagram follows guide count");
  // Hosted layout matrix, including expanded alternatives and keyboard access.
  for(const id of ["coup","sushi_go_party","skull_king"]) for(const lang of ["en","es"]) for(const theme of ["dark","light"]) for(const width of [320,390,768,1440]) {
    await page.setViewportSize({width,height:1000});
    await navigate(`/${lang}/${id}/learn/?shared=1&players=4&exchange=ambassador&expansion=0`);
    await page.evaluate(theme=>document.documentElement.dataset.theme=theme,theme);
    const box=page.locator(".guide-setup-context");
    check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1), `${id}/${lang}/${theme}/${width}: page fits`);
    check(await box.evaluate(el=>[...el.querySelectorAll("select,p,summary")].every(node=>node.scrollWidth<=node.clientWidth+1)), `${id}/${lang}/${theme}/${width}: content fits`);
    check(await box.evaluate(el=>[...el.querySelectorAll("select,summary")].every(node=>node.getBoundingClientRect().height>=44)), "Setup controls have 44px touch targets");
    await box.screenshot({path:path.join(output,`${id}-${lang}-${theme}-${width}.png`)});
    await box.locator("summary").last().focus();await page.keyboard.press("Enter");
    check(await box.locator("details").last().evaluate(el=>el.open), "Alternatives open by keyboard");
    if (width===320 && lang==="es") {
      await page.addStyleTag({content:"html {font-size: 125% !important;}"});
      check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1), "Enlarged Spanish text fits");
      await box.screenshot({path:path.join(output,`${id}-${lang}-${theme}-enlarged-320.png`)});
    }
  }
  await page.goto(base+"/game-night.html#sushi_go_party/learn");
  await page.locator("#guide-player-count").selectOption("8");
  check((await page.locator("#learn-setup").innerText()).match(/(?:For 8 players|Para 8 jugadores)/), "Portable setup uses selected count");
  await page.reload();check(await page.locator("#guide-player-count").inputValue()==="8", "Portable count reloads");
  check(!errors.length, `No page errors: ${errors.join(", ")}`);
  console.log(`Passed ${checks} setup-context checks. Screenshots: ${output}`);
} finally {await browser.close();server.kill();}
