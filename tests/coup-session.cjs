const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const vm = require('node:vm');
const {pathToFileURL} = require('node:url');
const {chromium, webkit} = require('playwright');
const root = path.resolve(__dirname, '..');
let checks = 0;
function check(value, message) { assert.ok(value, message); checks++; }
const sandbox = {localStorage:{getItem(){return null;}}};
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(root, 'coup-session.js'), 'utf8'), sandbox);
const create = sandbox.createCoupSession;
const points = session => session.snapshot().standings.sort((a,b)=>a.id-b.id).map(p=>p.points).join(',');

for (let count=2; count<=10; count++) {
  const session = create();
  check(session.configure(Array.from({length:count}, (_,i)=>`P${i}`), 'default', 6), `Accept ${count} players`);
}
const invalid = create();
for (const count of [0,-1,1.5,NaN,Infinity,Number.MAX_SAFE_INTEGER+1]) check(!invalid.configure(['A','B'], 'default', count), 'Reject invalid game count');
for (const names of [[],['A'],Array.from({length:11},(_,i)=>String(i)),['A',' '],['A',' a ']]) check(!invalid.configure(names,'default',6), 'Reject invalid roster');
check(!invalid.configure(['A','B'],'custom',6), 'Reject extra scoring mode');
check(!invalid.save(0,0), 'Cannot record before starting');

for (const mode of ['default','wins']) {
  const session = create(); session.configure(['A','B','C'],mode,2);
  for (const [winner,runnerUp] of [[0,0],[0,4],[4,0],[-1,0],[0.5,1],[null,1]]) check(!session.save(0,winner,runnerUp), 'Reject duplicate and invalid participants');
  if (mode==='default') check(!session.save(0,0), 'Default mode requires runner-up');
  check(session.save(0,0,1), 'Record game');
  check(points(session)===(mode==='default'?'3,1,0':'1,0,0'), `${mode}: exact points`);
  check(!session.save(0,0,1), 'Cannot save same game twice');
  check(!session.configure(['A','B'], 'wins', 10), 'Settings lock after first result');
  check(!session.renameAll(['A','B']), 'Rename cannot change membership');
  check(session.rename(0,'Alice') && session.snapshot().results[0].winner===0, 'Rename preserves identity');
  check(session.renameAll(['B','Alice','C']), 'Atomic rename permits swapping names');
  check(!session.rename(0,'Alice'), 'Reject duplicate names');
  check(session.save(1,1,0), 'Record final game');
  check(session.snapshot().finished && session.snapshot().winners.join(',')==='0,1', 'Equal points and wins share session victory');
  check(!session.save(2,2,0), 'Stop at planned game count');
  check(session.correct(0,1,2), 'Correct previous game after finish');
  check(points(session)===(mode==='default'?'1,6,1':'0,2,0'), 'Correction changes standings');
  check(session.snapshot().winners.join(',')==='1', 'Correction changes session winners');
  check(!session.correct(0,1,1) && !session.correct(5,0,1), 'Reject invalid corrections');
  check(session.undo() && !session.snapshot().finished && session.snapshot().winners.length===0, 'Undo final result reopens session');
  check(session.snapshot().results.length===1, 'Undo removes one result');
  session.undo(); check(session.snapshot().locked, 'Undo all results does not unlock settings');
  check(!session.configure(['X','Y'],'default',6), 'Lock persists with no remaining results');
  const restored = create(JSON.parse(JSON.stringify(session.snapshot())));
  check(restored.snapshot().locked && !restored.configure(['X','Y'],'default',6), 'Lock persists after reload with no results');
  session.newSession();
  check(!session.snapshot().locked && !session.snapshot().started && points(session)==='0,0,0', 'New session clears scores and unlocks setup');
  check(session.snapshot().names.join(',')==='B,Alice,C', 'New session keeps names');
}
for (const mode of ['default','wins']) {
  const duel = create(); duel.configure(['A','B'],mode,1);
  check(duel.save(0,0), 'Duel needs winner only');
  check(points(duel)===(mode==='default'?'3,0':'1,0'), 'Two-player loser earns zero');
  check(duel.snapshot().standings.find(p=>p.id===1).runnerUps===1, 'Duel infers last eliminated');
  check(duel.correct(0,1) && points(duel)===(mode==='default'?'0,3':'0,1'), 'Duel correction updates scores');
}
const wins = create(); wins.configure(['A','B','C'],'wins',1);
check(wins.save(0,2) && points(wins)==='0,0,1', 'Wins only permits omitted runner-up');
const tie = create(); tie.configure(['A','B','C','D'],'default',5);
[[0,1],[0,1],[2,1],[3,2],[1,3]].forEach((r,i)=>tie.save(i,...r));
check(points(tie)==='6,6,4,4' && tie.snapshot().winners.join(',')==='0', 'Most wins breaks a points tie');
const detached = tie.snapshot(); detached.results[0].winner=3; detached.names[0]='Changed';
check(tie.snapshot().names[0]==='A' && points(tie)==='6,6,4,4', 'Snapshot cannot mutate saved scores');
check(points(create(JSON.parse(JSON.stringify(tie.snapshot()))))==='6,6,4,4', 'Reload recomputes valid results');
for (const corruption of [null,{}, {...tie.snapshot(),mode:'custom'}, {...tie.snapshot(),results:[{winner:0,runnerUp:0}]}]) {
  check(!create(corruption).snapshot().started, 'Invalid stored session falls back to fresh setup');
}

