const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const vm = require('node:vm');
const {pathToFileURL} = require('node:url');
const {chromium, webkit} = require('playwright');
const root = path.resolve(__dirname, '..');
let checks = 0;
function check(value, message) {assert.ok(value, message); checks++;}
function rejects(fn, code) {assert.throws(fn, error => error.message === code); checks++;}
const sandbox = vm.createContext({});
vm.runInContext(fs.readFileSync(path.join(root, 'skull-score.js'), 'utf8'), sandbox);
const {scoreSkullEntry: score, createSkullGame: create, saveSkullRound: save, skullGameSummary: summary} = sandbox;
const entry = (bid, tricks, bonus = 0, adjustment = 0, explanation = '') => ({bid, tricks, bonus, adjustment, explanation});

// Check every legal base-score combination against the classic formulas.
for (let cards = 1; cards <= 10; cards++) {
  for (let bid = 0; bid <= cards; bid++) for (let tricks = 0; tricks <= cards; tricks++) {
    const base = bid === 0 ? (tricks === 0 ? cards * 10 : -cards * 10) : bid === tricks ? tricks * 20 : -Math.abs(bid - tricks) * 10;
    const result = score(entry(bid, tricks, -5), cards);
    check(result.base === base && result.appliedBonus === (bid === tricks ? -5 : 0) && result.total === base + result.appliedBonus, `Classic score: ${cards} cards, bid ${bid}, won ${tricks}`);
  }
}
check(score(entry(0, 0), 8).total === 80, 'Round-ten zero with eight cards scores +80');
check(score(entry(0, 1), 8).total === -80, 'Round-ten failed zero with eight cards scores -80');
check(score(entry(2, 2, 40, -25, 'Optional pirate power'), 2).total === 55, 'Exact positive: base, bonus and separate signed adjustment');
check(score(entry(2, 1, 40, 25, 'Documented exception'), 2).total === 15, 'Missed bid drops capture bonuses but retains explained adjustment');
check(score(entry(0, 0, -15, -20, 'Power'), 8).total === 45, 'Exact zero accepts signed eligible bonuses');
check(score(entry(0, 1, -15, -20, 'Power'), 8).total === -100, 'Failed zero ignores even negative capture bonuses');
rejects(() => score(entry(1, 1, 0, -1), 1), 'explanation');
rejects(() => score(entry(1, 1, 0, 1, '   '), 1), 'explanation');
for (const cards of [0, 11, 1.5, NaN]) rejects(() => score(entry(0, 0), cards), 'cards');
for (const invalid of [entry(-1, 0), entry(3, 0), entry(1.5, 0), entry(0, 3), entry(0, -1), entry(NaN, 0)]) rejects(() => score(invalid, 2), 'bid-tricks');
for (const invalid of [entry(0, 0, 1.5), entry(0, 0, Infinity), entry(0, 0, 0, NaN), entry(0, 0, Number.MAX_SAFE_INTEGER)]) rejects(() => score(invalid, 1), 'signed-total');
for (const count of [2, 8]) check(create(Array(count).fill('Player'), false).setup.players.length === count, 'Base player count');
check(create(Array(9).fill('Player'), true).setup.expansion, 'Expansion permits nine');
for (const count of [0, 1, 9, 10]) rejects(() => create(Array(count).fill('Player'), false), 'players');
rejects(() => create(Array(10).fill('Player'), true), 'players');
rejects(() => create(['A', '   '], false), 'names');
const game = create([' A ', 'B'], false);
check(game.setup.players.join(',') === 'A,B' && game.setup.mode === 'classic', 'Normalize names and label classic mode');
for (let round = 1; round <= 10; round++) save(game, round, Math.min(round, 8), [entry(0, 1), entry(0, 1)]);
check(game.rounds.slice(-3).every(row => row.cards === 8), 'Repeated hand sizes are independent of round number');
check(game.rounds[9].entries[0].base === -80, 'Round-ten stored zero uses the actual eight cards');
check(summary(game).totals.every(total => total === -520), 'Negative cumulative totals');
check(summary(game).finished && summary(game).winners.join(',') === '0,1', 'Negative tied leaders jointly win');
save(game, 1, 1, [entry(1, 1, 10), entry(0, 1)]);
check(summary(game).totals[0] === -480 && summary(game).winners.join(',') === '0', 'Correction recalculates cumulative totals and final winner');
save(game, 10, 7, [entry(0, 0), entry(0, 1)]);
check(game.rounds[9].entries[0].base === 70 && summary(game).totals[0] === -330, 'Changing saved hand size recomputes zero bid');
const before = JSON.stringify(game);
rejects(() => save(game, 1, 1, [entry(1, 1), entry(0, 0, 0, -5)]), 'explanation');
check(JSON.stringify(game) === before, 'Invalid correction is atomic');
rejects(() => save(game, 11, 8, [entry(0, 0), entry(0, 0)]), 'round');
rejects(() => save(game, 1, 1, [entry(0, 0)]), 'players');
const two = create(['A', 'B'], false);
rejects(() => save(two, 2, 2, [entry(0, 0), entry(0, 0)]), 'round');
save(two, 1, 1, [entry(0, 0), entry(0, 0)]);
check(two.rounds[0].entries.length === 2 && summary(two).winners.length === 0, 'Graybeard is not scored, and unfinished games have no winners');
save(two, 2, 2, [entry(2, 2), entry(2, 2)]);
check(two.rounds[1].entries.every(e => e.total === 40), 'No aggregate trick constraint');
const nine = create(Array.from({length:9}, (_, i) => `Player ${i + 1}`), true);
for (let round = 1; round <= 10; round++) save(nine, round, round, Array.from({length:9}, () => entry(0, 0)));
check(summary(nine).winners.length === 9, 'Every tied leader wins without a tiebreaker');

