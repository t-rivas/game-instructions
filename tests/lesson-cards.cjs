const {learningStage, learningLesson, learningSetupOptions} = require("./learning-navigation.cjs");
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {spawn} = require('node:child_process');
const {pathToFileURL} = require('node:url');
const {chromium} = require('playwright');

const root = path.resolve(__dirname, '..');
const catalog = JSON.parse(fs.readFileSync(path.join(root, 'src/generated/catalog.json')));
const server = spawn(process.execPath, [path.join(root, 'scripts/serve-export.mjs')], {cwd:root,stdio:['ignore','pipe','inherit']});
const origin = new Promise((resolve,reject)=>{
  server.stdout.once('data',chunk=>resolve(chunk.toString().trim()));
  server.once('error',reject);
  server.once('exit',code=>reject(new Error(`Static server exited ${code}`)));
});
const cards = page => page.locator('.lesson-card');
const ids = async page => page.locator('.lesson-card').evaluateAll(nodes=>nodes.map(node=>node.dataset.lessonCard));
for(const game of ['skull_king','coup','avalon']) {
  const rules=new Set([...catalog.games[game].sections,...(catalog.games[game].expansionSections||[])].map(section=>section.id));
  for(const id of catalog.lessonCardSteps[game].flat()) {
    assert.ok(catalog.official[id],`${id}: published artwork exists`);
    assert.ok(rules.has(catalog.lessonCardFacts[id].rule),`${id}: full rule section exists`);
  }
}

