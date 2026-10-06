const {learningStage, learningExample} = require("./learning-navigation.cjs");
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const vm = require('node:vm');
const {spawn} = require('node:child_process');
const {pathToFileURL} = require('node:url');
const {chromium, webkit} = require('playwright');
const root = path.resolve(__dirname,'..');
const data = JSON.parse(vm.runInNewContext(fs.readFileSync(path.join(root,'coup-lessons.js'),'utf8')+';JSON.stringify(COUP_LESSON)'));

// Independent, hand-authored rulebook expectations. Each tuple is coins/influence.
// The renderer/fixtures never compute these expected values.
const cases = [
  {example:'tax',path:['tax-pass'],totals:[[5,2],[2,2],[2,2]],lost:[[],[],[]],next:'Bruno'},
  {example:'tax',path:['tax-challenge','tax-proof','tax-true'],totals:[[5,2],[2,1],[2,2]],lost:[[],['coup-captain'],[]],next:'Bruno'},
  {example:'tax',path:['tax-challenge','tax-caught'],totals:[[2,1],[2,2],[2,2]],lost:[['coup-captain'],[],[]],next:'Bruno'},
  {example:'assassination',path:['assassin-response','assassin-hit'],totals:[[2,2],[2,1],[2,2]],lost:[[],['coup-captain'],[]],next:'Bruno'},
  {example:'assassination',path:['assassin-response','assassin-challenge','assassin-caught'],totals:[[5,1],[2,2],[2,2]],lost:[['coup-captain'],[],[]],next:'Bruno'},
  {example:'assassination',path:['assassin-response','assassin-challenge','assassin-proof','assassin-after-proof','assassin-double'],totals:[[2,2],[0,0],[2,2]],lost:[[],['coup-captain','coup-duke'],[]],next:'Cami'},
  {example:'assassination',path:['assassin-response','assassin-challenge','assassin-proof','assassin-after-proof','late-block'],totals:[[2,2],[2,1],[2,2]],lost:[[],['coup-captain'],[]],next:'Bruno'},
  {example:'assassination',path:['assassin-response','block-claim','block-pass'],totals:[[2,2],[2,2],[2,2]],lost:[[],[],[]],next:'Bruno'},
  {example:'assassination',path:['assassin-response','block-claim','block-challenge','block-proof','block-true'],totals:[[2,1],[2,2],[2,2]],lost:[['coup-duke'],[],[]],next:'Bruno'},
  {example:'assassination',path:['assassin-response','block-claim','block-challenge','block-caught','block-double'],totals:[[2,2],[0,0],[2,2]],lost:[[],['coup-captain','coup-duke'],[]],next:'Cami'},
];
const proofs={'tax-proof':[0,'coup-duke'],'assassin-proof':[0,'coup-assassin'],'block-proof':[1,'coup-contessa']};
const visited=new Set();
for(const c of cases){
  let current=data.scenarios.find(s=>s.id===c.example).start;visited.add(current);
  for(const id of c.path){assert.ok(data.nodes[current].choices.some(x=>x.to===id),`${current} → ${id}`);current=id;visited.add(id);}
  const n=data.nodes[current];
  assert.deepEqual(n.players.map(p=>[p.coins,p.hidden]),c.totals,current);
  assert.deepEqual(n.players.map(p=>p.lost),c.lost,current);
  assert.equal(n.players[n.next].name,c.next,current);assert.equal(n.choices.length,0);
}
assert.deepEqual([...visited].sort(),Object.keys(data.nodes).sort(),'Every node is exercised');
for(const [id,n] of Object.entries(data.nodes)){
  for(const lang of ['en','es'])assert.ok(n.title[lang]&&n.explanation[lang]);
  for(const [i,p] of n.players.entries()){
    assert.equal(p.hidden+p.lost.length,2,`${id}: influence is conserved`);
    assert.equal(p.proof,proofs[id]?.[0]===i?proofs[id][1]:null,`${id}: reveal only at the proof step`);
  }
}
const seed=JSON.stringify({names:['Session A','Session B','Session C'],mode:'default',planned:6,started:true,locked:true,results:[{winner:1,runnerUp:0}],setupDraft:null,resultDraft:{index:null,winner:'2',runnerUp:'1'},renameDraft:null});
const server=spawn(process.execPath,['scripts/serve-export.mjs'],{cwd:root,stdio:['ignore','pipe','inherit']});
const origin=new Promise((resolve,reject)=>{server.stdout.once('data',d=>resolve(d.toString().trim()));server.once('error',reject);server.once('exit',code=>reject(new Error('server '+code)));});
(async()=>{
  const base=await origin;
  const browser=await ({chromium,webkit}[process.env.BROWSER||'chromium']).launch({headless:true,...(process.env.CHROME_CHANNEL?{channel:process.env.CHROME_CHANNEL}:{})});
  const output=fs.mkdtempSync(path.join(os.tmpdir(),'tablefolk-coup-lessons-'));
  const ready=page=>page.waitForFunction(()=>document.querySelector('[data-tool=sources][data-ready=true]'));
  const scene=page=>page.locator('.coup-scene');
  const choose=async(page,id)=>{
    await page.locator(`[data-coup-choice="${id}"]`).click();
    assert.equal(await scene(page).getAttribute('data-coup-node'),id);
    await page.waitForFunction(()=>document.activeElement?.id==='coup-step-heading');
  };
  try{
    const noJS=await browser.newPage({javaScriptEnabled:false});
    for(const lang of ['en','es']){
      await noJS.goto(`${base}/${lang}/coup/learn/`);
      assert.equal(await noJS.locator('[data-coup-role]').count(),5,'Character explanations prerendered');
      assert.equal(await noJS.locator('.coup-hidden').count(),6,'Initial hands are hidden before scripts');
      assert.match(await noJS.locator('#coup-lesson').innerText(),lang==='en'?/A claim means/:/Declarar un personaje/);
    }await noJS.close();
    for(const portable of [false,true]){
      const context=await browser.newContext({viewport:{width:390,height:900},reducedMotion:'reduce'});
      await context.addInitScript(value=>localStorage.setItem('tablefolk-coup-session',value),seed);
      const page=await context.newPage(),errors=[],requests=[];
      page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/^https?:/.test(r.url()))requests.push(r.url());});
      if(portable){await context.setOffline(true);await page.goto(pathToFileURL(path.join(root,'game-night.html')).href+'#coup/learn');await page.locator('#lang-en').click();}
      else{await page.goto(`${base}/en/coup/learn/`);await ready(page);await learningExample(page);}
      for(const lang of ['en','es']){
        if(lang==='es'){
          if(portable)await page.locator('#lang-es').click();
          else{await page.goto(`${base}/es/coup/learn/`);await ready(page);await learningExample(page);}
        }
        for(const exchange of ['ambassador','inquisitor']){
          if(!(await page.locator(`[data-coup-role="coup-${exchange}"]`).count()))await page.locator('#inquisitor-toggle').click();
          assert.equal(await page.locator('[data-coup-role]').count(),5);
          assert.equal(await page.locator(`[data-coup-role="coup-${exchange==='ambassador'?'inquisitor':'ambassador'}"]`).count(),0);
          for(const c of cases){
            await page.locator(`[data-coup-example="${c.example}"]`).click();await page.locator('[data-coup-replay]').click();
            assert.equal(await page.locator('.coup-hidden').count(),6,'Replay restores face-down hands');
            for(const id of c.path){
              await choose(page,id);
              assert.ok(await page.locator('#coup-step-heading').evaluate(el=>el===document.activeElement),'Step change restores keyboard focus');
              const expectedProof=proofs[id];
              assert.equal(await page.locator('[data-coup-proof]').count(),expectedProof?1:0);
              if(expectedProof)assert.equal(await page.locator('[data-coup-proof]').getAttribute('data-coup-proof'),expectedProof[1]);
            }
            const actual=await page.locator('[data-coup-example-player]').evaluateAll(nodes=>nodes.map(n=>[Number(n.dataset.coins),Number(n.dataset.influence)]));
            assert.deepEqual(actual,c.totals,`${portable}/${lang}/${exchange}/${c.path.at(-1)}`);
            for(let i=0;i<3;i++)assert.deepEqual(await page.locator(`[data-coup-example-player="${i}"] [data-coup-lost]`).evaluateAll(nodes=>nodes.map(n=>n.dataset.coupLost)),c.lost[i]);
            assert.ok((await page.locator('.coup-outcome').innerText()).includes(c.next));
            assert.equal(await page.locator('.coup-hidden').count(),c.totals.reduce((sum,p)=>sum+p[1],0),'Replacement identities stay hidden');
            await page.locator('[data-coup-back]').click();
            await choose(page,c.path.at(-1));
            assert.equal(await page.evaluate(()=>localStorage.getItem('tablefolk-coup-session')),seed,'Live results and draft unchanged');
          }
        }
      }
      // Keyboard activation, enlargement, focus return and deterministic replay.
      await page.locator('[data-coup-example=tax]').focus();await page.keyboard.press('Enter');
      await page.locator('[data-coup-replay]').focus();await page.keyboard.press('Enter');
      await page.locator('[data-coup-choice=tax-challenge]').focus();await page.keyboard.press('Enter');
      await choose(page,'tax-proof');
      const art=page.locator('[data-coup-proof] [data-art]');await art.focus();await page.keyboard.press('Enter');
      assert.equal(await page.locator('#image-viewer[open]').count(),1);await page.keyboard.press('Escape');
      assert.ok(await art.evaluate(el=>el===document.activeElement));
      await choose(page,'tax-true');
      const beforeVariant=await scene(page).getAttribute('data-coup-node');
      if(await page.locator('.coup-variant').count())await page.locator('#reformation-toggle').click();
      assert.equal(await page.locator('.coup-variant').count(),0);
      await page.locator('#reformation-toggle').click();assert.equal(await page.locator('.coup-variant').count(),1);
      assert.equal(await scene(page).getAttribute('data-coup-node'),beforeVariant,'Variant changes preserve practice progress');
      if(portable){assert.deepEqual(requests,[],'Portable examples never request network resources');}
      else{
        for(const lang of ['en','es']){
          await page.goto(`${base}/${lang}/coup/learn/`);await ready(page);await learningExample(page);
          await page.locator('[data-coup-example=assassination]').click();
          await page.locator('[data-coup-replay]').click(); // Navigation now preserves the branch; replay explicitly starts this fixture.
          for(const id of ['assassin-response','block-claim','block-challenge','block-caught','block-double'])await choose(page,id);
          for(const theme of ['dark','light']){
            if(await page.locator('html').getAttribute('data-theme')!==theme)await page.locator('#theme').click();
            for(const width of [320,390,768,1440]){
              await page.setViewportSize({width,height:900});
              const overflow=await page.locator('#coup-lesson').evaluate(el=>[el,...el.querySelectorAll('*')].filter(n=>n.clientWidth>0&&n.scrollWidth>n.clientWidth+2).map(n=>n.className));
              assert.deepEqual(overflow,[],`${lang}/${theme}/${width}: internal clipping`);
              for(const b of await page.locator('#coup-lesson button:visible').all())assert.ok((await b.boundingBox()).height>=44,'Touch target height');
              await scene(page).screenshot({style:'header,.detail-controls,.skip-link{visibility:hidden!important}',path:path.join(output,`${lang}-${theme}-${width}-scene.png`)});
              await page.locator('.coup-role-grid').screenshot({style:'header,.detail-controls,.skip-link{visibility:hidden!important}',path:path.join(output,`${lang}-${theme}-${width}-roles.png`)});
            }
          }
        }
        await page.setViewportSize({width:320,height:900});
        await page.locator('[data-coup-replay]').click();
        await choose(page,'assassin-response');
        assert.equal(await page.locator('[data-coup-choice]').count(),3);
        await scene(page).screenshot({style:'header,.detail-controls,.skip-link{visibility:hidden!important}',path:path.join(output,'es-choices-320.png')});
        await choose(page,'assassin-challenge');await choose(page,'assassin-proof');
        await page.addStyleTag({content:'#coup-lesson :is(p,strong,span,a,button,small,h3,h4,h5){font-size:28px!important;line-height:1.5!important}'});
        assert.deepEqual(await page.locator('#coup-lesson').evaluate(el=>[el,...el.querySelectorAll('*')].filter(n=>n.clientWidth>0&&n.scrollWidth>n.clientWidth+2).map(n=>n.className)),[],'Enlarged text has no internal clipping');
        await scene(page).screenshot({style:'header,.detail-controls,.skip-link{visibility:hidden!important}',path:path.join(output,'es-enlarged-320.png')});
      }
      assert.deepEqual(errors,[]);await context.close();
    }
    const broken=await browser.newPage({viewport:{width:390,height:900}});
    await broken.route('**/assets/images/**',r=>r.abort());await broken.goto(`${base}/en/coup/learn/`);await ready(broken);await learningExample(broken);
    await choose(broken,'tax-challenge');await choose(broken,'tax-proof');
    assert.match(await broken.locator('[data-coup-proof]').innerText(),/Duke/);
    assert.match(await broken.locator('.coup-explanation').innerText(),/Bruno loses/);await broken.close();
    console.log(`PASS: 10 independently expected Coup outcomes, 22 stages, hosted/offline, both languages/exchange choices, state isolation, keyboard, zoom and responsive QA. Screenshots: ${output}`);
  }finally{await browser.close();server.kill();}
})().catch(e=>{console.error(e);server.kill();process.exitCode=1;});
