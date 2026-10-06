const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { spawn } = require('node:child_process');
const { chromium } = require('playwright');
const { learningExample } = require('./learning-navigation.cjs');
const root = path.resolve(__dirname, '..');
const server = spawn(process.execPath, ['scripts/serve-export.mjs'], {cwd:root, stdio:['ignore','pipe','inherit']});
const output = process.env.WATCH_SCREENSHOTS || fs.mkdtempSync(path.join(os.tmpdir(), 'tablefolk-watch-turn-'));
fs.mkdirSync(output, {recursive:true});
(async () => {
  const base = await new Promise(resolve => server.stdout.once('data', chunk => resolve(chunk.toString().trim())));
  const browser = await chromium.launch();
  try {
    for (const lang of ['en','es']) for (const theme of ['dark','light']) {
      const context = await browser.newContext({viewport:{width:390,height:900}, reducedMotion:'reduce'});
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      async function open(game) {
        await page.goto(`${base}/${lang}/${game}/learn/`);
        await page.waitForSelector('[data-tool=sources][data-ready=true]', {state:'attached'});
        await learningExample(page);
        if (await page.locator('html').getAttribute('data-theme') !== theme) await page.locator('#theme').click();
      }
      async function shot(name) {
        const table = page.locator('[data-watch-turn]');
        assert.equal(await table.evaluate(el => el.scrollWidth > el.clientWidth + 1), false, `${name}: table fits`);
        const viewport = page.viewportSize();
        // Keep the complete table in the capture viewport, including long translated captions.
        await page.setViewportSize({...viewport, height:Math.max(viewport.height, Math.ceil((await table.boundingBox()).height) + 360)});
        await table.screenshot({path:path.join(output, `${lang}-${theme}-${name}.png`), style:'header,.detail-controls,.skip-link{visibility:hidden!important}'});
        await page.setViewportSize(viewport);
      }
      await open('skull_king');
      const baseline = await page.evaluate(() => JSON.stringify(Object.fromEntries(Object.entries(localStorage))));
      await shot('skull-start');
      await page.locator('[data-watch-next]').focus(); await page.keyboard.press('Enter');
      assert.equal(await page.locator('.trick-play[data-played=true]').count(), 1);
      assert.equal(await page.locator('.watch-played-card').evaluate(el=>getComputedStyle(el).animationName),'none','Reduced motion presents the state immediately');
      await page.locator('[data-watch-next]').click(); await shot('skull-legal');
      await page.locator('[data-watch-next]').click(); await page.locator('[data-watch-next]').click();
      assert.equal(await page.locator('.trick-play[data-winner=true]').getAttribute('data-player'), '2');
      await shot('skull-numbered-winner');
      await page.locator('[data-watch-next]').click();
      const final = await page.locator('[data-watch-turn]').innerText();
      await page.locator('[data-watch-previous]').click(); await page.locator('[data-watch-next]').click();
      assert.equal(await page.locator('[data-watch-turn]').innerText(), final, 'Backward/forward is deterministic');
      await page.selectOption('#trick-example','three-characters');
      await page.locator('[data-watch-next]').evaluate(button => { for(let i=0;i<12;i++) button.click(); });
      assert.equal(await page.locator('[data-watch-beat]').getAttribute('data-watch-beat'), '5', 'Rapid clicks clamp to final state');
      await shot('skull-exception');
      await page.locator('[data-watch-previous]').click(); await shot('skull-exception-winner');
      if(await page.locator('.watch-history-toggle').isVisible())await page.locator('.watch-history-toggle').click();
      await page.locator('.trick-play [data-art]').first().focus(); await page.keyboard.press('Enter');
      assert.equal(await page.locator('#image-viewer[open]').count(),1);
      await page.keyboard.press('Escape');
      await page.locator('[data-watch-replay]').click();
      assert.equal(await page.locator('.trick-play[data-played=true]').count(),0);
      assert.equal(await page.evaluate(() => JSON.stringify(Object.fromEntries(Object.entries(localStorage)))), baseline, 'Watch controls never change preferences or live state');
      await open('coup');
      async function choice(id) {await page.locator(`[data-coup-choice=${id}]`).click();}
      await choice('tax-challenge'); await choice('tax-proof'); await shot('coup-proof');
      await choice('tax-true'); await shot('coup-replacement');
      assert.equal(await page.locator('[data-coup-proof]').count(),0);
      assert.equal(await page.locator('.coup-hidden').count(),5);
      const coupFinal = await page.locator('.coup-public-table').innerText();
      await page.locator('[data-coup-back]').click(); await choice('tax-true');
      assert.equal(await page.locator('.coup-public-table').innerText(),coupFinal);
      await page.locator('[data-coup-example=assassination]').click();
      await page.locator('[data-coup-choice=assassin-response]').evaluate(button => {button.click();button.click();button.click();});
      assert.equal(await page.locator('.coup-scene').getAttribute('data-coup-node'),'assassin-response');
      await shot('coup-payment');
      await choice('assassin-challenge'); await choice('assassin-proof'); await choice('assassin-after-proof'); await choice('assassin-double');
      await shot('coup-elimination');
      assert.match(await page.locator('.coup-outcome').innerText(), /Cami/);
      await open('avalon');
      await shot('avalon-team');
      await page.locator('[data-avalon-next]').click();
      assert.equal(await page.locator('[data-avalon-next]').isDisabled(),true);
      await page.locator('[data-avalon-votes]').click(); await shot('avalon-vote');
      await page.locator('[data-avalon-next]').click(); await shot('avalon-secret');
      assert.equal(await page.locator('[data-avalon-card]').count(),0);
      await page.locator('[data-avalon-next]').click(); await shot('avalon-result');
      assert.equal(await page.locator('.avalon-result-cards [data-avalon-team-seat]').count(),0);
      await page.locator('[data-avalon-next]').click(); await page.locator('[data-avalon-ending=hit]').click(); await shot('avalon-assassination');
      assert.equal(await page.locator('[data-watch-turn] [data-avalon-role]').count(),0, 'Recognition stays outside public table');
      for (const game of ['skull_king','coup','avalon']) {
        await open(game);
        if(game === 'skull_king') {await page.locator('[data-watch-next]').click();await page.locator('[data-watch-next]').click();}
        const selector = game === 'skull_king' ? '[data-watch-beat]' : game === 'coup' ? '[data-coup-node]' : '[data-avalon-stage]';
        const attribute = game === 'skull_king' ? 'data-watch-beat' : game === 'coup' ? 'data-coup-node' : 'data-avalon-stage';
        const state = await page.locator(selector).getAttribute(attribute);
        const other = lang === 'en' ? 'es' : 'en';
        await page.goto(`${base}/${other}/${game}/rules/`);
        await page.goto(`${base}/${other}/${game}/learn/`);
        await page.waitForSelector('[data-tool=sources][data-ready=true]', {state:'attached'}); await learningExample(page);
        assert.equal(await page.locator(selector).getAttribute(attribute),state,'Language/view navigation preserves the example');
        for (const width of [320,768,1440]) {
          await page.setViewportSize({width,height:900});
          assert.equal(await page.locator('[data-watch-turn]').evaluate(el=>el.scrollWidth>el.clientWidth+1),false, `${game} fits ${width}`);
        }
      }
      await page.emulateMedia({reducedMotion:'no-preference'});
      await open('skull_king');
      await page.locator('[data-watch-replay]').click();
      await page.locator('[data-watch-next]').click();
      await page.locator('[data-watch-previous]').click();
      assert.equal(await page.locator('.trick-play[data-played=true]').count(),0,'Previous works during card movement');
      assert.deepEqual(errors,[]);
      await context.close();
    }
    console.log(`PASS: turn states, rapid input, deterministic navigation, privacy, storage isolation, zoom, keyboard, reduced motion, language/view persistence and responsive tables. Screenshots: ${output}`);
  } finally {await browser.close();server.kill();}
})().catch(error=>{console.error(error);server.kill();process.exitCode=1;});
