const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');
const { chromium, webkit } = require('playwright');
const { games } = require('../src/generated/catalog.json');
const { pathToFileURL } = require('node:url');
const server = spawn(process.execPath, ['scripts/serve-export.mjs'], { stdio: ['ignore', 'pipe', 'inherit'] });
let checks = 0;
const check = (value, message) => { assert.ok(value, message); checks++; };
(async () => {
  let browser;
  try {
    const base = await new Promise((resolve, reject) => {
      server.stdout.once('data', data => resolve(data.toString().trim()));
      server.once('error', reject);
    });
    const engine = process.env.BROWSER || 'chromium';
    browser = await { chromium, webkit }[engine].launch({ headless: true,
      ...(engine === 'chromium' && process.env.CHROME_CHANNEL ? { channel: process.env.CHROME_CHANNEL } : {}) });
    const output = `/tmp/tablefolk-turn-reference-${engine}`;
    fs.mkdirSync(output, { recursive: true });
    const noJS = await browser.newContext({ javaScriptEnabled: false });
    const staticPage = await noJS.newPage();
    // Every reference and its exact rule targets exist before hydration.
    for (const lang of ['en', 'es']) for (const id of Object.keys(games)) {
      await staticPage.goto(`${base}/${lang}/${id}/play/`);
      const phases = staticPage.locator('.turn-phases li');
      check(await phases.count() >= 2, `${lang}/${id}: real recurring phases`);
      const links = await staticPage.locator('.turn-reference a').evaluateAll(nodes => nodes.map(node => node.getAttribute('href')));
      for (const href of links) {
        const link = new URL(href, base);
        if (link.pathname.endsWith('/rules/')) check(games[id].sections.some(section => section.id === link.hash.slice(1)), `${lang}/${id}: precise rule target ${href}`);
      }
      const tool = staticPage.locator('#active-table-tool');
      if (await tool.count()) check(await staticPage.evaluate(() => !!(document.getElementById('table-sheet').compareDocumentPosition(document.getElementById('active-table-tool')) & Node.DOCUMENT_POSITION_FOLLOWING)), `${id}: reference before optional setup`);
      const text = (await phases.allTextContents()).join(' ');
      if (['chess', 'catan'].includes(id)) check(!/set up|setup|prepara el tablero/i.test(text), `${id}: no setup lesson in the turn`);
      if (id.startsWith('sushi_go')) {
        check(lang === 'en' ? /Everyone secretly/.test(text) && /together/.test(text) && /left/.test(text) : /Todos eligen en secreto/.test(text) && /a la vez/.test(text) && /izquierda/.test(text), `${id}: simultaneous choose/reveal/pass`);
        check(!/score the round|puntúen la ronda/.test(text), `${id}: scoring is not a card-selection step`);
        check(await staticPage.locator('.round-transition').isVisible(), `${id}: separate round-end reference`);
      }
      if (id === 'coup' && lang === 'en') check(/action’s character first, then/.test(text) && /next surviving player/.test(text), 'Coup: action challenge precedes block and next survivor acts');
      if (id === 'poker' && lang === 'en') check(/with two players/.test(text) && /except all-in/.test(text) && /only one player remains/.test(text), 'Poker: heads-up, all-ins and uncontested pots');
      if (id === 'burako' && lang === 'en') check(/continue this turn/.test(text) && /wait until your next turn/.test(text), 'Burako: both dead-pile timings');
    }
    await noJS.close();
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const ready = () => page.waitForFunction(() => document.querySelector('main')?.dataset.route === location.pathname && document.querySelector('[data-tool=play][data-ready=true]'));
    const visit = async (id, lang = 'en', hash = '') => { await page.goto(`${base}/${lang}/${id}/play/${hash}`); await ready(); };
    await visit('coup');
    await page.locator('#jump-to-tool').focus();
    await page.keyboard.press('Enter');
    check(await page.locator('#active-table-tool-heading').evaluate(node => node === document.activeElement), 'Keyboard opens tool');
    await page.locator('#coup-name-0').fill('Ana');
    await page.locator('#coup-name-1').fill('Sol');
    await page.locator('#back-to-reference').click();
    check(await page.locator('#table-sheet-heading').evaluate(node => node === document.activeElement), 'Return restores reference focus');
    await page.locator('#jump-to-tool').click();
    check(await page.locator('#coup-name-0').inputValue() === 'Ana', 'Unconfirmed setup draft survives reference/tool switches');
    await page.locator('#coup-start').click();
    await page.locator('#coup-winner').selectOption('0');
    await page.locator('#coup-save-result').click();
    await page.locator('#coup-winner').selectOption('1');
    const snapshot = await page.evaluate(() => localStorage.getItem('tablefolk-coup-session'));
    await page.locator('#focus-play').click();
    await page.locator('#back-to-reference').click();
    check(await page.locator('#table-sheet').isVisible(), 'Return reveals the reference in full-screen play');
    await page.waitForFunction(() => document.activeElement?.id === 'table-sheet-heading');
    check(await page.locator('#table-sheet-heading').evaluate(node => node === document.activeElement), 'Full-screen reference has keyboard focus');
    await page.locator('#jump-to-tool').click();
    check(!(await page.locator('#table-sheet').isVisible()), 'Open tool restores full-screen tool view');
    check(await page.locator('#coup-winner').inputValue() === '1', 'Result draft remains intact');
    check(await page.evaluate(() => localStorage.getItem('tablefolk-coup-session')) === snapshot, 'Navigation cannot change live scores or result draft');
    await page.keyboard.press('Escape');
    // Navigate away and Resume through the actual collection link, using cached runtime.
    await page.locator('.breadcrumb').click();
    await page.waitForSelector('.resume-card[data-game=coup] .resume-link');
    await page.locator('.resume-card[data-game=coup] .resume-link').click();
    await ready();
    check(new URL(page.url()).hash === '#active-table-tool', 'Resume targets active tool');
    check(await page.locator('#coup-winner').inputValue() === '1', 'Resume keeps cached unconfirmed result');
    check(await page.locator('#active-table-tool').evaluate(node => node.getBoundingClientRect().top < innerHeight), 'Resume brings tool into viewport');
    check(await page.locator('#active-table-tool-heading').evaluate(node => node === document.activeElement), 'Resume restores tool focus after runtime recovery');
    // Stale focus preference with no live session cannot bypass a fresh reference.
    await visit('chess');
    await page.evaluate(() => sessionStorage.setItem('tablefolk-focus-play-chess', 'true'));
    await page.reload(); await ready();
    check(await page.locator('#main').getAttribute('data-focus') === 'false' && await page.locator('#table-sheet').isVisible(), 'Fresh visit shows reference despite stale full-screen preference');
    for (const [id, toggle, time, storage] of [
      ['chess', '#chess-clock-toggle', '#chess-clock-time-0', 'tablefolk-chess-clock'],
      ['poker', '#poker-timer-toggle', '#poker-timer-time', 'tablefolk-poker-tournament-v1'],
    ]) {
      await visit(id);
      await page.locator('#jump-to-tool').click();
      await page.locator(toggle).click();
      const before = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), storage);
      const textBefore = await page.locator(time).innerText();
      await page.locator('#focus-play').click();
      await page.screenshot({ path: `${output}/${id}-full-screen.png`, fullPage: true });
      await page.locator('#back-to-reference').click();
      await page.waitForTimeout(1100);
      await page.locator('#jump-to-tool').click();
      const after = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), storage);
      check(after.phase === 'running' && after.deadline === before.deadline, `${id}: reference cannot pause or restart a running clock`);
      check(await page.locator(time).innerText() !== textBefore, `${id}: time continues while reading reference`);
      await page.locator(toggle).click();
      const paused = await page.evaluate(key => localStorage.getItem(key), storage);
      await page.locator('#back-to-reference').click(); await page.locator('#jump-to-tool').click();
      check(await page.evaluate(key => localStorage.getItem(key), storage) === paused, `${id}: paused time remains paused`);
      await page.reload(); await ready();
      check(await page.locator('#main').getAttribute('data-focus') === 'true', `${id}: active session recovers full-screen preference`);
      await page.goto(`${base}/en/${id}/play/#active-table-tool`); await ready();
      await page.waitForFunction(() => !!document.activeElement?.closest('#active-table-tool'));
      check(await page.locator('#table-sheet').isHidden(), `${id}: full-screen Resume opens active controls directly`);
      await page.keyboard.press('Escape');
    }
    // Phase links reveal the relevant example or catalog, including temporary editions.
    for (const [id, selector] of [['coup', '#coup-lesson'], ['avalon', '#avalon-lesson'], ['skull_king', '#skull-trick-lesson'], ['sushi_go', '#table-cards'], ['sushi_go_party', '#table-cards']]) {
      await visit(id);
      const link = page.locator('.turn-phase-links a').filter({ hasText: 'Card example' }).first();
      await link.click();
      await page.waitForSelector(selector, { state: 'visible' });
      check(await page.locator(selector).isVisible(), `${id}: precise example opens without searching Learn`);
    }
    await page.goto(`${base}/en/coup/play/?shared=1&exchange=ambassador&reformation=0`); await ready();
    await page.locator('.turn-phase-links a').filter({ hasText: 'Card example' }).first().click();
    await page.waitForSelector('#coup-lesson', { state: 'visible' });
    check(new URL(page.url()).searchParams.get('shared') === '1' && new URL(page.url()).searchParams.get('exchange') === 'ambassador', 'Phase links retain shared edition choices');
    // Both themes/locales at all required widths, plus enlarged text. Include tool and image controls.
    for (const width of [320, 390, 768, 1440]) for (const lang of ['en', 'es']) for (const theme of ['dark', 'light']) {
      await page.setViewportSize({ width, height: 900 });
      for (const id of Object.keys(games)) {
        await visit(id, lang);
        if (await page.locator('#main').getAttribute('data-focus') === 'true') await page.keyboard.press('Escape');
        check(await page.locator('#table-sheet').isVisible(), `${id}: reference visible during layout review`);
        await page.evaluate(theme => document.documentElement.dataset.theme = theme, theme);
        check(await page.locator('.turn-reference').evaluate(node => node.scrollWidth <= node.clientWidth + 1), `${width}/${lang}/${theme}/${id}: reference fits`);
        check(await page.locator('.turn-phase-links a').evaluateAll(nodes => nodes.every(node => node.getBoundingClientRect().height >= 44)), `${width}/${lang}/${theme}/${id}: touch links`);
        if (['coup', 'chess', 'sushi_go_party'].includes(id)) {
          await page.screenshot({ path: `${output}/${id}-${width}-${lang}-${theme}.png`, fullPage: true });
          await page.locator('.turn-reference').screenshot({ path: `${output}/${id}-${width}-${lang}-${theme}-reference.png` });
        }
      }
    }
    await page.setViewportSize({ width: 320, height: 900 }); await visit('coup', 'es');
    await page.addStyleTag({ content: '.turn-reference,.turn-reference :is(p,li,span,strong,a),.table-jump {font-size:24px !important}' });
    check(await page.locator('.turn-reference').evaluate(node => node.scrollWidth <= node.clientWidth + 1), 'Enlarged Spanish text fits 320px');
    await page.screenshot({ path: `${output}/coup-enlarged-es.png`, fullPage: true });
    await page.locator('button[data-art=coup-duke]').first().click();
    await page.waitForSelector('#image-viewer[open]');
    await page.keyboard.press('Escape');
    check(await page.locator('button[data-art=coup-duke]').first().evaluate(node => node === document.activeElement), 'Reference card enlargement returns focus');
    // Portable output keeps reference-first order and in-document navigation offline.
    const offline = await browser.newContext();
    await offline.route(/^https?:/, route => route.abort());
    const portable = await offline.newPage();
    await portable.goto(pathToFileURL(path.resolve('game-night.html')).href + '#coup/reference');
    await portable.locator('#lang-en').click();
    check(await portable.locator('.turn-phases li').count() === 3, 'Portable guide uses the same actual turn phases');
    await portable.locator('#jump-to-tool').click();
    await portable.locator('#coup-name-0').fill('Offline');
    await portable.locator('#back-to-reference').click();
    check(await portable.locator('#table-sheet-heading').evaluate(node => node === document.activeElement), 'Portable return restores focus');
    await portable.locator('#jump-to-tool').click();
    check(await portable.locator('#coup-name-0').inputValue() === 'Offline', 'Portable navigation preserves draft');
    await offline.close();
    check(errors.length === 0, `No browser errors: ${errors.join(', ')}`);
    console.log(`${checks} turn-reference checks passed (${engine}). Screenshots: ${output}`);
  } finally { await browser?.close(); server.kill(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
