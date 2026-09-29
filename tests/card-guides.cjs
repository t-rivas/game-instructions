/* Offline card-reference checks: node tests/card-guides.cjs */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {pathToFileURL} = require('node:url');
const {chromium} = require('playwright');
const root = path.resolve(__dirname, '..');
const output = fs.mkdtempSync(path.join(os.tmpdir(), 'tablefolk-cards-'));
(async()=>{
  const browser = await chromium.launch({headless:true, ...(process.env.CHROME_CHANNEL?{channel:process.env.CHROME_CHANNEL}:{})});
  try {
    for (const file of ['index.html','game-night.html']) {
      const context = await browser.newContext({viewport:{width:390,height:844},offline:true});
      const page = await context.newPage();
      const errors=[]; page.on('pageerror',e=>errors.push(e.message));
      await page.goto(pathToFileURL(path.join(root,file)).href);
      for (const game of ['skull_king','sushi_go','sushi_go_party']) {
        await page.evaluate(game=>{location.hash=game+'/reference';},game);
        await page.waitForFunction(game=>state.game===game,game);
        await page.locator('#table-cards > summary').click();
        await page.locator('#card-guide').scrollIntoViewIfNeeded();
        assert.equal(await page.locator('#table-cards').getAttribute('open'),'');
        assert.equal(await page.locator('.card-guide-entry').count(),{skull_king:15,sushi_go:8,sushi_go_party:23}[game]);
        const photos=page.locator('.card-guide-art');
        for(let i=0;i<await photos.count();i++) {
          const photo=photos.nth(i);
          await photo.scrollIntoViewIfNeeded();
          await photo.locator('img').evaluate(image=>image.decode());
          assert.ok(await photo.getAttribute('aria-label'));
        }
        await photos.first().focus(); await page.keyboard.press('Enter');
        assert.equal(await page.locator('#image-viewer[open]').count(),1);
        await page.locator('#image-viewer img').evaluate(image=>image.decode());
        assert.ok((await page.locator('#image-viewer a').getAttribute('href')).startsWith('https://'));
        await page.keyboard.press('Escape');
        assert.equal(await page.locator('#image-viewer[open]').count(),0);
        assert.ok(await photos.first().evaluate(el=>el===document.activeElement));
        if(game==='skull_king') {
          assert.equal(await page.locator('[data-card^="exp-"]').count(),0);
          await page.locator('#skull-expansion-toggle').click();
          assert.equal(await page.locator('[data-card^="exp-"]').count(),7);
          assert.equal(await page.locator('.card-guide-entry').count(),24);
          await page.reload(); await page.waitForFunction(()=>state.game==='skull_king');
          assert.equal(await page.locator('[data-card^="exp-"]').count(),7);
          if(!await page.locator('#table-cards').evaluate(el=>el.open))await page.locator('#table-cards > summary').click();
        }
        for(const lang of ['es','en']) {
          await page.locator('#lang-'+lang).click();
          if(!await page.locator('#table-cards').evaluate(el=>el.open))await page.locator('#table-cards > summary').click();
          assert.equal(await page.locator('#card-guide-title').innerText(),lang==='es'?'Conoce tus cartas.':'Know your cards.');
          for(const width of [320,1440]) {
            await page.setViewportSize({width,height:900});
            assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
          }
        }
        await page.locator('#lang-es').click();
        await page.setViewportSize({width:390,height:844});
        await page.locator('#card-guide').scrollIntoViewIfNeeded();
        await page.screenshot({path:path.join(output,`${file}-${game}.png`)});
        if(file==='index.html')await page.locator('#card-guide').screenshot({path:path.join(output,`${game}-full.png`)});
      }
      assert.deepEqual(errors,[]);
      await context.close();
    }
    console.log('PASS: card guide photos, expansion toggle, translations, keyboard zoom and offline pages. Screenshots: '+output);
  } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
