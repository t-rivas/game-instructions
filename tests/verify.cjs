/* Run with npm test; requires Playwright Chromium (or CHROME_CHANNEL=chrome). */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const vm = require('node:vm');
const {execFileSync} = require('node:child_process');
const {pathToFileURL} = require('node:url');
const {chromium} = require('playwright');
const root = path.resolve(__dirname,'..');
const output = fs.mkdtempSync(path.join(os.tmpdir(),'tablefolk-qa-'));
let checks = 0;
function check(value,message) { assert.ok(value,message); checks++; }

// Run both builders from outside the repository, with CRLF input, and compare bytes.
const fixture = fs.mkdtempSync(path.join(os.tmpdir(),'tablefolk-build-'));
for (const file of fs.readdirSync(root).filter(n=>/\.(js|css|mjs|py)$/.test(n)||n==='index.html')) {
  fs.writeFileSync(path.join(fixture,file),fs.readFileSync(path.join(root,file),'utf8').replace(/\r?\n/g,'\r\n'));
}
fs.symlinkSync(path.join(root,'assets'),path.join(fixture,'assets'),'dir');
execFileSync('python3',[path.join(fixture,'build.py')],{cwd:os.tmpdir()});
const pythonBuild = fs.readFileSync(path.join(fixture,'game-night.html'));
execFileSync(process.execPath,[path.join(fixture,'build.mjs')],{cwd:os.tmpdir()});
const nodeBuild = fs.readFileSync(path.join(fixture,'game-night.html'));
check(pythonBuild.equals(nodeBuild),'Python and Node builders must match with CRLF and any cwd');
check(nodeBuild.equals(fs.readFileSync(path.join(root,'game-night.html'))),'Committed standalone HTML is stale; run npm run build');
const html = nodeBuild.toString();
check(!/<script[^>]+src=|<link[^>]+rel="stylesheet"/.test(html),'Standalone HTML must embed all scripts and styles');
const embedded = html.match(/<script>\n([\s\S]*)\n<\/script>/)[1];
new vm.Script(embedded); checks++;
for (const file of fs.readdirSync(root).filter(n=>n.endsWith('.js'))) new vm.Script(fs.readFileSync(path.join(root,file),'utf8'));
fs.rmSync(fixture,{recursive:true});

