const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');
const {pathToFileURL} = require('node:url');
const {chromium, webkit} = require('playwright');
let checks = 0;
const check = (value, message) => { assert.ok(value, message); checks++; };
(async () => {
  const engine = process.env.BROWSER || 'chromium';
  const browser = await ({chromium, webkit}[engine]).launch({...(engine === 'chromium' && process.env.CHROME_CHANNEL ? {channel:process.env.CHROME_CHANNEL} : {})});
  const output = fs.mkdtempSync(path.join(os.tmpdir(), 'tablefolk-score-ux-'));
  try {
    for (const file of ['index.html','game-night.html']) {
      const context = await browser.newContext({viewport:{width:390,height:844}});
      const page = await context.newPage(), errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await context.route(/^https?:/, route => route.abort());
      const visit = async game => { await page.goto(pathToFileURL(path.resolve(__dirname, '..', file)).href + '#' + game + '/reference'); await page.locator('#lang-en').click(); };
      const capture = async (game, selector) => {
        for (const width of [320,390,1440]) {
          await page.setViewportSize({width,height:900});
          for (const lang of ['es','en']) {
            await page.locator('#lang-' + lang).click();
            check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${game}/${width}/${lang} fits viewport`);
          }
          if (file === 'index.html') {
            await page.locator(selector).evaluate(node => node.scrollIntoView({block:'start',behavior:'instant'}));
            await page.screenshot({path:path.join(output, `${game}-${width}.png`)});
          }
        }
      };
      await visit('truco');
      await page.locator('#truco-name-0').fill('Ana & Bea'); await page.locator('#truco-name-1').fill('Camilo & Diego'); await page.locator('#truco-start').click();
      await page.locator('#truco-add-0-3').click();
      check(await page.locator('[data-truco-side="0"] #truco-add-0-3').count() === 1, 'Point controls belong to the same card as the team score');
      check(await page.locator('#truco-undo').evaluate(node => node.getBoundingClientRect().top < document.querySelector('.truco-history').getBoundingClientRect().top), 'Undo is above history');
      await capture('truco','#truco-score');
      await page.reload(); check(await page.evaluate(() => trucoScore.snapshot().totals[0]) === 3, 'Truco recovers points');
      await visit('moth');
      for (const [i,name] of ['Ana','Bea','Cy'].entries()) await page.locator('#moth-name-'+i).fill(name);
      await page.locator('#moth-player-form button').click(); await page.locator('#moth-out').selectOption('0');
      await page.locator('#moth-count-1-0').fill('2');
      check(await page.locator('#moth-count-1-0').inputValue() === '2' && await page.locator('#moth-count-1-1').inputValue() === '0', 'Only the nonzero count needs editing');
      check((await page.locator('#moth-player-total-1').textContent()).includes('2'), 'Penalty previews update before saving');
      check(await page.locator('#moth-save-round').isEnabled(), 'Default zeros enable confirmation without entering other counts');
      await page.locator('#moth-save-round').click(); await page.reload();
      check(await page.locator('[data-moth-total="1"]').textContent() === '2', 'Moth recovers confirmed penalties');
      await capture('moth','#moth-round-heading');
      await visit('skull_king');
      for (const [i,name] of ['Ana','Bea'].entries()) await page.locator('#skull-name-'+i).fill(name);
      await page.locator('#skull-score-setup button').click();
      for (const i of [0,1]) await page.locator('#skull-tricks-'+i).fill('1');
      await page.locator('#skull-bonus-0').fill('20');
      check((await page.locator('#skull-bonus-status-0').textContent()).includes('will not count'), 'Missed-bid bonus has explicit feedback');
      check(!await page.locator('#skull-adjustments-0').evaluate(node => node.open), 'Optional adjustments start collapsed');
      await page.locator('#skull-round-form button[type=submit]').click();
      check(await page.evaluate(() => skullScoreGame.rounds.length) === 0 && (await page.locator('#skull-score-notice').textContent()).includes('cannot exceed'), 'Impossible aggregate tricks cannot be saved');
      await page.locator('#skull-tricks-1').fill('0'); await page.locator('#skull-round-form button[type=submit]').click();
      await page.locator('#skull-undo-round').click(); check(await page.locator('#skull-tricks-0').inputValue() === '1', 'Undo restores previous round inputs');
      await capture('skull','#skull-round-heading');
      await visit('coup');
      check(await page.locator('#table-sheet').evaluate(node => !!(node.compareDocumentPosition(document.getElementById('coup-session')) & Node.DOCUMENT_POSITION_FOLLOWING)), 'Coup quick rules precede the scoreboard');
      await page.locator('#jump-to-tool').focus(); await page.keyboard.press('Enter');
      check(await page.locator('#active-table-tool-heading').evaluate(node => node === document.activeElement), 'Keyboard jump reaches the Coup scoreboard');
      await page.locator('#coup-name-0').fill('Ana'); await page.locator('#coup-name-1').fill('Bea'); await page.locator('#coup-add-player').click(); await page.locator('#coup-name-2').fill('Cy'); await page.locator('#coup-start').click();
      await page.locator('#coup-runner-up').selectOption('0'); await page.locator('#coup-winner').selectOption('0');
      check(await page.locator('#coup-runner-up').inputValue() === '', 'Changing winner clears conflicting runner-up');
      await page.locator('#coup-runner-up').selectOption('1');
      check((await page.locator('#coup-result-preview').textContent()).includes('Ana +3 · Bea +1'), 'Coup previews exact points');
      await capture('coup','#coup-session');
      await visit('poker'); await page.locator('#poker-timer-toggle').click();
      check(!await page.locator('#poker-schedule-details').evaluate(node => node.open), 'Poker running view collapses schedule');
      await page.locator('#poker-timer-toggle').click(); await capture('poker','#poker-timer');
      check(errors.length === 0, `No browser errors: ${errors.join(', ')}`);
      await context.close();
      // Storage failures must preserve in-memory play and explain recovery limits.
      const blocked = await browser.newContext();
      await blocked.addInitScript(() => { Storage.prototype.setItem = () => {throw new Error('unavailable');}; });
      const offline = await blocked.newPage();
      await offline.goto(pathToFileURL(path.resolve(__dirname, '..', file)).href+'#truco/reference');
      await offline.locator('#lang-en').click(); await offline.locator('#truco-name-0').fill('A'); await offline.locator('#truco-name-1').fill('B'); await offline.locator('#truco-start').click(); await offline.locator('#truco-add-0-1').click();
      check(await offline.evaluate(() => trucoScore.snapshot().totals[0]) === 1 && (await offline.locator('#truco-score').textContent()).includes('Local saving is unavailable'), 'Storage failure is visible and does not block scoring');
      await blocked.close();
    }
    console.log(`Passed ${checks} scoreboard usability checks. Screenshots: ${output}`);
  } finally { await browser.close(); }
})().catch(error => {console.error(error); process.exitCode = 1;});
