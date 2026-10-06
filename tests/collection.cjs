// Collection composition checks complement experience.cjs's history/filter tests.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { spawn } = require('node:child_process');
const { chromium, webkit } = require('playwright');
const server = spawn(process.execPath, ['scripts/serve-export.mjs']);
let checks = 0;
const failures = [];
const check = (value, message) => { checks++; if (!value) failures.push(message); };
(async () => {
  const base = await new Promise(resolve => server.stdout.once('data', data => resolve(data.toString().trim())));
  const browser = await (process.env.BROWSER === 'webkit' ? webkit : chromium).launch();
  try {
    for (const lang of ['en', 'es']) for (const theme of ['light', 'dark']) for (const width of [320, 390, 768, 1440]) {
      const label = `${lang}/${theme}/${width}`;
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      const errors = [];
      page.on('pageerror', e => errors.push(e.message));
      await page.addInitScript(theme => {
        if (!localStorage.getItem('tablefolk-preferences')) localStorage.setItem('tablefolk-preferences', JSON.stringify({ theme }));
      }, theme);
      await page.goto(`${base}/${lang}/`);
      await page.waitForFunction(() => JSON.parse(localStorage.getItem('tablefolk-preferences'))?.visited);
      await page.evaluate(() => document.fonts.ready);
      check(await page.locator('.game-card').count() === 15, `${label}: initial collection`);
      check(await page.locator('#game-search').evaluate(node => node.getBoundingClientRect().bottom < 600), `${label}: search within first phone viewport`);
      check(await page.locator('.game-card h3').first().evaluate(node => node.getBoundingClientRect().bottom < innerHeight), `${label}: first game title in viewport`);
      check(await page.locator('.hero-gallery').isVisible() === (width > 680), `${label}: compact mobile introduction`);
      for (const size of [16, 32]) {
        await page.evaluate(size => document.documentElement.style.fontSize = `${size}px`, size);
        const result = await page.evaluate(() => {
          const visible = node => node.getClientRects().length;
          return {
            overflow: document.documentElement.scrollWidth > innerWidth + 1,
            clipped: [...document.querySelectorAll('.game-card h3, .card-bottom a, .meta, .card-description, .collection-filters button')].filter(visible).filter(node => node.scrollWidth > node.clientWidth + 1).map(node => node.textContent),
            targets: [...document.querySelectorAll('.card-bottom a, .favorite-toggle, .collection-filters select')].every(node => node.getBoundingClientRect().height >= 44),
          };
        });
        check(!result.overflow && !result.clipped.length, `${label}/${size}px: reflow ${JSON.stringify(result)}`);
        check(result.targets, `${label}/${size}px: touch targets`);
      }
      await page.evaluate(() => document.documentElement.style.fontSize = '16px');
      // A paused session gives deterministic evidence of resume ordering and data preservation.
      await page.goto(`${base}/${lang}/chess/play/`);
      await page.waitForSelector('[data-tool=sources][data-ready=true]');
      await page.locator('#chess-clock-toggle').click();
      await page.locator('#chess-clock-toggle').click();
      const saved = await page.evaluate(() => localStorage.getItem('tablefolk-chess-clock'));
      await page.goto(`${base}/${lang}/`);
      await page.waitForSelector('.resume-link');
      check(await page.locator('.returning-hero').count() === 1, `${label}: compact returning heading`);
      check(await page.locator('.resume-link').evaluate(node => node.getBoundingClientRect().bottom < 600), `${label}: resume immediately reachable`);
      check(await page.locator('.hero-gallery').isHidden(), `${label}: returning gallery hidden`);
      check(await page.locator('.returning-hero').evaluate(node => node.getBoundingClientRect().height < 120), `${label}: returning intro height`);
      check(saved === await page.evaluate(() => localStorage.getItem('tablefolk-chess-clock')), `${label}: collection preserves saved session`);
      await page.locator('.resume-link').click();
      await page.waitForSelector('[data-tool=sources][data-ready=true]');
      check(page.url().endsWith('/chess/play/#active-table-tool'), `${label}: resume target`);
      check(!errors.length, `${label}: no browser errors ${errors}`);
      await page.close();
    }
    console.log('Collection layouts, enlarged text, and resume checked in both languages/themes at all four widths.');
    // Prerendered HTML remains useful even without JavaScript.
    const staticPage = await browser.newPage({ javaScriptEnabled: false });
    await staticPage.goto(base + '/en/');
    check(await staticPage.locator('.game-card').count() === 15, 'Initial HTML includes all 15 games');
    check(await staticPage.locator('.card-learn[href], .card-play[href]').count() === 30, 'Initial HTML includes working Learn/Play routes');
    check(await staticPage.locator('h1').innerText() === 'Learn the game.\nEnjoy the night.', 'Initial HTML explains purpose');
    await staticPage.close();
    console.log('Prerendered collection verified without JavaScript.');
    // Delay every image to verify that loading does not move the collection.
    for (const width of [390, 1440]) {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      let release;
      const gate = new Promise(resolve => release = resolve);
      await page.route('**/assets/responsive/**', async route => { await gate; await route.continue(); });
      await page.goto(base + '/en/', { waitUntil: 'domcontentloaded' });
      await page.waitForFunction(() => JSON.parse(localStorage.getItem('tablefolk-preferences'))?.visited);
      // WebKit's FontFaceSet.ready can wait for load, which the image gate holds.
      await page.evaluate(() => Promise.all([...document.fonts].map(font => font.load())));
      const geometry = () => page.locator('.hero, #collection, .game-card').evaluateAll(nodes => nodes.map(n => { const b = n.getBoundingClientRect(); return [b.x, b.y, b.width, b.height]; }));
      check(await page.locator('.game-card img').evaluateAll(images => images.every(img => img.hasAttribute('srcset') && img.hasAttribute('sizes') && img.getAttribute('loading') === 'lazy')), `${width}: responsive lazy collection images`);
      const before = await geometry();
      release();
      await page.locator('img:visible').evaluateAll(images => Promise.all(images.filter(img => img.getBoundingClientRect().top < innerHeight).map(img => { img.loading = "eager"; return img.decode(); })));
      check(JSON.stringify(before) === JSON.stringify(await geometry()), `${width}: image loading does not shift layout`);
      if (width === 390) check(await page.locator('.hero-gallery img').evaluateAll(images => images.every(img => img.currentSrc.startsWith('data:'))), 'Mobile does not download decorative hero artwork');
      await page.close();
    }
    fs.writeFileSync(`docs/collection-review/checks${process.env.BROWSER === 'webkit' ? '-webkit' : ''}.json`, JSON.stringify({ checks, failures }, null, 2) + '\n');
    assert.equal(failures.length, 0, JSON.stringify(failures, null, 2));
    console.log(`Collection: ${checks} composition, reflow, resume, static HTML, and image stability checks passed.`);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => server.kill());
