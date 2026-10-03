const { spawn } = require("node:child_process");
const fs = require("node:fs");
const { chromium } = require("playwright");
(async () => {
  const server = spawn(process.execPath, ["scripts/serve-export.mjs"]);
  const base = await new Promise((resolve) =>
    server.stdout.once("data", (data) => resolve(data.toString().trim())),
  );
  let browser;
  try {
    browser = await chromium.launch();
    const result = [];
    for (const width of [390, 1440])
      for (const route of ["/en/", "/en/avalon/learn/", "/en/truco/learn/"]) {
        const page = await browser.newPage({
          viewport: { width, height: 900 },
          deviceScaleFactor: 1,
        });
        await page.goto(base + route);
        if (route === "/en/")
          await page.locator("#collection").scrollIntoViewIfNeeded();
        else await page.waitForSelector("[data-tool=sources][data-ready=true]");
        await page.waitForTimeout(700);
        result.push({
          width,
          route,
          ...(await page.evaluate(() => {
            const images = performance
              .getEntriesByType("resource")
              .filter((entry) =>
                /\.(?:png|jpe?g|webp)(?:\?|$)/i.test(entry.name),
              );
            return {
              bytes: images.reduce(
                (total, entry) => total + entry.transferSize,
                0,
              ),
              requests: images.length,
              urls: images.map((entry) => new URL(entry.name).pathname),
            };
          })),
        });
        await page.close();
      }
    fs.writeFileSync(
      process.argv[2] || "/tmp/tablefolk-image-after.json",
      JSON.stringify(result, null, 2),
    );
    console.log(
      JSON.stringify(
        result.map(({ urls, ...summary }) => summary),
        null,
        2,
      ),
    );
  } finally {
    await browser?.close();
    server.kill();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
