const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawn } = require('node:child_process');
const { chromium, webkit } = require('playwright');
const catalog = require('../src/generated/catalog.json');
const server = spawn(process.execPath, ['scripts/serve-export.mjs'], { stdio: ['ignore', 'pipe', 'inherit'] });
let checks = 0;
const check = (condition, message) => { assert.ok(condition, message); checks++; };
(async () => {
  const base = await new Promise((resolve, reject) => {
    server.stdout.once('data', data => resolve(data.toString().trim()));
    server.once('error', reject);
  });
  const engine = process.env.BROWSER || 'chromium';
  const browser = await { chromium, webkit }[engine].launch({ headless: true,
    ...(engine === 'chromium' && process.env.CHROME_CHANNEL ? { channel: process.env.CHROME_CHANNEL } : {}) });
  const output = fs.mkdtempSync(path.join(os.tmpdir(), 'tablefolk-rule-preview-'));
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const ready = () => page.waitForFunction(() => document.querySelector('[data-tool=sources][data-ready=true]'));
  const visit = async route => { await page.goto(base + route); await ready(); };
  const open = async query => {
    await page.locator('#find-rule').click();
    if (query) await page.locator('#rule-search-dialog').fill(query);
  };
  const back = () => page.getByRole('button', { name: /Back to results|Volver a los resultados/ }).click();
  const preview = section => page.locator(`[data-rule-preview="${section}"]`);
  const fullSection = async (game, section, lang) => {
    const expected = catalog.games[game].sections.find(item => item.id === section).paragraphs.map(pair => pair[lang]);
    assert.deepEqual(await preview(section).locator('.rule-body > p').allTextContents(), expected);
    checks++;
  };
  const fits = async () => check(await page.locator('#rule-dialog').evaluate(node =>
    node.scrollWidth <= node.clientWidth + 1 && [...node.querySelectorAll('button, a')]
      .filter(child => child.getClientRects().length).every(child => child.getBoundingClientRect().height >= 44) &&
      [...node.querySelectorAll('p, h3, h5, button, a')]
      .filter(child => child.getClientRects().length)
      .every(child => child.scrollWidth <= child.clientWidth + 1)), 'No internal clipping in preview or controls');
  try {
    const noJS = await browser.newPage({ javaScriptEnabled: false });
    await noJS.goto(base + '/es/chess/rules/');
    check(await noJS.getByRole('link', { name: '¿Cuándo puedo enrocar?' }).isVisible(), 'Common question links are server-rendered without scripts');
    await noJS.close();
    await visit('/en/chess/play/');
    await open();
    check(await page.getByRole('link', { name: 'When can I castle?' }).isVisible(), 'Empty query surfaces castling question');
    const originalURL = page.url();
    await page.getByRole('link', { name: 'When can I castle?' }).click();
    await preview('special').waitFor();
    check(page.url() === originalURL, 'Question stays at the table without changing the URL');
    await fullSection('chess', 'special', 'en');
    check((await preview('special').innerText()).includes('The rook may cross an attacked square.'), 'Castling exception is complete');
    check(await page.locator('#rule-preview-title').evaluate(node => node === document.activeElement), 'Preview heading receives keyboard focus');
    await back();
    await page.waitForFunction(() => document.activeElement?.closest('.common-questions'));
    check(await page.getByRole('link', { name: 'When can I castle?' }).evaluate(node => node === document.activeElement), 'Back restores the question focus');
    check(await page.locator('#rule-search-dialog').inputValue() === 'castling', 'Back retains query');
    await page.locator('#rule-search-dialog').fill('castlng');
    const result = page.locator('#rule-dialog .rule-search-result').first();
    await result.focus();
    await page.keyboard.press('Enter');
    await preview('special').waitFor();
    await back();
    await page.waitForFunction(() => document.activeElement?.classList.contains('rule-search-result'));
    check(await result.evaluate(node => node === document.activeElement), 'Back restores typo result focus');
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => document.activeElement?.id === 'find-rule');
    check(await page.locator('#find-rule').evaluate(node => node === document.activeElement), 'Escape returns to table trigger');

    // Run a real clock under a modal preview, then a paused snapshot. Keep the
    // actual tool DOM node so a remount cannot silently pass a storage check.
    await page.locator('#jump-to-tool').click();
    await page.locator('#chess-clock-preset').selectOption('3');
    await page.locator('#chess-clock-toggle').click();
    await page.evaluate(() => window.lookupClockNode = document.getElementById('chess-clock-toggle'));
    const before = await page.evaluate(() => JSON.parse(localStorage.getItem('tablefolk-chess-clock')));
    const beforeTime = await page.locator('#chess-clock-time-0').textContent();
    await open('castling');
    await page.locator('#rule-dialog .rule-search-result').first().click();
    await page.waitForTimeout(1100);
    const during = await page.evaluate(() => JSON.parse(localStorage.getItem('tablefolk-chess-clock')));
    check(during.phase === 'running' && during.deadline === before.deadline && (await page.locator('#chess-clock-time-0').textContent()) !== beforeTime, 'Lookup keeps the active clock deadline and countdown');
    await page.getByRole('button', { name: 'Back to table' }).click();
    check(await page.evaluate(() => window.lookupClockNode === document.getElementById('chess-clock-toggle')), 'Underlying clock DOM stays mounted');
    await page.locator('#chess-clock-toggle').click();
    const paused = await page.evaluate(() => localStorage.getItem('tablefolk-chess-clock'));
    await open('castling');
    await page.locator('#rule-dialog .rule-search-result').first().click();
    await page.keyboard.press('Escape');
    check(await page.evaluate(() => localStorage.getItem('tablefolk-chess-clock')) === paused, 'Lookup preserves paused clock snapshot');

    await visit('/en/poker/play/');
    await page.locator('#jump-to-tool').click();
    await page.locator('#poker-timer-toggle').click();
    const pokerBefore = await page.evaluate(() => JSON.parse(localStorage.getItem('tablefolk-poker-tournament-v1')));
    const pokerTime = await page.locator('#poker-timer-time').innerText();
    await open('tie');
    await page.locator('#rule-dialog .rule-search-result').first().click();
    await preview('showdown').waitFor();
    await page.waitForTimeout(1100);
    const pokerDuring = await page.evaluate(() => JSON.parse(localStorage.getItem('tablefolk-poker-tournament-v1')));
    check(pokerDuring.phase === 'running' && pokerDuring.deadline === pokerBefore.deadline &&
      await page.locator('#poker-timer-time').innerText() !== pokerTime, 'Poker countdown continues with the same deadline during lookup');
    await page.keyboard.press('Escape');
    await page.locator('#poker-timer-toggle').click();

    await visit('/es/skull_king/play/?shared=1&expansion=1&q=sirena');
    const state = await page.evaluate(() => localStorage.getItem('tablefolk-skull-score-v1'));
    await open();
    await page.locator('#rule-dialog .rule-search-result').first().click();
    await preview('hierarchy').waitFor();
    await fullSection('skull_king', 'hierarchy', 'es');
    for (const id of ['sk-mermaid', 'sk-pirate', 'sk-king'])
      check(await page.locator(`[data-rule-card="${id}"]`).isVisible(), `Character lookup includes ${id}`);
    check((await preview('hierarchy').innerText()).includes('gana la Sirena sin importar el orden'), 'Three-character exception remains explicit');
    const art = page.locator('[data-rule-card="sk-mermaid"] [data-art]');
    await art.click();
    await page.locator('#image-viewer').waitFor();
    await page.keyboard.press('Escape');
    check(await preview('hierarchy').isVisible() && await art.evaluate(node => node === document.activeElement), 'Image Escape returns to card inside the preview');
    await page.getByRole('button', { name: 'Compartir regla', exact: true }).click();
    await page.waitForFunction(() => document.querySelector('#share-link')?.value.includes('#hierarchy'));
    const shared = new URL(await page.locator('#share-link').inputValue());
    check(shared.pathname === '/es/skull_king/rules/' && shared.hash === '#hierarchy' && shared.searchParams.get('expansion') === '1' && shared.searchParams.get('q') === 'sirena', `Sharing targets full rules with query and temporary expansion: ${shared.href}`);
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => document.activeElement?.textContent === 'Compartir regla' && !document.querySelector('#share-dialog').open);
    check(await preview('hierarchy').isVisible() && await page.getByRole('button', { name: 'Compartir regla', exact: true }).evaluate(node => node === document.activeElement), 'Share Escape returns to preview action');
    await page.getByRole('button', { name: 'Volver a la mesa' }).click();
    check(await page.evaluate(() => localStorage.getItem('tablefolk-skull-score-v1')) === state, 'Examples never change live scores');

    for (const lang of ['en', 'es']) for (const theme of ['light', 'dark']) for (const width of [320, 390, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.evaluate(value => localStorage.setItem('tablefolk-preferences', JSON.stringify({ theme: value })), theme);
      for (const game of ['chess', 'skull_king']) {
        await visit(`/${lang}/${game}/play/`);
        await page.evaluate(value => document.documentElement.dataset.theme = value, theme);
        await open(game === 'chess' ? 'castling' : 'mermaid');
        await page.locator('#rule-dialog .rule-search-result').first().click();
        await preview(game === 'chess' ? 'special' : 'hierarchy').waitFor();
        await fullSection(game, game === 'chess' ? 'special' : 'hierarchy', lang);
        await fits();
        await page.screenshot({ path: path.join(output, `${game}-${lang}-${theme}-${width}.png`) });
        await page.keyboard.press('Escape');
      }
    }
    await page.setViewportSize({ width: 320, height: 900 });
    await visit('/es/skull_king/play/');
    await open('mermaid');
    await page.locator('#rule-dialog .rule-search-result').first().click();
    await page.addStyleTag({ content: '#rule-dialog { font-size: 24px; } #rule-dialog p, #rule-dialog small, #rule-dialog button, #rule-dialog a { font-size: 24px !important; } #rule-dialog h3, #rule-dialog h5 { font-size: 30px !important; }' });
    await fits();
    await page.screenshot({ path: path.join(output, 'spanish-enlarged.png') });
    await page.locator('[data-rule-card="sk-mermaid"]').scrollIntoViewIfNeeded();
    await page.waitForFunction(() => { const img = document.querySelector('[data-rule-card="sk-mermaid"] img'); return img.complete && img.naturalWidth > 0; });
    await fits();
    await page.screenshot({ path: path.join(output, 'spanish-enlarged-card.png') });
    await back();
    await page.locator('#rule-search-dialog').fill('qzxvfoo');
    check(await page.locator('#rule-dialog .rule-search-result').count() === 0 && await preview('hierarchy').count() === 0, 'Unmatched query never presents an answer');
    await page.keyboard.press('Escape');
    await page.route('**/assets/responsive/sk-card-mermaid-*.webp', route => route.abort());
    await visit('/es/skull_king/play/');
    await open('mermaid');
    await page.locator('#rule-dialog .rule-search-result').first().click();
    await page.locator('[data-rule-card="sk-mermaid"]').scrollIntoViewIfNeeded();
    await page.waitForFunction(() => document.querySelector('[data-rule-card="sk-mermaid"] img')?.hidden);
    check((await page.locator('[data-rule-card="sk-mermaid"]').innerText()).includes('gana si coinciden Pirata, Rey y Sirena'), 'Failed artwork retains the card identity and conditional explanation');
    await page.keyboard.press('Escape');
    await visit('/en/coup/play/?shared=1&exchange=ambassador&reformation=0&q=examine');
    await open();
    check(await page.locator('#rule-dialog .rule-search-result').count() === 0, 'Inactive exchange character remains unsearchable');
    await page.keyboard.press('Escape');
    await visit('/en/skull_king/rules/?shared=1&expansion=1&q=mermaid');
    await page.locator('#rule-search-results .rule-search-result').first().click();
    check(new URL(page.url()).hash === '#hierarchy' && !await page.locator('#rule-dialog').isVisible(), 'Full Rules retains ordinary section links');
    assert.deepEqual(errors, []);
    console.log(`Passed ${checks} in-place rule lookup checks (${engine}). Screenshots: ${output}`);
  } finally { await browser.close(); server.kill(); }
})().catch(error => { server.kill(); console.error(error); process.exitCode = 1; });
