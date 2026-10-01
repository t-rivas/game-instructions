const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const vm = require('node:vm');
const {pathToFileURL} = require('node:url');
const root = path.resolve(__dirname,'..');
let checks = 0;
function check(value,message) { assert.ok(value,message); checks++; }
const sandbox = {
  document:{addEventListener(){},getElementById(){return null;}}, window:{addEventListener(){}},
  localStorage:{getItem(){return null;},setItem(){}}, setInterval(){return 1;},clearInterval(){}
};
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(root,'poker-timer.js'),'utf8'),sandbox);
const level = (duration,smallBlind=25,bigBlind=50,ante=0) => ({type:'level',duration,smallBlind,bigBlind,ante});
const schedule = [level(1),{type:'break',duration:2},level(3,50,100,10),level(1,100,200)];
let now = 1000000;
const create = saved => sandbox.createPokerTimer(() => now,saved);
const serialized = timer => JSON.parse(JSON.stringify(timer.serialize()));
const clock = create();
for (const rows of [[],null,[level(0)],[level(-1)],[level(1.5)],[level(Infinity)],[level(NaN)],
  [level(Number.MAX_SAFE_INTEGER)],[level(1,0)],[level(1,51,50)],[level(1,1,0)],
  [level(1,1.5)],[level(1,1,Infinity)],[level(1,1,2,-1)],[level(1,1,2,0.5)],
  [level(1,1,2,NaN)],[level(1,1,2,Infinity)],[level(1,1,2,Number.MAX_SAFE_INTEGER+1)],
  [{type:'turn',duration:1}],[{type:'break',duration:0}],[{type:'break',duration:1.5}]]) {
  check(!clock.configure(rows),'Reject invalid finite whole-number schedule: '+JSON.stringify(rows));
}
check(clock.configure([{type:'level',duration:1,smallBlind:1,bigBlind:1}]),'Equal blinds and omitted ante accepted');
check(clock.snapshot().schedule[0].ante === 0,'Omitted ante is zero per player');
check(clock.configure(schedule),'Configure ordered levels and break');
check(clock.snapshot().phase === 'ready' && clock.snapshot().remaining === 60000,'Ready starts at first full duration');
check(!clock.navigate(1),'Navigation disabled before starting');
clock.start();
check(!clock.configure([level(5)]),'Running schedule locked');
now += 59999;
check(clock.snapshot().index === 0 && clock.snapshot().remaining === 1,'Before exact boundary first row retains one millisecond');
now++;
check(clock.snapshot().index === 1 && clock.snapshot().remaining === 120000 && clock.snapshot().phase === 'running','Exact transition starts break immediately');
check(!('smallBlind' in clock.snapshot().schedule[1]) && !('ante' in clock.snapshot().schedule[1]),'Break has no blinds or ante');
now += 125000;
check(clock.snapshot().index === 2 && clock.snapshot().remaining === 175000,'Break ends into next level with overshoot charged');
clock.pause();
const pausedRemaining = clock.snapshot().remaining;
now += 9999999;
check(clock.snapshot().remaining === pausedRemaining && clock.snapshot().phase === 'paused','Pause freezes elapsed time');
check(!clock.configure([level(5)]),'Paused schedule locked');
const pausedReload = create(serialized(clock));
check(pausedReload.snapshot().phase === 'paused' && pausedReload.snapshot().remaining === pausedRemaining,'Paused reload stays paused');
now += 500000;
check(pausedReload.snapshot().remaining === pausedRemaining,'Reloaded pause remains frozen through suspension');
pausedReload.start(); now += 1000;
check(pausedReload.snapshot().remaining === pausedRemaining-1000,'Resume uses preserved remaining time');
pausedReload.pause();
check(pausedReload.navigate(-1),'Paused previous row available');
check(pausedReload.snapshot().index === 1 && pausedReload.snapshot().remaining === 120000 && pausedReload.snapshot().phase === 'paused','Manual previous restores break duration and preserves pause');
check(pausedReload.navigate(1) && pausedReload.snapshot().remaining === 180000 && pausedReload.snapshot().phase === 'paused','Manual next restores level duration while paused');
pausedReload.start(); now += 5000;
check(pausedReload.navigate(-1) && pausedReload.snapshot().remaining === 120000 && pausedReload.snapshot().phase === 'running','Running previous starts full duration and preserves running');
now += 1000; pausedReload.navigate(1);
check(pausedReload.snapshot().remaining === 180000 && pausedReload.snapshot().phase === 'running','Running next starts full duration');
check(!pausedReload.navigate(0) && !pausedReload.navigate(2),'Only adjacent navigation supported');
pausedReload.navigate(1); now += 60000;
check(pausedReload.snapshot().phase === 'finished' && pausedReload.snapshot().remaining === 0 && pausedReload.snapshot().index === 3,'Final row finishes without looping');
check(!pausedReload.start() && !pausedReload.navigate(-1) && !pausedReload.configure(schedule),'Finished timer stays locked until reset');
now += 3600000;
check(pausedReload.snapshot().phase === 'finished','Finished timer remains finished');
const finishedReload = create(serialized(pausedReload));
check(finishedReload.snapshot().phase === 'finished','Finished reload remains finished');
finishedReload.reset();
check(finishedReload.snapshot().phase === 'ready' && finishedReload.snapshot().index === 0 && finishedReload.snapshot().remaining === 60000 && !finishedReload.snapshot().notice,'Reset clears progress and notice, preserves schedule');
check(finishedReload.configure([level(2)]),'Reset unlocks editing');