async function visit(page,game,tab='reference') {
  await page.evaluate(hash=>{location.hash=hash;},`${game}/${tab}`);
  await page.waitForFunction(({game,tab})=>state.game===game&&state.tab===tab,{game,tab});
}
async function openPractice(page) {
  await page.locator('#table-practice > summary').click();
}
async function verifyInteractions(page,file) {
  await page.locator('#lang-en').click();
  await page.locator('#game-search').fill('ajedrez');
  check(await page.locator('.game-card').count()===1,'Spanish search works in English');
  await page.locator('.game-card').click();
  await page.waitForFunction(()=>state.game==='chess');
  check(await page.locator('#tab-reference').getAttribute('aria-selected')==='true','Collection opens table guide');
  await page.locator('#tab-reference').focus();await page.keyboard.press('ArrowRight');
  await page.waitForFunction(()=>state.tab==='full');
  check(await page.locator('#tab-full').getAttribute('aria-selected')==='true','Keyboard tab navigation');
  await page.locator('#expand-all').click();
  check(await page.locator('.rule-section:not([open])').count()===0,'Expand full rules');

  const scenarioGames=await page.evaluate(()=>Object.keys(PRACTICE));
  for(const game of scenarioGames) {
    await visit(page,game);await openPractice(page);
    for(let index=0;index<2;index++) {
      const answer=await page.evaluate(({game,index})=>PRACTICE[game][index].answer,{game,index});
      const wrong=answer===0?1:0;
      await page.locator(`#scenario-choice-${wrong}`).click();
      check((await page.locator('#scenario-feedback').innerText()).startsWith('Not quite.'),`${game}: wrong answer explains rule`);
      await page.locator(`#scenario-choice-${answer}`).focus();await page.keyboard.press('Enter');
      check((await page.locator('#scenario-feedback').innerText()).startsWith('Correct.'),`${game}: keyboard answer`);
      await page.locator('#lang-es').click();
      check(await page.locator(`#scenario-choice-${answer}`).getAttribute('aria-pressed')==='true',`${game}: answer survives language switch`);
      check((await page.locator('#scenario-feedback').innerText()).startsWith('Correcto.'),`${game}: Spanish feedback`);
      await page.locator('#lang-en').click();
      await page.locator('#scenario-next').click();
      check(await page.evaluate(()=>document.activeElement.id)==='scenario-heading',`${game}: next example receives focus`);
    }
    await page.locator('#scenario-reset').click();
    check(await page.locator('[data-scenario-choice][aria-pressed=true]').count()===0,`${game}: reset clears selection`);
    await page.locator('#scenario-practice > a').click();
    await page.waitForFunction(()=>state.tab==='full');
    check(await page.locator('.rule-section[open]').count()>0,`${game}: explanation links to full rule`);
    await page.locator('[data-art]').first().click();
    check(await page.locator('dialog[open]').count()===1,`${game}: image viewer opens`);
    await page.keyboard.press('Escape');
    check(await page.locator('dialog[open]').count()===0,`${game}: image viewer closes with Escape`);
  }

  await visit(page,'coup','full');
  for(const iq of [false,true]) for(const reformation of [false,true]) {
    if((await page.locator('#inquisitor-toggle').getAttribute('aria-checked')==='true')!==iq) await page.locator('#inquisitor-toggle').click();
    if((await page.locator('#reformation-toggle').getAttribute('aria-checked')==='true')!==reformation) await page.locator('#reformation-toggle').click();
    const edition=await page.locator('.edition').innerText();
    check(edition.includes(iq?'Inquisitor':'Ambassador')&&edition.includes('Reformation')===reformation,'Coup edition follows independent variants');
  }
  await page.reload();await page.waitForFunction(()=>state.game==='coup');
  check(await page.locator('#reformation-toggle').getAttribute('aria-checked')==='true','Coup preferences survive reload');
  await visit(page,'skull_king','full');
  if(await page.locator('#skull-expansion-toggle').getAttribute('aria-checked')==='true')await page.locator('#skull-expansion-toggle').click();
  check(await page.locator('#expansion-setup').count()===0,'Skull King base guide hides expansion rules');
  await page.locator('#skull-expansion-toggle').click();
  check(await page.locator('#skull-expansion-toggle').getAttribute('aria-checked')==='true','Skull King expansion switch turns on');
  check(await page.locator('#expansion-setup').count()===1,'Skull King expansion rules appear');
  check((await page.locator('.edition').innerText()).includes('Expansion Pack'),'Skull King edition follows expansion switch');
  await visit(page,'skull_king','reference');
  check((await page.locator('#table-sheet').innerText()).includes('Wild 15'),'Skull King expansion changes quick reference');
  await page.reload();await page.waitForFunction(()=>state.game==='skull_king');
  check(await page.locator('#skull-expansion-toggle').getAttribute('aria-checked')==='true','Skull King expansion survives reload');
  await page.locator('#skull-expansion-toggle').click();
  check(!(await page.locator('#table-sheet').innerText()).includes('Wild 15'),'Skull King base quick reference restored');
  await visit(page,'coup');await openPractice(page);
  await page.locator('#coin-range').fill('10');
  check(await page.evaluate(()=>visualState.coins)===10,'Coup coin helper');

  await visit(page,'avalon');await page.locator('[data-players="7"]').click();await openPractice(page);
  await page.locator('[data-quest="4"]').click();await page.locator('#fail-more').click();
  check(await page.locator('#quest-demo .quest-result.success').count()===1,'Avalon: quest 4 succeeds with one Fail at 7 players');
  await page.locator('#fail-more').click();
  check(await page.locator('#quest-demo .quest-result.failure').count()===1,'Avalon: quest 4 fails with two Fails');
  await page.locator('[data-players="6"]').click();
  check(await page.evaluate(()=>state.players)===6,'Avalon count switch');
  await page.locator('#fail-less').click();
  check(await page.locator('#quest-demo .quest-result.failure').count()===1,'Avalon: quest 4 fails with one Fail at 6 players');

  await visit(page,'poker');await openPractice(page);
  for(let i=0;i<4;i++) await page.locator('#street-next').click();
  check(await page.evaluate(()=>visualState.street)===4,'Poker reaches showdown');
  await page.locator('#street-next').click();
  check(await page.evaluate(()=>visualState.street)===0,'Poker restarts');

  await visit(page,'moth');await openPractice(page);
  await page.locator('#practice-moth').check();await page.locator('#guess-2').click();
  check((await page.locator('#moth-practice').innerText()).includes('Only the guard'),'Moth: non-guard cannot discard moth');
  await page.locator('#practice-guard').check();
  check((await page.locator('#moth-practice').innerText()).includes('Legal play'),'Moth: guard can discard matching moth');

  await visit(page,'dixit');await page.locator('#dixit-players').selectOption('3');
  for(const outcome of ['some','all','none']) {
    await page.locator(`[data-dixit-outcome="${outcome}"]`).click();
    check(await page.evaluate(()=>tableState.dixitOutcome)===outcome,'Dixit scoring selector');
  }
  await page.emulateMedia({media:'print'});
  check(await page.locator('.print-dixit-rules').isVisible(),'Dixit print includes every outcome');
  check(!await page.locator('#table-practice').isVisible(),'Printed reference omits practice');
  await page.emulateMedia({media:'screen'});
  for(const [game,width,theme] of [['chess',390,'dark'],['burako',320,'light'],['catan',1440,'light']]) {
    await visit(page,game);await page.setViewportSize({width,height:950});
    await page.evaluate(theme=>{state.theme=theme;render();},theme);
    await page.locator('#table-practice').evaluate(e=>{e.open=true;});
    await page.locator('#scenario-practice').scrollIntoViewIfNeeded();
    await page.screenshot({path:path.join(output,`${file}-${game}-${width}.png`)});
  }
}