(async () => {
  const engine = process.env.BROWSER || 'chromium';
  const browser = await ({chromium,webkit}[engine]).launch(process.env.CHROME_CHANNEL ? {channel:process.env.CHROME_CHANNEL} : {});
  const output = fs.mkdtempSync(path.join(os.tmpdir(),'tablefolk-coup-'));
  try {
    for (const file of ['index.html','game-night.html']) {
      const context = await browser.newContext({viewport:{width:390,height:900}});
      const page = await context.newPage(); const errors = [], requests = [];
      page.on('pageerror', error=>errors.push(error.message));
      page.on('request', request=>{if (/^https?:/.test(request.url())) requests.push(request.url());});
      await page.goto(pathToFileURL(path.join(root,file)).href+'#coup/reference');
      check((await page.locator('#coup-session-heading').textContent()).includes('Marcador'), 'Spanish scoreboard available');
      await page.locator('#lang-en').click();
      check((await page.locator('#coup-session').textContent()).includes('not official Coup scoring'), 'House scoring clearly labeled');
      check(await page.locator('#coup-planned').inputValue()==='6', 'Default is six games');
      await page.locator('#coup-name-0').fill('Alice'); await page.locator('#coup-name-1').fill(' alice ');
      await page.locator('#coup-start').click();
      check(await page.locator('#coup-session-error').textContent()!=='', 'Duplicate names show error');
      await page.locator('#coup-name-1').fill('Bob');
      for (const count of ['0','1.5','-1']) {
        await page.locator('#coup-planned').fill(count); await page.locator('#coup-start').click();
        check(await page.locator('#coup-start').count()===1, 'Invalid whole-number count blocks start');
      }
      await page.locator('#coup-planned').fill('1');
      await page.locator('#theme').click();
      check(await page.locator('#coup-name-0').inputValue()==='Alice', 'Setup draft survives theme switch');
      await page.locator('#coup-start').click();
      check(await page.locator('#coup-edit-setup').count()===1, 'Setup editable before first result');
      check(await page.locator('.scoreboard-heading #coup-new-session').isVisible(), 'Reset is prominent beside scoreboard title');
      check(await page.locator('#coup-runner-up').count()===0, 'Duel form asks for winner only');
      await page.locator('#coup-save-result').click();
      check(await page.evaluate(()=>coupSession.snapshot().results.length)===0, 'Missing selection blocks save');
      await page.locator('#coup-winner').selectOption('0');
      await page.locator('#coup-save-result').focus(); await page.keyboard.press('Enter');
      check(await page.locator('[data-coup-player="0"] td').first().textContent()==='3', 'Default duel winner gets three');
      check(await page.locator('[data-coup-player="1"] td').first().textContent()==='0', 'Default duel loser gets zero');
      check(await page.locator('#coup-session-winners').textContent()==='Session winner: Alice', 'Final winner announced');
      check(await page.locator('#coup-result-form').count()===0 && await page.locator('#coup-edit-setup').count()===0, 'Finished session stops recording and locks settings');
      await page.locator('#coup-undo').click();
      check(await page.locator('#coup-result-form').count()===1 && await page.locator('#coup-session-winners').count()===0, 'Undo final result restores result form');
      await page.reload();
      check(await page.locator('#coup-edit-setup').count()===0, 'Reload preserves lock after undoing only result');
      await page.locator('#coup-new-session').click();
      check(await page.locator('#coup-name-0').inputValue()==='Alice', 'New session retains names');
      await page.locator('#coup-add-player').click(); await page.locator('#coup-name-2').fill('Carla');
      await page.locator('#coup-planned').fill('2'); await page.locator('#coup-start').click();
      await page.locator('#coup-winner').selectOption('0'); await page.locator('#coup-runner-up').selectOption('0');
      await page.locator('#coup-save-result').click();
      check((await page.locator('#coup-session-error').textContent()).includes('different runner-up'), 'Duplicate result selection shows error');
      check(await page.evaluate(()=>coupSession.snapshot().results.length)===0, 'Duplicate selection cannot change scores');
      await page.locator('#coup-runner-up').selectOption('1');
      await page.locator('#inquisitor-toggle').click(); await page.locator('#reformation-toggle').click();
      check(await page.locator('#coup-winner').inputValue()==='0' && await page.locator('#coup-runner-up').inputValue()==='1', 'Variant switches preserve pending result');
      // Call the same submit handler twice, simulating duplicate event delivery.
      await page.evaluate(()=>{
        const handler=document.getElementById('coup-result-form').onsubmit;
        handler({preventDefault(){}}); handler({preventDefault(){}});
      });
      check(await page.evaluate(()=>coupSession.snapshot().results.length)===1, 'Double submit saves only one game');
      await page.locator('#coup-winner').selectOption('1'); await page.locator('#coup-runner-up').selectOption('0');
      await page.locator('#coup-save-result').click();
      check((await page.locator('#coup-session-winners').textContent()).includes('Shared session winners: Alice, Bob'), 'Browser announces shared winners');
      const saved = await page.evaluate(()=>JSON.stringify(coupSession.snapshot()));
      for (const selector of ['#inquisitor-toggle','#reformation-toggle','#lang-es','#theme']) await page.locator(selector).click();
      await page.locator('#tab-full').click(); await page.locator('#tab-reference').click();
      check(await page.evaluate(()=>JSON.stringify(coupSession.snapshot()))===saved, 'Saved scores survive variants, language, theme and guide views');
      await page.reload();
      check(await page.evaluate(()=>JSON.stringify(coupSession.snapshot()))===saved, 'Saved results survive reload');
      await page.locator('#lang-en').click();
      await page.locator('[data-coup-correct="0"]').click();
      await page.locator('#coup-winner').selectOption('1'); await page.locator('#coup-runner-up').selectOption('2');
      await page.locator('#coup-save-result').click();
      check(await page.locator('[data-coup-player="1"] td').first().textContent()==='6', 'Correction recalculates points');
      check(await page.locator('#coup-session-winners').textContent()==='Session winner: Bob', 'Correction recalculates session winner');
      await page.locator('.coup-session-names summary').click();
      await page.locator('#coup-rename-1').fill('Robert'); await page.locator('#coup-rename-form button').click();
      check((await page.locator('.coup-session-history').textContent()).includes('Robert') && (await page.locator('#coup-session-winners').textContent()).includes('Robert'), 'Rename updates history and winner without changing identity');
      check(await page.locator('[data-coup-player="1"] td').first().textContent()==='6', 'Rename preserves score');
      await page.locator('#coup-undo').click();
      check(await page.locator('#coup-session-winners').count()===0, 'Undo corrected final session reopens it');
      page.once('dialog',dialog=>dialog.dismiss()); await page.locator('#coup-new-session').click();
      check(await page.evaluate(()=>coupSession.snapshot().results.length)===1, 'Cancelled new session preserves results');
      page.once('dialog',dialog=>dialog.accept()); await page.locator('#coup-new-session').click();
      check(await page.evaluate(()=>coupSession.snapshot().standings.every(p=>p.points===0&&p.wins===0&&p.runnerUps===0)), 'New session zeroes all totals');
      check(await page.locator('#coup-setup-form').isVisible() && await page.locator('#coup-name-0').isEditable() && await page.locator('#coup-add-player').isEnabled(), 'Reset allows editing names and player membership');
      await page.reload();
      check(await page.evaluate(()=>!coupSession.snapshot().locked && !coupSession.snapshot().started && coupSession.snapshot().results.length===0), 'Reset remains unlocked with empty history after reload');
      await page.locator('#coup-mode').selectOption('wins'); await page.locator('#coup-planned').fill('1'); await page.locator('#coup-start').click();
      check(!await page.locator('#coup-runner-up').getAttribute('required'), 'Wins-only runner-up is optional');
      await page.locator('#coup-winner').selectOption('2'); await page.locator('#coup-save-result').click();
      check(await page.locator('[data-coup-player="2"] td').first().textContent()==='1', 'Browser wins-only winner earns one');
      check(await page.locator('[data-coup-player="0"] td').first().textContent()==='0', 'Browser wins-only other players earn zero');
      page.once('dialog',dialog=>dialog.accept()); await page.locator('#coup-new-session').click();
      await page.locator('#coup-remove-player').click(); await page.locator('#coup-start').click();
      await page.locator('#coup-winner').selectOption('1'); await page.locator('#coup-save-result').click();
      check(await page.locator('[data-coup-player="1"] td').first().textContent()==='1' && await page.locator('[data-coup-player="0"] td').first().textContent()==='0', 'Browser wins-only duel scoring');
      for (const width of [320,390,844,1440]) {
        await page.setViewportSize({width,height:width===844?390:900});
        for (const lang of ['es','en']) {
          await page.locator('#lang-'+lang).click();
          for (const theme of ['light','dark']) {
            if (await page.evaluate(()=>state.theme)!==theme) await page.locator('#theme').click();
            check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth), `${width}/${lang}/${theme}: no page overflow`);
            check(await page.locator('#coup-new-session').evaluate(n=>n.getBoundingClientRect().height>=44), 'New session has a touch target');
          }
        }
        if (file==='index.html') await page.locator('#coup-session').screenshot({path:path.join(output,`session-${width}.png`)});
      }
      await page.emulateMedia({media:'print'});
      check(await page.locator('#coup-session').isHidden(), 'Scoreboard does not clutter printed rules');
      check(errors.length===0, `No browser errors: ${errors.join(', ')}`);
      check(requests.length===0, 'Scoreboard works offline');
      await context.close();
    }
    console.log(`Passed ${checks} Coup session checks (${engine}). Screenshots: ${output}`);
  } finally { await browser.close(); }
})().catch(error=>{console.error(error);process.exitCode=1;});
