const {learningStage, learningSetupOptions} = require("./learning-navigation.cjs");
const assert=require('node:assert/strict');
const fs=require('node:fs');const os=require('node:os');const path=require('node:path');const vm=require('node:vm');
const {spawn}=require('node:child_process');const {pathToFileURL}=require('node:url');const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
// These totals are independently specified, not obtained from the fixture or scoreboard model.
const expected={
 skull_king:{'positive-bid':[[40],[-10],[-10]],'zero-bid':[[50],[-50]],'capture-bonus':[[70],[-10]]},
 sushi_go:{dishes:[[22],[12]],'maki-tie':[[3,3,0,0],[2,2,2,0]],'pudding-tie':[[3,3,0,-6],[3,3,-3,-3]]},
 sushi_go_party:{dishes:[[22],[12]],'maki-tie':[[6,6,3,0],[6,6,6,3]],'pudding-tie':[[6,6,0,-6],[6,6,-6,-6]],'maki-six':[[6,6,4,2,0,0],[6,6,4,2,2,0]]},
 dixit:{'some-to-all':[[3,4,3,0,3],[0,2,2,2,2]],'none-to-some':[[0,5,3,2,2],[3,2,1,3,0]]}
};
const data=JSON.parse(vm.runInNewContext(fs.readFileSync(path.join(root,'scoring-examples.js'),'utf8')+'; JSON.stringify(SCORING_EXAMPLES)'));
const catalog=JSON.parse(fs.readFileSync(path.join(root,'src/generated/catalog.json')));
for(const [game,examples] of Object.entries(data)){
 assert.equal(examples.scenarios.length,Object.keys(expected[game]).length);
 for(const s of examples.scenarios){
  assert.equal(s.states.length,expected[game][s.id].length);
  assert.ok(catalog.games[game].sections.some(r=>r.id===s.rule),`${game}/${s.id}: real rule link`);
  for(const [i,state] of s.states.entries()){
   assert.deepEqual(state.rows.map(r=>r.terms.reduce((n,t)=>n+t.value,0)),expected[game][s.id][i]);
   for(const card of state.cards){assert.ok(card.count>=0);if(card.art)assert.ok(catalog.official[card.art],card.art);}
   if(game.startsWith('sushi')&&s.id==='dishes')assert.equal(state.cards.reduce((n,c)=>n+c.count,0),8,'Valid four-player plate');
   if(state.votes){assert.equal(state.votes.length,4);state.votes.forEach((v,i)=>assert.notEqual(v.card,i+2,'No self-vote'));}
  }
  if(game==='dixit')assert.equal(s.states[0].votes.filter((v,i)=>v.card!==s.states[1].votes[i].card).length,1,'Exactly one vote changes');
 }
}
const server=spawn(process.execPath,['scripts/serve-export.mjs'],{cwd:root,stdio:['ignore','pipe','inherit']});
const origin=new Promise((r,j)=>{server.stdout.once('data',d=>r(String(d).trim()));server.once('error',j);});
const output=fs.mkdtempSync(path.join(os.tmpdir(),'tablefolk-scoring-'));
const totals=page=>page.locator('[data-scoring-total]').evaluateAll(nodes=>nodes.map(n=>Number(n.textContent)));
const scores=page=>page.evaluate(()=>Object.fromEntries(Object.entries(localStorage).filter(([key])=>/score|session|timer|clock/.test(key))));
(async()=>{
 const base=await origin;const browser=await chromium.launch({headless:true,...(process.env.CHROME_CHANNEL?{channel:process.env.CHROME_CHANNEL}:{})});
 try{
  const noJS=await browser.newPage({javaScriptEnabled:false});
  for(const game of Object.keys(expected)){await noJS.goto(`${base}/es/${game}/learn/`);assert.ok((await noJS.locator('#scoring-example').textContent()).length>400,'Worked text is prerendered');assert.ok(await noJS.locator('[data-scoring-total]').count());}await noJS.close();
  for(const portable of [false,true]){
   const context=await browser.newContext({viewport:{width:390,height:900},reducedMotion:'reduce'});const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await context.addInitScript(() => {
    try { if(!localStorage.getItem('tablefolk-skull-score-v1'))localStorage.setItem('tablefolk-skull-score-v1', JSON.stringify({
     version:1,game:{setup:{mode:'classic',expansion:false,players:['Real Ana','Real Bruno']},rounds:[{round:1,cards:1,entries:[{bid:1,tricks:1,bonus:0,adjustment:0,explanation:''},{bid:0,tricks:0,bonus:0,adjustment:0,explanation:''}]}]},
     draft:{round:2,cards:'2',entries:[{bid:'1',tricks:'',bonus:'0',adjustment:'0',explanation:''},{bid:'0',tricks:'',bonus:'0',adjustment:'0',explanation:''}]}
    })); } catch {}
   });
   if(portable)await context.setOffline(true);
   for(const game of Object.keys(expected)){
    if(portable){await page.goto(pathToFileURL(path.join(root,'game-night.html')).href+'#'+game+'/learn');await page.locator('#lang-en').click();}
    else{await page.goto(`${base}/en/${game}/learn/`);await page.waitForSelector('[data-tool=sources][data-ready=true]');await learningStage(page,'end');}
    const before=await scores(page);
    assert.ok(before['tablefolk-skull-score-v1'],'An existing game with scores and an unfinished draft is present');
    for(const [i,s] of data[game].scenarios.entries()){
     await page.selectOption('#scoring-scenario',String(i));
     for(const [fact,values] of expected[game][s.id].entries()){
      await page.selectOption('#scoring-fact',String(fact));assert.deepEqual(await totals(page),values,`${portable?'portable':'hosted'}/${game}/${s.id}/${fact}`);
      if(!portable)assert.equal(await page.locator('#scoring-example').getAttribute('data-scoring-owner'),'react','The runtime never replaces React teaching content');
      assert.ok((await page.locator('.scoring-explanation').innerText()).length>30);
      assert.ok(await page.locator('#scoring-fact').evaluate(el=>el===document.activeElement)||!portable); // Portable patch restores focus.
     }
     await page.locator('#scoring-replay').focus();await page.keyboard.press('Enter');assert.deepEqual(await totals(page),expected[game][s.id][0]);
     assert.ok(await page.locator('#scoring-heading').evaluate(el=>el===document.activeElement),'Replay returns focus');
    }
    if(game==='skull_king'){
     await page.selectOption('#scoring-scenario','2');await page.selectOption('#scoring-fact','1');await learningSetupOptions(page);await page.locator('#skull-expansion-toggle').click();
     assert.deepEqual(await totals(page),[-10],'Guide expansion cannot change base-box example');
    }
    if(!(await page.locator('#scoring-example [data-art]').count()))await page.selectOption('#scoring-scenario','0');
    const zoom=page.locator('#scoring-example [data-art]').first();
    await zoom.focus();await page.keyboard.press('Enter');assert.equal(await page.locator('#image-viewer[open]').count(),1);await page.keyboard.press('Escape');assert.ok(await zoom.evaluate(el=>el===document.activeElement));
    assert.deepEqual(await scores(page),before,'Practice never changes scores or drafts');
    if(!portable){
     // Keep worked state while switching learning stages.
     await page.selectOption('#scoring-scenario','0');await page.selectOption('#scoring-fact','1');
     await learningStage(page,'turn');await learningStage(page,'end');
     assert.deepEqual(await totals(page),expected[game][data[game].scenarios[0].id][1],'Learning-stage navigation keeps example state');
     for(const lang of ['en','es']){
      if(lang==='es'){await page.goto(`${base}/es/${game}/learn/`);await page.waitForSelector('[data-tool=sources][data-ready=true]');await learningStage(page,'end');}
      await page.selectOption('#scoring-scenario',game==='skull_king'?'2':game==='dixit'?'1':'0');await page.selectOption('#scoring-fact','1');
      for(const theme of ['dark','light']){
       if(await page.locator('html').getAttribute('data-theme')!==theme)await page.locator('#theme').click();
       for(const width of [320,390,768,1440]){
        await page.setViewportSize({width,height:900});
        const overflow=await page.locator('#scoring-example').evaluate(root=>[root,...root.querySelectorAll('*')].filter(el=>el.clientWidth>0&&el.scrollWidth>el.clientWidth+2).map(el=>el.className));
        assert.deepEqual(overflow,[],`${game}/${lang}/${theme}/${width}: internal clipping`);
        for(const control of await page.locator('#scoring-example button,#scoring-example select').all())assert.ok((await control.boundingBox()).height>=44);
        await page.locator('#scoring-example').screenshot({style:'header,.detail-controls,.skip-link{visibility:hidden!important}',path:path.join(output,`${game}-${lang}-${theme}-${width}.png`)});
       }
      }
     }
     await page.setViewportSize({width:320,height:900});await page.addStyleTag({content:'#scoring-example :is(p,li,strong,span,small,a,button,label,select,dt,dd){font-size:24px!important;line-height:1.5!important}'});
     assert.ok(await page.locator('#scoring-example').evaluate(el=>el.scrollWidth<=el.clientWidth+1),'Enlarged text fits');
     await page.locator('#scoring-example').screenshot({style:'header,.detail-controls,.skip-link{visibility:hidden!important}',path:path.join(output,`${game}-es-enlarged-320.png`)});
    }else{await page.locator('#lang-es').click();assert.ok((await page.locator('#scoring-title').innerText()).length>15);await page.setViewportSize({width:320,height:900});assert.ok(await page.locator('#scoring-example').evaluate(el=>el.scrollWidth<=el.clientWidth+1));}
   }
   assert.deepEqual(errors,[]);await context.close();
  }
  const broken=await browser.newPage();await broken.route('**/assets/images/**',r=>r.abort());await broken.goto(`${base}/en/sushi_go/learn/#scoring-example`);await broken.waitForSelector('[data-tool=sources][data-ready=true]');
  assert.ok(await broken.locator('#scoring-example').isVisible(),'Scoring deep link opens end lesson');assert.deepEqual(await totals(broken),[22]);await broken.selectOption('#scoring-fact','1');assert.deepEqual(await totals(broken),[12]);await broken.close();
  console.log(`PASS: 25 independently expected worked outcomes, hosted/portable, score isolation, one-vote changes, replay, keyboard, zoom, source links, no-JS, failed images, EN/ES, both themes, four widths, enlarged text. Screenshots: ${output}`);
 }finally{await browser.close();server.kill();}
})().catch(e=>{console.error(e);server.kill();process.exitCode=1;});
