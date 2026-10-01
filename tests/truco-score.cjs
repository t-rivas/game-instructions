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
const sandbox = {};
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(root, 'truco-score.js'), 'utf8'), sandbox);
const create = sandbox.createTrucoScore;
const phase = sandbox.trucoScorePhase;
const configured = (target = 30) => { const game = create(); game.configure(['Ana & Bea', 'Camilo & Diego'], target); return game; };
const totals = game => game.snapshot().totals.join(',');

const invalid = create();
check(invalid.snapshot().target === 30 && invalid.snapshot().names.length === 2, 'Default target and exactly two sides');
check(!invalid.award(0, 1), 'Names required before scoring');
for (const names of [[], ['A'], ['A','B','C'], ['A',' '], ['A',' a '], [1,'B']]) {
  check(!invalid.configure(names, 30), 'Reject invalid or duplicate names');
}
for (const number of [0, -1, 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) {
  check(!invalid.configure(['A','B'], number), 'Reject non-positive or unsafe targets');
  const game = configured();
  check(!game.award(0, number) && !game.snapshot().locked, 'Reject invalid points without locking');
  game.award(0, 1);
  check(!game.correct(0, 0, number) && totals(game) === '1,0', 'Invalid correction leaves totals unchanged');
}
const basic = configured();
check(basic.configure(['Ana','Bea'], 30), 'Target and names editable before first award');
for (const side of [-1, 2, 0.5, null, '0']) check(!basic.award(side, 1), 'Reject invalid side');
check(!basic.award(0, 1, 'falta') && !basic.snapshot().locked, 'Reject unsupported labels');
check(basic.award(0, 14, 'envido') && totals(basic) === '14,0', 'Custom award reaches 14');
check(phase(14, 30).name === 'malas' && phase(14, 30).points === 14, '14 malas');
check(basic.award(0, 1, 'truco') && totals(basic) === '15,0', '14→15 preserves cumulative total');
check(phase(15, 30).name === 'buenas' && phase(15, 30).points === 0, '15 becomes 0 buenas');
check(basic.award(0, 14, 'flor') && totals(basic) === '29,0', '29 cumulative');
check(phase(29, 30).name === 'buenas' && phase(29, 30).points === 14, '29 becomes 14 buenas');
check(basic.award(0, 1, 'other') && totals(basic) === '30,0', '29→30');
check(basic.snapshot().winner === 0 && basic.snapshot().winningIndex === 3 && phase(30, 30) === null, 'First side reaching 30 wins');
check(!basic.award(1, 4) && !basic.configure(['A','B'], 40), 'Completed game blocks awards and target changes');
check(basic.undo() && !basic.snapshot().finished && totals(basic) === '29,0', 'Undo winning award reopens game');
check(basic.award(0, 4) && totals(basic) === '33,0', 'Overshoot retains all awarded points');
check(basic.correct(3, 0, 1) && totals(basic) === '30,0', 'Correction after completion');
check(basic.correct(3, 1, 2) && !basic.snapshot().finished && totals(basic) === '29,2', 'Changing entry side recalculates completion');
check(basic.rename(['Bea','Ana']) && totals(basic) === '29,2' && basic.snapshot().entries[0].side === 0, 'Atomic rename preserves side identity');
check(!basic.rename(['A','A']), 'Duplicate rename rejected');
check(!basic.delete(-1) && !basic.delete(100) && !basic.correct(100, 0, 1), 'Invalid history indexes rejected');
while (basic.snapshot().entries.length) basic.delete(0);
check(totals(basic) === '0,0' && basic.snapshot().locked && !basic.configure(['A','B'], 20), 'Deleting all entries keeps target locked and totals nonnegative');
check(!basic.undo(), 'Undo empty history is harmless');
basic.newGame();
check(!basic.snapshot().locked && !basic.snapshot().started && basic.snapshot().names.join(',') === 'Bea,Ana', 'New game keeps names and unlocks target');

for (const target of [1, 7, 15, 31, Number.MAX_SAFE_INTEGER]) {
  const game = configured(target);
  check(phase(0, target) === null && phase(target - 1, target) === null, 'Custom targets never invent phases');
  check(game.award(1, target) && game.snapshot().winner === 1 && game.snapshot().totals[1] === target, 'Positive custom target completes exactly');
  check(game.undo() && totals(game) === '0,0' && game.snapshot().locked, 'Undo sole winning award keeps lock');
  check(!game.configure(['A','B'], 30), 'Undo cannot unlock target');
}
const custom = configured(7);
custom.award(1, 6); custom.award(1, 4);
check(custom.snapshot().winner === 1 && totals(custom) === '0,10', 'Custom target overshoot preserved');

const replay = configured();
[[0,10,'truco'], [1,20,'envido'], [0,10,'flor'], [1,10,'other']].forEach(entry => replay.award(...entry));
check(replay.snapshot().winner === 1 && totals(replay) === '20,30', 'Chronological history determines first winner');
check(replay.correct(0, 0, 31), 'Move winning entry earlier by correction');
check(totals(replay) === '31,0' && replay.snapshot().winner === 0 && replay.snapshot().entries.length === 4, 'Replay excludes later awards without deleting history');
check(replay.snapshot().entries.map(entry => entry.counted).join(',') === 'true,false,false,false', 'Every entry after corrected win flagged');
check(replay.correct(3, 1, 12) && totals(replay) === '31,0', 'Excluded entry remains editable but not counted');
check(!replay.award(1, 1), 'Corrected completion blocks new awards');
check(replay.correct(0, 0, 10) && totals(replay) === '20,32' && replay.snapshot().winner === 1, 'Correcting earlier winner reactivates preserved awards');
check(replay.correct(1, 1, 30) && totals(replay) === '10,30' && replay.snapshot().winningIndex === 1, 'Either side can become earlier winner');
check(replay.delete(1) && !replay.snapshot().finished && totals(replay) === '20,12', 'Deleting winning entry restores later awards and reopens game');
check(replay.snapshot().entries.every(entry => entry.counted), 'Flags clear when history no longer completes');
const detached = replay.snapshot(); detached.names[0] = 'Changed'; detached.entries[0].points = 99; detached.totals[0] = -2;
check(totals(replay) === '20,12' && replay.snapshot().names[0] === 'Ana & Bea', 'Snapshot cannot mutate internal history');
replay.correct(0,0,30); replay.undo();
check(replay.snapshot().finished && replay.snapshot().entries.length === 2 && totals(replay) === '30,0', 'Undo removes latest chronological entry even when excluded');
const overflow = configured(Number.MAX_SAFE_INTEGER);
overflow.award(0, Number.MAX_SAFE_INTEGER - 1);
check(!overflow.award(0, 2) && totals(overflow) === `${Number.MAX_SAFE_INTEGER - 1},0`, 'Reject unsafe cumulative totals atomically');
overflow.award(0, 1);
check(!overflow.correct(0, 0, Number.MAX_SAFE_INTEGER), 'Reject corrections overflowing preserved history');

(async () => {
  const engine = process.env.BROWSER || 'chromium';
  const browser = await ({chromium,webkit}[engine]).launch(process.env.CHROME_CHANNEL ? {channel:process.env.CHROME_CHANNEL} : {});
  const output = fs.mkdtempSync(path.join(os.tmpdir(), 'tablefolk-truco-'));
  try {
    for (const file of ['index.html', 'game-night.html']) {
      const context = await browser.newContext({viewport:{width:390,height:900}});
      const page = await context.newPage(); const errors = [], requests = [];
      page.on('pageerror', error => errors.push(error.message));
      page.on('request', request => { if (/^https?:/.test(request.url())) requests.push(request.url()); });
      await page.goto(pathToFileURL(path.join(root, file)).href + '#truco/reference');
      check((await page.locator('#truco-score-heading').textContent()).includes('Marcador manual'), 'Spanish scoreboard available');
      await page.locator('#lang-en').click();
      check(await page.locator('#truco-target').inputValue() === '30', 'UI default target is 30');
      check(await page.locator('[data-truco-name]').count() === 2, 'Exactly two named sides');
      check((await page.locator('#truco-score').textContent()).includes('does not calculate card values'), 'Manual scope explicit');
      await page.locator('#truco-name-0').fill('Ana & Bea'); await page.locator('#truco-name-1').fill(' ana & bea ');
      await page.locator('#truco-start').click();
      check((await page.locator('#truco-score-error').textContent()).includes('distinct names'), 'Duplicate names show error');
      await page.locator('#truco-name-1').fill('Camilo & Diego');
      for (const target of ['0', '-1', '1.5']) {
        await page.locator('#truco-target').fill(target); await page.locator('#truco-start').click();
        check(!await page.evaluate(() => trucoScore.snapshot().started), 'Invalid target cannot start');
      }
      await page.locator('#truco-target').fill('30'); await page.locator('#theme').click();
      check(await page.locator('#truco-name-0').inputValue() === 'Ana & Bea', 'Setup draft survives theme switch');
      await page.locator('#truco-start').click();
      check(await page.locator('#truco-edit-setup').count() === 1, 'Setup still editable before scoring');
      const total = side => page.locator(`[data-truco-side="${side}"] .truco-total strong`).textContent();
      const award = async (side, points) => { await page.locator(`#truco-custom-${side}`).fill(String(points)); await page.locator(`#truco-custom-save-${side}`).click(); };
      const correct = async (index, side, points) => {
        await page.locator(`[data-truco-correct="${index}"]`).click();
        await page.locator('#truco-edit-side').selectOption(String(side)); await page.locator('#truco-edit-points').fill(String(points));
        await page.locator('#truco-save-correction').click();
      };
      for (const points of ['0', '-1', '1.5']) {
        await page.locator('#truco-custom-0').fill(points); await page.locator('#truco-custom-save-0').click();
        check(await total(0) === '0 / 30', 'Invalid custom award leaves total unchanged');
      }
      await page.locator('#truco-award-label').selectOption('envido'); await award(0, 14);
      check(await total(0) === '14 / 30' && await page.locator('[data-truco-side="0"] .truco-phase').textContent() === '14 malas', 'UI 14 malas with cumulative total');
      check((await page.locator('[data-truco-entry="0"]').textContent()).includes('Envido'), 'Optional label recorded');
      check(await page.locator('#truco-edit-setup').count() === 0, 'Target locks after first award');
      await page.locator('#truco-add-0-1').focus(); await page.keyboard.press('Enter');
      check(await total(0) === '15 / 30' && await page.locator('[data-truco-side="0"] .truco-phase').textContent() === '0 buenas', 'Keyboard award transitions 14→15');
      await award(0, 14);
      check(await total(0) === '29 / 30' && await page.locator('[data-truco-side="0"] .truco-phase').textContent() === '14 buenas', 'UI 29 buenas');
      await page.locator('#truco-add-0-1').click();
      check(await total(0) === '30 / 30' && (await page.locator('#truco-winner').textContent()).includes('Ana & Bea'), 'UI 29→30 announces winner');
      check(await page.locator('[data-truco-award]:enabled').count() === 0 && await page.locator('#truco-custom-save-1').isDisabled(), 'All new award controls stop at completion');
      await page.locator('#truco-undo').click();
      check(await total(0) === '29 / 30' && await page.locator('#truco-winner').count() === 0, 'Undo winning award restores active scoreboard');
      await page.locator('#truco-add-0-4').click();
      check(await total(0) === '33 / 30', 'UI retains overshoot');
      await correct(0, 0, 30);
      check(await total(0) === '30 / 30' && await page.locator('.truco-excluded').count() === 3, 'Earlier corrected win visibly excludes later history');
      check((await page.locator('#truco-history-warning').textContent()).includes('excluded from totals') && await page.locator('[data-truco-entry]').count() === 4, 'Warning explains retained history');
      await correct(3, 1, 3);
      check(await total(1) === '0 / 30', 'Excluded entry corrections do not silently add points');
      await correct(0, 0, 14);
      check(await total(0) === '29 / 30' && await total(1) === '3 / 30' && await page.locator('.truco-excluded').count() === 0, 'Correction reactivates later entries');
      await page.locator('#truco-add-1-2').click(); await page.locator('#truco-add-1-3').click();
      check(await total(1) === '8 / 30', '+2 and +3 quick awards work');
      await page.locator('[data-truco-correct="0"]').click(); await page.locator('#truco-edit-points').fill('0'); await page.locator('#truco-save-correction').click();
      check(await total(0) === '29 / 30', 'Invalid correction does not subtract points');
      await page.locator('#truco-edit-points').fill('13'); await page.locator('#truco-edit-label').selectOption('other');
      await page.locator('#lang-es').click(); await page.locator('#theme').click();
      check(await page.locator('#truco-edit-points').inputValue() === '13', 'Pending correction survives language/theme');
      await page.locator('#tab-full').click(); await page.locator('#tab-reference').click();
      check(await page.locator('#truco-edit-label').inputValue() === 'other', 'Pending correction survives guide views');
      await page.locator('#lang-en').click(); await page.locator('#truco-save-correction').click();
      check(await total(0) === '28 / 30', 'UI correction recalculates score');
      await page.locator('.truco-names summary').click(); await page.locator('#truco-rename-0').fill('<Partners>'); await page.locator('#truco-rename-form button').click();
      check((await page.locator('[data-truco-entry="0"]').textContent()).includes('<Partners>') && await total(0) === '28 / 30', 'Renaming escapes text and preserves history identity');
      await page.locator('[data-truco-delete="0"]').click();
      check(await total(0) === '15 / 30', 'Delete entry recomputes totals');
      await correct(0, 0, 30);
      await page.locator('[data-truco-delete="0"]').click();
      check(await page.locator('#truco-winner').count() === 0 && await page.locator('.truco-excluded').count() === 0 && await total(0) === '14 / 30', 'Deleting corrected winning entry reopens game');
      while (await page.locator('[data-truco-entry]').count()) await page.locator('#truco-undo').click();
      check(await total(0) === '0 / 30' && await total(1) === '0 / 30' && await page.locator('#truco-edit-setup').count() === 0, 'Undo all entries keeps target locked and totals nonnegative');
      check(await page.locator('.scoreboard-heading #truco-new-game').isVisible(), 'Reset is prominent beside scoreboard title');
      await page.locator('#truco-new-game').click();
      check(await page.locator('#truco-name-0').isEditable() && await page.locator('#truco-target').isEnabled(), 'Reset reopens editable sides and target');
      check(await page.evaluate(() => !trucoScore.snapshot().started && !trucoScore.snapshot().locked && trucoScore.snapshot().entries.length === 0 && trucoEditDraft === null), 'Reset clears scores, history and corrections');
      await page.locator('#truco-target').fill('7'); await page.locator('#truco-start').click();
      check(await total(0) === '0 / 7' && !(await page.locator('#truco-score').textContent()).includes('buenas'), 'Custom target has no split');
      await page.locator('#truco-custom-1').fill('6'); await page.locator('#truco-award-label').selectOption('flor'); await page.locator('#theme').click();
      check(await page.locator('#truco-custom-1').inputValue() === '6' && await page.locator('#truco-award-label').inputValue() === 'flor', 'Pending custom award survives rerender');
      await page.locator('#truco-custom-save-1').click(); await page.locator('#truco-add-1-4').click();
      check(await total(1) === '10 / 7' && (await page.locator('#truco-winner').textContent()).includes('Camilo & Diego'), 'Custom overshoot announces second side winner');
      page.once('dialog', dialog => dialog.dismiss()); await page.locator('#truco-new-game').click();
      check(await total(1) === '10 / 7', 'Cancel new game preserves history');
      await page.locator('[data-truco-correct="0"]').click();
      for (const width of [320,390,844,1440]) {
        await page.setViewportSize({width,height:width === 844 ? 390 : 900});
        for (const lang of ['es','en']) {
          await page.locator('#lang-' + lang).click();
          for (const theme of ['light','dark']) {
            if (await page.evaluate(() => state.theme) !== theme) await page.locator('#theme').click();
            check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${file}/${width}/${lang}/${theme}: no overflow`);
            check(await page.locator('#truco-save-correction').evaluate(node => node.getBoundingClientRect().height >= 44), 'Correction control has touch target');
          }
        }
        if (file === 'index.html') await page.locator('#truco-score').screenshot({path:path.join(output, `score-${width}.png`)});
      }
      await page.emulateMedia({media:'print'});
      check(await page.locator('#truco-score').isHidden(), 'Scoreboard does not clutter printed rules');
      await page.emulateMedia({media:'screen'});
      await page.reload();
      check(await page.locator('#truco-start').count() === 1 && await page.evaluate(() => trucoScore.snapshot().entries.length) === 0, 'Reload clears scores as documented');
      check(errors.length === 0, `No browser errors: ${errors.join(', ')}`);
      check(requests.length === 0, 'Scoreboard works offline');
      await context.close();
    }
    console.log(`Passed ${checks} Truco scoreboard checks (${engine}). Screenshots: ${output}`);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
