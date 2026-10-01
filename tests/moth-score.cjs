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
vm.runInContext(fs.readFileSync(path.join(root, 'moth-score.js'), 'utf8'), sandbox);
const {mothPenalty: penalty, mothCount: count, createMothGame: create, updateMothPlayers: rename,
  scoreMothRound: score, saveMothRound: save, undoMothRound: undo, mothGameSummary: summary} = sandbox;
const zero = () => [0,0,0];
check(penalty([2,1,1]) === 17, 'Guide example: 2 numbers + action + moth = 17');
for (const [category, weight] of [1,5,10].entries()) {
  const entry = zero(); entry[category] = 1;
  check(score(3, 0, [null, entry, zero()]).entries[1].total === weight, `Category ${category} scores ${weight}`);
  const max = [43,20,8][category];
  entry[category] = max;
  check(score(3, 0, [null, entry, zero()]).entries[1].total === max * weight, 'Category maximum accepted');
  entry[category]++;
  rejects(() => score(3, 0, [null, entry, zero()]), 'deck');
  entry[category] = max;
  const other = zero(); other[category] = 1;
  rejects(() => score(3, 0, [null, entry, other]), 'deck');
}
check(score(3, 0, [[43,20,8], ['2','1','1'], zero()]).entries[0].total === 0, 'Out player always gets zero; old counts do not consume deck');
check(score(3, 1, [zero(), null, zero()]).entries.every(entry => entry.total === 0), 'Explicit zero hands need not account for discarded or hidden cards');
for (const invalid of ['', ' ', '-1', -1, '1.5', 1.5, '1e1', 'NaN', NaN, Infinity, null, undefined, true, {}, '999999999999999999999']) {
  rejects(() => count(invalid), 'counts');
  rejects(() => score(3, 0, [null, [invalid,0,0], zero()]), 'counts');
}
for (const valid of [0, '0', '000', 12, '12']) check(count(valid) === Number(valid), 'Explicit whole-number counts accepted');
for (const out of ['', -1, 3, 1.5, NaN]) rejects(() => score(3, out, [zero(),zero(),zero()]), 'out');
rejects(() => score(3, 0, [zero()]), 'players');
rejects(() => score(3, 0, [zero(), [0,0], zero()]), 'counts');
rejects(() => score(3, 0, [null, Array(3), zero()]), 'counts');
for (const n of [3,4,5]) check(create(Array.from({length:n}, (_,i) => `Player ${i}`)).players.length === n, 'Supported setup');
for (const n of [0,2,6]) rejects(() => create(Array(n).fill('Player')), 'players');
rejects(() => create(['A','B',' ']), 'names');
rejects(() => create(['A',' a ','B']), 'names');
rejects(() => create(Array(3)), 'names');
const game = create([' A ', 'B', 'C']);
check(game.players[0] === 'A', 'Trim names');
rename(game, ['A','B','C','D']); check(game.players.length === 4, 'Membership changes before first round');
rename(game, ['A','B','C']);
rejects(() => save(game, 2, 0, [null,zero(),zero()]), 'round');
save(game, 1, 0, [null,[2,1,1],[0,0,1]]);
check(summary(game).totals.join(',') === '0,17,10' && game.locked, 'First result locks setup and updates cumulative penalties');
check(summary(game).standings.map(row => row.player).join(',') === '0,2,1', 'Standings ascend by penalty');
rejects(() => save(game, 1, 0, [null,zero(),zero()]), 'round');
rejects(() => rename(game, ['A','B','C','D']), 'locked');
rename(game, ['Ada','Ben','Cy']); check(game.players[0] === 'Ada', 'Names remain editable');
save(game, 2, 1, [[2,1,1],null,[0,1,0]]);
check(summary(game).totals.join(',') === '17,17,15', 'Cumulative totals across rounds');
save(game, 3, 2, [zero(),zero(),null]);
check(summary(game).finished && summary(game).winners.join(',') === '2', 'Lowest final total wins');
rejects(() => save(game, 4, 0, [null,zero(),zero()]), 'round');
save(game, 1, 0, [null,[2,1,1],[2,0,1]], true);
check(summary(game).totals.join(',') === '17,17,17' && summary(game).winners.length === 3, 'Earlier correction recalculates all totals and tied winners');
const before = JSON.stringify(game);
rejects(() => save(game, 1, 0, [null,[44,0,0],zero()], true), 'deck');
check(JSON.stringify(game) === before, 'Invalid correction leaves saved history intact');
rejects(() => save(game, 4, 0, [null,zero(),zero()], true), 'round');
undo(game); check(!summary(game).finished && summary(game).winners.length === 0, 'Undo final reopens the game');
undo(game); undo(game);
rejects(() => rename(game, ['A','B','C','D']), 'locked');
check(game.locked && game.rounds.length === 0, 'Undoing first round retains membership lock');
for (const n of [3,4,5]) {
  const full = create(Array.from({length:n}, (_, i) => `Player ${i+1}`));
  for (let r = 1; r <= n; r++) save(full, r, r - 1, Array.from({length:n}, zero));
  check(summary(full).finished && summary(full).winners.length === n, 'Exactly one round per player and all lowest ties win');
  rejects(() => save(full, n + 1, 0, Array.from({length:n}, zero)), 'round');
}

