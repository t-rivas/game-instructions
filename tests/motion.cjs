const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');
const { chromium, webkit } = require('playwright');
const { learningLesson } = require('./learning-navigation.cjs');
const server = spawn(process.execPath, ['scripts/serve-export.mjs'], {stdio:['ignore','pipe','inherit']});
const output = path.resolve('docs/motion-review');
let checks = 0;
const check = (value, message) => { assert.ok(value, message); checks++; };
const frames = page => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
const ready = page => page.waitForSelector('[data-tool=sources][data-ready=true]');
const settled = page => page.waitForFunction(() => document.getAnimations().every(a => a.playState !== 'running'));
const focus = (page, selector) => page.waitForFunction(selector => document.activeElement?.matches(selector), selector);
async function preview(page) {
  await page.locator('#find-rule').click();
  await page.locator('#rule-search-dialog').fill('mermaid');
  await page.locator('#rule-dialog .rule-search-result').first().click();
  await focus(page, '#rule-preview-title');
}
(async () => {
  const base = await new Promise(resolve => server.stdout.once('data', data => resolve(data.toString().trim())));
  const engine = process.env.BROWSER || 'chromium';
  const browser = await {chromium, webkit}[engine].launch();
  const errors = [];
  try {
    if(process.env.MOTION_RECORDINGS !== 'only') {
    for (const motion of ['no-preference','reduce']) {
      const context = await browser.newContext({viewport:{width:320,height:844}, reducedMotion:motion});
      await context.addInitScript(() => {
        window.__motionCalls = []; window.__motionAnimations = [];
        const original = Element.prototype.animate;
        Element.prototype.animate = function(keyframes, options) {
          window.__motionCalls.push({className:this.className, id:this.id, keyframes, duration:options.duration});
          const animation = original.call(this, keyframes, options);
          window.__motionAnimations.push(animation); return animation;
        };
      });
      const page = await context.newPage();
      page.on('pageerror', error => errors.push(error.message));
      await page.goto(`${base}/es/skull_king/learn/`); await ready(page);
      await settled(page);
      await page.evaluate(() => { window.__lesson = document.querySelector('.lesson'); window.__tool = document.querySelector('#skull-trick-lesson'); });
      await page.locator('#lesson-next').focus(); await page.keyboard.press('Enter');
      await focus(page, '.lesson-copy h3');
      check(await page.locator('.lesson').getAttribute('data-learning-step') === 'components', `${motion}: step commits immediately`);
      if (motion === 'no-preference') {
        check(await page.evaluate(() => window.__motionCalls.some(c => c.className === 'lesson-copy' && c.duration === 180 && !c.keyframes[0].transform)), 'Text receives a finite fade without movement');
        // Pause an in-flight effect so the preference change is tested deterministically.
        await page.evaluate(() => window.__motionAnimations.filter(a => a.playState === 'running').forEach(a => a.pause()));
        await page.emulateMedia({reducedMotion:'reduce'});
        await page.waitForFunction(() => window.__motionAnimations.every(a => a.playState === 'idle' || a.playState === 'finished'));
        check(true, 'Switching to reduced motion cancels an in-flight step effect');
        await page.emulateMedia({reducedMotion:motion});
      }
      for (let i=0; i<6; i++) {
        await page.locator('#lesson-next').evaluate(node => node.click()); await frames(page);
        await page.locator('#lesson-prev').evaluate(node => node.click()); await frames(page);
      }
      check(await page.evaluate(() => window.__lesson === document.querySelector('.lesson') && window.__tool === document.querySelector('#skull-trick-lesson')), 'Step changes retain the lesson and teaching tool instances');
      await learningLesson(page, 'example');
      await page.locator('[data-watch-next]').click();
      check(await page.locator('.watch-played-card').first().evaluate((node,motion) => getComputedStyle(node).animationDuration === (motion === 'reduce' ? '0s' : '0.38s'), motion), `${motion}: authored teaching timing is preserved`);
      await page.locator('[data-watch-previous]').click();
      check(await page.locator('.trick-play[data-played=true]').count() === 0, 'Backward navigation during teaching motion restores the exact state');
      await page.locator('[data-watch-next]').evaluate(node => { for(let i=0;i<12;i++) node.click(); });
      await frames(page);
      await page.locator('[data-watch-replay]').click();
      check(await page.locator('.trick-play[data-played=true]').count() === 0, 'Replay clears a rapid sequence');
      await learningLesson(page, 'basic-score');
      await page.selectOption('#scoring-fact','1');
      const changed = await page.locator('.scoring-outcome').innerText();
      check(await page.locator('#scoring-fact').inputValue() === '1', 'Result and fact agree during feedback');
      await page.locator('#scoring-replay').click();
      check(await page.locator('.scoring-outcome').innerText() !== changed, 'Replay restores the result immediately');
      await focus(page, '#scoring-heading');
      await page.selectOption('#scoring-fact','1');
      await learningLesson(page, 'objective'); await learningLesson(page, 'basic-score');
      check(await page.locator('#scoring-fact').inputValue() === '1', 'Lesson navigation preserves scoring example state');
      const practice = page.locator('.optional-practice').filter({has:page.locator('[data-practice-option]')});
      await practice.locator(':scope > summary').click();
      await practice.locator('[data-practice-option]').first().click();
      await practice.locator('[data-practice-option]').last().click();
      check(await practice.locator('[data-practice-option]').last().getAttribute('aria-pressed') === 'true', 'Rapid choice changes show the final selection');
      if (motion === 'no-preference') check(await page.evaluate(() => ['scoring-outcome','practice-feedback'].every(name => window.__motionCalls.some(c => c.className === name))), 'Result and practice changes use the shared finite feedback');
      else check(await page.evaluate(() => window.__motionCalls.length === 0), 'Reduced learning and results create no scripted effects');
      await page.reload(); await ready(page); await learningLesson(page, 'basic-score');
      check(await page.locator('#scoring-fact').inputValue() === '1', 'Feedback motion leaves recovered lesson state intact');

      await page.goto(`${base}/es/skull_king/play/`); await ready(page);
      const storage = await page.evaluate(() => JSON.stringify(Object.fromEntries(Object.entries(localStorage))));
      await page.locator('#find-rule').evaluate(node => node.click()); await frames(page);
      check(await page.locator('#rule-dialog').evaluate((node,motion) => node.getAnimations().some(a=>a.transitionProperty === 'opacity') === (motion === 'no-preference'),motion), `${motion}: dialog entry actually fades or is immediate`);
      await focus(page,'#rule-search-dialog');
      await page.locator('#rule-search-dialog').fill('mermaid');
      await page.locator('#rule-dialog .rule-search-result').first().click(); await focus(page,'#rule-preview-title');
      check(await page.locator('#rule-dialog').evaluate((node,motion) => getComputedStyle(node).transitionDuration.includes(motion === 'reduce' ? '0s' : '0.18s'),motion), `${motion}: native dialog motion follows the preference`);
      check(await page.locator('#rule-dialog').evaluate(node => node.scrollWidth <= node.clientWidth + 1), 'Spanish preview fits 320px');
      const art = page.locator('[data-rule-card=sk-mermaid] [data-art]');
      await art.locator('img').evaluate(node => node.decode());
      for (let i=0;i<5;i++) {
        // Close and reopen in the same task, before the old native close event arrives.
        await art.evaluate(node => {node.click();document.querySelector('#image-viewer').close();node.click();});
        await frames(page);
        check(await page.locator('#image-viewer').evaluate(node => node.open && !node.inert), 'Rapid image reopening reaches an active final dialog');
        await focus(page, '#image-viewer .image-close');
        await page.keyboard.press('Tab');
        check(await page.evaluate(() => document.activeElement.closest('dialog')?.id === 'image-viewer'), 'Image dialog traps keyboard focus during entry');
        if(i === 0) check(await page.locator('#image-viewer').evaluate(node => {
          node.querySelector('.image-close').click(); return !node.open && node.inert;
        }), 'Image close makes its content inert synchronously');
        else await page.keyboard.press('Escape');
        await focus(page, '[data-rule-card=sk-mermaid] [data-art]');
        check(await page.locator('#image-viewer').evaluate(node => !node.open && getComputedStyle(node).pointerEvents === 'none'), 'Closing image content stops interaction immediately');
      }
      if (motion === 'no-preference') {
        check(await page.evaluate(() => window.__motionCalls.some(c => c.className === '' && c.duration === 180 && c.keyframes[0].transform.includes('translate('))), 'Enlargement travels from the thumbnail geometry');
        await art.click();
        await page.evaluate(() => document.querySelector('.image-stage img').getAnimations().forEach(a => a.pause()));
        await page.emulateMedia({reducedMotion:'reduce'});
        await page.waitForFunction(() => document.querySelector('.image-stage img').getAnimations().length === 0);
        check(true, 'Changing the preference cancels image travel');
        await page.keyboard.press('Escape'); await focus(page, '[data-rule-card=sk-mermaid] [data-art]');
        await page.emulateMedia({reducedMotion:motion});
      }
      const share = page.getByRole('button',{name:'Compartir regla',exact:true});
      for(let i=0;i<5;i++) {
        await share.click(); await focus(page,'#copy-rule-link');
        await page.locator('#share-dialog .dialog-close').evaluate(node => node.click());
        await frames(page);
        await share.evaluate(node => node.click()); await frames(page);
        check(await page.locator('#share-dialog').evaluate(node => node.open && !node.inert), 'Rapid share reopening remains open and interactive');
        await focus(page,'#copy-rule-link');
        await page.keyboard.press('Escape'); await focus(page,'.rule-preview-actions button');
        check(await page.locator('#share-dialog').evaluate(node => !node.open && node.inert), 'Closed share content is inert');
      }
      await page.keyboard.press('Escape'); await focus(page,'#find-rule');
      await page.locator('#find-rule').click(); await focus(page,'#rule-search-dialog');
      check(await page.locator('.rule-preview').count() === 0, 'Reopening from a preview reveals search and places input focus');
      await page.locator('#rule-dialog .rule-search-result').first().click(); await focus(page,'#rule-preview-title');
      await page.getByRole('button',{name:'Volver a los resultados',exact:true}).click();
      await focus(page,'.rule-search-result');
      await page.keyboard.press('Escape'); await focus(page,'#find-rule');
      check(await page.evaluate(() => JSON.stringify(Object.fromEntries(Object.entries(localStorage)))) === storage, 'Motion and nested dialogs leave live score snapshots untouched');
      for(let i=0;i<6;i++) {
        await page.locator('#find-rule').evaluate(node => node.click()); await focus(page,'#rule-search-dialog');
        await page.locator('#rule-dialog .dialog-close').evaluate(node => node.click()); await frames(page);
        await page.locator('#find-rule').evaluate(node => node.click()); await focus(page,'#rule-search-dialog');
        check(await page.locator('#rule-dialog').evaluate(node => node.open && !node.inert), 'Rapid search reopening reaches its final state');
        await page.keyboard.press('Escape'); await focus(page,'#find-rule');
        check(await page.locator('#rule-dialog').evaluate(node => !node.open && node.inert), 'Closed search and preview content is inert');
      }
      await settled(page);
      check(await page.evaluate(() => document.getAnimations().filter(a => a.playState === 'running').length === 0), 'No continuous or stranded animations');
      if(motion === 'reduce') check(await page.evaluate(() => window.__motionCalls.length === 0), 'Reduced motion creates no scripted effects');
      await page.goto(`${base}/es/`);
      const collection = page.locator('.game-card[data-game=coup]');
      await collection.hover(); await settled(page);
      check(await collection.evaluate((node,motion) => getComputedStyle(node).transform === (motion === 'reduce' ? 'none' : 'matrix(1, 0, 0, 1, 0, -2)'),motion), `${motion}: collection hover is restrained and optional`);
      await page.mouse.move(0,0); await settled(page);
      check(await collection.evaluate(node => getComputedStyle(node).transform === 'none'), 'Collection returns to its stable resting layout');
      await context.close();
    }
    const touch = await browser.newContext({viewport:{width:320,height:844},hasTouch:true,reducedMotion:'no-preference'});
    const page = await touch.newPage(); await page.goto(`${base}/es/`);
    const card = page.locator('.game-card[data-game=coup]');
    await card.locator('.favorite-toggle').tap();
    check(await card.locator('.favorite-toggle').getAttribute('aria-pressed') === 'true', 'Touch selection remains responsive');
    check(await card.evaluate(node => getComputedStyle(node).transform === 'none'), 'Touch does not retain pointer hover movement');
    check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth+1), 'Touch feedback causes no mobile overflow');
    await touch.close();
    assert.deepEqual(errors,[]); checks++;
    console.log(`PASS: ${checks} motion checks (${engine}); rapid input, focus, nested dialogs, teaching timing, persistence, touch and reduced motion.`);
    }
    if(['1','only'].includes(process.env.MOTION_RECORDINGS)) {
      fs.mkdirSync(output,{recursive:true});
      async function record(name, run, options={}) {
        const context = await browser.newContext({viewport:{width:960,height:900},reducedMotion:'no-preference',recordVideo:{dir:path.join(output,'.raw'),size:options.viewport || {width:960,height:900}},...options});
        const page = await context.newPage();
        await page.addInitScript(() => Object.defineProperty(navigator,'clipboard',{value:{writeText:async()=>{}}}));
        await run(page);
        await page.screenshot({path:path.join(output,`${name}.png`)});
        const video = page.video(); await context.close();
        await video.saveAs(path.join(output,`${name}.webm`)); await video.delete();
      }
      const pause = page => page.waitForTimeout(650);
      await record('learning-and-results',async page => {
        await page.goto(`${base}/es/skull_king/learn/`); await ready(page);
        await page.locator('#basics').scrollIntoViewIfNeeded(); await pause(page);
        await page.locator('#lesson-next').click(); await pause(page);
        await page.locator('#lesson-next').click(); await pause(page);
        await page.locator('#lesson-prev').click(); await pause(page);
        await page.locator('#lesson-overview > summary').click(); await pause(page);
        await page.locator('#lesson-overview > summary').click(); await pause(page);
        await learningLesson(page,'basic-score');
        await page.locator('.scoring-outcome').scrollIntoViewIfNeeded(); await pause(page);
        await page.selectOption('#scoring-fact','1'); await pause(page);
        await page.locator('#scoring-replay').click(); await pause(page);
      });
      await record('search-share-image',async page => {
        await page.goto(`${base}/es/skull_king/play/`); await ready(page);
        await page.locator('#find-rule').click(); await pause(page);
        await page.locator('#rule-search-dialog').fill('mermaid'); await pause(page);
        await page.locator('#rule-dialog .rule-search-result').first().click(); await pause(page);
        await page.locator('[data-rule-card=sk-mermaid] [data-art]').click(); await pause(page);
        await page.keyboard.press('Escape'); await pause(page);
        await page.getByRole('button',{name:'Compartir regla',exact:true}).click(); await pause(page);
        await page.locator('#copy-rule-link').click(); await pause(page);
        await page.keyboard.press('Escape'); await pause(page);
        await page.getByRole('button',{name:'Volver a los resultados',exact:true}).click(); await pause(page);
        await page.keyboard.press('Escape'); await pause(page);
      },{viewport:{width:390,height:844},hasTouch:true});
      await record('collection-pointer',async page => {
        await page.goto(`${base}/es/`);
        const card=page.locator('.game-card[data-game=coup]'); await card.scrollIntoViewIfNeeded(); await pause(page);
        await card.hover(); await pause(page);
        await card.locator('.favorite-toggle').hover(); await page.mouse.down(); await page.waitForTimeout(250); await page.mouse.up(); await pause(page);
        await page.mouse.move(10,400); await pause(page);
        await card.locator('.card-learn').focus(); await pause(page);
      });
      await record('collection-touch',async page => {
        await page.goto(`${base}/es/`);
        const card=page.locator('.game-card[data-game=coup]'); await card.scrollIntoViewIfNeeded(); await pause(page);
        await card.locator('.favorite-toggle').tap(); await pause(page);
        await card.locator('.favorite-toggle').tap(); await pause(page);
      },{viewport:{width:390,height:844},hasTouch:true});
      await record('reduced-motion',async page => {
        await page.goto(`${base}/es/skull_king/learn/`); await ready(page);
        await page.locator('#lesson-next').click(); await pause(page);
        await page.locator('#lesson-prev').click(); await pause(page);
        await page.goto(`${base}/es/skull_king/play/`); await ready(page);
        await page.locator('#find-rule').click(); await pause(page);
        await page.locator('#rule-search-dialog').fill('mermaid'); await pause(page);
        await page.locator('#rule-dialog .rule-search-result').first().click(); await pause(page);
        await page.locator('[data-rule-card=sk-mermaid] [data-art]').click(); await pause(page);
        await page.keyboard.press('Escape'); await pause(page);
        await page.getByRole('button',{name:'Compartir regla',exact:true}).click(); await pause(page);
        await page.keyboard.press('Escape'); await pause(page);
        check(await page.evaluate(() => document.getAnimations().filter(a=>a.playState==='running').length===0),'Reduced-motion recording has no active effects');
      },{viewport:{width:390,height:844},hasTouch:true,reducedMotion:'reduce'});
      fs.rmSync(path.join(output,'.raw'),{recursive:true,force:true});
      console.log(`Recordings: ${output}`);
    }
  } finally {await browser.close();server.kill();}
})().catch(error=>{console.error(error);server.kill();process.exitCode=1;});
