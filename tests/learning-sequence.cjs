const {learningContents, learningStage, learningLesson, learningSetupOptions} = require("./learning-navigation.cjs");
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
   if(id==='sushi_go_party') {await learningSetupOptions(page);await page.locator('#guide-player-count').selectOption('4');await page.locator('#guide-setup-options > summary').click();}
   await page.locator('#already-set-up').click();
   assert.equal(await page.locator('[data-learning-step]').getAttribute('data-current-stage'),id==='chess'?'components':'turn');
   assert.ok(await page.locator('.lesson-copy h3').evaluate(el=>el===document.activeElement));
   await learningStage(page, 'setup');
   if(id==='avalon')await learningLesson(page, 'avalon-opening');
   await page.locator('#lesson-next').click();
   if(id==='sushi_go_party') {
    assert.equal(await page.locator('[data-learning-step]').getAttribute('data-learning-step'),'basic-deal');
    assert.match(await page.locator('.lesson-explanation').innerText(),/5, 3 (?:and|y) 2/);
    await page.locator('#lesson-next').click();
   }
   assert.ok(page.url().includes('/learn/'));
   assert.equal(await page.locator('[data-learning-step]').getAttribute('data-current-stage'),'turn');
   if(['coup','avalon','skull_king'].includes(id)) {
    await learningLesson(page, 'example');
    assert.ok(await page.locator(id==='skull_king'?'#skull-trick-lesson':`#${id}-lesson`).isVisible());
   }
   await learningStage(page, 'end');
   assert.ok((await page.locator('.lesson-copy h3').innerText()).length);
   // Every original lesson remains reachable under its semantic ID, with its copy.
   const lessonIds=await page.locator('.learning-overview button').evaluateAll(nodes=>nodes.map(node=>node.textContent));
   assert.ok(lessonIds.every(title=>title && !title.includes('undefined')),`${id}: all lessons have meaningful labels`);
   const values=await page.locator('.learning-overview button').evaluateAll(nodes=>nodes.map(node=>node.dataset.lessonTarget));
   for(const value of values.filter(value=>value.startsWith('basic-'))) {
     await learningLesson(page, value);
     assert.ok((await page.locator('.lesson-explanation').innerText()).length>20,`${lang}/${id}/${value}: explanation visible`);
   }
   // The objective and its Next action fit without an expanded navigation panel.
   await learningLesson(page, 'objective');
   for(const width of [320,390,768,1440]) {
     await page.setViewportSize({width,height:900});
     assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${width}/${lang}/${id}: objective fits`);
     assert.ok(!await page.locator('#lesson-overview').evaluate(node=>node.open), 'Contents closes after keyboard selection');
     assert.ok(await page.locator('#lesson-next').isVisible());
     assert.equal(await page.locator('#learning-step').count(),0,'No competing lesson selector');
   }
   await page.setViewportSize({width:390,height:844});
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
  await learningStage(page, 'turn');
  const local=await page.evaluate(()=>sessionStorage.getItem('tablefolk-lesson-coup'));
  await page.goto(`${base}/en/coup/learn/?shared=1&exchange=ambassador`);await ready();
  await learningStage(page, 'end');
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
   await learningStage(page, 'objective');
   await page.evaluate(hash=>window.dispatchEvent(new HashChangeEvent('hashchange')),hash);
   await page.waitForSelector(`[data-learning-step=${step}]`);
   assert.ok(await page.locator(selector).isVisible(),`${id}: repeated bookmark reopens content`);
  }
  await page.goto(`${base}/en/sushi_go_party/learn/`);await ready();
  await learningStage(page, 'setup');
  assert.match(await page.locator('.lesson-explanation').innerText(),/three different appetizers/);
  await page.locator('#lesson-next').click();
  assert.equal(await page.locator('[data-learning-step]').getAttribute('data-learning-step'),'basic-deal');
  await page.locator('#lang-es').click();await page.waitForURL('**/es/sushi_go_party/learn/');await ready();
  await page.waitForSelector('[data-learning-step=basic-deal]');
  assert.match(await page.locator('.lesson-explanation').innerText(),/5, 3 (?:and|y) 2/);
  await page.locator('#already-set-up').click();
  assert.equal(await page.locator('[data-learning-step]').getAttribute('data-learning-step'),'basic-draft');
  // A removed optional card keeps its ID so restoring the variant restores context.
  await page.goto(`${base}/en/coup/learn/`);await ready();
  await learningStage(page, 'components');
  await learningSetupOptions(page);
  if(await page.locator('#inquisitor-toggle').getAttribute('aria-checked')!=='true')await page.locator('#inquisitor-toggle').click();
  await learningLesson(page, 'card-coup-inquisitor');
  await page.locator('#inquisitor-toggle').click();
  await page.waitForSelector('[data-learning-step=objective]');
  assert.equal(await page.evaluate(()=>sessionStorage.getItem('tablefolk-lesson-coup')),'card-coup-inquisitor');
  await page.locator('#inquisitor-toggle').click();
  await page.waitForSelector('[data-learning-step=card-coup-inquisitor]');
  await learningStage(page, 'turn');
  await learningLesson(page, 'example');
  await page.locator('[data-coup-choice]').first().click();
  await page.locator('#coup-lesson').evaluate(node=>window.__mountedCoupExample=node);
  const exampleNode=await page.locator('[data-coup-node]').getAttribute('data-coup-node');
  await learningStage(page, 'setup');
  await learningStage(page, 'turn');
  await learningLesson(page, 'example');
  assert.equal(await page.locator('[data-coup-node]').getAttribute('data-coup-node'),exampleNode,'Changing stages preserves the example branch');
  assert.ok(await page.locator('#coup-lesson').evaluate(node=>node===window.__mountedCoupExample),'The example stays mounted');
  // Malformed progress cannot select a different numbered lesson.
  await page.evaluate(()=>sessionStorage.setItem('tablefolk-lesson-coup','999'));
  await page.reload();await ready();await page.waitForSelector('[data-learning-step=objective]');
  for(const width of [320,390,768,1440]) for(const lang of ['en','es']) for(const theme of ['light','dark']) {
   await page.setViewportSize({width,height:900});await page.goto(`${base}/${lang}/coup/learn/`);await ready();
   await page.evaluate(theme=>document.documentElement.setAttribute('data-theme',theme),theme);
   for(const stage of ['objective','components','setup','turn','end']) {
    await learningStage(page, stage);
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${width}/${lang}/${stage} page fits`);
    assert.deepEqual(await page.locator('.learning-overview button,.detail-controls .tabs button').evaluateAll(nodes=>nodes.filter(n=>n.scrollWidth>n.clientWidth+1).map(n=>n.textContent)),[]);
   }
   await learningStage(page, 'components');await page.locator('#lesson-next').click();
   await page.locator('#basics').screenshot({style:'header,.detail-controls,.skip-link{visibility:hidden!important}',path:`${output}/${lang}-${theme}-${width}.png`});
  }
  for(const [id,step] of [['sushi_go_party','basic-deal'],['chess','piece-pawn']]) for(const lang of ['en','es']) {
   await page.goto(`${base}/${lang}/${id}/learn/`);await ready();
   await learningStage(page, id==='chess'?'components':'setup');
   await learningLesson(page, step);
   for(const width of [320,390,768,1440]) for(const theme of ['light','dark']) {
    await page.setViewportSize({width,height:900});
    await page.evaluate(theme=>document.documentElement.setAttribute('data-theme',theme),theme);
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
    await learningContents(page);
    assert.ok((await page.locator(`[data-lesson-target="${step}"]`).boundingBox()).height>=44,'Contents lessons have a touch target of at least 44px');
    await page.keyboard.press('Escape');
    assert.deepEqual(await page.locator('.learning-overview button,.detail-controls .tabs button').evaluateAll(nodes=>nodes.filter(n=>n.scrollWidth>n.clientWidth+1).map(n=>n.textContent)),[]);
    await page.locator('#basics').screenshot({style:'header,.detail-controls,.skip-link{visibility:hidden!important}',path:`${output}/${id}-${lang}-${theme}-${width}.png`});
   }
  }
  await page.goto(`${base}/es/coup/learn/`);await ready();
  await learningStage(page, 'components');await page.locator('#lesson-next').click();
  await page.emulateMedia({reducedMotion:'reduce'});await page.setViewportSize({width:320,height:900});
  await page.addStyleTag({content:'.learning-sequence :is(p,button,label,select,a){font-size:24px!important}'});
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  await page.locator('.lesson-cards [data-art]').first().focus();await page.keyboard.press('Enter');
  await page.waitForSelector('#image-viewer[open]');await page.keyboard.press('Escape');
  assert.ok(await page.locator('.lesson-cards [data-art]').first().evaluate(el=>el===document.activeElement));
  await page.locator('#basics').screenshot({style:'header,.detail-controls,.skip-link{visibility:hidden!important}',path:`${output}/enlarged-320.png`});
  // Contents supports keyboard opening, selection and dismissal without losing focus.
  await page.goto(`${base}/en/coup/learn/`);await ready();
  const summary=page.locator('#lesson-overview > summary');
  await summary.focus();await page.keyboard.press('Enter');
  assert.ok(await page.locator('#lesson-overview').evaluate(node=>node.open));
  await page.locator('[data-lesson-target=basic-action]').focus();await page.keyboard.press('Enter');
  assert.ok(!await page.locator('#lesson-overview').evaluate(node=>node.open), 'Contents closes after keyboard selection');
  assert.ok(await page.locator('.lesson-copy h3').evaluate(node=>node===document.activeElement));
  assert.ok(await page.locator('.lesson > .optional-practice').count());
  assert.ok(!await page.locator('.lesson > .optional-practice').evaluate(node=>node.open),'Practice starts optional');
  await page.locator('.lesson > .optional-practice > summary').click();
  await page.locator('[data-practice-option]').first().click();
  const answer=await page.locator('[data-practice-option][aria-pressed=true]').getAttribute('data-practice-option');
  await page.locator('#lesson-next').click();await learningLesson(page,'basic-action');
  await page.locator('.lesson > .optional-practice > summary').click();
  assert.equal(await page.locator('[data-practice-option][aria-pressed=true]').getAttribute('data-practice-option'),answer,'Optional answers recover');
  await learningContents(page);await page.keyboard.press('Escape');
  assert.ok(await summary.evaluate(node=>node===document.activeElement));
  // Former Avalon setup position migrates, then the unified lesson order resumes.
  await page.goto(`${base}/en/avalon/learn/`);await ready();
  await page.evaluate(()=>{sessionStorage.setItem('tablefolk-lesson-avalon','0');sessionStorage.setItem('tablefolk-avalon-step','2');});
  await page.reload();await ready();await page.waitForSelector('[data-learning-step=avalon-opening]');
  await page.locator('#lesson-prev').click();await page.waitForSelector('[data-learning-step=avalon-prepare]');
  await learningLesson(page,'basic-roles');await page.reload();await ready();await page.waitForSelector('[data-learning-step=basic-roles]');
  const noJS=await browser.newPage({javaScriptEnabled:false});await noJS.goto(`${base}/en/chess/learn/`);
  assert.match(await noJS.locator('.lesson-copy').innerText(),/Checkmate/);await noJS.close();
  assert.deepEqual(errors,[]);console.log(`Learning sequence: 15 games, migration, navigation, shared isolation, keyboard, image viewer and 48 responsive captures per browser passed. Screenshots: ${output}`);
 }finally{await browser.close();server.kill();}
})().catch(e=>{console.error(e);server.kill();process.exitCode=1;});