(async()=>{
  const base = await origin;
  const browser = await chromium.launch({headless:true,...(process.env.CHROME_CHANNEL?{channel:process.env.CHROME_CHANNEL}:{})});
  const output = fs.mkdtempSync(path.join(os.tmpdir(),'tablefolk-lesson-cards-'));
  try {
    const noJS = await browser.newPage({javaScriptEnabled:false});
    for(const game of ['skull_king','coup','avalon']) {
      await noJS.goto(`${base}/en/${game}/learn/`);
      assert.ok(await noJS.locator('[data-art]').count(), `${game}: artwork is prerendered for learning stages`);
      assert.equal(await noJS.locator('#learning-tools').getAttribute('open'),null);
    }
    await noJS.close();

    const context = await browser.newContext({viewport:{width:390,height:900}});
    const page = await context.newPage();
    const errors=[];page.on('pageerror',error=>errors.push(error.message));
    const ready = () => page.waitForFunction(()=>document.querySelector('[data-tool=sources][data-ready=true]'),null,{timeout:60000});
    for(const game of ['skull_king','coup','avalon']) for(const lang of ['en','es']) {
      await page.goto(`${base}/${lang}/${game}/learn/`);await ready();
      await learningStage(page,'components');await page.locator('#lesson-next').click();
      assert.ok(await cards(page).count(),`${lang}/${game}: cards visible in lesson`);
      for(const theme of ['dark','light']) {
        if(await page.locator('html').getAttribute('data-theme')!==theme) await page.locator('#theme').click();
        for(const width of [320,390,768,1440]) {
          await page.setViewportSize({width,height:900});
          assert.ok(await page.locator('.lesson-cards').evaluate(el=>el.scrollWidth<=el.clientWidth+1),`${lang}/${game}/${theme}/${width}: card block fits`);
          assert.ok(await page.locator('.lesson-copy h3').isVisible(),'The card has one lesson heading');
        }
        if(lang==='es'&&theme==='light') {
          await page.setViewportSize({width:390,height:900});
          await page.locator('.lesson-cards').screenshot({path:path.join(output,`${game}-es-light.png`)});
        }
      }
      const first=cards(page).first();
      await first.locator('[data-art]').focus();await page.keyboard.press('Enter');
      assert.equal(await page.locator('#image-viewer[open]').count(),1);
      await page.keyboard.press('Escape');
      assert.ok(await first.locator('[data-art]').evaluate(el=>el===document.activeElement),`${game}: zoom returns focus`);
      const target=await first.locator('a').getAttribute('href');
      assert.ok(target.includes(`/${lang}/${game}/rules/`)&&target.includes('#'),`${game}: full rule link`);
    }

    await page.goto(`${base}/en/coup/learn/`);await ready();await learningStage(page,'components');
    await learningSetupOptions(page);
    if(await page.locator('#inquisitor-toggle').getAttribute('aria-checked')!=='true')await page.locator('#inquisitor-toggle').click();
    await learningLesson(page, 'card-coup-inquisitor');
    assert.deepEqual(await ids(page),['coup-inquisitor']);
    await page.locator('#inquisitor-toggle').click();await learningStage(page,'components');
    assert.equal(await page.locator('[data-lesson-target="card-coup-inquisitor"]').count(),0);
    await learningLesson(page, 'card-coup-ambassador');
    assert.deepEqual(await ids(page),['coup-ambassador']);
    await page.goto(`${base}/en/skull_king/learn/`);await ready();
    await learningSetupOptions(page);await page.locator('#skull-expansion-toggle').click();await learningStage(page,'turn');
    await learningLesson(page, 'basic-expansion');
    assert.deepEqual(await ids(page),['exp-wild','exp-mary']);
    await page.locator('#skull-expansion-toggle').click();
    assert.equal(await page.locator('[data-lesson-card^=exp-]').count(),0);
    await page.goto(`${base}/en/avalon/learn/`);await ready();await learningStage(page,'setup');
    await page.locator('#avalon-mode').selectOption('optional');await learningStage(page,'components');
    await learningLesson(page, 'card-avalon-morgana');
    assert.deepEqual(await ids(page),['avalon-morgana']);
    await learningStage(page,'setup');await page.locator('#role-morgana').uncheck();await learningStage(page,'components');
    assert.equal(await page.locator('[data-lesson-target="card-avalon-morgana"]').count(),0);
    await learningLesson(page, 'card-avalon-merlin');
    await page.setViewportSize({width:320,height:900});
    await page.addStyleTag({content:'.lesson-card-copy h4,.lesson-card-copy p,.lesson-card-copy small,.lesson-card-copy a{font-size:180%!important;line-height:1.45!important}'});
    assert.ok(await page.locator('.lesson-cards').evaluate(el=>el.scrollWidth<=el.clientWidth+1),'Enlarged card text stays inside the lesson');
    assert.ok((await cards(page).first().locator('[data-art]').boundingBox()).width>=44,'Card zoom has a touch-sized target');
    assert.deepEqual(errors,[]);
    await context.close();

    const broken = await browser.newPage({viewport:{width:390,height:900}});
    await broken.route('**/assets/images/**',route=>route.abort());
    await broken.goto(`${base}/en/skull_king/learn/`);
    await broken.waitForSelector('[data-tool=sources][data-ready=true]');await learningStage(broken,'components');await broken.locator('#lesson-next').click();
    assert.ok(await broken.locator('.lesson-card-copy').first().innerText(), 'Image failure leaves the explanation available');
    await broken.close();

    const offline = await browser.newPage({viewport:{width:390,height:900}});
    await offline.goto(pathToFileURL(path.join(root,'game-night.html')).href);
    await offline.evaluate(()=>{location.hash='coup/learn';});
    await offline.waitForFunction(()=>document.querySelector('[data-lesson-card="coup-duke"]'));
    if(await offline.locator('#inquisitor-toggle').getAttribute('aria-checked')!=='true')await offline.locator('#inquisitor-toggle').click();
    assert.ok((await ids(offline)).includes('coup-inquisitor'),'Portable lesson uses shared card definitions');
    await offline.locator('#inquisitor-toggle').click();
    assert.ok((await ids(offline)).includes('coup-ambassador'),'Portable variant selection updates cards');
    await offline.locator('#lang-es').click();
    assert.equal(await offline.locator('[data-lesson-card="coup-ambassador"] h4').innerText(),'Embajador');
    await offline.setViewportSize({width:320,height:900});
    assert.ok(await offline.locator('.lesson-cards').evaluate(el=>el.scrollWidth<=el.clientWidth+1),'Portable Spanish cards fit at 320px');
    await offline.close();
    console.log(`PASS: lesson cards, variants, zoom focus, image fallback and responsive layouts. Screenshots: ${output}`);
  } finally {await browser.close();server.kill();}
})().catch(error=>{console.error(error);server.kill();process.exitCode=1;});
