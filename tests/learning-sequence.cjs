const assert = require('node:assert/strict');
const {spawn} = require('node:child_process');
const {chromium, webkit} = require('playwright');
const fs = require('node:fs');
const {games} = require('../src/generated/catalog.json');
const server=spawn(process.execPath,['scripts/serve-export.mjs'],{stdio:['ignore','pipe','inherit']});
(async()=>{
 const base=await new Promise(r=>server.stdout.once('data',d=>r(d.toString().trim())));
 const engine=process.env.BROWSER || 'chromium';
 const browser=await {chromium,webkit}[engine].launch({headless:true,...(engine==='chromium' && process.env.CHROME_CHANNEL ? {channel:process.env.CHROME_CHANNEL} : {})});
 const output=process.env.LEARNING_SCREENSHOTS || `/tmp/tablefolk-learn-review-${engine}`;fs.mkdirSync(output,{recursive:true});
 try {
  const page=await browser.newPage({viewport:{width:390,height:844}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const ready=()=>page.waitForFunction(()=>document.querySelector('main')?.dataset.route===location.pathname && document.querySelector('[data-tool=sources][data-ready=true]'));
  for(const lang of ['en','es']) for(const id of Object.keys(games)) {
   await page.goto(`${base}/${lang}/${id}/learn/`);await ready();
   assert.equal(await page.locator('[data-learning-stage]').count(),5);
   await page.locator('#already-set-up').click();
   assert.equal(await page.locator('[data-learning-stage][aria-current=step]').getAttribute('data-learning-stage'),id==='chess'?'components':'turn');
   assert.ok(await page.locator('.lesson-copy h3').evaluate(el=>el===document.activeElement));
   await page.locator('[data-learning-stage=setup]').click();
   if(id==='avalon')await page.locator('#avalon-step-2').click();
   await page.locator('#setup-ready').click();
   if(id==='sushi_go_party') {
    assert.equal(await page.locator('[data-learning-step]').getAttribute('data-learning-step'),'basic-deal');
    assert.match(await page.locator('.lesson-copy').innerText(),/5\/3\/2/);
    await page.locator('#setup-ready').click();
   }
   assert.ok(page.url().includes('/learn/'));
   assert.equal(await page.locator('[data-learning-stage][aria-current=step]').getAttribute('data-learning-stage'),'turn');
   if(['coup','avalon','skull_king'].includes(id)) {
    await page.locator('#learning-step').selectOption('example');
    assert.ok(await page.locator(id==='skull_king'?'#skull-trick-lesson':`#${id}-lesson`).isVisible());
   }
   await page.locator('[data-learning-stage=end]').click();
   assert.ok((await page.locator('.lesson-copy h3').innerText()).length);
   // Every original lesson remains reachable under its semantic ID, with its copy.
   const lessonIds=await page.locator('.learning-overview button').evaluateAll(nodes=>nodes.map(node=>node.textContent));
   assert.ok(lessonIds.every(title=>title && !title.includes('undefined')),`${id}: all lessons have meaningful labels`);
   for(const stage of ['setup','turn','end']) {
    await page.locator(`[data-learning-stage=${stage}]`).click();
    const picker=page.locator('#learning-step');
    const values=await picker.count() ? await picker.locator('option').evaluateAll(nodes=>nodes.map(node=>node.value)) : [];
    for(const value of values.filter(value=>value.startsWith('basic-'))) {
     await picker.selectOption(value);
     assert.ok((await page.locator('.lesson-copy > p').first().innerText()).length>20,`${lang}/${id}/${value}: explanation visible`);
    }
   }
  }
  await page.goto(`${base}/en/chess/learn/`);await ready();
  await page.evaluate(()=>sessionStorage.setItem('tablefolk-lesson-chess','1'));await page.reload();await ready();
  await page.waitForSelector('[data-learning-step=basic-move]');
  assert.equal(await page.evaluate(()=>sessionStorage.getItem('tablefolk-lesson-chess')),'basic-move');
  await page.locator('#already-set-up').click();
  for(const piece of ['king','queen','rook','bishop','knight','pawn']) {
   assert.equal(await page.locator('[data-learning-step]').getAttribute('data-learning-step'),`piece-${piece}`);
   assert.ok(await page.locator(`.lesson-copy [data-art=chess-${piece}]`).isVisible());
   if(piece!=='pawn')await page.locator('#lesson-next').click();
  }
  await page.locator('#lang-es').click();await page.waitForURL('**/es/chess/learn/');await ready();await page.waitForSelector('[data-learning-step=piece-pawn]');
  await page.locator('#tab-play').click();await page.waitForURL('**/es/chess/play/');await ready();await page.locator('#tab-learn').click();await page.waitForURL('**/es/chess/learn/');await ready();await page.waitForSelector('[data-learning-step=piece-pawn]');
  await page.goto(`${base}/en/coup/learn/`);await ready();
  await page.locator('[data-learning-stage=turn]').click();
  const local=await page.evaluate(()=>sessionStorage.getItem('tablefolk-lesson-coup'));
  await page.goto(`${base}/en/coup/learn/?shared=1&exchange=ambassador`);await ready();
  await page.locator('[data-learning-stage=end]').click();
  assert.equal(await page.evaluate(()=>sessionStorage.getItem('tablefolk-lesson-coup')),local);
  // Setup and example bookmarks reveal content even when a different lesson was saved.
  for(const [id,hash,step,selector] of [
   ['sushi_go_party','learn-setup','basic-menu','#learn-setup'],
   ['chess','setup-notes','basic-board','#setup-notes'],
   ['coup','coup-lesson','example','#coup-lesson'],
   ['avalon','avalon-lesson','example','#avalon-lesson'],
   ['skull_king','skull-trick-lesson','example','#skull-trick-lesson'],
   ['sushi_go','scoring-example','basic-score','#scoring-example'],
  ]) {
   await page.goto(`${base}/en/${id}/learn/#${hash}`);await ready();
   await page.waitForSelector(`[data-learning-step=${step}]`);
   assert.ok(await page.locator(selector).isVisible(),`${id}: bookmark reveals its content`);
   assert.equal(new URL(page.url()).hash,`#${hash}`);
   await page.locator('[data-learning-stage=objective]').click();
   await page.evaluate(hash=>window.dispatchEvent(new HashChangeEvent('hashchange')),hash);
   await page.waitForSelector(`[data-learning-step=${step}]`);
   assert.ok(await page.locator(selector).isVisible(),`${id}: repeated bookmark reopens content`);
  }
  await page.goto(`${base}/en/sushi_go_party/learn/`);await ready();
  await page.locator('[data-learning-stage=setup]').click();
  assert.match(await page.locator('.lesson-copy').innerText(),/three appetizers/);
  await page.locator('#setup-ready').click();
  assert.equal(await page.locator('[data-learning-step]').getAttribute('data-learning-step'),'basic-deal');
  await page.locator('#lang-es').click();await page.waitForURL('**/es/sushi_go_party/learn/');await ready();
  await page.waitForSelector('[data-learning-step=basic-deal]');
  assert.match(await page.locator('.lesson-copy').innerText(),/5\/3\/2/);
  await page.locator('#already-set-up').click();
  assert.equal(await page.locator('[data-learning-step]').getAttribute('data-learning-step'),'basic-draft');
  // A removed optional card keeps its ID so restoring the variant restores context.
  await page.goto(`${base}/en/coup/learn/`);await ready();
  await page.locator('[data-learning-stage=components]').click();
  await page.locator('#learning-step').selectOption('card-coup-inquisitor');
  await page.locator('#inquisitor-toggle').click();
  await page.waitForSelector('[data-learning-step=objective]');
  assert.equal(await page.evaluate(()=>sessionStorage.getItem('tablefolk-lesson-coup')),'card-coup-inquisitor');
  await page.locator('#inquisitor-toggle').click();
  await page.waitForSelector('[data-learning-step=card-coup-inquisitor]');
  await page.locator('[data-learning-stage=turn]').click();
  await page.locator('#learning-step').selectOption('example');
  await page.locator('[data-coup-choice]').first().click();
  const exampleNode=await page.locator('[data-coup-node]').getAttribute('data-coup-node');
  await page.locator('[data-learning-stage=setup]').click();
  await page.locator('[data-learning-stage=turn]').click();
  await page.locator('#learning-step').selectOption('example');
  assert.equal(await page.locator('[data-coup-node]').getAttribute('data-coup-node'),exampleNode,'Changing stages preserves the example branch');
  // Malformed progress cannot select a different numbered lesson.
  await page.evaluate(()=>sessionStorage.setItem('tablefolk-lesson-coup','999'));
  await page.reload();await ready();await page.waitForSelector('[data-learning-step=objective]');
  for(const width of [320,390,768,1440]) for(const lang of ['en','es']) for(const theme of ['light','dark']) {
   await page.setViewportSize({width,height:900});await page.goto(`${base}/${lang}/coup/learn/`);await ready();
   await page.evaluate(theme=>document.documentElement.setAttribute('data-theme',theme),theme);
   for(const stage of ['objective','components','setup','turn','end']) {
    await page.locator(`[data-learning-stage=${stage}]`).click();
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${width}/${lang}/${stage} page fits`);
    assert.deepEqual(await page.locator('.learning-stages button,.detail-controls .tabs button').evaluateAll(nodes=>nodes.filter(n=>n.scrollWidth>n.clientWidth+1).map(n=>n.textContent)),[]);
   }
   await page.locator('[data-learning-stage=components]').click();await page.locator('#lesson-next').click();
   await page.locator('#basics').screenshot({style:'header,.detail-controls,.skip-link{visibility:hidden!important}',path:`${output}/${lang}-${theme}-${width}.png`});
  }
  for(const [id,step] of [['sushi_go_party','basic-deal'],['chess','piece-pawn']]) for(const lang of ['en','es']) {
   await page.goto(`${base}/${lang}/${id}/learn/`);await ready();
   await page.locator(`[data-learning-stage=${id==='chess'?'components':'setup'}]`).click();
   await page.locator('#learning-step').selectOption(step);
   for(const width of [320,390,768,1440]) for(const theme of ['light','dark']) {
    await page.setViewportSize({width,height:900});
    await page.evaluate(theme=>document.documentElement.setAttribute('data-theme',theme),theme);
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
    assert.ok((await page.locator('#learning-step').boundingBox()).height>=44,'Lesson selector has a touch target of at least 44px');
    assert.deepEqual(await page.locator('.learning-stages button,.detail-controls .tabs button').evaluateAll(nodes=>nodes.filter(n=>n.scrollWidth>n.clientWidth+1).map(n=>n.textContent)),[]);
    await page.locator('#basics').screenshot({style:'header,.detail-controls,.skip-link{visibility:hidden!important}',path:`${output}/${id}-${lang}-${theme}-${width}.png`});
   }
  }
  await page.goto(`${base}/es/coup/learn/`);await ready();
  await page.locator('[data-learning-stage=components]').click();await page.locator('#lesson-next').click();
  await page.emulateMedia({reducedMotion:'reduce'});await page.setViewportSize({width:320,height:900});
  await page.addStyleTag({content:'.learning-sequence :is(p,button,label,select,a){font-size:24px!important}'});
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  await page.locator('.lesson-cards [data-art]').first().focus();await page.keyboard.press('Enter');
  await page.waitForSelector('#image-viewer[open]');await page.keyboard.press('Escape');
  assert.ok(await page.locator('.lesson-cards [data-art]').first().evaluate(el=>el===document.activeElement));
  await page.locator('#basics').screenshot({style:'header,.detail-controls,.skip-link{visibility:hidden!important}',path:`${output}/enlarged-320.png`});
  const noJS=await browser.newPage({javaScriptEnabled:false});await noJS.goto(`${base}/en/chess/learn/`);
  assert.match(await noJS.locator('.lesson-copy').innerText(),/Checkmate/);await noJS.close();
  assert.deepEqual(errors,[]);console.log(`Learning sequence: 15 games, migration, navigation, shared isolation, keyboard, image viewer and 48 responsive captures per browser passed. Screenshots: ${output}`);
 }finally{await browser.close();server.kill();}
})().catch(e=>{console.error(e);server.kill();process.exitCode=1;});
