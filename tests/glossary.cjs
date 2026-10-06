const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const {spawn} = require('node:child_process');
const {chromium} = require('playwright');
const context = vm.createContext({});
vm.runInContext(fs.readFileSync('glossary.js','utf8'),context);
const parts = (game,text,lang) => JSON.parse(vm.runInContext(`JSON.stringify(glossaryParts(${JSON.stringify(game)},${JSON.stringify(text)},${JSON.stringify(lang)}))`,context));
assert.equal(parts('coup','influencia e influencias','es').filter(p=>p.term).length,1);
assert.equal(parts('truco','humano mano','es').find(p=>p.term).text,'mano');
assert.equal(parts('coup','mano muestra baza','es').filter(p=>p.term).length,0);
assert.equal(parts('catan','Gran Ruta Comercial','es')[0].term.label.es,'Camino más largo');
assert.equal(parts('truco','<script>muestra</script>','es').map(p=>p.text).join(''),'<script>muestra</script>');
const terms=JSON.parse(vm.runInContext('JSON.stringify(CONTEXTUAL_GLOSSARY)',context));
const {games}=require('../src/generated/catalog.json');
for(const term of terms)assert.ok(games[term.game].sections.some(s=>s.id===term.rule),`${term.game}/${term.id}: valid rule reference`);
const server=spawn(process.execPath,['scripts/serve-export.mjs'],{stdio:['ignore','pipe','inherit']});
(async()=>{
 const base=await new Promise(resolve=>server.stdout.once('data',data=>resolve(data.toString().trim())));
 const browser=await chromium.launch({headless:true,channel:process.env.CHROME_CHANNEL||'chrome'});
 const output='/tmp/tablefolk-glossary-review';fs.mkdirSync(output,{recursive:true});
 try {
  const page=await browser.newPage({viewport:{width:390,height:900}});
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  const ready=()=>page.waitForSelector('[data-tool=sources][data-ready=true]');
  for(const lang of ['en','es'])for(const game of ['skull_king','coup','avalon','truco','catan']) {
   await page.goto(`${base}/${lang}/${game}/learn/`);await ready();
   await page.locator('[data-learning-stage=setup]').click();
   if(game==='truco') {
    for(const term of ['muestra','mano'])assert.ok(await page.locator(`.setup-checklist [data-glossary-term=${term}] .glossary-definition`).isVisible());
   }
   if(game==='catan')assert.ok((await page.locator('.setup-checklist').innerText()).includes(lang==='es'?'Camino más largo':'Longest Road'));
   await page.locator('[data-learning-stage=turn]').click();
   if(game==='skull_king')await page.locator('#learning-step').selectOption('basic-trick');
   if(game==='coup')await page.locator('#learning-step').selectOption('basic-challenge');
   const term=game==='skull_king'?'trick':game==='coup'?'influence':null;
   if(term)assert.ok(await page.locator(`.lesson-copy [data-glossary-term=${term}] .glossary-definition`).isVisible());
   // One representative lesson for every game/language/size/theme.
   for(const width of [320,390,768,1440])for(const theme of ['light','dark']) {
    await page.setViewportSize({width,height:900});await page.evaluate(theme=>document.documentElement.setAttribute('data-theme',theme),theme);
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${game}/${lang}/${width}/${theme} fits`);
    await page.locator('#basics').screenshot({path:`${output}/${game}-${lang}-${theme}-${width}.png`,style:'header,.detail-controls,.skip-link{visibility:hidden!important}'});
   }
  }
  await page.goto(`${base}/es/coup/learn/`);await ready();
  await page.locator('[data-learning-stage=turn]').click();await page.locator('#learning-step').selectOption('basic-action');
  const trigger=page.locator('.lesson-cards .glossary-trigger').first();
  await trigger.focus();await page.keyboard.press('Enter');assert.equal(await trigger.getAttribute('aria-expanded'),'true');
  await page.keyboard.press('Escape');assert.equal(await trigger.getAttribute('aria-expanded'),'false');assert.ok(await trigger.evaluate(el=>el===document.activeElement));
  await trigger.click();await page.locator('.lesson-cards .glossary-close').first().click();assert.ok(await trigger.evaluate(el=>el===document.activeElement));
  await page.emulateMedia({media:'print'});assert.ok(await page.locator('.lesson-cards .glossary-disclosure').first().isVisible());
  await page.emulateMedia({media:'screen',reducedMotion:'reduce'});await page.setViewportSize({width:320,height:900});
  await trigger.click();await page.addStyleTag({content:'.lesson-cards :is(p,button,span){font-size:24px!important}'});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  await page.locator('.lesson-cards [data-art]').first().click();await page.waitForSelector('#image-viewer[open]');await page.keyboard.press('Escape');
  await page.goto(`${base}/es/catan/rules/`);await ready();await page.locator('#rule-search').fill('Gran Ruta Comercial');assert.ok(await page.locator('.rule-search-result').count()>0);
  const noJS=await browser.newPage({javaScriptEnabled:false});
  await noJS.goto(`${base}/es/coup/learn/`);assert.ok(await noJS.locator('.lesson-copy .glossary-definition').count()>0);await noJS.close();
  await page.goto(`${base}/game-night.html`);await page.evaluate(()=>{location.hash='#truco/learn';});await page.waitForSelector('#basics .glossary-definition');assert.ok((await page.locator('#basics').innerText()).includes('muestra'));
  assert.deepEqual(errors,[]);
  console.log(`Contextual glossary passed; screenshots: ${output}`);
 }finally{await browser.close();server.kill();}
})().catch(error=>{console.error(error);server.kill();process.exitCode=1;});
