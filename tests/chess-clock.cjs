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

const sandbox = {document:{addEventListener(){}}, window:{addEventListener(){}}, localStorage:{getItem(){return null;}}};
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(root,'chess-clock.js'),'utf8'), sandbox);
let now = 0;
const clock = sandbox.createChessClock(() => now);
for (const values of [[0,0],[181,0],[1,-1],[1,61],[1.5,0],[1,NaN]]) check(!clock.configure(...values), 'Reject invalid controls');
check(clock.configure(3,2), 'Configure 3 minutes plus 2 seconds');
clock.move(0); check(clock.snapshot().phase==='ready', 'Cannot move before starting');
clock.start(); now += 1500;
clock.move(1); check(clock.snapshot().active===0, 'Inactive player cannot switch');
clock.move(0);
check(clock.snapshot().remaining[0]===180500 && clock.snapshot().active===1, 'Charge elapsed time and add increment once');
clock.move(0); check(clock.snapshot().active===1, 'Duplicate tap ignored');
now += 2500; clock.pause();
const paused = clock.snapshot(); now += 100000;
check(clock.snapshot().remaining[1]===paused.remaining[1], 'Paused time does not elapse');
clock.move(1); check(clock.snapshot().active===1, 'Cannot move while paused');
clock.start(); now += 500; clock.pause();
check(clock.snapshot().remaining[1]===177000, 'Resume preserves remaining time');
check(!clock.configure(5,0), 'Cannot reconfigure a game in progress');
clock.start(); now += 177000; clock.move(1);
check(clock.snapshot().phase==='finished' && clock.snapshot().remaining[1]===0 && clock.snapshot().active===1, 'Exact deadline expires before increment or turn switch');
clock.start(); check(clock.snapshot().phase==='finished', 'Expired game cannot resume');
clock.reset(); check(clock.snapshot().phase==='ready' && clock.snapshot().remaining.every(n=>n===180000) && clock.snapshot().active===0, 'Reset restores controls and White');
clock.start(); now += 3600000;
check(clock.snapshot().remaining[0]===0 && clock.snapshot().phase==='finished', 'Long suspension catches up without callbacks');

// Restore a running deadline, paused turn, expired game and legacy controls.
let recoveryNow = 1000;
const original = sandbox.createChessClock(() => recoveryNow);
original.configure(3,2); original.start(); recoveryNow += 1500; original.move(0);
const running = original.snapshot(); recoveryNow += 30000;
const restored = sandbox.createChessClock(() => recoveryNow);
check(restored.restore(running) && restored.snapshot().remaining[1] === 150000 && restored.snapshot().active === 1, 'Running recovery subtracts elapsed wall time from the active side');
restored.pause(); const pauseSave = restored.snapshot(); recoveryNow += 60000;
const pausedRecovery = sandbox.createChessClock(() => recoveryNow);
check(pausedRecovery.restore(pauseSave) && pausedRecovery.snapshot().phase === 'paused' && pausedRecovery.snapshot().remaining[1] === 150000, 'Paused recovery preserves remaining time and phase');
recoveryNow += 200000;
const expiredRecovery = sandbox.createChessClock(() => recoveryNow);
check(expiredRecovery.restore(running) && expiredRecovery.snapshot().phase === 'finished' && expiredRecovery.snapshot().remaining[1] === 0, 'Running recovery expires without awarding increment');
const invalidRecovery = sandbox.createChessClock(() => recoveryNow);
for (const invalid of [{...running, active:2}, {...running, remaining:[-1,0]}, {...running, deadline:null}, {...running, minutes:0}]) check(!invalidRecovery.restore(invalid), 'Malformed clock recovery is rejected');

