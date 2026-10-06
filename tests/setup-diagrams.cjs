const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { spawn } = require('node:child_process');
const { pathToFileURL } = require('node:url');
const { chromium, webkit } = require('playwright');
const root = path.resolve(__dirname, '..');
const model = vm.createContext({});
vm.runInContext(fs.readFileSync(path.join(root, 'setup-diagrams.js'), 'utf8'), model);
// Expectations are written independently of the model's formulas.
const quantities = {2:[10,5,3,2],3:[10,5,3,2],4:[9,5,3,2],5:[9,5,3,2],6:[8,7,5,3],7:[8,7,5,3],8:[7,7,5,3]};
for (const [players,[deal,...desserts]] of Object.entries(quantities)) {
  const visual = model.setupVisual('sushi_go_party',2,'en',Number(players));
  assert.ok(visual.instructions[0].includes(`deal ${deal} secret cards`));
  assert.ok(visual.instructions[0].includes(`Shuffle ${desserts[0]} random`));
  assert.ok(visual.instructions[1].includes(`add ${desserts[1]} and ${desserts[2]}`));
}
assert.equal(model.setupVisual('sushi_go_party',2,'en',99).title, model.setupVisual('sushi_go_party',2,'en',4).title);
const server = spawn(process.execPath,['scripts/serve-export.mjs'],{stdio:['ignore','pipe','inherit']});
(async()=>{
  const base=await new Promise(r=>server.stdout.once('data',d=>r(d.toString().trim())));
  const engine=process.env.BROWSER || 'chromium';
  const browser=await {chromium,webkit}[engine].launch({headless:true,...(engine==='chromium' && process.env.CHROME_CHANNEL?{channel:process.env.CHROME_CHANNEL}:{})});
  const output=process.env.SETUP_SCREENSHOTS || `/tmp/tablefolk-setup-after-${engine}`;
  fs.mkdirSync(output,{recursive:true});
  try {
    const page=await browser.newPage({viewport:{width:390,height:900}}), errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    const ready=()=>page.waitForSelector('[data-tool=sources][data-ready=true]');
    const setup=async(game,lang='en')=>{await page.goto(`${base}/${lang}/${game}/learn/`);await ready();await page.locator('[data-learning-stage=setup]').click();};
    await setup('chess');
    const board=page.locator('[data-setup-visual=chess-1]');
    assert.equal(await board.locator('[data-square]').count(),64);
    assert.equal(await board.locator('[data-piece]').count(),32);
    assert.equal(await board.locator('[data-piece=pawn]').count(),16);
    assert.ok(await board.locator('[data-square=h1]').evaluate(el=>el.classList.contains('light')));
    for(const [square,piece] of Object.entries({a1:'rook',b1:'knight',c1:'bishop',d1:'queen',e1:'king',f1:'bishop',g1:'knight',h1:'rook',d8:'queen',e8:'king'})) assert.equal(await board.locator(`[data-square=${square}]`).getAttribute('data-piece'),piece);
    assert.ok(await board.locator('[data-square=d1]').evaluate(el=>el.classList.contains('light')));
    assert.ok(await board.locator('[data-square=d8]').evaluate(el=>el.classList.contains('dark')));
    // Checklist recovery and language changes keep the same saved completion.
    await page.locator('#setup-check-1').check();
    await page.waitForFunction(()=>JSON.parse(localStorage.getItem('tablefolk-setup-checklist-chess')).checked[1]);
    await page.reload();await ready();
    await page.waitForFunction(()=>document.getElementById('setup-check-1').checked);
    assert.ok(await page.locator('#setup-check-1').isChecked());
    await page.locator('#lang-es').click();await page.waitForURL('**/es/chess/learn/');await ready();
    await page.waitForFunction(()=>document.getElementById('setup-check-1').checked);
    assert.ok(await page.locator('#setup-check-1').isChecked());
    const art=page.locator('[data-setup-visual=chess-1] [data-art=chess-queen]');
    await art.focus();await page.keyboard.press('Enter');await page.waitForSelector('#image-viewer[open]');
    await page.keyboard.press('Escape');assert.ok(await art.evaluate(el=>el===document.activeElement));
    await setup('catan');
    const placement=page.locator('[data-setup-visual=catan-2]');
    assert.match(await placement.innerText(),/A → B → C/);
    assert.deepEqual(await placement.locator('.setup-order b').allTextContents(),['1','2','3','4','4','3','2','1']);
    assert.match(await placement.innerText(),/1 lumber \+ 1 brick \+ 1 grain/);
    await setup('sushi_go_party');
    assert.equal(await page.locator('[data-setup-visual=sushi_go_party-0] [data-art]').count(),8);
    const before=await page.evaluate(()=>JSON.stringify({...localStorage}));
    for(const [players,[deal,...desserts]] of Object.entries(quantities)) {
      await page.locator('#setup-example-players').selectOption(players);
      const figure=page.locator('[data-setup-visual=sushi_go_party-2]');
      assert.equal(await figure.locator('.setup-hands .setup-zone').count(),Number(players));
      assert.ok((await figure.innerText()).includes(`${deal} face-down cards`));
      assert.deepEqual(await figure.locator('.setup-zones .setup-zone span').allTextContents(),desserts.map(n=>`Add ${n} desserts`));
    }
    assert.equal(await page.evaluate(()=>JSON.stringify({...localStorage})),before,'Example count writes no session or setup preferences');
    await page.locator('[data-learning-stage=turn]').click();await page.locator('[data-learning-stage=setup]').click();
    assert.equal(await page.locator('#setup-example-players').inputValue(),'8','Reopening setup preserves example controls');
    if(await page.locator('#guide-player-count').count()) {
      await page.locator('#guide-player-count').selectOption('6');
      await page.waitForFunction(()=>!document.getElementById('setup-example-players'));
      assert.match(await page.locator('[data-setup-visual=sushi_go_party-2]').innerText(),/6 players.*prepare round 1/);
      assert.match(await page.locator('[data-setup-visual=sushi_go_party-2]').innerText(),/8 face-down cards/);
      await page.locator('#setup-check-2').check();await page.locator('#guide-player-count').selectOption('8');
      await page.waitForFunction(()=>!document.getElementById('setup-check-2').checked);
      await page.locator('#guide-player-count').selectOption('');
    }
    for(const id of ['chess','catan','sushi_go_party']) for(const lang of ['en','es']) for(const width of [320,390,768,1440]) for(const theme of ['light','dark']) {
      await page.setViewportSize({width,height:900});await setup(id,lang);
      await page.evaluate(theme=>document.documentElement.dataset.theme=theme,theme);
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${id}/${lang}/${width}/${theme}: page fits`);
      if(id==='catan') {
        const box=await page.locator('.setup-catan-board').boundingBox();
        assert.ok(box.height>=120 && Math.abs(box.height/box.width-280/320)<.01,'Catan placement diagram keeps its full viewBox, rather than icon sizing');
      }
      assert.deepEqual(await page.locator('.setup-visual :is(strong,span,p,h4),.setup-example-picker select').evaluateAll(nodes=>nodes.filter(n=>n.clientWidth && n.scrollWidth>n.clientWidth+1).map(n=>n.textContent)),[],`${id}: labels fit`);
      assert.deepEqual(await page.locator('.setup-recognition img').evaluateAll(nodes=>nodes.filter(img=>{
        const a=img.getBoundingClientRect(), b=img.closest('button').getBoundingClientRect();
        return a.top<b.top-.5 || a.bottom>b.bottom+.5 || a.left<b.left-.5 || a.right>b.right+.5;
      }).map(img=>img.alt)),[],`${id}: entire artwork fits its image control`);
      await page.locator('#learn-setup').screenshot({style:'header,.detail-controls,.skip-link{visibility:hidden!important}',path:`${output}/${id}-${lang}-${theme}-${width}.png`});
    }
    for(const id of ['chess','catan','sushi_go_party']) {
      await setup(id,'es');await page.setViewportSize({width:320,height:900});await page.emulateMedia({reducedMotion:'reduce'});
      await page.addStyleTag({content:'.setup-visual :is(p,strong,span,h4),.setup-example-picker label{font-size:24px!important}'});
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
      await page.locator('#learn-setup').screenshot({style:'header,.detail-controls,.skip-link{visibility:hidden!important}',path:`${output}/${id}-enlarged-320.png`});
    }
    const noJS=await browser.newPage({javaScriptEnabled:false});await noJS.goto(`${base}/es/chess/learn/`);
    assert.match(await noJS.locator('[data-setup-visual=chess-1]').textContent(),/d1 dama/);await noJS.close();
    await page.route('**/assets/**',route=>route.abort());await setup('catan');
    assert.match(await placement.innerText(),/Distance rule/);assert.match(await page.locator('[data-setup-visual=catan-0]').innerText(),/terrain hexes/);
    // Chromium verifies offline file URLs. Playwright WebKit's offline emulation
    // rejects file navigation before any app code runs; it covers hosted output above.
    for(const file of engine==='chromium' ? ['index.html','game-night.html'] : []) {
      const context=await browser.newContext({offline:true,viewport:{width:390,height:900}}), offline=await context.newPage();
      offline.on('pageerror',e=>errors.push(e.message));
      await offline.goto(pathToFileURL(path.join(root,file)).href);
      for(const id of ['chess','catan','sushi_go_party']) {
        await offline.evaluate(id=>location.hash=`${id}/learn`,id);await offline.waitForSelector(`[data-setup-visual=${id}-1]`);
        assert.equal(await offline.locator('.setup-visual').count(),id==='chess'?2:3);
        await offline.locator('.setup-visual [data-art]').first().click();await offline.waitForSelector('#image-viewer[open]');await offline.keyboard.press('Escape');
        assert.ok(await offline.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
      }
      await context.close();
    }
    assert.deepEqual(errors,[]);
    console.log(`Setup diagrams (${engine}): positions, 7 deal schedules, recovery, isolation, zoom, static output, ${engine==='chromium'?'offline file URLs, ':''}48 responsive captures and enlarged text passed. Screenshots: ${output}`);
  } finally {await browser.close();server.kill();}
})().catch(e=>{console.error(e);server.kill();process.exitCode=1;});