(async()=>{
  const browser=await chromium.launch({headless:true,...(process.env.CHROME_CHANNEL?{channel:process.env.CHROME_CHANNEL}:{})});
  try {
    for(const file of ['index.html','game-night.html']) {
      const context=await browser.newContext({viewport:{width:1440,height:900}});
      await context.setOffline(true);
      const page=await context.newPage();const errors=[];const requests=[];
      page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>requests.push(r.url()));
      await page.goto(pathToFileURL(path.join(root,file)).href);
      await page.waitForFunction(()=>document.querySelectorAll('.game-card').length===Object.keys(GAMES).length);
      check(await page.locator('html').getAttribute('lang')==='es','Spanish default');
      const assets=await page.evaluate(async()=>{
        const entries=[...Object.entries(OFFICIAL).map(([id,a])=>[id,a.src]),...Object.entries(GUIDE_ART).map(([id,a])=>[id,a[0]])];
        return Promise.all(entries.map(async([id,src])=>{const image=new Image();image.src=src;try{await image.decode();return null;}catch{return id;}}));
      });
      check(assets.every(a=>a===null),'Every registered image must decode: '+assets.filter(Boolean));
      if(file==='game-night.html')check(requests.every(url=>url.startsWith('data:')||url===pathToFileURL(path.join(root,file)).href),'Standalone must not request sibling files');
      const games=await page.evaluate(()=>Object.keys(GAMES));
      for(const width of [320,390,768,1440]) {
        await page.setViewportSize({width,height:900});
        for(const game of games)for(const tab of ['learn','reference','full'])for(const lang of ['es','en'])for(const theme of ['dark','light']) {
          const result=await page.evaluate(({game,tab,lang,theme})=>{
            Object.assign(state,{game,tab,lang,theme,compact:false});render();
            document.querySelectorAll('details').forEach(d=>d.open=true);
            const ids=[...document.querySelectorAll('[id]')].map(e=>e.id);
            return {overflow:document.documentElement.scrollWidth>innerWidth+1,badText:/undefined|\[object Object\]/.test(document.querySelector('#main').innerText),duplicates:ids.length!==new Set(ids).size};
          },{game,tab,lang,theme});
          check(!result.overflow&&!result.badText&&!result.duplicates,`${file} ${width} ${game} ${tab} ${lang} ${theme}: ${JSON.stringify(result)}`);
        }
        console.log(`${file}: all guides at ${width}px passed`);
      }
      // Start interaction tests with empty disclosure state and a real home route.
      await page.goto(pathToFileURL(path.join(root,file)).href);
      await page.waitForFunction(()=>state.game===null);
      await page.setViewportSize({width:1440,height:900});
      await verifyInteractions(page,file);
      check(errors.length===0,`${file}: browser errors: ${errors.join('; ')}`);
      await context.close();
    }
    console.log(`PASS: ${checks} checks. Screenshots: ${output}`);
  } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
