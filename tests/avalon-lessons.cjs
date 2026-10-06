const {learningStage, learningExample} = require("./learning-navigation.cjs");
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const os = require('node:os');
const {spawn} = require('node:child_process');
const {pathToFileURL} = require('node:url');
const {chromium} = require('playwright');
const ctx=vm.createContext({});
vm.runInContext(fs.readFileSync('data.js','utf8')+'\n'+fs.readFileSync('avalon-lessons.js','utf8')+'\nthis.data=AVALON_TEACHING;',ctx);
const d=ctx.data;
const roster=opts=>JSON.parse(JSON.stringify(ctx.avalonExampleRoster(d,opts)));
const fixture=roster({players:10,avalonMode:'optional',optional:['percival','morgana','mordred','oberon']});
const expected={merlin:[2,4,6],assassin:[4,5],percival:[1,4],morgana:[2,5],mordred:[2,4],oberon:[],servant:[]};
for(const r of fixture)assert.deepEqual(r.targets,expected[r.id],r.id+' knowledge');
const noMorgana=roster({players:5,avalonMode:'optional',optional:['percival','oberon']});
assert.deepEqual(noMorgana.find(r=>r.id==='percival').targets,[1]);
assert.deepEqual(noMorgana.find(r=>r.id==='assassin').targets,[]);
const counts={5:[3,2,3],6:[4,2,3],7:[4,3,4],8:[5,3,5],9:[6,3,5],10:[6,4,5]};
const voteTotals={5:[3,2],6:[4,3],7:[4,3],8:[5,4],9:[5,4],10:[6,5]};
for(const [players,[good,evil,size]] of Object.entries(counts)) {
 for(const [i,mode] of ['approve','reject'].entries()) {
  const vote=ctx.avalonExampleVote(+players,mode);
  assert.equal(vote.approvals,voteTotals[players][i]);assert.equal(vote.rejects,+players-voteTotals[players][i]);
  assert.equal(vote.approved,mode==='approve');assert.equal(vote.tied,mode==='reject'&&+players%2===0);
 }
 for(let mask=0;mask<16;mask++) {
  const optional=['percival','morgana','mordred','oberon'].filter((_,i)=>mask&(1<<i));
  if(optional.filter(x=>x!=='percival').length>evil-1)continue;
  const r=roster({players:+players,avalonMode:'optional',optional});
  assert.equal(r.length,+players);assert.equal(r.filter(x=>x.side==='good').length,good);assert.equal(r.filter(x=>x.side==='evil').length,evil);
  for(const quest of [1,4,5]) {
   const size=d.setups[players].quests[quest-1],team=ctx.avalonExampleTeam(r,size);
   assert.equal(team.length,size);assert.equal(team.filter(x=>x.side==='evil').length,2);
   assert.equal(new Set(team.map(x=>x.seat)).size,size);
  }
 }
 for(const quest of [1,4,5]) for(const fails of [0,1,2]) {
  const q=ctx.avalonExampleQuest(d,+players,quest,fails);
  assert.equal(q.succeeds,fails===0||(quest===4&&+players>=7&&fails===1),`${players}/${quest}/${fails}`);
  if(quest===4)assert.equal(q.size,size);
 }
}
const server=spawn(process.execPath,['scripts/serve-export.mjs'],{stdio:['ignore','pipe','inherit']});
const origin=new Promise(resolve=>server.stdout.once('data',d=>resolve(d.toString().trim())));
(async()=>{
 const base=await origin,browser=await chromium.launch({headless:true,...(process.env.CHROME_CHANNEL?{channel:process.env.CHROME_CHANNEL}:{})});
 const output=fs.mkdtempSync(path.join(os.tmpdir(),'tablefolk-avalon-'));
 try {
  const noJS=await browser.newPage({javaScriptEnabled:false});await noJS.goto(base+'/en/avalon/learn/');
  assert.match(await noJS.locator('#avalon-lesson').innerText(),/Who recognizes whom/);assert.equal(await noJS.locator('[data-avalon-seat]').count(),7);await noJS.close();
  for(const portable of [false,true]) {
   const context=await browser.newContext({viewport:{width:390,height:900},reducedMotion:'reduce'});
   await context.addInitScript(()=>localStorage.setItem('tablefolk-coup-session',JSON.stringify({names:['A','B'],mode:'default',planned:6,started:true,locked:true,results:[{winner:0,runnerUp:1}]})));
   const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
   if(portable) {await context.setOffline(true);await page.goto(pathToFileURL(path.resolve('game-night.html')).href+'#avalon/learn');await page.locator('#lang-en').click();}
   else {await page.goto(base+'/en/avalon/learn/');await page.waitForFunction(()=>document.querySelector('[data-tool=sources][data-ready=true]'));await learningExample(page);}
   const next=async()=>{await page.locator('[data-avalon-next]').click();await page.waitForFunction(()=>document.activeElement?.id==='avalon-scene-title');};
   const lesson=page.locator('#avalon-lesson');
   const savedSession=await page.evaluate(()=>localStorage.getItem('tablefolk-coup-session'));
   for(const n of [5,6,7,8,9,10]) {
    await learningStage(page,'setup');await page.locator('#avalon-step-0').count() && await page.locator('#avalon-step-0').click();
    await page.locator('#players').selectOption(String(n));
    assert.equal(await page.locator('[data-avalon-seat]').count(),n);
    await page.locator('#avalon-mode').selectOption('optional');
    const roles=['mordred','oberon'];
    for(const role of roles)if(await page.locator('#role-'+role).isEnabled())await page.locator('#role-'+role).check();
    const chosen=await page.locator('[data-role]:checked').evaluateAll(ns=>ns.map(n=>n.dataset.role));
    assert.equal(await lesson.locator('[data-avalon-role]').count(),new Set(roster({players:n,avalonMode:'optional',optional:chosen}).map(r=>r.id)).size);
    await learningExample(page);await lesson.locator('.avalon-opening-script summary').click();
    // Compare one approved and one rejected proposal. No quest may follow a rejection.
    await page.locator('[data-avalon-replay]').click();await next();
    await page.selectOption('#avalon-example-vote','reject');
    assert.equal(await lesson.locator('.avalon-public-votes li').count(),0,'Votes hidden before reveal');
    await page.locator('.avalon-feedback').evaluate(el=>{window.__avalonLive=el;});
    await page.locator('[data-avalon-votes]').click();
    assert.ok(await page.evaluate(()=>window.__avalonLive===document.querySelector('.avalon-feedback')),'Live feedback stays mounted');
    assert.equal(await lesson.locator('.avalon-public-votes li').count(),n,'Every player votes');
    assert.match(await lesson.locator('.avalon-feedback').innerText(),/Team rejected/);
    if(n%2===0)assert.match(await lesson.locator('.avalon-feedback').innerText(),/tied vote/);
    assert.equal(await page.locator('[data-avalon-next]').count(),0);
    assert.equal(await lesson.locator('[data-art=avalon-mission]').count(),0);
    const sameQuest=await page.locator('#avalon-example-quest').inputValue();
    await page.locator('[data-avalon-propose]').click();
    assert.equal(await page.locator('[data-avalon-leader]').innerText(),'2');
    assert.equal(await page.locator('#avalon-example-quest').inputValue(),sameQuest);
    const script=await lesson.locator('.avalon-opening-script').innerText();
    assert.equal(script.includes('EXCEPT Mordred'),chosen.includes('mordred'));
    assert.equal(script.includes('Oberon keeps'),chosen.includes('oberon'));
    await learningExample(page);await lesson.locator('.avalon-opening-script summary').click();
    for(const quest of [1,4,5])for(const fails of [0,1,2]) {
     await page.selectOption('#avalon-example-quest',String(quest));await page.locator('[data-avalon-replay]').click();
     await next();assert.equal(await lesson.locator('[data-art=avalon-mission]').count(),0);
     assert.ok(await page.locator('[data-avalon-next]').isDisabled());
     await page.locator('[data-avalon-votes]').click();await next();
     assert.equal(await lesson.locator('[data-art=avalon-team]').count(),0);
     const teamSize=d.setups[n].quests[quest-1];
     assert.equal(await lesson.locator('.avalon-hidden-quest li').count(),teamSize,'Only the approved team submits');
     assert.equal(await lesson.locator('[data-avalon-card]').count(),0,'Submitted identities remain hidden');
     await page.selectOption('#avalon-example-fails',String(fails));await next();
     assert.equal(await page.locator('[data-avalon-result]').getAttribute('data-avalon-result'),fails===0||(quest===4&&n>=7&&fails===1)?'success':'fail');
     assert.equal(await lesson.locator('[data-avalon-card=fail]').count(),fails);
     assert.equal(await lesson.locator('[data-avalon-card=success]').count(),teamSize-fails);
     assert.equal(await lesson.locator('.avalon-result-cards [data-avalon-team-seat]').count(),0,'Quest results are anonymous');
    }
   }
   await learningStage(page,'setup');await page.locator('#players').selectOption('5');await learningExample(page);
   assert.equal(await page.locator('[data-avalon-seat]').count(),5);
   assert.equal(await page.locator('[data-role]:checked').count(),2);
   assert.ok(await page.locator('#role-oberon').isDisabled());
   await next();await page.locator('[data-avalon-votes]').click();await next();await next();
   const before=await page.evaluate(()=>Object.fromEntries(Object.entries(localStorage).filter(([k])=>/score|session|clock|timer/.test(k))));
   await next();await page.locator('[data-avalon-ending=hit]').click();assert.match(await lesson.locator('[role=status]').innerText(),/Evil wins/);
   await page.locator('[data-avalon-ending=miss]').click();assert.match(await lesson.locator('[role=status]').innerText(),/Good wins/);
   assert.equal(await page.locator('[data-avalon-ending=miss]').getAttribute('aria-pressed'),'true');
   assert.ok(await page.locator('[data-avalon-ending=miss]').evaluate(el=>el===document.activeElement));
   assert.deepEqual(await page.evaluate(()=>Object.fromEntries(Object.entries(localStorage).filter(([k])=>/score|session|clock|timer/.test(k)))),before);
   await page.locator('[data-avalon-replay]').focus();await page.keyboard.press('Enter');
   await page.waitForFunction(()=>document.activeElement?.id==='avalon-scene-title');
   const zoom=lesson.locator('[data-art=avalon-merlin]').first();await zoom.focus();await page.keyboard.press('Enter');
   assert.equal(await page.locator('#image-viewer[open]').count(),1);await page.keyboard.press('Escape');
   assert.ok(await zoom.evaluate(el=>el===document.activeElement));
   if(!portable)for(const lang of ['en','es']) {
    await page.goto(base+`/${lang}/avalon/learn/`);await page.waitForFunction(()=>document.querySelector('[data-tool=sources][data-ready=true]'));await learningExample(page);
    for(const theme of ['dark','light']) {
     if(await page.locator('html').getAttribute('data-theme')!==theme)await page.locator('#theme').click();
     for(const width of [320,390,768,1440]) {
      await page.setViewportSize({width,height:900});
      assert.deepEqual(await lesson.evaluate(el=>[el,...el.querySelectorAll('*')].filter(n=>n.clientWidth>0&&n.scrollWidth>n.clientWidth+2).map(n=>n.className)),[],`${lang}/${theme}/${width}: no internal clipping`);
      await lesson.screenshot({style:'header,.detail-controls,.skip-link{visibility:hidden!important}',path:path.join(output,`${lang}-${theme}-${width}.png`)});
      for(let stage=0;stage<5;stage++) {
       assert.ok(await page.locator('.avalon-scene').evaluate(el=>el.scrollWidth<=el.clientWidth+1));
       if(stage===1)await page.locator('[data-avalon-votes]').click();
       for(const button of await lesson.locator('button:visible,select:visible').all())assert.ok((await button.boundingBox()).height>=44,'Touch target');
       if(lang==='es'&&theme==='light'&&width===390)await page.locator('.avalon-scene').screenshot({style:'header,.detail-controls,.skip-link{visibility:hidden!important}',path:path.join(output,`es-light-390-stage-${stage}.png`)});
       if(stage<4)await next();
      }
      await page.locator('.avalon-scene').screenshot({style:'header,.detail-controls,.skip-link{visibility:hidden!important}',path:path.join(output,`${lang}-${theme}-${width}-ending.png`)});
      await page.locator('[data-avalon-replay]').click();
     }
    }
   }
   assert.equal(await page.evaluate(()=>localStorage.getItem('tablefolk-coup-session')),savedSession,'Practice preserves saved live session');
   await page.setViewportSize({width:320,height:900});await page.addStyleTag({content:'#avalon-lesson{font-size:28px} #avalon-lesson :is(p,li,h4,strong,span,small){font-size:inherit!important}'});
   assert.deepEqual(await lesson.evaluate(el=>[el,...el.querySelectorAll('*')].filter(n=>n.clientWidth>0&&n.scrollWidth>n.clientWidth+2).map(n=>n.className)),[],'enlarged text fits internally');
   await next();await page.selectOption('#avalon-example-vote','reject');await page.locator('[data-avalon-votes]').click();
   assert.ok(await page.locator('[data-avalon-propose]').isVisible());
   await page.locator('.avalon-scene').screenshot({style:'header,.detail-controls,.skip-link{visibility:hidden!important}',path:path.join(output,`${portable?'offline':'hosted'}-enlarged-rejection-320.png`)});
   assert.deepEqual(errors,[]);await context.close();
  }
  const broken=await browser.newPage();await broken.route('**/assets/images/**',route=>route.abort());
  await broken.goto(base+'/en/avalon/learn/');await broken.waitForFunction(()=>document.querySelector('[data-tool=sources][data-ready=true]'));
  await broken.waitForSelector('[data-tool=sources][data-ready=true]');await learningExample(broken);assert.match(await broken.locator('[data-avalon-role=merlin]').innerText(),/Merlin/);
  await broken.locator('[data-avalon-next]').click();assert.match(await broken.locator('.avalon-scene').innerText(),/Approve on the left/);await broken.close();
  console.log('Avalon: role knowledge, capacities, 54 quest outcomes per surface, stages, endgame, offline, keyboard, state isolation and responsive checks passed. Screenshots: '+output);
 } finally {await browser.close();server.kill();}
})().catch(e=>{console.error(e);server.kill();process.exitCode=1;});
