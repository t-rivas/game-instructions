// Run against the production export. Capture before only prior to editing.
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const phase = process.argv[2] || 'after';
if (!['before', 'after'].includes(phase)) throw Error('Expected before or after');
const server = spawn(process.execPath, ['scripts/serve-export.mjs'], { stdio: ['ignore', 'pipe', 'inherit'] });
(async () => {
  const base = await new Promise(resolve => server.stdout.once('data', data => resolve(data.toString().trim())));
  const browser = await chromium.launch();
  const output = path.join(__dirname, phase);
  fs.mkdirSync(output, { recursive: true });
  try {
    for (const width of [320, 390, 768, 1440]) for (const lang of ['en', 'es']) for (const theme of ['light', 'dark']) {
      for (const returning of [false, true]) {
        const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
        try {
          await page.addInitScript(({ theme, returning }) => {
            if (!localStorage.getItem('tablefolk-preferences')) localStorage.setItem('tablefolk-preferences', JSON.stringify({ theme, visited: returning }));
          }, { theme, returning });
          if (returning) {
            await page.goto(`${base}/${lang}/chess/play/`);
            await page.waitForSelector('[data-tool=sources][data-ready=true]');
            await page.locator('#chess-clock-toggle').click();
            await page.locator('#chess-clock-toggle').click();
          }
          await page.goto(`${base}/${lang}/`);
          await page.waitForFunction(() => JSON.parse(localStorage.getItem('tablefolk-preferences')).visited);
          if (returning) await page.waitForSelector('.resume-link');
          await page.evaluate(() => document.fonts.ready);
          await page.locator('img:visible').evaluateAll(images => Promise.all(images.filter(img => img.getBoundingClientRect().top < innerHeight).map(img => img.decode().catch(() => {}))));
          const name = `${returning ? 'returning' : 'new'}-${lang}-${theme}-${width}`;
          await page.screenshot({ path: path.join(output, `${name}-viewport.png`), animations: 'disabled' });
          // Real scrolling loads each lazy image before the full-page capture.
          for (const card of await page.locator('.game-card').all()) await card.scrollIntoViewIfNeeded();
          await page.locator('img:visible').evaluateAll(images => Promise.all(images.map(img => img.decode().catch(() => {}))));
          await page.evaluate(() => scrollTo(0, 0));
          await page.screenshot({ path: path.join(output, `${name}-full.png`), fullPage: true, animations: 'disabled' });
        } finally { await page.close(); }
      }
    }
    console.log(`Screenshots: ${output}`);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => server.kill());