async function fill(page, player, counts) {
  for (let c = 0; c < 3; c++) await page.locator(`#moth-count-${player}-${c}`).fill(String(counts[c]));
}
async function visit(page, route) {
  await page.evaluate(route => {location.hash = route;}, route);
  await page.waitForFunction(route => state.game === route.split('/')[0] && state.tab === route.split('/')[1], route);
}
async function previewSave(page) {
  await page.locator('#moth-preview-round').click();
  await page.locator('#moth-save-round').click();
}
async function edit(page, round) {
  await page.locator(`#moth-history-${round}`).evaluate(node => {node.open = true;});
  await page.locator(`[data-moth-edit="${round}"]`).click();
}

(async () => {
  const engine = process.env.BROWSER || 'chromium';
  const browser = await ({chromium, webkit}[engine]).launch({headless:true, ...(engine === 'chromium' && process.env.CHROME_CHANNEL ? {channel:process.env.CHROME_CHANNEL} : {})});
  const output = fs.mkdtempSync(path.join(os.tmpdir(), 'tablefolk-moth-'));
  try {
    for (const file of ['index.html','game-night.html']) {
      const context = await browser.newContext({viewport:{width:390,height:844}, hasTouch:true});
      await context.route(/^https?:/, route => route.abort());
      const page = await context.newPage();
      const errors = []; page.on('pageerror', error => errors.push(error.message));
      await page.goto(pathToFileURL(path.join(root, file)).href+'#moth/reference');
      check((await page.locator('#moth-score-heading').textContent()).includes('Planilla'), 'Bilingual scoreboard works offline');
      await page.locator('#lang-en').click();
      check(await page.locator('#moth-player-count option').count() === 3, 'Only 3–5-player setups available');
      for (const [i,name] of ['<Ada>','Ben','Cy'].entries()) await page.locator(`#moth-name-${i}`).fill(name);
      await page.locator('#moth-player-form button').click();
      check(await page.locator('.scoreboard-heading #moth-new-game').isVisible(), 'Reset is prominent beside scoreboard title');
      check(await page.locator('#moth-save-round').isVisible() && await page.locator('#moth-save-round').isDisabled(), 'Round confirmation is visible and requires valid entries');
      check(await page.locator('#moth-save-round').textContent() === 'Confirm round', 'Confirmation has an explicit label');
      check(await page.locator('[data-moth-category]').evaluateAll(inputs => inputs.every(input => input.value === '0')), 'Every card count starts at zero');
      // Membership remains editable until round one is saved.
      await page.locator('#moth-players > summary').click();
      await page.locator('#moth-player-count').selectOption('4');
      await page.locator('#moth-name-3').fill('Dee');
      await page.locator('#moth-player-form button').click();
      check(await page.locator('#moth-out option').count() === 5, 'Add a player before first saved round');
      await page.locator('#moth-player-count').selectOption('3');
      await page.locator('#moth-player-form button').click();
      await page.locator('#moth-preview-round').click();
      check((await page.locator('#moth-score-notice').textContent()).includes('Select'), 'Must select the empty hand');
      await page.locator('#moth-out').selectOption('0');
      check(await page.locator('#moth-count-0-0').count() === 0 && (await page.locator('.moth-out-zero').textContent()).includes('0'), 'Empty hand automatically gets zero without count inputs');
      check(await page.locator('#moth-round-form legend').first().textContent() === '<Ada>', 'Names are safely escaped');
      check(await page.locator('#moth-save-round').isEnabled(), 'Default zero counts are valid after selecting the empty hand');
      await page.locator('#moth-count-1-0').fill('');
      await page.locator('#moth-preview-round').click();
      check((await page.locator('#moth-score-notice').textContent()).includes('explicit') && await page.locator('#moth-save-round').isDisabled(), 'Blank counts never mean zero');
      await fill(page, 1, [2,1,1]); await fill(page, 2, [0,0,1]);
      check(await page.locator('#moth-save-round').isEnabled() && await page.locator('[data-moth-preview="1"]').textContent() === '17', 'Completing valid counts enables confirmation and previews penalties without an extra click');
      for (const invalid of ['', '-1', '1.5', '1e1']) {
        await page.locator('#moth-count-1-0').fill(invalid);
        await page.locator('#moth-preview-round').click();
        check(await page.locator('#moth-save-round').isDisabled() && await page.evaluate(() => mothScoreGame.rounds.length) === 0, 'Invalid count blocks preview and saving');
      }
      for (const [category, max] of [43,20,8].entries()) {
        const a = zero(), b = zero(); a[category] = max; b[category] = 1;
        await fill(page, 1, a); await fill(page, 2, b);
        await page.locator('#moth-preview-round').click();
        check((await page.locator('#moth-score-notice').textContent()).includes('Across all hands') && await page.locator('#moth-save-round').isDisabled(), 'Aggregate deck capacity enforced for each category');
      }
      await fill(page, 1, [2,1,1]); await fill(page, 2, [0,0,1]);
      await page.locator('#moth-preview-round').click();
      check(await page.locator('[data-moth-preview="1"]').textContent() === '17' && await page.locator('[data-moth-preview="0"]').textContent() === '0', 'Preview shows 17 and empty-hand zero before saving');
      check(await page.evaluate(() => mothScoreGame.rounds.length) === 0, 'Preview does not save');
      check(await page.locator('#moth-save-round').isEnabled(), 'Valid preview enables round confirmation');
      await page.locator('#moth-count-1-0').fill('3');
      check(await page.locator('#moth-save-round').isEnabled() && await page.locator('[data-moth-preview="1"]').textContent() === '18', 'Valid count changes refresh the preview and keep confirmation available');
      await page.locator('#moth-count-1-0').fill('');
      check(await page.locator('#moth-save-round').isDisabled() && (await page.locator('#moth-confirm-status').textContent()).includes('explicit'), 'Missing count disables confirmation and explains the reason beside the button');
      await page.locator('#moth-count-1-0').fill('2');
      await page.locator('#lang-es').click(); await page.locator('#theme').click();
      await visit(page, 'moth/full'); await visit(page, 'coup/reference'); await visit(page, 'moth/reference');
      check(await page.locator('[data-moth-preview="1"]').textContent() === '17', 'Preview and draft survive language, theme and view changes');
      await page.locator('#lang-en').click();
      await page.locator('#moth-player-count').selectOption('4');
      await page.locator('#moth-save-round').evaluate(button => {button.click(); button.click();});
      check(await page.evaluate(() => mothScoreGame.rounds.length) === 1, 'Duplicate activation saves exactly one round');
      check(await page.locator('[data-moth-category]').evaluateAll(inputs => inputs.every(input => input.value === '0')), 'Each new round starts with zero counts');
      check(await page.locator('#moth-player-count').isDisabled(), 'First saved round locks membership');
      check(await page.locator('#moth-player-count').inputValue() === '3' && await page.locator('[data-moth-name]').count() === 3, 'Lock uses committed roster and discards an unsaved membership proposal');
      check(await page.locator('[data-moth-total="1"]').textContent() === '17', 'Saved cumulative penalty is correct');
      check((await page.locator('[data-moth-standing]').evaluateAll(nodes => nodes.map(node => node.dataset.mothStanding))).join(',') === '0,2,1', 'Standings display lowest total first');
      await page.locator('#moth-name-0').fill('Ada renamed'); await page.locator('#moth-player-form button').click();
      check((await page.locator('#moth-out option[value="0"]').textContent()) === 'Ada renamed', 'Name edit updates player labels');
      await page.locator('#moth-out').selectOption('1');
      await fill(page, 0, [2,1,1]); await fill(page, 2, [0,1,0]);
      await edit(page, 1); await page.locator('#moth-edit-cancel').click();
      check(await page.locator('#moth-count-0-0').inputValue() === '2' && await page.locator('#moth-out').inputValue() === '1', 'Cancel correction restores unfinished next round');
      await page.locator('#moth-save-round').focus(); await page.keyboard.press('Enter');
      check(await page.locator('[data-moth-total="0"]').textContent() === '17' && await page.locator('[data-moth-total="2"]').textContent() === '15', 'Multiple rounds accumulate correctly');
      await page.locator('#moth-out').selectOption('2'); await fill(page, 0, zero()); await fill(page, 1, zero());
      await page.locator('#moth-save-round').click();
      check(await page.locator('#moth-round-form').count() === 0 && (await page.locator('#moth-game-result').textContent()).includes('Winner: Cy'), 'Game stops at three rounds and identifies lowest total');
      await edit(page, 1); await fill(page, 2, [2,0,1]); await previewSave(page);
      check((await page.locator('#moth-game-result').textContent()).includes('Joint winners: Ada renamed, Ben, Cy'), 'Correction produces a three-way lowest tie');
      await page.locator('#moth-history-3').evaluate(node => {node.open = true;});
      check((await page.locator('#moth-history-3 td').allTextContents()).filter(text => text === '17').length === 3, 'Later history cumulative totals update after earlier correction');
      await edit(page, 3); await fill(page, 0, [1,0,0]); await previewSave(page);
      check((await page.locator('#moth-game-result').textContent()).includes('Joint winners: Ben, Cy'), 'Only tied lowest players share victory');
      await page.locator('#moth-undo-round').click();
      check(await page.locator('#moth-round-form').count() === 1 && !(await page.locator('#moth-game-result').textContent()).includes('winners:'), 'Undo final round reopens game and removes winner announcement');
      check((await page.locator('#moth-rounds-completed').textContent()).startsWith('2 / 3'), 'Undo updates rounds completed');
      await previewSave(page);
      check((await page.locator('#moth-game-result').textContent()).includes('Joint winners: Ben, Cy'), 'Re-saving reopened final round restores winners');
      await edit(page, 2);
      for (const width of [320,390,844,1440]) {
        await page.setViewportSize({width,height:900});
        for (const lang of ['es','en']) {
          await page.locator('#lang-'+lang).click();
          for (const theme of ['light','dark']) {
            if (await page.evaluate(() => state.theme) !== theme) await page.locator('#theme').click();
            check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${file}/${width}/${lang}/${theme} fits viewport`);
          }
        }
      }
      await page.setViewportSize({width:390,height:844});
      if (file === 'index.html') await page.locator('#moth-score').screenshot({path:path.join(output,'correction-mobile.png')});
      await page.locator('#moth-edit-cancel').click();
      await page.emulateMedia({media:'print'}); check(await page.locator('#moth-score').isHidden(), 'Interactive scoreboard excluded from reference printing'); await page.emulateMedia({media:'screen'});
      // Legacy guide calculator still uses the shared weights.
      await visit(page, 'moth/learn');
      await page.locator('#learning-tools').evaluate(node => {node.open = true;});
      for (const [i,n] of [2,1,1].entries()) await page.locator('#score-'+i).fill(String(n));
      check((await page.locator('#score-result').textContent()).startsWith('17'), 'Existing guide calculator remains functional');
      await page.locator('a[href="#moth/reference/moth-score"]').click();
      await page.waitForSelector('#moth-score');
      check((await page.locator('#moth-game-result').textContent()).includes('Ben, Cy'), 'Calculator link opens existing multiplayer game');
      page.once('dialog', dialog => dialog.dismiss()); await page.locator('#moth-new-game').click();
      check(await page.locator('#moth-rounds-completed').count() === 1, 'Cancelled reset preserves history');
      page.once('dialog', dialog => dialog.accept()); await page.locator('#moth-new-game').click();
      check(await page.locator('#moth-player-count').isEnabled() && await page.locator('#moth-name-0').inputValue() === 'Ada renamed', 'Reset returns to unlocked editable player setup');
      check(await page.evaluate(() => mothScoreGame === null && mothScoreDraft === null && mothScorePending === null && mothScorePreview === null), 'Reset clears scores, drafts and previews');
      for (const n of [4,5]) {
        await page.locator('#moth-player-count').selectOption(String(n));
        for (let i = 0; i < n; i++) await page.locator(`#moth-name-${i}`).fill(`Player ${i+1}`);
        await page.locator('#moth-player-form button').click();
        for (let round = 0; round < n; round++) {
          await page.locator('#moth-out').selectOption(String(round));
          for (let i = 0; i < n; i++) if (i !== round) await fill(page, i, zero());
          await previewSave(page);
        }
        check(await page.locator('#moth-round-form').count() === 0 && (await page.locator('#moth-rounds-completed').textContent()).startsWith(`${n} / ${n}`), 'Four/five-player game ends at its exact round limit');
        check(await page.evaluate(() => mothGameSummary(mothScoreGame).winners.length) === n, 'All tied players share victory in four/five-player game');
        await page.reload();
        check(await page.evaluate(() => mothScoreGame.rounds.length) === n, 'Confirmed rounds survive reload');
        page.once('dialog', dialog => dialog.accept()); await page.locator('#moth-new-game').click();
      }
      await page.reload(); check(await page.locator('#moth-player-form').count() === 1, 'Explicit reset remains cleared after reload');
      check(errors.length === 0, `No browser errors: ${errors.join(', ')}`);
      await context.close();
    }
    console.log(`Passed ${checks} Polilla scoreboard checks (${engine}). Screenshots: ${output}`);
  } finally {await browser.close();}
})().catch(error => {console.error(error); process.exitCode = 1;});