async function fillEntry(page, player, values) {
  for (const [key, value] of Object.entries(values)) await page.locator(`#skull-${key}-${player}`).fill(String(value));
}
async function start(page, names) {
  await page.locator('#skull-player-count').selectOption(String(names.length));
  for (let i = 0; i < names.length; i++) await page.locator(`#skull-name-${i}`).fill(names[i]);
  await page.locator('#skull-score-setup button[type=submit]').click();
}
async function visit(page, hash) {
  await page.evaluate(hash => {location.hash = hash;}, hash);
  await page.waitForFunction(hash => location.hash === '#'+hash && state.game === hash.split('/')[0] && state.tab === hash.split('/')[1], hash);
}

(async () => {
  const engine = process.env.BROWSER || 'chromium';
  const browser = await ({chromium, webkit}[engine]).launch({headless:true, ...(engine==='chromium' && process.env.CHROME_CHANNEL ? {channel:process.env.CHROME_CHANNEL} : {})});
  const output = fs.mkdtempSync(path.join(os.tmpdir(), 'tablefolk-skull-'));
  try {
    for (const file of ['index.html', 'game-night.html']) {
      const context = await browser.newContext({viewport:{width:390,height:844},hasTouch:true});
      await context.route(/^https?:/, route => route.abort());
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.goto(pathToFileURL(path.join(root, file)).href+'#skull_king/reference');
      check((await page.locator('#skull-score-heading').textContent()).includes('clásico'), 'Spanish classic sheet is available offline');
      check((await page.locator('#skull-score').textContent()).includes('Rascal'), 'Unsupported scoring is clearly labeled');
      check(await page.locator('#skull-player-count option').count() === 7, 'Base setup supports 2–8');
      await page.locator('#lang-en').click();
      await start(page, ['<Ada>', 'Ben']);
      check(await page.locator('.skull-player-entry').count() === 2, 'Only two real players are scored');
      check(await page.locator('.skull-player-entry legend').first().textContent() === '<Ada>', 'Player names are escaped');
      await fillEntry(page, 0, {bid:0, tricks:0, bonus:15, adjustment:-5, explanation:'Optional power'});
      await fillEntry(page, 1, {bid:1, tricks:0, bonus:40, adjustment:10, explanation:'Documented exception'});
      check((await page.locator('#skull-preview-0').innerText()).includes('20'), 'Live preview includes the separate adjustment');
      await page.locator('#skull-expansion-toggle').click();
      check((await page.locator('#skull-game-edition').textContent()).includes('Base box'), 'Guide expansion toggle does not reinterpret a base game');
      check(await page.locator('#skull-bonus-0').inputValue() === '15', 'Round draft survives guide switch');
      await page.locator('#lang-es').click(); await page.locator('#theme').click();
      await visit(page, 'skull_king/full'); await visit(page, 'coup/reference'); await visit(page, 'skull_king/reference');
      check(await page.locator('#skull-explanation-0').inputValue() === 'Optional power', 'Unfinished entries survive languages, themes and guides');
      await page.locator('#lang-en').click();
      await page.locator('#skull-round-form button[type=submit]').focus(); await page.keyboard.press('Enter');
      check(await page.locator('[data-skull-total="0"]').textContent() === '20' && await page.locator('[data-skull-total="1"]').textContent() === '0', 'Keyboard save applies bonuses only to exact bids');
      await fillEntry(page, 0, {bid:0, tricks:0, adjustment:5, explanation:'   '});
      await fillEntry(page, 1, {bid:0, tricks:0});
      await page.locator('#skull-round-form button[type=submit]').click();
      check(await page.evaluate(() => skullScoreGame.rounds.length) === 1, 'Whitespace-only adjustment explanation blocks saving');
      await page.locator('#skull-explanation-0').fill('Exception');
      await page.locator('#skull-history-1 > summary').click();
      await page.locator('[data-skull-edit="1"]').click();
      await page.locator('#skull-edit-cancel').click();
      check(await page.locator('#skull-adjustment-0').inputValue() === '5', 'Cancel correction restores unfinished next round');
      await page.locator('[data-skull-edit="1"]').click();
      await fillEntry(page, 0, {bid:1, tricks:1, bonus:-5, adjustment:-20, explanation:'Pirate power'});
      await page.locator('#skull-round-form button[type=submit]').click();
      check(await page.locator('[data-skull-total="0"]').textContent() === '-5', 'Correction updates cumulative total, including negative eligible bonuses');
      check(await page.locator('#skull-adjustment-0').inputValue() === '5', 'Saving correction restores next-round draft');
      // Make both players score -10 in round 1, then identical results in rounds 2–10.
      await page.locator('[data-skull-edit="1"]').click();
      for (const player of [0,1]) await fillEntry(page, player, {bid:0, tricks:1, bonus:50, adjustment:0, explanation:''});
      await page.locator('#skull-round-form button[type=submit]').click();
      for (let round = 2; round <= 10; round++) {
        await page.locator('#skull-cards').fill(String(Math.min(round, 8)));
        for (const player of [0,1]) await fillEntry(page, player, {bid:0, tricks:1, bonus:-5, adjustment:0, explanation:''});
        await page.locator('#skull-round-form button[type=submit]').click();
      }
      check((await page.locator('#skull-game-result').textContent()).includes('Joint winners: <Ada>, Ben'), 'Round ten presents tied leaders jointly');
      check(await page.locator('[data-skull-total="0"]').textContent() === '-520', 'Final negative tie has the correct cumulative total');
      check(await page.locator('#skull-round-form').count() === 0, 'Game ends at ten rounds');
      await page.locator('#skull-history-10 > summary').click();
      check((await page.locator('#skull-history-10 td').allTextContents()).includes('-80'), 'History displays actual eight-card zero penalty in round ten');
      await page.locator('[data-skull-edit="10"]').click();
      await fillEntry(page, 0, {tricks:0, bonus:0});
      await page.locator('#skull-round-form button[type=submit]').click();
      check((await page.locator('#skull-game-result').textContent()).includes('Winner: <Ada>'), 'Final-round correction recalculates winners');
      check(await page.locator('[data-skull-total="0"]').textContent() === '-360', 'Final-round exact zero scores +80');
      for (const width of [320,390,844,1440]) {
        await page.setViewportSize({width,height:width===844?390:900});
        for (const lang of ['es','en']) {
          await page.locator('#lang-'+lang).click();
          for (const theme of ['light','dark']) {
            if (await page.evaluate(() => state.theme) !== theme) await page.locator('#theme').click();
            check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${file}/${width}/${lang}/${theme}: history fits viewport`);
          }
        }
      }
      await page.setViewportSize({width:390,height:844});
      if (file==='index.html') await page.locator('#skull-score').screenshot({path:path.join(output, 'history-mobile.png')});
      page.once('dialog', dialog => dialog.dismiss()); await page.locator('#skull-new-game').click();
      check(await page.locator('[data-skull-total="0"]').textContent() === '-360', 'Cancelled new game preserves scores');
      page.once('dialog', dialog => dialog.accept()); await page.locator('#skull-new-game').click();
      check(await page.locator('#skull-player-count option').count() === 8, 'New expansion game supports nine players');
      await start(page, Array.from({length:9}, (_, i) => `Player ${i+1}`));
      await page.locator('#skull-expansion-toggle').click();
      check(await page.locator('.skull-player-entry').count() === 9 && (await page.locator('#skull-game-edition').textContent()).includes('Expansion Pack'), 'Nine-player expansion game remains intact with guide expansion off');
      for (let round = 1; round <= 10; round++) {
        for (let player = 0; player < 9; player++) await fillEntry(page, player, {bid:0, tricks:0});
        await page.locator('#skull-round-form button[type=submit]').click();
      }
      check((await page.locator('#skull-game-result').textContent()).includes('Joint winners: Player 1, Player 2, Player 3, Player 4, Player 5, Player 6, Player 7, Player 8, Player 9'), 'All nine tied players jointly win');
      await page.locator('#skull-history-1 > summary').click();
      await page.locator('[data-skull-edit="1"]').click();
      for (const width of [320,390,844,1440]) {
        await page.setViewportSize({width,height:900});
        check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Nine-player correction fits viewport');
        check(await page.locator('#skull-bonus-0').evaluate(node => node.getBoundingClientRect().height >= 44), 'Inputs meet touch target');
      }
      await page.setViewportSize({width:390,height:844});
      if (file==='index.html') await page.locator('#skull-score').screenshot({path:path.join(output, 'edit-mobile.png')});
      await page.emulateMedia({media:'print'});
      check(await page.locator('#skull-score').isHidden(), 'Guide print excludes interactive sheet');
      await page.emulateMedia({media:'screen'});
      await page.reload(); await page.waitForFunction(() => state.game === 'skull_king');
      check(await page.locator('#skull-score-setup').count() === 1, 'Reload clears sheet as documented');
      check(errors.length === 0, `No browser errors: ${errors.join(', ')}`);
      await context.close();
    }
    console.log(`Passed ${checks} Skull King score checks (${engine}). Screenshots: ${output}`);
  } finally {await browser.close();}
})().catch(error => {console.error(error); process.exitCode=1;});