// No timer callbacks between start and restore: cross a level and a break.
const missed = create(); missed.configure(schedule); missed.start(); const saved = serialized(missed);
now += 210000;
const recovered = create(saved);
check(recovered.snapshot().index === 2 && recovered.snapshot().remaining === 150000 && recovered.snapshot().phase === 'running','Reload recovers across several levels and breaks');
check(recovered.snapshot().notice.crossed === 2,'Catch-up produces one visible notice describing missed transitions');
check(create(serialized(recovered)).snapshot().notice.crossed === 2,'Catch-up notice persists when pagehide saves before reload');
now += 700000;
const completed = create(saved);
check(completed.snapshot().phase === 'finished' && completed.snapshot().remaining === 0,'Suspension through entire schedule completes');
const one = create(); one.configure([level(1)]); one.start(); now += 60000;
check(one.snapshot().phase === 'finished','Single-row schedule finishes at boundary');
const resetRunning = create(); resetRunning.configure(schedule); resetRunning.start(); now += 10000; resetRunning.reset();
check(resetRunning.snapshot().phase === 'ready' && resetRunning.snapshot().remaining === 60000 && resetRunning.serialize().deadline === null,'Running reset clears deadline');
const resetReload = create(serialized(resetRunning));
check(resetReload.snapshot().phase === 'ready','Reset state persists');
const boundaryPause = create(); boundaryPause.configure(schedule); boundaryPause.start(); now += 60000; boundaryPause.pause();
check(boundaryPause.snapshot().index === 1 && boundaryPause.snapshot().remaining === 120000 && boundaryPause.snapshot().phase === 'paused','Pause at boundary first transitions then pauses');
const boundaryNav = create(); boundaryNav.configure(schedule); boundaryNav.start(); now += 60000; boundaryNav.navigate(1);
check(boundaryNav.snapshot().index === 2 && boundaryNav.snapshot().remaining === 180000,'Manual navigation first catches up then selects adjacent row');
for (const invalid of [{...saved,version:2},{...saved,index:99},{...saved,phase:'other'},{...saved,deadline:Infinity},
  {...saved,schedule:[level(-1)]},{...saved,phase:'paused',deadline:null,remaining:-1},
  {...saved,phase:'paused',deadline:null,remaining:999999},{...saved,phase:'paused',deadline:null,remaining:0},
  {...saved,phase:'ready',index:1,deadline:null,remaining:120000},
  {...saved,phase:'finished',index:0,deadline:null,remaining:0}]) {
  check(create(invalid).snapshot().phase === 'ready','Invalid saved state safely falls back to ready');
}
console.log(`PASS: ${checks} deterministic timing checks`);
if (process.env.UNIT_ONLY) process.exit(0);

