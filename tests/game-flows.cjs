const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');
const {pathToFileURL} = require('node:url');
const {chromium, webkit} = require('playwright');
let checks = 0;
function check(value, message) { assert.ok(value, message); checks++; }
(async () => {
  const engine = process.env.BROWSER || 'chromium';
  const browser = await ({chromium, webkit}[engine]).launch({headless:true, ...(engine === 'chromium' && process.env.CHROME_CHANNEL ? {channel:process.env.CHROME_CHANNEL} : {})});
  const output = fs.mkdtempSync(path.join(os.tmpdir(), 'tablefolk-flows-'));
  try {
    for (const file of ['index.html', 'game-night.html']) {
      const context = await browser.newContext({viewport:{width:390,height:844}});
      // Linux WebKit offline emulation prevents even file: navigations. Keep
      // local files available while explicitly denying every network request.
      let probeBlocked = false;
      if (engine === 'webkit') await context.route(/^https?:\/\//, route => {
        if (route.request().url() === 'https://offline-check.invalid/tablefolk') probeBlocked = true;
        return route.abort('internetdisconnected');
      });
      else await context.setOffline(true);
      const page = await context.newPage(), errors = [];
      page.on('pageerror', error => errors.push(error.message));
      const url = pathToFileURL(path.resolve(__dirname, '..', file)).href;
      const visit = async (game, tab='reference') => { await page.goto(`${url}#${game}/${tab}`); await page.locator('#lang-en').click(); };
      await page.goto(url); await page.locator('#lang-en').click();
      check(await page.evaluate(async () => {
        try { await fetch('https://offline-check.invalid/tablefolk'); return false; }
        catch { return true; }
      }) && (engine === 'webkit' ? probeBlocked : await page.evaluate(() => !navigator.onLine)), 'Offline harness denies network access while loading actual local files');
      const games = await page.evaluate(() => Object.keys(GAMES));
      for (const game of games) {
        check(await page.locator(`[data-game="${game}"] .card-learn`).getAttribute('href') === `#${game}/learn`, `${game}: Learn entry`);
        check(await page.locator(`[data-game="${game}"] .card-play`).getAttribute('href') === `#${game}/reference`, `${game}: Play entry`);
      }
      await page.locator('[data-game="avalon"] .card-learn').click();
      check(await page.locator('#tab-learn').getAttribute('aria-selected') === 'true', 'Learn opens the learning guide');
      check(await page.locator('#players').isVisible() && await page.locator('#roster').isVisible(), 'Avalon setup is visible without expanding a panel');
      check(await page.evaluate(() => document.getElementById('learn-setup').compareDocumentPosition(document.getElementById('basics')) & Node.DOCUMENT_POSITION_FOLLOWING), 'Setup precedes lessons');
      await page.locator('#players').selectOption('5');
      await page.locator('#avalon-mode').selectOption('optional');
      check(await page.locator('#roster').innerText() === 'Deal: Merlin, Assassin, Percival, Morgana, 1 Loyal Servant(s).', 'Setup produces a valid five-player roster');
      check(await page.locator('#role-mordred').isDisabled(), 'Role capacity is enforced in visible setup');
      check(await page.locator('.script').isVisible() && (await page.locator('.script').innerText()).includes('Merlin and Morgana'), 'Opening script follows visible setup');
      await page.locator('#lang-es').click();
      check((await page.locator('#roster').innerText()).includes('Percival, Morgana'), 'Selected setup survives translation');
      await page.locator('#learning-tools > summary').click();
      const ids = await page.locator('[id]').evaluateAll(nodes => nodes.map(n => n.id));
      check(ids.length === new Set(ids).size, 'Setup and practice have unique IDs');
      await page.locator('#learn-setup').screenshot({path:path.join(output,`${file}-setup.png`)});
      await page.evaluate(() => {location.hash='#collection';});
      await page.locator('[data-game="monopoly"] .card-play').click();
      await page.locator('#lang-en').click();
      check(await page.locator('#tab-reference').getAttribute('aria-selected') === 'true', 'Play now opens quick reference');
      await page.locator('#rule-search').fill('auction');
      check(await page.locator('.rule-search-result').count() > 0, 'Find a term mid-game');
      check((await page.locator('.rule-search-result').first().innerText()).toLowerCase().includes('auction'), 'Result shows matching rule text');
      await page.locator('.rule-search-result').first().click();
      await page.waitForFunction(() => state.tab === 'full');
      check(await page.locator('#tab-full').getAttribute('aria-selected') === 'true' && await page.locator('#movement').getAttribute('open') !== null, 'Search opens the matching full rule');
      await page.locator('#rule-search').fill('zzzz-no-rule');
      check(await page.locator('.rule-search-result').count() === 0 && (await page.locator('#rule-search-results').innerText()).includes('No rules found'), 'No-result feedback');
      await page.locator('#rule-search-clear').click();
      check(await page.locator('#rule-search').inputValue() === '' && await page.locator('#rule-search-results').innerText() === '', 'Clear restores empty lookup');
      await page.locator('#rule-search').fill('<img src=x onerror=alert(1)>');
      check(await page.locator('#rule-search-results img').count() === 0, 'Search input is escaped');
      await visit('coup'); await page.locator('#rule-search').fill('challenge');
      check(await page.locator('.rule-search-result').count() > 0, 'Challenge is searchable within Coup');
      await page.locator('#tab-full').click();
      check(await page.locator('#rule-search').inputValue() === 'challenge', 'Query survives view switch');
      await page.locator('#lang-es').click(); await page.locator('#rule-search').fill('DESAFIO');
      check(await page.locator('.rule-search-result').count() > 0, 'Spanish search ignores accents and case');
      await page.locator('#rule-search').screenshot({path:path.join(output,`${file}-search.png`)});

      // Drafts must survive before any result is confirmed, without adding scores.
      await visit('skull_king');
      await page.locator('#skull-name-0').fill('Alice'); await page.locator('#skull-name-1').fill('Bob');
      await page.reload(); check(await page.locator('#skull-name-0').inputValue() === 'Alice', 'Skull King setup draft recovers');
      await page.locator('#skull-score-setup button[type=submit]').click();
      await page.locator('#skull-bid-0').fill('1'); await page.locator('#skull-tricks-0').fill('1');
      await page.locator('#skull-bonus-1').fill('');
      await page.reload();
      check(await page.locator('#skull-bid-0').inputValue() === '1' && await page.locator('#skull-bonus-1').inputValue() === '', 'Skull King preserves partial and blank entries');
      check(await page.evaluate(() => skullScoreGame.rounds.length) === 0, 'Reload does not confirm a draft');
      await page.locator('#skull-bonus-1').fill('0');
      await page.locator('#skull-round-form button[type=submit]').click();
      await page.locator('#skull-bid-1').fill('2');
      await page.locator('[data-skull-edit="1"]').evaluate(node => node.closest('details').open=true);
      await page.locator('[data-skull-edit="1"]').click(); await page.locator('#skull-tricks-0').fill('0');
      await page.reload();
      check(await page.locator('#skull-tricks-0').inputValue() === '0', 'Skull King correction recovers');
      await page.locator('#skull-edit-cancel').click();
      check(await page.locator('#skull-bid-1').inputValue() === '2', 'Cancelling recovered correction restores pending round');

      await visit('moth');
      for (const [i,name] of ['Alice','Bob','Cara'].entries()) await page.locator(`#moth-name-${i}`).fill(name);
      await page.locator('#moth-player-form button[type=submit]').click();
      await page.locator('#moth-out').selectOption('0'); await page.locator('#moth-count-1-0').fill('4');
      await page.locator('#moth-count-2-1').fill(''); await page.reload();
      check(await page.locator('#moth-out').inputValue() === '0' && await page.locator('#moth-count-1-0').inputValue() === '4' && await page.locator('#moth-count-2-1').inputValue() === '', 'Moth recovers partially entered card counts');
      check(await page.locator('#moth-save-round').isDisabled(), 'Blank recovered field still requires an entry');
      await page.locator('#moth-count-2-1').fill('0');
      check(await page.locator('#moth-save-round').isEnabled(), 'Recovered draft can be confirmed once valid');
      await page.locator('#moth-save-round').click();
      await page.locator('#moth-out').selectOption('1'); await page.locator('#moth-count-0-0').fill('3');
      await page.locator('[data-moth-edit="1"]').evaluate(node => node.closest('details').open=true);
      await page.locator('[data-moth-edit="1"]').click(); await page.locator('#moth-count-1-0').fill('2');
      await page.reload(); await page.locator('#moth-edit-cancel').click();
      check(await page.locator('#moth-count-0-0').inputValue() === '3' && await page.locator('#moth-out').inputValue() === '1', 'Moth recovers pending round alongside correction');

      await visit('coup');
      const names = await page.locator('[data-coup-name]').count();
      for (let i=0;i<names;i++) await page.locator(`#coup-name-${i}`).fill(['Alice','Bob','Cara','Dan','Eve','Flo'][i]);
      await page.locator('#coup-planned').fill('4'); await page.reload();
      check(await page.locator('#coup-name-0').inputValue() === 'Alice' && await page.locator('#coup-planned').inputValue() === '4', 'Coup setup recovers');
      await page.locator('#coup-setup-form button[type=submit]').click();
      await page.locator('#coup-winner').selectOption('1'); await page.reload();
      check(await page.locator('#coup-winner').inputValue() === '1' && await page.evaluate(() => coupSession.snapshot().results.length) === 0, 'Coup recovers unconfirmed winner without awarding points');

      await page.locator('.coup-session-names > summary').click();
      await page.locator('#coup-rename-0').fill('Alice renamed'); await page.reload();
      await page.locator('.coup-session-names > summary').click();
      check(await page.locator('#coup-rename-0').inputValue() === 'Alice renamed', 'Coup recovers unsaved name edits');

      await visit('truco'); await page.locator('#truco-name-0').fill('Alice'); await page.locator('#truco-name-1').fill('Bob');
      await page.reload(); check(await page.locator('#truco-name-1').inputValue() === 'Bob', 'Truco setup recovers');
      await page.locator('#truco-start').click(); await page.locator('#truco-award-label').selectOption('envido');
      await page.locator('#truco-custom-0').fill('7'); await page.locator('#truco-custom-1').fill('3'); await page.reload();
      check(await page.locator('#truco-custom-0').inputValue() === '7' && await page.locator('#truco-custom-1').inputValue() === '3' && await page.locator('#truco-award-label').inputValue() === 'envido', 'Truco recovers both custom entries and label');
      await page.locator('#truco-custom-save-0').click(); await page.locator('#truco-correct-0').click();
      await page.locator('#truco-edit-points').fill('5'); await page.reload();
      check(await page.locator('#truco-edit-points').inputValue() === '5' && await page.evaluate(() => trucoScore.snapshot().totals[0]) === 7, 'Correction stays a draft after reload');
      await page.locator('#truco-save-correction').click();
      check(await page.evaluate(() => trucoScore.snapshot().totals[0]) === 5, 'Recovered correction can be saved');
      await page.evaluate(() => {
        const saved=JSON.parse(localStorage.getItem('tablefolk-truco-score-v1')); saved.awardDraft={points:null}; saved.editDraft={index:999};
        localStorage.setItem('tablefolk-truco-score-v1',JSON.stringify(saved));
      });
      await page.reload(); check(await page.evaluate(() => trucoScore.snapshot().totals[0]) === 5, 'Malformed drafts leave confirmed scores intact');
      for (const width of [320,390,1440]) {
        await page.setViewportSize({width,height:900});
        await page.goto(url);
        for (const lang of ['es','en']) {
          await page.locator('#lang-'+lang).click();
          check(await page.evaluate(() => document.documentElement.scrollWidth<=innerWidth), `Cards fit at ${width} in ${lang}`);
        }
        if(file==='index.html') await page.locator('#collection').screenshot({path:path.join(output,`cards-${width}.png`)});
      }
      check(errors.length === 0, 'No browser errors: '+errors.join('; '));
      await context.close();
    }
    console.log(`Passed ${checks} game flow checks (${engine}). Screenshots: ${output}`);
  } finally { await browser.close(); }
})().catch(error => {console.error(error);process.exitCode=1;});
