// Repeatable captures of the hosted source build, before and after the phone redesign.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const { chromium } = require('playwright');
const { learningLesson, learningExample } = require('./learning-navigation.cjs');
const phase = process.env.REVIEW_PHASE || 'after';
const output = path.resolve('docs/mobile-review', phase);
fs.mkdirSync(output, { recursive: true });
const server = spawn(process.execPath, ['scripts/serve-export.mjs'], { stdio: ['ignore', 'pipe', 'inherit'] });
const profiles = [
  ['en', 'dark', 390], ['es', 'light', 320],
  ['en', 'light', 320], ['es', 'dark', 390],
  ['es', 'light', 768], ['en', 'dark', 1440], ['es', 'light', 1440],
];
(async () => {
  const base = await new Promise(resolve => server.stdout.once('data', data => resolve(data.toString().trim())));
  const browser = await chromium.launch();
  const errors = [];
  try {
    for (const [lang, theme, width] of profiles) {
      const context = await browser.newContext({ viewport: { width, height: width < 768 ? 844 : 1000 }, reducedMotion: 'reduce' });
      await context.addInitScript(({ lang, theme }) => {
        if (!localStorage.getItem('review-seeded')) {
          localStorage.setItem('tablefolk-preferences', JSON.stringify({ lang, theme }));
          localStorage.setItem('review-seeded', 'true');
        }
      }, { lang, theme });
      const page = await context.newPage();
      page.on('pageerror', error => errors.push(error.message));
      const visit = async (game, view = 'learn') => {
        await page.goto(`${base}/${lang}/${game}/${view}/`);
        await page.waitForSelector('[data-tool=sources][data-ready=true]', { state: 'attached' });
      };
      const shot = async (name, selector) => {
        await page.evaluate(() => document.fonts.ready);
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${phase}/${lang}/${theme}/${width}/${name}: page fits`);
        const options = { path: path.join(output, `${lang}-${theme}-${width}-${name}.png`), animations: 'disabled' };
        if (selector) await page.locator(selector).screenshot({ ...options, style: '#header,.detail-controls,.skip-link{visibility:hidden!important}' });
        else await page.screenshot(options);
      };
      await page.goto(`${base}/${lang}/`);
      await page.waitForSelector('.game-card');
      await shot('collection');
      await visit('coup');
      await learningLesson(page, 'card-coup-duke');
      await page.evaluate(() => scrollTo(0, 0));
      await shot('learn');
      await visit('skull_king');
      await learningExample(page);
      await page.locator('[data-watch-next]').click();
      await page.locator('[data-watch-next]').click();
      await shot('example', '[data-watch-turn]');
      await page.locator('[data-watch-next]').click();
      await page.locator('[data-watch-next]').click();
      await shot('example-outcome', '[data-watch-turn]');
      await learningLesson(page, 'basic-trick');
      const comparison = page.locator('[data-comparison=mermaid-king]');
      await comparison.locator('summary').click();
      await comparison.locator('[data-comparison-reveal]').click();
      await shot('comparison', '[data-comparison=mermaid-king]');
      await visit('monopoly', 'play');
      await page.locator('#find-rule').click();
      await page.locator('#rule-search-dialog').fill(lang === 'es' ? 'subasta' : 'auction');
      await shot('search');
      await page.keyboard.press('Escape');
      await visit('chess', 'play');
      await page.locator('#chess-clock-toggle').click();
      await page.locator('#chess-clock-toggle').click();
      await shot('clock', '#chess-clock');
      if (phase === 'after') {
        await page.locator('#chess-clock-toggle').click();
        const before = await page.locator('.chess-clock-player.is-active').getAttribute('id');
        await page.setViewportSize({ width: 844, height: 390 });
        await page.locator('#theme').click();
        const other = lang === 'en' ? 'es' : 'en';
        await page.locator(`#lang-${other}`).click();
        await page.waitForURL(`${base}/${other}/chess/play/`);
        await page.waitForSelector('[data-tool=play][data-ready=true]');
        assert.equal(await page.locator('.chess-clock-player.is-active').getAttribute('id'), before, 'Rotation and language preserve the running clock');
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'Landscape clock fits');
      }
      await context.close();
      console.log(`${phase}: ${lang}/${theme}/${width} captures complete`);
    }
    assert.deepEqual(errors, [], 'No browser errors');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => server.kill());
