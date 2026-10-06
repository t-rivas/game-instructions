const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {spawn} = require('node:child_process');
const {chromium} = require('playwright');
const {learningLesson} = require('./learning-navigation.cjs');
const root = path.resolve(__dirname,'..');
const catalog = JSON.parse(fs.readFileSync(path.join(root,'src/generated/catalog.json')));
const data = catalog.lessonComparisons;
// Rulebook expectations written independently, not computed by an evaluator.
assert.deepEqual(data.skull_king[0].situations.map(s=>[s.snapshot.plays,s.snapshot.winner,s.snapshot.next]),[
  [['mermaid','black-14','pirate'],2,2], [['mermaid','king','pirate'],0,0],
]);
assert.deepEqual(data.coup[0].situations.map(s=>s.snapshot.players.map(p=>[p.name,p.coins,p.hidden,p.lost,p.proof])),[
  [['Ana',5,2,[],null],['Bruno',2,1,['coup-captain'],null],['Cami',2,2,[],null]],
  [['Ana',2,1,['coup-captain'],null],['Bruno',2,2,[],null],['Cami',2,2,[],null]],
]);
assert.deepEqual(data.avalon[0].situations.map(s=>{
  const q=s.snapshot;
  return [q.players,q.roster.length,q.team.length,q.size,q.quest,q.fails,q.successes,q.threshold,q.succeeds,q.roster.filter(r=>r.side==='good').length,q.roster.filter(r=>r.side==='evil').length];
}),[[6,6,3,3,4,1,2,1,false,4,2],[7,7,4,4,4,1,3,2,true,4,3]]);
for(const [game,comparisons] of Object.entries(data)) for(const c of comparisons){
  assert.ok(catalog.games[game].sections.some(s=>s.id===c.rule));
  for(const s of c.situations) for(const g of s.groups) for(const item of g.items){
    assert.ok(item.name.en && item.name.es,'Identity survives image failures');
    if(item.art) assert.ok(catalog.official[item.art],`${item.art}: existing published art`);
  }
}
const output=process.env.COMPARISON_SCREENSHOTS || path.join(root,'docs/comparison-review');
fs.mkdirSync(output,{recursive:true});
const server=spawn(process.execPath,['scripts/serve-export.mjs'],{cwd:root,stdio:['ignore','pipe','inherit']});
const cases=[['skull_king','basic-trick','mermaid-king',['2','0']],['coup','basic-challenge','challenged-tax',['tax','cancelled']],['avalon','basic-quest','fourth-quest',['fail','success']]];
(async()=>{
  const base=await new Promise((resolve,reject)=>{server.stdout.once('data',c=>resolve(c.toString().trim()));server.once('error',reject);});
  const browser=await chromium.launch();
  const errors=[];
  try{
    for(const lang of ['en','es']) for(const theme of ['light','dark']){
      const context=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
      const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
      // Include representative existing snapshots and preferences in isolation checks.
      await context.addInitScript(()=>{
        if(!localStorage.getItem('comparison-test-seeded')){
          localStorage.setItem('tablefolk-coup-session',JSON.stringify({names:['Session A','Session B','Session C'],mode:'default',planned:6,started:true,locked:true,results:[{winner:1,runnerUp:0}],setupDraft:null,resultDraft:{index:null,winner:'2',runnerUp:'1'},renameDraft:null}));
          localStorage.setItem('tablefolk-skull-score-v1','{"sentinel":"existing scores"}');
          localStorage.setItem('comparison-test-seeded','1');
        }
      });
      for(const [game,lesson,id,results] of cases){
        await page.goto(`${base}/${lang}/${game}/learn/`);
        await page.waitForSelector('[data-tool=sources][data-ready=true]',{state:'attached'});
        await learningLesson(page,lesson);
        if(await page.locator('html').getAttribute('data-theme')!==theme)await page.locator('#theme').click();
        const panel=page.locator(`[data-comparison=${id}]`);
        assert.equal(await panel.evaluate(n=>n.open),false,'Comparison starts optional');
        const baseline=await page.evaluate(()=>JSON.stringify(Object.fromEntries(Object.entries(localStorage))));
        const otherLearning=await page.evaluate(()=>JSON.stringify(Object.fromEntries(Object.entries(sessionStorage).filter(([key])=>!key.includes('comparison-')))));
        await panel.locator('summary').focus();await page.keyboard.press('Enter');
        assert.equal(await panel.locator('[data-after=true]:visible').count(),0,'Resolution cards stay concealed before reveal');
        await panel.locator('[data-comparison-reveal]').focus();await page.keyboard.press('Enter');
        assert.deepEqual(await panel.locator('[data-comparison-result]').evaluateAll(ns=>ns.filter(n=>!n.hidden).map(n=>n.dataset.comparisonResult)),results);
        assert.ok(await panel.locator('[data-changed=true]').count()>0,'Changed facts have text and a marker');
        assert.equal(await panel.locator('.comparison-outcome').first().evaluate(n=>getComputedStyle(n).animationName),'none');
        if(game==='skull_king'){
          const art=panel.locator('[data-art]').first();await art.focus();await page.keyboard.press('Enter');
          await page.waitForSelector('#image-viewer[open]');await page.keyboard.press('Escape');
          assert.ok(await art.evaluate(n=>n===document.activeElement),'Image dialog returns keyboard focus');
        }
        for(const width of [1440,390]){
          await page.setViewportSize({width,height:1000});
          const situations=await panel.locator('.comparison-situation').evaluateAll(ns=>ns.map(n=>({x:n.getBoundingClientRect().x,y:n.getBoundingClientRect().y})));
          if(width===1440)assert.ok(Math.abs(situations[0].y-situations[1].y)<2 && situations[1].x>situations[0].x,'Desktop is side by side');
          else assert.ok(situations[1].y>situations[0].y && Math.abs(situations[0].x-situations[1].x)<2,'Phone shows both stacked');
          assert.deepEqual(await panel.evaluate(n=>[n,...n.querySelectorAll('*')].filter(el=>el.clientWidth>0 && el.scrollWidth>el.clientWidth+2).map(el=>el.className)),[],`${lang}/${theme}/${game}/${width}: internal content fits`);
          await panel.screenshot({path:path.join(output,`${lang}-${theme}-${game}-${width}.png`),style:'header,.detail-controls,.skip-link{visibility:hidden!important}'});
        }
        if(game==='avalon'){
          for(const [i,players,team,cards] of [[0,6,3,3],[1,7,4,4]]){
            const s=panel.locator(`[data-situation="${i}"]`);
            assert.equal(await s.locator('.comparison-group').first().locator('.comparison-item').count(),players);
            assert.equal(await s.locator('.comparison-group').first().locator('.comparison-symbol').evaluateAll(ns=>ns.filter(n=>n.textContent==='✓').length),team);
            assert.equal(await s.locator('.comparison-group').last().locator('.comparison-item').count(),cards);
            assert.equal(await s.locator('.comparison-group').last().locator('.comparison-item').filter({hasText:lang==='en'?'Fail':'Fracaso'}).count(),1);
          }
        }
        const final=await panel.locator('.comparison-pair').innerText();
        await panel.locator('[data-comparison-replay]').focus();await page.keyboard.press('Enter');
        assert.equal(await panel.locator('.comparison-outcome:visible').count(),0);
        await page.waitForFunction(()=>document.activeElement?.hasAttribute('data-comparison-reveal'));
        await page.keyboard.press('Enter');
        assert.equal(await panel.locator('.comparison-pair').innerText(),final,'Replay deterministically restores both snapshots');
        assert.equal(await page.evaluate(()=>JSON.stringify(Object.fromEntries(Object.entries(localStorage)))),baseline,'No real state or preferences changed');
        assert.equal(await page.evaluate(()=>JSON.stringify(Object.fromEntries(Object.entries(sessionStorage).filter(([key])=>!key.includes('comparison-'))))),otherLearning,'Other learning state untouched');
      }
      await context.close();
    }
    const context=await browser.newContext({viewport:{width:320,height:900},reducedMotion:'reduce'});
    const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
    const ready=()=>page.waitForSelector('[data-tool=sources][data-ready=true]',{state:'attached'});
    for(const [game,lesson,id] of cases){
      await page.goto(`${base}/en/${game}/learn/`);await ready();await learningLesson(page,lesson);
      const panel=page.locator(`[data-comparison=${id}]`);
      await panel.locator('summary').click();await panel.locator('[data-comparison-reveal]').click();
      const key=`tablefolk-practice-${game}-comparison-${id}-v1`;
      const saved=await page.evaluate(key=>sessionStorage.getItem(key),key);
      await page.locator('#lang-es').click();await page.waitForURL('**/es/**');await ready();
      await page.waitForFunction(id=>document.querySelector(`[data-comparison=${id}]`)?.open,id);
      assert.equal(await panel.locator('.comparison-outcome:visible').count(),2,'Language change keeps reveal');
      assert.equal(await panel.locator('summary').innerText(),'¿Qué cambia el resultado?');
      await page.goto(`${base}/es/${game}/rules/`);await page.goto(`${base}/es/${game}/learn/`);await ready();
      await page.waitForFunction(id=>document.querySelector(`[data-comparison=${id}]`)?.open,id);
      assert.equal(await panel.locator('.comparison-outcome:visible').count(),2,'View changes keep reveal');
      await page.goto(`${base}/es/${game}/learn/?shared=1`);await ready();await learningLesson(page,lesson);
      assert.equal(await panel.evaluate(n=>n.open),false,'Shared learning starts separate');
      await panel.locator('summary').click();await panel.locator('[data-comparison-reveal]').click();await panel.locator('[data-comparison-replay]').click();
      assert.equal(await page.evaluate(key=>sessionStorage.getItem(key),key),saved,'Temporary share preserves local comparison');
    }
    await context.close();
    // Failed images + enlarged text together, at the narrowest supported width.
    const broken=await browser.newContext({viewport:{width:320,height:900},reducedMotion:'reduce'});
    await broken.route('**/*',route=>route.request().resourceType()==='image'?route.abort():route.continue());
    const large=await broken.newPage();large.on('pageerror',e=>errors.push(e.message));
    for(const [game,lesson,id] of cases){
      await large.goto(`${base}/es/${game}/learn/`);await large.waitForSelector('[data-tool=sources][data-ready=true]',{state:'attached'});await learningLesson(large,lesson);
      const panel=large.locator(`[data-comparison=${id}]`);await panel.locator('summary').click();await panel.locator('[data-comparison-reveal]').click();
      await large.addStyleTag({content:'.lesson-comparison :is(p,b,strong,small,span,h4,h5,a,button,summary){font-size:24px!important;line-height:1.5!important}'});
      assert.deepEqual(await panel.evaluate(n=>[n,...n.querySelectorAll('*')].filter(el=>el.clientWidth>0&&el.scrollWidth>el.clientWidth+2).map(el=>el.className)),[],`${game}: failed images + enlarged text fits`);
      assert.ok((await panel.innerText()).includes('Dato que cambia'));
      await panel.screenshot({path:path.join(output,`es-enlarged-failed-images-${game}-320.png`),style:'header,.detail-controls,.skip-link{visibility:hidden!important}'});
    }
    await broken.close();
    // Offline uses the same outcomes and controls without any network.
    const offline=await browser.newContext({viewport:{width:390,height:900},offline:true,reducedMotion:'reduce'});
    const portable=await offline.newPage();portable.on('pageerror',e=>errors.push(e.message));
    await portable.goto('file://'+path.join(root,'game-night.html'));
    for(const [game,,id,results] of cases){
      await portable.evaluate(game=>location.hash=game+'/learn',game);
      await portable.waitForSelector('#basics [data-step]');
      await portable.locator(`[data-step="${data[game][0].basic}"]`).click();
      const panel=portable.locator(`[data-comparison=${id}]`);await panel.locator('summary').click();
      await panel.locator('[data-comparison-reveal]').focus();await portable.keyboard.press('Enter');
      assert.deepEqual(await panel.locator('[data-comparison-result]').evaluateAll(ns=>ns.filter(n=>!n.hidden).map(n=>n.dataset.comparisonResult)),results);
      await panel.locator('[data-comparison-replay]').click();assert.equal(await panel.locator('.comparison-outcome:visible').count(),0);
      await panel.locator('[data-comparison-reveal]').click();
      assert.ok(await panel.evaluate(n=>n.scrollWidth<=n.clientWidth+1));
    }
    await offline.close();
    assert.deepEqual(errors,[]);
    console.log(`PASS: 6 independently expected outcomes, rule links, consistent cards/rosters/teams, hosted/offline, keyboard/replay, reduced motion, learning isolation, EN/ES, themes, desktop/mobile, enlarged text + failed images. Screenshots: ${output}`);
  }finally{await browser.close();server.kill();}
})().catch(e=>{console.error(e);server.kill();process.exitCode=1;});
