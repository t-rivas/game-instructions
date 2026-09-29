const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {pathToFileURL} = require('node:url');
const {chromium, webkit} = require('playwright');

const root = path.resolve(__dirname, '..');
const engine = process.env.BROWSER || 'chromium';
const output = fs.mkdtempSync(path.join(os.tmpdir(), 'tablefolk-mobile-'));
let checks = 0;

(async () => {
  const browser = await ({chromium, webkit}[engine]).launch({headless:true,
    ...(engine==='chromium' && process.env.CHROME_CHANNEL ? {channel:process.env.CHROME_CHANNEL} : {})});
  try {
    for (const file of ['index.html', 'game-night.html']) {
      const context = await browser.newContext({viewport:{width:393,height:852},isMobile:true,hasTouch:true});
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      // Block internet requests without WebKit's offline mode, which rejects file:// navigation.
      await context.route(/^https?:/, route => route.abort());
      await page.goto(pathToFileURL(path.join(root,file)).href);
      await page.waitForFunction(() => document.querySelectorAll('.game-card').length===Object.keys(GAMES).length);
      const games = await page.evaluate(() => ['catan', ...Object.keys(GAMES).filter(id=>id!=='catan')]);
      for (const width of [320,393,600]) {
        await page.setViewportSize({width,height:852});
        for (const game of games) {
          for (const view of ['learn','full','reference','return']) {
            await page.evaluate(({game,view}) => {
              state.lang='es';state.seen=view==='return'?[game]:[];state.game=null;
              location.hash=`${game}/${view==='return'?'learn':view}`;
              route();
            }, {game,view});
            await page.locator('.detail-cover img').evaluate(img=>img.decode());
            const dimensions = await page.evaluate(() => {
              const rect = selector => {
                const {width,height,top,bottom,left,right} = document.querySelector(selector).getBoundingClientRect();
                return {width,height,top,bottom,left,right};
              };
              return {cover:rect('.detail-cover'),hero:rect('.detail-hero'),controls:rect('.detail-controls'),
                compact:document.body.classList.contains('compact-hero'),overflow:document.documentElement.scrollWidth>innerWidth+1};
            });
            const label = `${engine} ${file} ${width}px ${game}/${view}`;
            assert.ok(!dimensions.overflow, `${label}: horizontal overflow`);checks++;
            if (!dimensions.compact) {
              assert.ok(dimensions.cover.width>dimensions.hero.width*.8, `${label}: banner is a narrow strip ${JSON.stringify(dimensions)}`);checks++;
              assert.ok(dimensions.cover.height<=width/1.8 && dimensions.cover.height>=70, `${label}: oversized or collapsed banner ${JSON.stringify(dimensions)}`);checks++;
            } else {
              assert.ok(dimensions.hero.height<220, `${label}: compact banner too tall`);checks++;
            }
            // The tabs must be reachable on the initial phone screen, without a giant image first.
            assert.ok(dimensions.controls.top<780, `${label}: tabs pushed below first screen ${JSON.stringify(dimensions)}`);checks++;
            await page.evaluate(() => scrollTo({top:1000,behavior:'instant'}));
            await page.waitForFunction(() => scrollY>0);
            // WebKit updates sticky positions on the next rendering frame after scrolling.
            await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
            const pinned = await page.evaluate(() => {
              const header=document.querySelector('#header').getBoundingClientRect();
              const controls=document.querySelector('.detail-controls').getBoundingClientRect();
              return {headerBottom:header.bottom,controlsTop:controls.top,controlsBottom:controls.bottom,viewportHeight:innerHeight};
            });
            assert.ok(Math.abs(pinned.controlsTop-pinned.headerBottom)<2 && pinned.controlsBottom<pinned.viewportHeight, `${label}: tabs do not stay below header ${JSON.stringify(pinned)}`);checks++;
            if(width===393 && game==='catan' && (view==='learn'||view==='reference')) {
              await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));
              await page.screenshot({path:path.join(output,`${engine}-${file}-${view}.png`)});
            }
          }
        }
        console.log(`${engine} ${file}: all mobile headers at ${width}px passed`);
      }
      assert.deepEqual(errors,[],`${engine} ${file}: browser errors`);checks++;
      await context.close();
    }
    console.log(`PASS: ${checks} mobile header checks. Screenshots: ${output}`);
  } finally { await browser.close(); }
})().catch(error => {console.error(error);process.exitCode=1;});