(async () => {
  const engine = process.env.BROWSER || 'chromium';
  const browser = await ({chromium,webkit}[engine]).launch({headless:true,
    ...(engine==='chromium' && process.env.CHROME_CHANNEL?{channel:process.env.CHROME_CHANNEL}:{})});
  const output = fs.mkdtempSync(path.join(os.tmpdir(),'tablefolk-clock-'));
  try {
    for (const file of ['index.html','game-night.html']) {
      const context = await browser.newContext({viewport:{width:390,height:844},hasTouch:true});
      await context.route(/^https?:/,route=>route.abort());
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror',error=>errors.push(error.message));
      await page.goto(pathToFileURL(path.join(root,file)).href+'#chess/reference');
      const time = new Date('2026-10-01T12:00:00Z');
      await page.clock.install({time}); await page.clock.pauseAt(time);
      check(await page.locator('#chess-clock-heading').textContent()==='Reloj de ajedrez','Spanish clock available offline');
      await page.locator('#lang-en').click();
      await page.locator('#chess-clock-preset').selectOption('3');
      await page.locator('#chess-clock-increment').fill('2');
      await page.locator('#chess-clock-toggle').click();
      await page.clock.runFor(1500);
      await page.locator('#chess-clock-player-0').click();
      check(await page.locator('#chess-clock-time-0').textContent()==='3:01','Browser applies increment after elapsed time');
      check(await page.locator('#chess-clock-player-1').getAttribute('aria-disabled')==='false','Black clock becomes active');
      await page.locator('#chess-clock-toggle').click();
      await page.clock.fastForward(60000);
      check(await page.locator('#chess-clock-time-1').textContent()==='3:00','Pause stops countdown');
      await page.locator('#chess-clock-toggle').click();
      await page.locator('#lang-es').click(); await page.locator('#theme').click();
      check(await page.locator('#chess-clock-player-1').getAttribute('aria-disabled')==='false','Language and theme preserve turn');
      await page.locator('#tab-full').click(); await page.clock.fastForward(30000);
      await page.locator('#tab-reference').click();
      check(await page.locator('#chess-clock-time-1').textContent()==='2:30','Other guide views preserve elapsed time');
      await page.evaluate(()=>{location.hash='#collection';});
      await page.waitForSelector('#game-grid'); await page.clock.fastForward(10000);
      await page.locator('[data-game="chess"] .card-play').click();
      check(await page.locator('#chess-clock-time-1').textContent()==='2:20','Leaving the game preserves elapsed time');
      page.once('dialog',dialog=>dialog.dismiss()); await page.locator('#chess-clock-reset').click();
      check(await page.locator('#chess-clock-time-1').textContent()==='2:20','Cancelled reset preserves game');
      // Change wall time without running timer callbacks, as with a suspended page.
      await page.clock.setFixedTime(new Date(time.getTime()+400000));
      await page.evaluate(()=>document.dispatchEvent(new Event('visibilitychange')));
      check(await page.locator('#chess-clock-time-1').textContent()==='0:00','Suspended clock catches up on visibility change');
      check((await page.locator('#chess-clock-status').textContent()).includes('se agotó'),'Time-up message is translated');
      check(await page.locator('#chess-clock-toggle').isDisabled(),'Expired game cannot restart without reset');
      await page.locator('#chess-clock-reset').click();
      await page.locator('#chess-clock-minutes').fill('0');
      await page.locator('#chess-clock-toggle').click();
      check(await page.evaluate(()=>chessClock.snapshot().phase)==='ready','Invalid custom time blocks start');
      await page.locator('#chess-clock-minutes').fill('7');
      await page.locator('#lang-en').click();
      check(await page.locator('#chess-clock-minutes').inputValue()==='7','Draft survives rerender');
      await page.locator('#chess-clock-toggle').focus(); await page.keyboard.press('Enter');
      await page.locator('#chess-clock-player-0').focus(); await page.keyboard.press('Space');
      check(await page.locator('#chess-clock-player-1').getAttribute('aria-disabled')==='false','Keyboard switches turns');
      await page.clock.runFor(1000);
      check(await page.evaluate(()=>document.activeElement.id)==='chess-clock-player-0','Tick preserves keyboard focus');
      page.once('dialog',dialog=>dialog.accept()); await page.locator('#chess-clock-reset').click();
      check(await page.locator('#chess-clock-time-0').textContent()==='7:00','Confirmed reset restores base time');
      await page.clock.setSystemTime(new Date(time.getTime()+400000));
      await page.locator('#chess-clock-toggle').click();
      await page.reload();
      check(await page.locator('#chess-clock-minutes').inputValue()==='7' && await page.locator('#chess-clock-increment').inputValue()==='2','Preferences survive reload');
      check(await page.evaluate(()=>chessClock.snapshot().phase)==='running','Reload recovers a running clock');
      await page.clock.runFor(5000);
      check(await page.locator('#chess-clock-time-0').textContent()==='6:55','Recovered running clock continues ticking');
      await page.locator('#chess-clock-toggle').click(); await page.reload();
      check(await page.evaluate(()=>chessClock.snapshot().phase)==='paused','Reload keeps a paused clock paused');
      await page.clock.fastForward(60000);
      check(await page.locator('#chess-clock-time-0').textContent()==='6:55','Paused recovery does not charge elapsed time');
      page.once('dialog',dialog=>dialog.accept()); await page.locator('#chess-clock-reset').click(); await page.reload();
      check(await page.evaluate(()=>chessClock.snapshot().phase)==='ready','Reset clears clock progress across reloads');
      for (const width of [320,390,844,1440]) {
        await page.setViewportSize({width,height:width===844?390:900});
        for (const lang of ['es','en']) {
          await page.locator('#lang-'+lang).click();
          for (const theme of ['light','dark']) {
            if (await page.evaluate(()=>state.theme)!==theme) await page.locator('#theme').click();
            check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${width}/${lang}/${theme}: no horizontal overflow`);
            const panels = await page.locator('.chess-clock-player').evaluateAll(nodes=>nodes.map(n=>({width:n.clientWidth,scroll:n.scrollWidth,height:n.clientHeight})));
            check(panels.every(p=>p.width>=44&&p.height>=44&&p.scroll<=p.width), 'Clock panels fit and are tappable');
            check(await page.locator('#chess-clock-preset').evaluate(node=>node.getBoundingClientRect().height>=44), 'Preset selector has a 44px touch target');
          }
        }
        if (file==='index.html') await page.locator('#chess-clock').screenshot({path:path.join(output,`clock-${width}.png`)});
      }
      await page.emulateMedia({media:'print'});
      check(await page.locator('#chess-clock').isHidden(),'Clock hidden in print');
      check(errors.length===0,`No browser errors: ${errors.join(', ')}`);
      await context.close();
    }
    console.log(`Passed ${checks} chess clock checks (${engine}). Screenshots: ${output}`);
  } finally { await browser.close(); }
})().catch(error=>{console.error(error);process.exitCode=1;});
