const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const { chromium, webkit } = require('playwright');
const { learningExample, learningLesson, openDisclosure } = require('./learning-navigation.cjs');
const server = spawn(process.execPath, ['scripts/serve-export.mjs'], { stdio: ['ignore', 'pipe', 'inherit'] });
(async () => {
  const base = await new Promise(resolve => server.stdout.once('data', data => resolve(data.toString().trim())));
  const browser = await (process.env.BROWSER === 'webkit' ? webkit : chromium).launch();
  const errors = [];
  try {
    const page = await browser.newPage({ viewport: { width: 320, height: 844 }, hasTouch: true });
    page.on('pageerror', error => errors.push(error.message));
    const ready = () => page.waitForFunction(() => document.querySelector('main')?.dataset.route === location.pathname && document.querySelector('[data-tool=sources][data-ready=true]'));
    const visit = async (route) => { await page.goto(base + route); await ready(); };
    const fits = async (label) => assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), label);
    const changeLanguage = async (lang) => {
      await page.locator(`#lang-${lang}`).click();
      await page.waitForURL(url => url.pathname.startsWith(`/${lang}/`));
      await ready();
    };
    await visit('/en/skull_king/learn/');
    await learningExample(page);
    await page.selectOption('#trick-example', 'three-characters');
    await page.locator('[data-watch-next]').click();
    await page.locator('[data-watch-next]').click();
    await page.evaluate(() => window.reviewExample = document.getElementById('skull-trick-lesson'));
    for (const size of [{ width: 320, height: 844 }, { width: 390, height: 844 }, { width: 768, height: 1000 }, { width: 1440, height: 1000 }, { width: 844, height: 390 }]) {
      await page.setViewportSize(size);
      await fits(`Example fits ${size.width}`);
      assert.equal(await page.locator('[data-watch-beat]').getAttribute('data-watch-beat'), '2');
      assert.ok(await page.evaluate(() => reviewExample === document.getElementById('skull-trick-lesson')), 'Responsive changes preserve the mounted example');
    }
    await changeLanguage('es');
    await page.waitForSelector('[data-watch-beat="2"]');
    assert.equal(await page.locator('#trick-example').inputValue(), 'three-characters');
    await page.setViewportSize({ width: 320, height: 844 });
    await page.evaluate(() => document.documentElement.style.fontSize = '32px');
    await fits('Example fits at doubled text size');
    await page.evaluate(() => document.documentElement.style.fontSize = '16px');
    await learningLesson(page, 'basic-trick');
    await openDisclosure(page, '[data-comparison=mermaid-king]');
    await page.locator('[data-comparison-reveal]').click();
    await changeLanguage('en');
    assert.equal(await page.locator('.comparison-outcome:visible').count(), 2, 'Comparison outcomes survive language navigation');

    await visit('/es/monopoly/play/');
    await page.locator('#find-rule').click();
    await page.locator('#rule-search-dialog').fill('subasta');
    // A reduced visual viewport exercises the same geometry used with a keyboard.
    await page.setViewportSize({ width: 320, height: 360 });
    await page.waitForFunction(() => Math.abs(document.querySelector('#rule-dialog').getBoundingClientRect().height - innerHeight) < 2);
    assert.equal(await page.locator('#rule-search-dialog').evaluate(node => node === document.activeElement), true, 'Search field keeps focus');
    assert.ok(await page.locator('#rule-search-dialog').evaluate(node => { const r = node.getBoundingClientRect(); return r.top >= 0 && r.bottom <= innerHeight; }), 'Active search field remains visible');
    assert.ok(await page.locator('#rule-dialog .dialog-close').evaluate(node => { const r = node.getBoundingClientRect(); return r.top >= 0 && r.bottom <= innerHeight; }), 'Close remains visible above the keyboard');
    await fits('Search fits with a reduced viewport');
    await page.keyboard.press('Escape');
    assert.ok(await page.locator('#find-rule').evaluate(node => node === document.activeElement), 'Search returns focus to its opener');
    await page.setViewportSize({ width: 390, height: 844 });

    await page.clock.setFixedTime(new Date('2026-10-06T12:00:00Z'));
    await visit('/en/chess/play/');
    await page.locator('#chess-clock-minutes').fill('3');
    await page.locator('#chess-clock-toggle').click();
    await page.clock.setFixedTime(new Date('2026-10-06T12:00:05Z'));
    await page.waitForFunction(() => document.getElementById('chess-clock-time-0').textContent === '2:55');
    await page.setViewportSize({ width: 844, height: 390 });
    await page.locator('#theme').click();
    await changeLanguage('es');
    assert.equal(await page.locator('#chess-clock-time-0').textContent(), '2:55', 'Rotation, theme and language retain the deadline');
    await page.locator('#focus-play').click();
    await openDisclosure(page, '#table-display-options');
    await page.locator('#clock-orientation').click();
    assert.equal(await page.locator('#chess-clock-time-0').textContent(), '2:55', 'Table presentation preserves the clock');
    await fits('Landscape clock fits');
    await page.keyboard.press('Escape');

    await visit('/es/truco/play/');
    await page.locator('#truco-name-0').fill('Ana y Camila');
    await page.locator('#truco-name-1').fill('Bruno y Diego');
    await page.locator('#truco-start').click();
    await page.locator('#truco-add-0-3').click();
    await page.locator('#truco-custom-1').fill('2');
    await page.setViewportSize({ width: 320, height: 844 });
    await changeLanguage('en');
    assert.equal(await page.locator('#truco-custom-1').inputValue(), '2', 'Score draft survives rotation and language');
    assert.match(await page.locator('[data-truco-side="0"] .truco-total').textContent(), /3 \/ 30/);
    await fits('Active portrait scoreboard fits');
    assert.deepEqual(errors, []);
    console.log('PASS: phone example/comparison state, enlarged text, reduced viewport search/focus, landscape clock deadlines and active score drafts.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => server.kill());
