const assert = require('node:assert/strict');
const fs = require('node:fs');
const { spawn } = require('node:child_process');
const { chromium } = require('playwright');
const { learningLesson } = require('./learning-navigation.cjs');
const catalog = require('../src/generated/catalog.json');
const server = spawn(process.execPath, ['scripts/serve-export.mjs'], { stdio: ['ignore', 'pipe', 'inherit'] });
let checks = 0;
const failures = [];
function check(value, message) { checks++; if (!value) failures.push(message); }
const cases = [['skull_king', 'card-sk-mermaid'], ['coup', 'card-coup-duke'], ['avalon', 'card-avalon-merlin'], ['catan', 'components']];
(async () => {
  const base = await new Promise(resolve => server.stdout.once('data', data => resolve(data.toString().trim())));
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ reducedMotion: 'reduce' });
    for (const game of ['library', ...Object.keys(catalog.games)]) {
      await page.goto(base + (game === 'library' ? '/es/' : `/es/${game}/learn/`));
      if (game !== 'library') await page.waitForSelector('[data-tool=sources][data-ready=true]');
      for (const theme of ['light', 'dark']) {
        await page.evaluate(theme => document.documentElement.dataset.theme = theme, theme);
        const ratios = await page.locator('.site-shell').evaluate(node => {
          const style = getComputedStyle(node);
          const canvas = document.createElement('canvas'); canvas.width = canvas.height = 1;
          const ctx = canvas.getContext('2d');
          const color = name => { ctx.clearRect(0, 0, 1, 1); ctx.fillStyle = style.getPropertyValue(name).trim(); ctx.fillRect(0, 0, 1, 1); return [...ctx.getImageData(0, 0, 1, 1).data].slice(0, 3); };
          const luminance = rgb => rgb.map(c => { c /= 255; return c <= .04045 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4; }).reduce((a, c, i) => a + c * [.2126, .7152, .0722][i], 0);
          const contrast = (a, b) => { const x = luminance(color(a)), y = luminance(color(b)); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); };
          const result = [];
          for (const surface of ['--surface-page', '--surface-reading', '--surface-group']) {
            for (const text of ['--text', '--muted', '--accent']) result.push([`${text}/${surface}`, contrast(text, surface), 4.5]);
            for (const indicator of ['--border-control', '--focus-ring']) result.push([`${indicator}/${surface}`, contrast(indicator, surface), 3]);
          }
          result.push(['primary action', contrast('--on-accent', '--accent'), 4.5]);
          result.push(['art mount text', contrast('--surface-art-text', '--surface-art'), 4.5]);
          result.push(['art frame', contrast('--surface-art-border', '--surface-art'), 3]);
          return result;
        });
        for (const [pair, ratio, required] of ratios) check(ratio >= required, `${game}/${theme}/${pair}: ${ratio.toFixed(2)} < ${required}`);
      }
    }
    console.log('All game palettes checked in both themes.');
    for (const [game, lesson] of cases) for (const lang of ['es', 'en']) {
      await page.goto(`${base}/${lang}/${game}/learn/`); await page.waitForSelector('[data-tool=sources][data-ready=true]');
      await learningLesson(page, lesson);
      const frame = page.locator('.lesson-card-art:visible').first();
      await frame.locator('img').evaluate(img => { img.loading = 'eager'; return img.decode(); });
      for (const theme of ['light', 'dark']) for (const width of [320, 390, 768, 1440]) {
        await page.setViewportSize({ width, height: 1000 });
        await page.evaluate(theme => document.documentElement.dataset.theme = theme, theme);
        const metrics = await frame.locator('img').evaluate(img => {
          const r = img.getBoundingClientRect(), style = getComputedStyle(img);
          return { natural: img.naturalWidth / img.naturalHeight, rendered: r.width / r.height, fit: style.objectFit, filter: style.filter, opacity: style.opacity, width: r.width };
        });
        check(Math.abs(metrics.rendered - metrics.natural) < .02 && metrics.fit === 'contain', `${lang}/${game}/${theme}/${width}: entire artwork preserves its ratio`);
        check(metrics.filter === 'none' && metrics.opacity === '1', `${game}: artwork is not recolored`);
        check(metrics.width >= (width < 680 ? 100 : 140), `${game}/${width}: lead artwork is prominent`);
        check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${game}/${width}: page fits`);
        check(await frame.locator('.art-enlarge').isVisible(), `${game}: enlargement affordance is visible`);
      }
      await frame.focus(); await page.keyboard.press('Enter');
      await page.waitForSelector('#image-viewer[open]'); await page.keyboard.press('Escape');
      check(await frame.evaluate(node => node === document.activeElement), `${game}: existing viewer restores focus`);
      await page.emulateMedia({ forcedColors: 'active' });
      await frame.focus();
      check(await frame.evaluate(node => parseFloat(getComputedStyle(node).outlineWidth) >= 2), `${game}: keyboard focus survives forced colors`);
      check((await page.locator('.lesson').innerText()).length > 50, `${game}: text retains the explanation without color`);
      await page.emulateMedia({ forcedColors: 'none' });
    }
    const broken = await browser.newPage({ viewport: { width: 320, height: 1000 } });
    await broken.route('**/assets/responsive/**', route => route.abort());
    for (const [game, lesson] of cases) {
      await broken.goto(`${base}/es/${game}/learn/`); await broken.waitForSelector('[data-tool=sources][data-ready=true]');
      await learningLesson(broken, lesson);
      const frame = broken.locator('.lesson-card-art:visible').first();
      await frame.scrollIntoViewIfNeeded();
      await frame.locator('img[hidden]').waitFor({ state: 'attached' });
      check(await frame.locator('.art-fallback').isVisible(), `${game}: missing image has a useful localized fallback`);
      check((await broken.locator('.lesson-copy').innerText()).trim().length > 3, `${game}: lesson name survives failed artwork`);
      check((await broken.locator('.lesson').innerText()).includes('Imagen no disponible'), `${game}: missing-image status is visible`);
      check(await broken.locator('#lesson-next').isVisible(), `${game}: failed image does not block next action`);
    }
    await broken.close();
    fs.writeFileSync('docs/surface-review/checks.json', JSON.stringify({ checks, failures }, null, 2) + '\n');
    assert.equal(failures.length, 0, JSON.stringify(failures, null, 2));
    console.log(`Surfaces: ${checks} contrast, artwork, reflow, viewer, forced-color, and missing-image checks passed.`);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => server.kill());
