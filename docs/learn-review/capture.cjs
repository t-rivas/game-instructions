// Use the built export (or TABLEFOLK_EXPORT_DIR) to refresh after screenshots.
const {spawn} = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const {chromium} = require('playwright');
const {learningContents, learningLesson, learningSetupOptions} = require('../../tests/learning-navigation.cjs');
const server = spawn(process.execPath, ['scripts/serve-export.mjs'], {stdio: ['ignore', 'pipe', 'inherit']});
(async () => {
  const base = await new Promise(resolve => server.stdout.once('data', data => resolve(data.toString().trim())));
  const browser = await chromium.launch({headless: true});
  const output = path.join(__dirname, 'after');
  fs.mkdirSync(output, {recursive: true});
  const capture = async (name, lang, game, width, arrange) => {
    const page = await browser.newPage({viewport: {width, height: 900}, reducedMotion: 'reduce'});
    try {
      await page.goto(`${base}/${lang}/${game}/learn/`);
      await page.waitForSelector('[data-tool=sources][data-ready=true]');
      await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
      if (arrange) await arrange(page);
      await page.screenshot({path: path.join(output, `${name}.png`), fullPage: true, animations: 'disabled'});
    } finally { await page.close(); }
  };
  try {
    for (const width of [320,390,768,1440]) for (const lang of ['en','es'])
      await capture(`${lang}-${width}`, lang, 'coup', width);
    await capture('contents-es-390', 'es', 'coup', 390, learningContents);
    await capture('options-en-390', 'en', 'coup', 390, learningSetupOptions);
    await capture('card-en-390', 'en', 'coup', 390, page => learningLesson(page, 'card-coup-duke'));
    await capture('practice-en-390', 'en', 'coup', 390, async page => {
      await learningLesson(page, 'basic-action');
      await page.locator('.lesson > .optional-practice > summary').click();
    });
    await capture('sushi-setup-es-320', 'es', 'sushi_go_party', 320, async page => {
      await learningSetupOptions(page);
      await page.locator('#guide-player-count').selectOption('8');
      await page.locator('#guide-setup-options > summary').click();
      await learningLesson(page, 'basic-deal');
    });
    await capture('avalon-setup-es-320', 'es', 'avalon', 320, async page => {
      await learningLesson(page, 'basic-roles');
      await page.locator('#players').selectOption('10');
      await page.locator('#avalon-mode').selectOption('optional');
    });
    await capture('chess-setup-en-768', 'en', 'chess', 768, page => learningLesson(page, 'basic-board'));
    await capture('catan-setup-es-1440', 'es', 'catan', 1440, page => learningLesson(page, 'basic-settle'));
    console.log(`Learn screenshots: ${output}`);
  } finally { await browser.close(); }
})().catch(error => {console.error(error); process.exitCode = 1;}).finally(() => server.kill());
