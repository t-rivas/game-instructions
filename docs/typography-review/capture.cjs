// Capture the same production screens before and after the typography update.
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const { learningLesson } = require('../../tests/learning-navigation.cjs');
const phase = process.argv[2] || 'after';
if (!['before', 'after'].includes(phase)) throw new Error('Expected before or after');
const server = spawn(process.execPath, ['scripts/serve-export.mjs'], { stdio: ['ignore', 'pipe', 'inherit'] });
(async () => {
  const base = await new Promise(resolve => server.stdout.once('data', data => resolve(data.toString().trim())));
  const browser = await chromium.launch({ headless: true });
  const output = path.join(__dirname, phase);
  fs.mkdirSync(output, { recursive: true });
  try {
    for (const width of (phase === 'before' ? [390, 1440] : [320, 390, 768, 1440])) for (const theme of ['light', 'dark']) {
      for (const screen of ['collection', 'card-lesson', 'full-rules', 'active-tool', 'rule-preview']) {
        const page = await browser.newPage({ viewport: { width, height: 1000 }, reducedMotion: 'reduce' });
        try {
          await page.addInitScript(theme => localStorage.setItem('tablefolk-preferences', JSON.stringify({ theme })), theme);
          const route = screen === 'collection' ? '/es/' : screen === 'card-lesson' || screen === 'rule-preview' ? '/es/coup/learn/' : screen === 'full-rules' ? '/es/burako/rules/' : '/es/chess/play/';
          await page.goto(base + route);
          if (screen !== 'collection') await page.waitForSelector('[data-tool=sources][data-ready=true]');
          else await page.waitForFunction(() => JSON.parse(localStorage.getItem('tablefolk-preferences')).visited);
          if (screen === 'card-lesson') await learningLesson(page, 'card-coup-duke');
          if (screen === 'active-tool') {
            await page.locator('#jump-to-tool').click();
            await page.locator('#chess-clock-toggle').click();
            await page.locator('#active-table-tool').scrollIntoViewIfNeeded();
          }
          if (screen === 'full-rules') {
            await page.locator('#expand-all').click();
            await page.locator('.rule-section').nth(2).scrollIntoViewIfNeeded();
          }
          if (screen === 'rule-preview') {
            await page.locator('.find-rule-button').first().click();
            await page.locator('.rule-dialog .common-questions a').first().click();
            await page.locator('.rule-preview').waitFor();
          }
          await page.evaluate(() => document.fonts.ready);
          await page.locator('img:visible').evaluateAll(images => Promise.all(images.filter(image => { const box = image.getBoundingClientRect(); return box.bottom > 0 && box.top < innerHeight; }).map(image => image.decode().catch(() => {}))));
          await page.screenshot({ path: path.join(output, `${screen}-${theme}-${width}.png`), animations: 'disabled' });
          if (screen === 'card-lesson') await page.locator('.lesson').screenshot({ path: path.join(output, `lesson-detail-${theme}-${width}.png`), animations: 'disabled' });
          if (screen === 'full-rules') await page.locator('.rule-section').nth(2).screenshot({ path: path.join(output, `reading-detail-${theme}-${width}.png`), animations: 'disabled' });
        } finally { await page.close(); }
      }
    }
    if (phase === 'after') for (const theme of ['light', 'dark']) {
      for (const screen of ['card-lesson', 'full-rules', 'active-tool', 'rule-preview']) {
        const page = await browser.newPage({ viewport: { width: 320, height: 1000 }, reducedMotion: 'reduce' });
        try {
          await page.addInitScript(theme => localStorage.setItem('tablefolk-preferences', JSON.stringify({ theme })), theme);
          const route = screen === 'full-rules' ? '/es/burako/rules/' : screen === 'active-tool' ? '/es/chess/play/' : '/es/coup/learn/';
          await page.goto(base + route);
          await page.waitForSelector('[data-tool=sources][data-ready=true]');
          if (screen === 'card-lesson') await learningLesson(page, 'card-coup-duke');
          if (screen === 'full-rules') await page.locator('#expand-all').click();
          if (screen === 'active-tool') await page.locator('#chess-clock-toggle').click();
          if (screen === 'rule-preview') {
            await page.locator('.find-rule-button').first().click();
            await page.locator('.rule-dialog .common-questions a').first().click();
          }
          await page.evaluate(() => document.documentElement.style.fontSize = '32px');
          // Detail captures omit pinned chrome; the responsive suite uses the real page.
          await page.addStyleTag({ content: '.site-shell :is(#header, .detail-controls, .skip-link) { display: none !important; }' });
          const selector = screen === 'card-lesson' ? '.lesson' : screen === 'full-rules' ? '.rule-section:nth-of-type(3)' : screen === 'active-tool' ? '#chess-clock' : '.rule-dialog';
          const target = screen === 'full-rules' ? page.locator('.rule-section').nth(2) : page.locator(selector);
          await target.scrollIntoViewIfNeeded();
          if (screen === 'rule-preview') await page.locator('#rule-preview-title').evaluate(node => node.scrollIntoView({ block: 'start' }));
          await target.screenshot({ path: path.join(output, `enlarged-${screen}-${theme}-320.png`), animations: 'disabled' });
        } finally { await page.close(); }
      }
    }
    console.log(`Screenshots: ${output}`);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => server.kill());
