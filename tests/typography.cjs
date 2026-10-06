// Production typography, reflow, and game-layout checks.
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const { learningLesson } = require('./learning-navigation.cjs');
const catalog = require('../src/generated/catalog.json');
const server = spawn(process.execPath, ['scripts/serve-export.mjs'], { stdio: ['ignore', 'pipe', 'inherit'] });
let checks = 0;
const failures = [];
(async () => {
  const base = await new Promise(resolve => server.stdout.once('data', data => resolve(data.toString().trim())));
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ reducedMotion: 'reduce' });
  async function reflow(label) {
    const result = await page.evaluate(() => {
      const visible = node => node.getClientRects().length && getComputedStyle(node).visibility !== 'hidden';
      const copy = [...document.querySelectorAll('.lesson-copy > p, .lesson-card-copy p, .rule-body > p')].filter(visible);
      const unreadable = copy.filter(node => {
        const style = getComputedStyle(node);
        return parseFloat(style.fontSize) < parseFloat(getComputedStyle(document.documentElement).fontSize) || parseFloat(style.lineHeight) / parseFloat(style.fontSize) < 1.6;
      }).map(node => node.className || node.tagName);
      const canvas = document.createElement('canvas').getContext('2d');
      const brokenLabels = [...document.querySelectorAll('.tabs button')].filter(visible).filter(node => {
        const style = getComputedStyle(node);
        canvas.font = style.font;
        const available = node.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
        return node.textContent.trim().split(/\s+/).some(word => canvas.measureText(word).width > available + 2);
      }).map(node => node.textContent);
      const overflow = document.documentElement.scrollWidth > innerWidth + 1;
      const wide = [...document.querySelectorAll('main *')].filter(visible).filter(node => {
        const rect = node.getBoundingClientRect();
        return rect.width > 2 && (rect.right > innerWidth + 2 || rect.left < -2) && !node.closest('.skull-history, .moth-history, .coup-standings, .score-table-wrap, .table-scroll, .skull-score-table, .poker-schedule-wrap');
      }).slice(0, 8).map(node => `${node.tagName}.${node.className}#${node.id}`);
      return { overflow, unreadable, brokenLabels, wide };
    });
    checks++;
    if (result.overflow || result.unreadable.length || result.brokenLabels.length) failures.push({ label, ...result });
  }
  try {
    for (const lang of ['es', 'en']) {
      for (const game of Object.keys(catalog.games)) for (const view of ['learn', 'play', 'rules']) {
        await page.goto(`${base}/${lang}/${game}/${view}/`);
        await page.waitForSelector('[data-tool=sources][data-ready=true]');
        if (view === 'rules') await page.locator('#expand-all').click();
        for (const theme of ['light', 'dark']) {
          await page.evaluate(theme => document.documentElement.dataset.theme = theme, theme);
          for (const width of [320, 390, 768, 1440]) {
            await page.setViewportSize({ width, height: 1000 });
            await reflow(`${lang}/${game}/${view}/${theme}/${width}`);
          }
        }
      }
      console.log(`${lang}: all 15 games, 3 views, 2 themes, 4 widths checked`);
    }
    // Stress long Spanish explanations and controls at 200% default text size.
    await page.evaluate(() => localStorage.clear());
    for (const route of ['/es/', '/es/coup/learn/', '/es/burako/rules/', ...['coup', 'moth', 'skull_king', 'truco', 'chess', 'poker', 'avalon', 'sushi_go_party'].map(game => `/es/${game}/play/`)]) {
      await page.goto(base + route);
      if (route !== '/es/') await page.waitForSelector('[data-tool=sources][data-ready=true]');
      if (route.includes('/coup/learn')) await learningLesson(page, 'card-coup-duke');
      if (route.includes('/rules/')) await page.locator('#expand-all').click();
      if (route.includes('/chess/play')) await page.locator('#chess-clock-toggle').click();
      for (const theme of ['light', 'dark']) for (const width of [320, 390, 768, 1440]) {
        await page.setViewportSize({ width, height: 1000 });
        await page.evaluate(theme => { document.documentElement.dataset.theme = theme; document.documentElement.style.fontSize = '32px'; }, theme);
        await reflow(`200%/${route}/${theme}/${width}`);
      }
    }
    await page.goto(base + '/es/coup/learn/');
    await page.waitForSelector('[data-tool=sources][data-ready=true]');
    await page.locator('.find-rule-button').first().click();
    await page.locator('.rule-dialog .common-questions a').first().click();
    for (const size of [16, 32]) for (const width of [320, 390, 768, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.evaluate(size => document.documentElement.style.fontSize = `${size}px`, size);
      const metrics = await page.locator('.rule-dialog').evaluate(node => ({ width: node.clientWidth, scroll: node.scrollWidth, paragraph: getComputedStyle(node.querySelector('.rule-body p')).fontSize }));
      checks++;
      if (metrics.scroll > metrics.width + 1 || parseFloat(metrics.paragraph) < size) failures.push({ label: `preview/${size}/${width}`, ...metrics });
    }
    fs.mkdirSync(path.join(__dirname, '../docs/typography-review'), { recursive: true });
    fs.writeFileSync(path.join(__dirname, '../docs/typography-review/checks.json'), JSON.stringify({ checks, failures }, null, 2) + '\n');
    assert.equal(failures.length, 0, JSON.stringify(failures, null, 2));
    console.log(`Typography: ${checks} responsive checks passed, including 200% text and rule previews.`);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => server.kill());
