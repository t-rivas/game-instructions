const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');
const { chromium, webkit } = require('playwright');
const { learningLesson, learningSetupOptions, openDisclosure } = require('./learning-navigation.cjs');
const catalog = require('../src/generated/catalog.json');
const server = spawn(process.execPath, ['scripts/serve-export.mjs'], { stdio: ['ignore', 'pipe', 'inherit'] });
const output = path.resolve('docs/control-review/after');
fs.mkdirSync(output, { recursive: true });
let checks = 0;
const check = (value, label) => { assert.ok(value, label); checks++; };
(async () => {
  const base = await new Promise((resolve, reject) => {
    server.stdout.once('data', data => resolve(data.toString().trim()));
    server.once('error', reject);
  });
  const engine = process.env.BROWSER || 'chromium';
  const browser = await { chromium, webkit }[engine].launch();
  const errors = [];
  const page = await browser.newPage({ viewport: { width: 320, height: 800 }, reducedMotion: 'reduce' });
  page.on('pageerror', error => errors.push(error.message));
  const visit = async route => {
    await page.goto(base + route);
    await page.waitForSelector('[data-tool=sources][data-ready=true]');
  };
  const shot = async (name, fullPage = false) => {
    if (fullPage) await page.evaluate(() => scrollTo(0, 0));
    return page.screenshot({ path: path.join(output, `${name}-${engine}.png`), animations: 'disabled', fullPage });
  };
  const fits = async root => {
    const problems = await page.locator(root).evaluate(node => {
      const issues = [];
      if (node.scrollWidth > node.clientWidth + 1) issues.push('container overflows');
      for (const control of node.querySelectorAll('button, input:not([type=checkbox]):not([type=radio]), select, textarea, summary')) {
        // WebKit retains layout boxes for controls inside closed native details.
        if (!control.getClientRects().length || control.matches('details:not([open]) > :not(summary), details:not([open]) > :not(summary) *')) continue;
        const rect = control.getBoundingClientRect();
        if (rect.height < 44) issues.push(`${control.id || control.className}: height ${rect.height}`);
        if (control.scrollWidth > control.clientWidth + 2) issues.push(`${control.id || control.className}: text clipped`);
      }
      return issues;
    });
    check(problems.length === 0, `${page.url()} ${root}: ${problems.join(', ')}`);
    check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'Page fits the viewport');
  };
  const focusIn = async id => check(await page.evaluate(id => document.activeElement?.closest('dialog')?.id === id, id), `Focus stays in ${id}`);
  try {
    for (const lang of ['es', 'en']) for (const game of Object.keys(catalog.games)) {
      await visit(`/${lang}/${game}/learn/`);
      await fits('main');
      await visit(`/${lang}/${game}/play/`);
      await fits('main');
    }
    for (const theme of ['light', 'dark']) for (const width of [320, 1440]) {
      await page.setViewportSize({ width, height: width === 320 ? 800 : 1000 });
      await visit('/es/coup/learn/');
      await page.evaluate(theme => document.documentElement.dataset.theme = theme, theme);
      const next = page.locator('#lesson-next');
      const selected = page.locator('#tab-learn');
      check(await next.evaluate((node, selectedId) => getComputedStyle(node).backgroundColor !== getComputedStyle(document.getElementById(selectedId)).backgroundColor, 'tab-learn'), 'Primary action differs from selected navigation');
      check(await selected.evaluate(node => getComputedStyle(node).boxShadow !== 'none' && getComputedStyle(node).borderTopColor !== 'rgba(0, 0, 0, 0)'), 'Selected tab has a visible border and inset indicator');
      await next.focus();
      // macOS WebKit uses Option+Tab to include buttons in page navigation.
      await page.keyboard.press(engine === 'webkit' ? 'Shift+Alt+Tab' : 'Shift+Tab');
      await page.keyboard.press(engine === 'webkit' ? 'Alt+Tab' : 'Tab');
      check(await next.evaluate(node => getComputedStyle(node).outlineStyle === 'solid' && getComputedStyle(node).outlineWidth === '3px'), 'Keyboard focus is clearly visible');
      check(await page.locator('#learning-tools .fold-hint').evaluate(node => node.getBoundingClientRect().right <= node.closest('summary').getBoundingClientRect().right - 40), 'Disclosure text leaves room for its expand indicator');
      await shot(`navigation-${theme}-${width}`, true);
      await learningSetupOptions(page);
      const toggle = page.getByRole('switch').first();
      const before = await toggle.getAttribute('aria-checked');
      await toggle.focus();
      await page.keyboard.press('Space');
      check(await toggle.getAttribute('aria-checked') !== before, 'Switch operates with Space');
      await fits('main');
      await shot(`switches-${theme}-${width}`, true);
      await learningLesson(page, 'basic-deal');
      await shot(`fields-checklist-${theme}-${width}`, true);

      await visit('/es/skull_king/play/');
      await page.evaluate(theme => document.documentElement.dataset.theme = theme, theme);
      await page.locator('#find-rule').focus();
      await page.keyboard.press('Enter');
      check(await page.locator('#rule-search-dialog').evaluate(node => node === document.activeElement), 'Search opens with input focus');
      await page.locator('#rule-search-dialog').fill('mermaid');
      await fits('#rule-dialog');
      await shot(`search-dialog-${theme}-${width}`);
      for (let i = 0; i < 12; i++) { await page.keyboard.press("Tab"); await focusIn("rule-dialog"); }
      for (let i = 0; i < 12; i++) { await page.keyboard.press("Shift+Tab"); await focusIn("rule-dialog"); }
      const result = page.locator('#rule-dialog .rule-search-result').first();
      await result.focus();
      await page.keyboard.press('Enter');
      check(await page.locator('#rule-preview-title').evaluate(node => node === document.activeElement), 'In-place preview receives focus');
      const url = page.url();
      const share = page.locator('.rule-preview-actions button');
      await share.focus();
      await page.keyboard.press('Enter');
      check(await page.locator('#copy-rule-link').evaluate(node => node === document.activeElement), 'Share opens with primary action focus');
      await fits('#share-dialog');
      await shot(`share-dialog-${theme}-${width}`);
      for (const key of ["Tab", "Shift+Tab"]) for (let i = 0; i < 8; i++) { await page.keyboard.press(key); await focusIn("share-dialog"); }
      await page.keyboard.press('Escape');
      await page.waitForFunction(() => document.activeElement?.matches('.rule-preview-actions button'));
      check(await share.evaluate(node => node === document.activeElement), 'Nested sharing returns focus to preview trigger');
      const art = page.locator('#rule-dialog [data-art="sk-mermaid"]');
      await art.focus();
      await page.keyboard.press('Enter');
      check(await page.locator('.image-close').evaluate(node => node === document.activeElement), 'Image opens with close action focus');
      await page.locator('#image-viewer img').evaluate(img => img.decode());
      check(await page.locator('#image-viewer img').evaluate(img => img.naturalWidth > 0), 'Enlarged image is loaded');
      await fits('#image-viewer');
      await shot(`image-dialog-${theme}-${width}`);
      for (const key of ["Tab", "Shift+Tab"]) for (let i = 0; i < 6; i++) { await page.keyboard.press(key); await focusIn("image-viewer"); }
      await page.keyboard.press('Escape');
      await page.waitForFunction(() => document.activeElement?.matches('[data-art="sk-mermaid"]'));
      check(await art.evaluate(node => node === document.activeElement), 'Nested image returns focus to its preview trigger');
      check(page.url() === url, 'Nested dialogs leave the address intact');
      await page.getByRole('button', { name: 'Volver a los resultados' }).click();
      await page.waitForFunction(() => document.activeElement?.classList.contains('rule-search-result'));
      check(await result.evaluate(node => node === document.activeElement), 'Back restores result focus');
      await page.keyboard.press('Escape');
      await page.waitForFunction(() => document.activeElement?.id === 'find-rule');
      check(await page.locator('#find-rule').evaluate(node => node === document.activeElement), 'Closing search restores opener focus');
    }
    await page.setViewportSize({ width: 320, height: 800 });
    await visit('/es/chess/play/');
    await page.locator('#focus-play').click();
    await fits('main');
    await shot('table-controls-320');
    await visit('/es/poker/play/');
    const minutes = page.locator('#poker-row-0-duration');
    await minutes.fill('0');
    await page.locator('#poker-timer-toggle').click();
    check(await minutes.getAttribute('aria-invalid') === 'true', 'Invalid field is identified');
    check(await minutes.evaluate(node => node === document.activeElement), 'Error puts focus on the invalid field');
    await fits('main');
    await page.locator('#poker-timer-error').scrollIntoViewIfNeeded();
    await shot('field-errors-320');

    // Hold platform operations to verify pending, success, and fallback feedback.
    await page.evaluate(() => {
      Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: () => new Promise(resolve => { window.finishCopy = resolve; }) } });
    });
    await openDisclosure(page, '#guide-actions');
    await page.locator('#share-guide').click();
    await page.locator('#copy-rule-link').click();
    check(await page.locator('#copy-rule-link').isDisabled(), 'Copy is disabled while pending');
    check(await page.locator('#copy-rule-link').getAttribute('aria-busy') === 'true', 'Pending copy is exposed to assistive technology');
    await shot('share-loading-320');
    await page.evaluate(() => window.finishCopy());
    await page.getByText('Enlace copiado', { exact: true }).waitFor();
    check(await page.locator('.share-feedback').getAttribute('data-tone') === 'success', 'Copy success has a persistent visible status');
    await shot('share-copied-320');
    await page.keyboard.press('Escape');
    await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: undefined }));
    await openDisclosure(page, '#guide-actions');
    await page.locator('#share-guide').click();
    await page.locator('#copy-rule-link').click();
    check(await page.locator('#share-link').evaluate(node => node === document.activeElement && node.selectionEnd === node.value.length), 'Clipboard fallback selects the entire link and places focus');
    await page.keyboard.press('Escape');
    check(errors.length === 0, errors.join('\n'));
    console.log(`Passed ${checks} control, mobile and nested focus checks (${engine}). Screenshots: ${output}`);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => server.kill());
