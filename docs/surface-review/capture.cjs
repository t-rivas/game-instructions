const { spawn } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const { learningLesson } = require('../../tests/learning-navigation.cjs');
const phase = process.argv[2] || 'after';
if (!['before', 'after'].includes(phase)) throw new Error('Expected before or after');
const server = spawn(process.execPath, ['scripts/serve-export.mjs'], { stdio: ['ignore', 'pipe', 'inherit'] });
const cases = [
  ['skull_king', 'card-sk-mermaid', 'card'], ['coup', 'card-coup-duke', 'card'],
  ['avalon', 'card-avalon-merlin', 'card'], ['catan', 'components', 'components'],
  ['skull_king', 'basic-trick', 'example'], ['coup', 'basic-challenge', 'example'],
  ['avalon', 'basic-quest', 'example'], ['catan', 'basic-settle', 'diagram'],
];
(async () => {
  const base = await new Promise(resolve => server.stdout.once('data', data => resolve(data.toString().trim())));
  const browser = await chromium.launch();
  const output = path.join(__dirname, phase); fs.mkdirSync(output, { recursive: true });
  try {
    for (const width of [390, 1440]) for (const theme of ['light', 'dark']) for (const [game, lesson, kind] of cases) {
      const page = await browser.newPage({ viewport: { width, height: 1000 }, reducedMotion: 'reduce' });
      try {
        await page.addInitScript(theme => localStorage.setItem('tablefolk-preferences', JSON.stringify({ theme })), theme);
        await page.goto(`${base}/es/${game}/learn/`);
        await page.waitForSelector('[data-tool=sources][data-ready=true]');
        await learningLesson(page, lesson);
        let target = page.locator('.lesson');
        if (kind === 'example') {
          target = page.locator('.lesson-comparison');
          await target.locator(':scope > summary').click();
          await target.locator('[data-comparison-reveal]').click();
        }
        await target.locator('img').evaluateAll(images => {
          for (const img of images) img.loading = 'eager';
          return Promise.all(images.map(img => img.decode().catch(() => {})));
        });
        await target.screenshot({ path: path.join(output, `${game}-${kind}-${theme}-${width}.png`), animations: 'disabled', style: 'header,.detail-controls,.skip-link{visibility:hidden!important}' });
        if (kind === 'card' || kind === 'components') {
          await page.evaluate(() => scrollTo(0, 0));
          await page.screenshot({ path: path.join(output, `${game}-page-${theme}-${width}.png`), animations: 'disabled' });
        }
      } finally { await page.close(); }
    }
    if (phase === 'after') for (const game of ['skull_king', 'coup', 'avalon', 'catan']) {
      const page = await browser.newPage({ viewport: { width: 320, height: 1000 } });
      try {
        await page.route('**/assets/responsive/**', route => route.abort());
        await page.goto(`${base}/es/${game}/learn/`);
        await page.waitForSelector('[data-tool=sources][data-ready=true]');
        await learningLesson(page, cases.find(row => row[0] === game)[1]);
        await page.locator('.lesson').screenshot({ path: path.join(output, `${game}-missing-320.png`), style: 'header,.detail-controls,.skip-link{visibility:hidden!important}' });
      } finally { await page.close(); }
    }
    console.log(`Surface screenshots: ${output}`);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => server.kill());
