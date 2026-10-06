const assert = require('node:assert/strict');
const fs = require('node:fs');
const {spawn} = require('node:child_process');
const vm = require('node:vm');
const {pathToFileURL} = require('node:url');
const path = require('node:path');
const {chromium,webkit} = require('playwright');
// Expected choices are authored independently of the UI's answer indexes.
const expected = {skull_king:['minus-fifty','mermaid'],sushi_go:['nine','three-each'],sushi_go_party:['two-to-six','six'],catan:['four','missing-ore'],secret_hitler:['fascists-win','chaos'],el_camarero:['two','continue'],monopoly:['auction','double'],chess:['draw','crossing'],burako:['repeats','stock'],truco:['twelve','thirty-five'],coup:['bruno-loses','spent'],avalon:['everyone','approved-team'],dixit:['zero']};
const {lessonPractice} = require('../src/generated/catalog.json');
const practiceSource = fs.readFileSync(path.join(__dirname,'../practice.js'),'utf8');
const shuffled = vm.runInNewContext('const L=(en,es)=>({en,es});' + practiceSource.replace('// Stable concepts/options:', 'Object.values(PRACTICE).forEach(scenarios=>scenarios.reverse());\n// Stable concepts/options:') + '; JSON.stringify(LESSON_PRACTICE)');
for(const [game,scenarios] of Object.entries(JSON.parse(shuffled)))for(const scenario of scenarios){
 const original=lessonPractice[game].find(item=>item.id===scenario.id);
 assert.deepEqual(scenario.lessons,original.lessons,'Reordered exercises retain their concept IDs');
 assert.equal(scenario.optionIds[scenario.answer],original.optionIds[original.answer],'Reordered exercises retain their correct option IDs');
}
const server = spawn(process.execPath,['scripts/serve-export.mjs'],{stdio:['ignore','pipe','inherit']});
(async()=>{
 const base=await new Promise(resolve=>server.stdout.once('data',data=>resolve(data.toString().trim())));
 const engine=process.env.BROWSER || 'chromium';
 const browser=await {chromium,webkit}[engine].launch({headless:true,...(engine==='chromium'&&process.env.CHROME_CHANNEL?{channel:process.env.CHROME_CHANNEL}:{})});
 const output=`/tmp/tablefolk-lesson-practice-${engine}`;fs.mkdirSync(output,{recursive:true});
 try{
  const page=await browser.newPage({viewport:{width:390,height:900},reducedMotion:'reduce'}),errors=[];page.on('pageerror',error=>errors.push(error.message));
  const ready=async()=>{try{await page.waitForFunction(()=>document.querySelector('main')?.dataset.route===location.pathname&&document.querySelector('[data-tool=sources][data-ready=true]'));}catch(error){console.error('Recovery failure',page.url(),errors,await page.locator('main').innerText());throw error;}};
  const visit=async(game,lang='en',query='')=>{await page.goto(`${base}/${lang}/${game}/learn/${query}`);await ready();};
  const select=async step=>{
   await page.locator('#lesson-overview > summary').click();
   // The picker and overview both use semantic lesson identities.
   await page.locator('.learning-overview button').evaluateAll((nodes,step)=>{
        // Stored selection restores any stage, including setup/end, without text matching.
    const game=location.pathname.split('/')[2];sessionStorage.setItem(`tablefolk-${location.search.includes('shared=1')?'shared-':''}lesson-${game}`,step);
   },step);
   await page.reload();await ready();await page.waitForSelector(`[data-learning-step="${step}"]`);
  };
  for(const [game,answers] of Object.entries(expected)){
   await visit(game);
   const before=await page.evaluate(()=>Object.fromEntries(Object.keys(localStorage).filter(k=>/score|clock|session|tournament/.test(k)).map(k=>[k,localStorage.getItem(k)])));
   for(let i=0;i<answers.length;i++){
    const decision=lessonPractice[game][i];await select(decision.lessons[0]);
    if(await page.locator('.practice-picker select').count())await page.locator('.practice-picker select').selectOption(decision.id);
    const practice=page.locator(`[data-lesson-practice="${decision.id}"]`);
    assert.ok(await practice.isVisible(),`${game}/${decision.id}: practice appears after concept`);
    const wrong=decision.optionIds.find(id=>id!==answers[i]);
    await practice.locator(`[data-practice-option="${wrong}"]`).click();
    assert.match(await practice.locator('[role=status]').innerText(),/Not quite/);
    assert.ok((await practice.locator('[role=status]').innerText()).includes(decision.feedback[decision.optionIds.indexOf(wrong)].en));
    await practice.locator(`[data-practice-option="${answers[i]}"]`).focus();await page.keyboard.press('Enter');
    assert.match(await practice.locator('[role=status]').innerText(),/^Correct\./);
    await page.locator('#lang-es').click();await page.waitForURL('**/es/**');await ready();await page.waitForSelector(`[data-learning-step="${decision.lessons[0]}"]`);
    assert.equal(await practice.locator(`[data-practice-option="${answers[i]}"]`).getAttribute('aria-pressed'),'true',`${game}: answer survives translation`);
    assert.match(await practice.locator('[role=status]').innerText(),/Correcto/);
    await page.locator('#tab-play').click();await page.waitForURL('**/play/');await ready();await page.locator('#tab-learn').click();await page.waitForURL('**/learn/');await ready();
    await page.waitForSelector(`[data-learning-step="${decision.lessons[0]}"]`);
    assert.equal(await practice.locator(`[data-practice-option="${answers[i]}"]`).getAttribute('aria-pressed'),'true',`${game}: answer survives view change`);
    await practice.locator('[data-practice-retry]').click();
    assert.equal(await practice.locator('[aria-pressed=true]').count(),0);
    assert.ok(await practice.locator('[data-practice-option]').first().evaluate(el=>el===document.activeElement));
    // Skip never requires a correct answer.
    await practice.locator('[data-practice-continue]').click();
    assert.notEqual(await page.locator('[data-learning-step]').getAttribute('data-learning-step'),decision.lessons[0]);
    await page.locator('#lang-en').click();await page.waitForURL('**/en/**');await ready();
   }
   const after=await page.evaluate(()=>Object.fromEntries(Object.keys(localStorage).filter(k=>/score|clock|session|tournament/.test(k)).map(k=>[k,localStorage.getItem(k)])));
   assert.deepEqual(after,before,`${game}: practice never writes a live game`);console.log(`${game}: concept decisions and persistence passed`);
  }
  for(const [game,step,target,attribute,value] of [
   ['coup','basic-challenge','[data-coup-node]','data-coup-node','tax-start'],
   ['avalon','basic-vote','[data-avalon-stage]','data-avalon-stage','1'],
   ['avalon','basic-quest','[data-avalon-stage]','data-avalon-stage','2'],
   ['skull_king','basic-trick','.trick-example','data-scenario','three-characters']
  ]){
   await visit(game);await select(step);await page.locator('[data-practice-revisit]').click();
   await page.waitForSelector('[data-learning-step=example]');
   await page.waitForFunction(({target,attribute,value})=>document.querySelector(target)?.getAttribute(attribute)===value,{target,attribute,value});
   assert.ok(await page.locator(target).isVisible());
  }
  for(const [game,step,index] of [['skull_king','basic-score','1'],['sushi_go','basic-score','1'],['sushi_go_party','basic-score','2'],['dixit','basic-score','0']]){
   await visit(game);await select(step);await page.locator('[data-practice-revisit]').click();
   await page.waitForFunction(({index,fact})=>document.querySelector('#scoring-scenario')?.value===index&&document.querySelector('#scoring-fact')?.value===fact,{index,fact:['skull_king','dixit'].includes(game)?'1':'0'});
   assert.ok(await page.locator('#scoring-example').isVisible());
   assert.equal(await page.locator('#scoring-fact').inputValue(),['skull_king','dixit'].includes(game)?'1':'0');
  }
  await visit('coup');await page.locator('[data-coup-choice=tax-challenge]').click();await page.locator('[data-coup-choice=tax-proof]').click();
  await page.locator('#lang-es').click();await page.waitForURL('**/es/**');await ready();await page.waitForSelector('[data-coup-node=tax-proof]');
  await page.locator('#tab-rules').click();await page.waitForURL('**/rules/');await ready();await page.locator('#tab-learn').click();await page.waitForURL('**/learn/');await ready();await page.waitForSelector('[data-coup-node=tax-proof]');
  await visit('catan');await select('basic-produce');await page.locator('[data-practice-option=five]').click();
  const local=await page.evaluate(()=>sessionStorage.getItem('tablefolk-practice-catan-decisions-v1'));
  await visit('catan','en','?shared=1');await select('basic-produce');
  assert.equal(await page.locator('[data-lesson-practice] [aria-pressed=true]').count(),0);
  await page.locator('[data-practice-option=four]').click();
  assert.equal(await page.evaluate(()=>sessionStorage.getItem('tablefolk-practice-catan-decisions-v1')),local);
  await visit('catan');await page.waitForSelector('[data-learning-step=basic-produce]');assert.equal(await page.locator('[data-practice-option=five]').getAttribute('aria-pressed'),'true');
  for(const bad of ['not-json','[]','null','{"robber-discard":{}}']){
   await page.evaluate(bad=>sessionStorage.setItem('tablefolk-practice-catan-decisions-v1',bad),bad);await page.reload();await ready();
   assert.equal(await page.locator('[data-lesson-practice] [aria-pressed=true]').count(),0);
  }
  for(const [game,step,control] of [['poker','basic-streets','#street-2'],['moth','basic-discard','#guess-3']]){
   await visit(game);await select(step);assert.ok(await page.locator('[data-tool=practice-helper]').isVisible());
   await page.locator(control).click();await page.locator('#lang-es').click();await page.waitForURL('**/es/**');await ready();
   assert.equal(await page.locator(control).getAttribute('aria-pressed'),'true');
   await page.locator('#tab-play').click();await page.waitForURL('**/play/');await ready();await page.locator('#tab-learn').click();await page.waitForURL('**/learn/');await ready();
   assert.equal(await page.locator(control).getAttribute('aria-pressed'),'true');
   await page.locator('#practice-helper-retry').click();
   assert.equal(await page.locator(game==='poker'?'#street-0':'#guess-3').getAttribute('aria-pressed'),game==='poker'?'true':'false');
   const ids=await page.locator('[id]').evaluateAll(nodes=>nodes.map(n=>n.id));assert.equal(ids.length,new Set(ids).size,`${game}: helper IDs stay unique`);
  }
  for(const [game,step] of [['catan','basic-produce'],['coup','basic-challenge'],['avalon','basic-vote'],['poker','basic-streets'],['moth','basic-discard']])for(const lang of ['en','es']){
   await visit(game,lang);await select(step);
   for(const width of [320,390,768,1440])for(const theme of ['light','dark']){
    await page.setViewportSize({width,height:900});await page.evaluate(theme=>document.documentElement.setAttribute('data-theme',theme),theme);
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${game}/${lang}/${width}: no page overflow`);
    assert.deepEqual(await page.locator('.lesson-practice button').evaluateAll(nodes=>nodes.filter(n=>n.getBoundingClientRect().height && (n.scrollWidth>n.clientWidth+2||n.getBoundingClientRect().height<44)).map(n=>n.textContent)),[],`${game}/${lang}/${width}: readable touch controls`);
    await page.locator('#basics').screenshot({animations:'disabled',style:'header,.detail-controls,.skip-link{visibility:hidden!important}',path:`${output}/${game}-${lang}-${theme}-${width}.png`});
   }
  }
  await visit('coup','es');await select('basic-challenge');await page.setViewportSize({width:320,height:900});await page.emulateMedia({reducedMotion:'reduce'});
  await page.addStyleTag({content:'.lesson-practice :is(p,button,label,select,a){font-size:24px!important}'});
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  const art=page.locator('.practice-card-context [data-art]').first();await art.focus();await page.keyboard.press('Enter');await page.waitForSelector('#image-viewer[open]');await page.keyboard.press('Escape');assert.ok(await art.evaluate(el=>el===document.activeElement));
  await page.locator('#basics').screenshot({animations:'disabled',style:'header,.detail-controls,.skip-link{visibility:hidden!important}',path:`${output}/enlarged-320.png`});
  // Portable Learn offers the same inline questions and stable answer IDs offline.
  for(const file of ['index.html','game-night.html']){
   const portable=await browser.newPage({viewport:{width:390,height:900},reducedMotion:'reduce'});await portable.goto(pathToFileURL(path.resolve(file)).href+'#catan/learn');await portable.locator('#lang-en').click();
   await portable.locator('[data-step="1"]').click();assert.ok(await portable.locator('[data-lesson-practice=robber-discard]').isVisible());
   await portable.locator('[data-inline-answer="1"]').click();assert.match(await portable.locator('#inline-practice-feedback').innerText(),/rounds up/);
   await portable.locator('#lang-es').click();assert.equal(await portable.locator('[data-inline-answer="1"]').getAttribute('aria-pressed'),'true');
   await portable.locator('#inline-practice-retry').click();assert.equal(await portable.locator('[data-inline-answer][aria-pressed=true]').count(),0);
   await portable.locator('#inline-practice-continue').click();assert.equal(await portable.locator('#lesson-step-2').getAttribute('aria-current'),'step');
   await portable.evaluate(()=>location.hash='#skull_king/learn');await portable.waitForFunction(()=>state.game==='skull_king');
   await portable.locator('[data-step="3"]').click();await portable.locator('#inline-practice-revisit').click();
   assert.equal(await portable.locator('#scoring-scenario').inputValue(),'1');assert.equal(await portable.locator('#scoring-fact').inputValue(),'1');
   assert.equal(Number(await portable.locator('[data-scoring-total]').first().innerText()),-50);await portable.close();
  }
  assert.deepEqual(errors,[]);console.log(`Contextual practice: 25 outcomes, retries, revisits, language/view persistence, shared isolation, portable parity and 80 responsive captures passed. ${output}`);
 }finally{await browser.close();server.kill();}
})().catch(error=>{console.error(error);server.kill();process.exitCode=1;});