(async () => {
  const {chromium,webkit} = require('playwright');
  const engine = process.env.BROWSER || 'chromium';
  const browser = await ({chromium,webkit}[engine]).launch({headless:true,...(engine==='chromium' && process.env.CHROME_CHANNEL?{channel:process.env.CHROME_CHANNEL}:{})});
  const output = fs.mkdtempSync(path.join(os.tmpdir(),'tablefolk-poker-'));
  try {
    for (const file of ['index.html','game-night.html']) {
      const context = await browser.newContext({viewport:{width:390,height:844}});
      await context.route(/^https?:/,route => route.abort());
      const page = await context.newPage(), errors = [];
      page.on('pageerror',error => errors.push(error.message));
      const time = new Date('2026-10-01T12:00:00Z');
      await page.clock.install({time:new Date(time.getTime() - 1000)}); await page.clock.pauseAt(time);
      await page.goto(pathToFileURL(path.join(root,file)).href+'#poker/reference');
      check(await page.locator('#poker-timer-heading').textContent() === 'Reloj de ciegas del torneo','Spanish timer works offline');
      await page.locator('#lang-en').click();
      for (const [row,duration] of [[0,'1'],[1,'1'],[2,'2'],[3,'1']]) await page.locator(`#poker-row-${row}-duration`).fill(duration);
      await page.locator('#poker-row-0-smallBlind').fill('51');
      await page.locator('#poker-timer-toggle').click();
      check(await page.evaluate(() => pokerTimer.snapshot().phase) === 'ready' && await page.locator('#poker-timer-error').isVisible(),'Invalid blind order blocks start with visible error');
      await page.locator('#poker-row-0-smallBlind').fill('25');
      await page.locator('#poker-row-0-ante').fill('');
      await page.locator('#poker-row-0-duration').fill('1.5');
      await page.locator('#poker-timer-toggle').click();
      check(await page.evaluate(() => pokerTimer.snapshot().phase) === 'ready','Fractional duration blocks start');
      await page.locator('#poker-row-0-duration').fill('1');
      await page.locator('[data-poker-edit="break"]').click();
      check(await page.locator('[data-schedule-row]').count() === 5,'Can add a break');
      await page.locator('[data-poker-edit="up"][data-row="4"]').click();
      check(await page.locator('#poker-row-3-smallBlind').count() === 0,'Reorder moves break before level');
      await page.locator('[data-poker-edit="remove"][data-row="3"]').click();
      check(await page.locator('[data-schedule-row]').count() === 4,'Can remove a row');
      await page.locator('[data-poker-edit="level"]').click();
      check(await page.locator('#poker-row-4-smallBlind').count() === 1,'Can add a playing level');
      await page.locator('[data-poker-edit="remove"][data-row="4"]').click();
      await page.locator('#poker-timer-toggle').focus(); await page.keyboard.press('Enter');
      check(!await page.locator('#poker-schedule-details').evaluate(node => node.open), 'Running timer collapses schedule');
      check(await page.locator('#poker-row-0-duration').isDisabled() && await page.locator('[data-poker-edit="level"]').isDisabled(),'Started schedule inputs and row actions locked');
      check((await page.locator('#poker-timer-blinds').textContent()).includes('Ante per player 0'),'Ante explicitly per player');
      check((await page.locator('#poker-timer-next').textContent()).includes('Level 2'),'Next scheduled level shown');
      await page.clock.runFor(1000);
      check(await page.locator('#poker-timer-time').textContent() === '0:59','Deadline countdown updates');
      check(await page.evaluate(() => document.activeElement.id) === 'poker-timer-toggle','Tick preserves focus');
      await page.clock.fastForward(59000);
      check(await page.locator('#poker-timer-current').textContent() === 'Level 2' && await page.locator('#poker-timer-time').textContent() === '1:00','Automatic transition starts next full row');
      check(await page.locator('#poker-timer-notice').isVisible(),'Visible transition notice');
      check((await page.locator('#poker-timer-next').textContent()).includes('Break'),'Upcoming break shown');
      await page.locator('#poker-timer-toggle').click();
      await page.clock.fastForward(120000); await page.reload();
      check(await page.locator('#poker-timer-phase').textContent() === 'Paused' && await page.locator('#poker-timer-time').textContent() === '1:00','Paused timer remains paused across reload');
      await page.locator('#poker-timer-forward').click();
      check(await page.locator('#poker-timer-current').textContent() === 'Break' && await page.locator('#poker-timer-time').textContent() === '2:00' && await page.locator('#poker-timer-phase').textContent() === 'Paused','Manual next to break restores full duration while paused');
      check((await page.locator('#poker-timer-blinds').textContent()).includes('No blinds or ante'),'Break display has no blind values');
      await page.locator('#poker-timer-previous').click();
      check(await page.locator('#poker-timer-time').textContent() === '1:00','Manual previous restores full duration');
      await page.locator('#poker-timer-toggle').click(); await page.clock.runFor(1000);
      await page.locator('#poker-timer-forward').click();
      check(await page.locator('#poker-timer-time').textContent() === '2:00' && await page.locator('#poker-timer-phase').textContent() === 'Running','Manual running navigation preserves running');
      await page.locator('#lang-es').click(); await page.locator('#theme').click();
      check(await page.locator('#poker-timer-current').textContent() === 'Descanso','Language/theme rerender preserves timer');
      await page.locator('#tab-full').click(); await page.clock.fastForward(10000); await page.locator('#tab-reference').click();
      check(await page.locator('#poker-timer-time').textContent() === '1:50','Timing continues across guide views');
      page.once('dialog', dialog => dialog.dismiss()); await page.locator('#poker-timer-reset').click();
      check(await page.evaluate(() => pokerTimer.snapshot().phase) === 'running', 'Cancelled reset preserves active timer');
      page.once('dialog', dialog => dialog.accept()); await page.locator('#poker-timer-reset').click();
      check(await page.locator('#poker-timer-time').textContent() === '1:00' && await page.locator('#poker-row-0-duration').isEnabled(),'Reset unlocks schedule and restores first duration');
      await page.locator('#lang-en').click();
      const recoveryStart = await page.evaluate(() => Date.now());
      await page.locator('#poker-timer-toggle').click();
      // Advance wall time with no callbacks, then reload across two levels and a break.
      await page.clock.setFixedTime(new Date(recoveryStart+190000));
      await page.reload();
      check(await page.locator('#poker-timer-current').textContent() === 'Break' && await page.locator('#poker-timer-time').textContent() === '0:50','Running reload catches up across missed levels into break');
      check((await page.locator('#poker-timer-notice').textContent()).includes('Caught up across 2 rows'),'Reload shows one catch-up notice');
      check(await page.locator('#poker-timer-sound').getAttribute('aria-pressed') === 'false','Sound is off until a user gesture');
      // Stub Web Audio to prove sound delivery without actual speakers.
      await page.evaluate(() => {
        window.__pokerSounds = 0;
        window.AudioContext = class {
          constructor() { this.state='running'; this.currentTime=0; this.destination={}; }
          async resume() {}
          createOscillator() { return {frequency:{value:0},connect(){},start(){window.__pokerSounds++;},stop(){}}; }
          createGain() { return {connect(){},gain:{setValueAtTime(){},exponentialRampToValueAtTime(){}}}; }
        };
      });
      await page.locator('#poker-timer-sound').click();
      check(await page.locator('#poker-timer-sound').getAttribute('aria-pressed') === 'true' && await page.evaluate(() => window.__pokerSounds) === 1,'User gesture enables and previews optional sound');
      await page.locator('#poker-timer-forward').click();
      check(await page.evaluate(() => window.__pokerSounds) === 2,'Manual transition can sound once');
      await page.clock.setSystemTime(new Date(recoveryStart+190000));
      page.once('dialog', dialog => dialog.accept()); await page.locator('#poker-timer-reset').click(); await page.locator('#poker-timer-toggle').click();
      await page.clock.runFor(60000);
      check(await page.evaluate(() => window.__pokerSounds) === 3,'Timely automatic transition sounds once');
      await page.clock.fastForward(180000);
      check(await page.evaluate(() => window.__pokerSounds) === 3 && await page.evaluate(() => pokerTimer.snapshot().index) === 3,'Multiple missed visible transitions do not replay sounds');
      await page.clock.setFixedTime(new Date(time.getTime()+9999999));
      await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
      check(await page.locator('#poker-timer-phase').textContent() === 'Tournament schedule finished' && await page.locator('#poker-timer-time').textContent() === '0:00','Suspension through final row completes');
      check(await page.evaluate(() => window.__pokerSounds) === 3,'Wake-up does not replay missed sounds');
      check(await page.locator('#poker-timer-toggle').isDisabled() && await page.locator('#poker-timer-forward').isDisabled(),'Completion cannot silently loop');
      await page.reload();
      check(await page.locator('#poker-timer-phase').textContent() === 'Tournament schedule finished','Completion persists across reload');
      check(await page.locator('#poker-timer-sound').getAttribute('aria-pressed') === 'false','Reload requires a new sound gesture');
      page.once('dialog', dialog => dialog.accept()); await page.locator('#poker-timer-reset').click(); await page.reload();
      check(await page.locator('#poker-timer-phase').textContent() === 'Ready','Reset persists across reload');
      for (const width of [320,390,768,1440]) {
        await page.setViewportSize({width,height:900});
        for (const language of ['es','en']) {
          await page.locator('#lang-'+language).click();
          for (const theme of ['dark','light']) {
            if (await page.evaluate(() => state.theme)!==theme) await page.locator('#theme').click();
            check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),`${file}/${width}/${language}/${theme}: no overflow`);
          }
        }
        if (file==='index.html') await page.locator('#poker-timer').screenshot({path:path.join(output,`poker-${width}.png`)});
      }
      check(errors.length === 0,`${file}: no browser errors: ${errors.join('; ')}`);
      await context.close();
    }
    console.log(`PASS: ${checks} total poker timer checks. Screenshots: ${output}`);
  } finally { await browser.close(); }
})().catch(error => {console.error(error);process.exitCode=1;});
