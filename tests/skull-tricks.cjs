const {learningStage, learningExample, learningSetupOptions, openDisclosure} = require("./learning-navigation.cjs");
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const vm = require('node:vm');
const {spawn} = require('node:child_process');
const {pathToFileURL} = require('node:url');
const {chromium} = require('playwright');
const root = path.resolve(__dirname,'..');
// Hand-authored expectations from the rulebook; no trick solver or UI-derived oracle.
const expected = {
  'follow-suit':[2,2,[true,false,false]], 'black-trump':[2,2,[true,true,true]],
  'escape-lead':[1,1,[true,true,false]], 'all-escapes':[0,0,[true,true,true]],
  'mermaid-numbers':[2,2,[true,true,false]], 'pirate-mermaid':[2,2,[true,true,true]],
  'king-pirate':[2,2,[true,true,true]], 'three-characters':[2,2,[true,true,true]],
  'tigress-pirate':[0,0,[true,true,true]], 'tigress-escape':[1,1,[true,false,true]],
  kraken:[null,1,[true,true,false]], 'white-whale':[1,1,[true,true,false]],
  loot:[2,2,[true,false,true]], 'rosie-power':[0,2,[true,true,true]],
  'first-mate':[2,2,[true,true,true]],
};
const fixtures=vm.runInNewContext(fs.readFileSync(path.join(root,'skull-tricks.js'),'utf8')+';JSON.stringify(SKULL_TRICKS)');
const data=JSON.parse(fixtures);
assert.equal(data.scenarios.length,Object.keys(expected).length);
for(const s of data.scenarios){
  assert.deepEqual([s.winner,s.next,s.hand.map(c=>c.legal)],expected[s.id],s.id);
  assert.ok(s.hand.some(c=>c.card===s.plays[2]&&c.legal),`${s.id}: shown play is in hand and legal`);
  for(const id of [...s.plays,...s.hand.map(c=>c.card)]) assert.ok(data.cards[id],id);
}
const server=spawn(process.execPath,['scripts/serve-export.mjs'],{cwd:root,stdio:['ignore','pipe','inherit']});
const origin=new Promise((resolve,reject)=>{server.stdout.once('data',d=>resolve(d.toString().trim()));server.once('error',reject);server.once('exit',code=>reject(new Error('server '+code)));});
(async()=>{
 const base=await origin;
 const browser=await chromium.launch({headless:true,...(process.env.CHROME_CHANNEL?{channel:process.env.CHROME_CHANNEL}:{})});
 const output=fs.mkdtempSync(path.join(os.tmpdir(),'tablefolk-skull-tricks-'));
 try{
  const noJS=await browser.newPage({javaScriptEnabled:false});await noJS.goto(`${base}/es/skull_king/learn/`);
  assert.match(await noJS.locator('#skull-trick-lesson').innerText(),/Una baza(?: \(.*?\))? es/);
  assert.equal(await noJS.locator('.trick-play').count(),3);await noJS.close();
  for(const portable of [false,true]){
   const context=await browser.newContext({viewport:{width:390,height:900},reducedMotion:'reduce'});
   const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
   if(portable){await context.setOffline(true);await page.goto(pathToFileURL(path.join(root,'game-night.html')).href+'#skull_king/learn');await page.locator('#lang-en').click();}
   else{await page.goto(`${base}/en/skull_king/learn/`);await page.waitForFunction(()=>document.querySelector('[data-tool=sources][data-ready=true]'));await learningExample(page);}
   const scoreBefore=await page.evaluate(()=>localStorage.getItem('tablefolk-skull-score-v1'));
   assert.equal(await page.locator('#trick-example option').count(),10);
   await openDisclosure(page, '.example-extras');
   await page.locator('.trick-options summary').click();
   await page.locator('.trick-options input').nth(0).check();await page.locator('.trick-options input').nth(1).check();
   assert.equal(await page.locator('#trick-example option').count(),14);
   await learningSetupOptions(page);await page.locator('#skull-expansion-toggle').click();assert.equal(await page.locator('#trick-example option').count(),15);
   for(const [id,[winner,next,legal]] of Object.entries(expected)){
    await page.selectOption('#trick-example',id);
    assert.equal(await page.locator('.trick-result').innerText(),'');
    assert.deepEqual(await page.locator('.trick-hand li').evaluateAll(nodes=>nodes.map(n=>n.dataset.legal==='true')),legal);
    // Intentionally wrong first, then correct; the authored result must stay the same.
    await page.locator(`[name=trick-winner][value="${winner===0?1:0}"]`).check();
    await page.locator('[data-trick-reveal]').click();assert.match(await page.locator('.trick-result').innerText(),/different result/);
    await page.locator(`[name=trick-winner][value="${winner??-1}"]`).check();await page.locator('[data-trick-reveal]').click();
    const result=await page.locator('.trick-result').innerText();
    assert.ok(result.includes(`Winner: ${winner===null?'Nobody':['Ana','Bruno','Cami'][winner]}. Leads next: ${['Ana','Bruno','Cami'][next]}.`),id);
    assert.match(result,/Your prediction is correct/);
    assert.equal(await page.locator('.trick-play[data-winner=true]').count(),winner===null?0:1);
    await page.locator('.trick-controls button').nth(1).click();assert.equal(await page.locator('.trick-result').innerText(),'');
    assert.ok(await page.locator('.trick-example h3').evaluate(el=>el===document.activeElement),'Replay restores focus');
   }
   await page.selectOption('#trick-example','first-mate');await page.locator('#skull-expansion-toggle').click();
   assert.equal(await page.locator('[data-scenario=first-mate]').count(),0);
   assert.equal(await page.locator('#trick-example option[value=first-mate]').count(),0);
   await page.locator('.trick-options').evaluate(el=>el.open=true);
   await page.locator('.trick-options input').nth(0).uncheck();await page.locator('.trick-options input').nth(1).uncheck();
   assert.equal(await page.locator('#trick-example option').count(),10);
   await page.selectOption('#trick-example','three-characters');
   if(!portable) for(let beat=0;beat<3;beat++) await page.locator('[data-watch-next]').click();
   if(await page.locator('.watch-history-toggle').isVisible())await page.locator('.watch-history-toggle').click();
   const image=page.locator('.trick-play [data-art]').first();await image.focus();await page.keyboard.press('Enter');
   assert.equal(await page.locator('#image-viewer[open]').count(),1);await page.keyboard.press('Escape');
   assert.ok(await image.evaluate(el=>el===document.activeElement),'Zoom focus returns');
   await page.locator('.trick-controls button').last().click();assert.equal(await page.locator('.trick-example').getAttribute('data-scenario'),'tigress-pirate');
   await page.locator('.trick-controls button').first().click();assert.equal(await page.locator('.trick-example').getAttribute('data-scenario'),'three-characters');
   await page.locator('[name=trick-winner][value="2"]').focus();await page.keyboard.press('Space');
   await page.locator('[data-trick-reveal]').focus();await page.keyboard.press('Enter');
   assert.match(await page.locator('.trick-result').innerText(),/regardless of play order/);
   assert.equal(await page.evaluate(()=>localStorage.getItem('tablefolk-skull-score-v1')),scoreBefore,'Practice never writes scores');
   if(!portable){
    for(const lang of ['en','es']){
     if(lang==='es'){await page.goto(`${base}/es/skull_king/learn/`);await page.waitForFunction(()=>document.querySelector('[data-tool=sources][data-ready=true]'));await learningExample(page);}
     await openDisclosure(page, '.example-extras');await page.selectOption('#trick-example','three-characters');await page.locator('[data-trick-reveal]').click();
     for(const theme of ['dark','light']){
      if(await page.locator('html').getAttribute('data-theme')!==theme)await page.locator('#theme').click();
      for(const width of [320,390,768,1440]){
       await page.setViewportSize({width,height:900});
       if(await page.locator('.watch-history-toggle').isVisible() && await page.locator('.watch-history-toggle').getAttribute('aria-expanded') === 'false')await page.locator('.watch-history-toggle').click();
       const overflow=await page.locator('#skull-trick-lesson').evaluate(root=>[root,...root.querySelectorAll('*')].filter(el=>el.clientWidth>0&&el.scrollWidth>el.clientWidth+2).map(el=>el.className));
       assert.deepEqual(overflow,[],`${lang}/${theme}/${width}: internal clipping`);
       for(const button of await page.locator('.trick-controls button,[data-trick-reveal],.trick-play [data-art]').all())assert.ok((await button.boundingBox()).height>=44);
       await page.locator('#skull-trick-lesson').screenshot({style:'header,.detail-controls{visibility:hidden!important}',path:path.join(output,`${lang}-${theme}-${width}.png`)});
      }
     }
    }
    await page.setViewportSize({width:320,height:900});
    await page.addStyleTag({content:'#skull-trick-lesson :is(p,li,strong,span,a,button,label,select,legend){font-size:28px!important;line-height:1.5!important}'});
    assert.ok(await page.locator('#skull-trick-lesson').evaluate(el=>el.scrollWidth<=el.clientWidth+1),'Enlarged text fits');
    await page.locator('#skull-trick-lesson').screenshot({style:'header,.detail-controls{visibility:hidden!important}',path:path.join(output,'es-enlarged-320.png')});
   }else{
    await page.locator('#lang-es').click();assert.match(await page.locator('.trick-result').innerText(),/sin importar el orden/);
    await page.setViewportSize({width:320,height:900});assert.ok(await page.locator('#skull-trick-lesson').evaluate(el=>el.scrollWidth<=el.clientWidth+1));
   }
   assert.deepEqual(errors,[]);await context.close();
  }
  const broken=await browser.newPage();await broken.route('**/assets/images/**',r=>r.abort());await broken.goto(`${base}/en/skull_king/learn/`);
  await broken.waitForSelector('[data-tool=sources][data-ready=true]');await learningExample(broken);
  await openDisclosure(broken, '.example-extras');await broken.selectOption('#trick-example','three-characters');await broken.locator('[data-trick-reveal]').click();
  assert.match(await broken.locator('.trick-result').innerText(),/Mermaid wins/);assert.equal(await broken.locator('.trick-card-name').count(),3);await broken.close();
  console.log(`PASS: 15 independently specified scenarios, hosted/portable, legal hands, predictions, variant isolation, no score writes, keyboard, zoom, no-JS, image failures and responsive layouts. Screenshots: ${output}`);
 }finally{await browser.close();server.kill();}
})().catch(e=>{console.error(e);server.kill();process.exitCode=1;});
