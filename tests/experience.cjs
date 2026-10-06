const {learningStage, learningLesson, openDisclosure} = require("./learning-navigation.cjs");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");
const { spawn } = require("node:child_process");
const { chromium, webkit } = require("playwright");
let checks = 0;
const check = (value, message) => {
  assert.ok(value, message);
  checks++;
};
const server = spawn(process.execPath, ["scripts/serve-export.mjs"], {
  stdio: ["ignore", "pipe", "inherit"],
});
(async () => {
  const base = await new Promise((resolve) =>
    server.stdout.once("data", (data) => resolve(data.toString().trim())),
  );
  const engine = process.env.BROWSER || "chromium";
  const browser = await { chromium, webkit }[engine].launch({
    headless: true,
    ...(engine === "chromium" && process.env.CHROME_CHANNEL
      ? { channel: process.env.CHROME_CHANNEL }
      : {}),
  });
  const output = fs.mkdtempSync(
    path.join(os.tmpdir(), "tablefolk-experience-"),
  );
  try {
    const page = await browser.newPage({
      viewport: { width: 390, height: 600 },
    });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    const ready = () =>
      page.waitForFunction(
        () =>
          document.querySelector("[data-tool=sources][data-ready=true]") &&
          [...document.querySelectorAll("[data-tool]")].every(
            (node) => node.dataset.ready === "true",
          ),
      );
    const navigate = async (route) => {
      await page.goto(base + route);
      await ready();
    };
    const fits = async (label) =>
      check(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
        label,
      );

    // Validated URL values, local favorites and Back/Forward all feed the same controls.
    await page.goto(
      base + "/en/?players=99&duration=banana&favorites=true&q=%00chess",
    );
    await page.waitForFunction(
      () => document.querySelector("#game-search")?.value === "chess",
    );
    check(
      (await page.locator("#filter-players").inputValue()) === "" &&
        (await page.locator("#filter-duration").inputValue()) === "",
      "Reject invalid filter values",
    );
    check(
      !new URL(page.url()).searchParams.has("players") &&
        !new URL(page.url()).searchParams.has("favorites"),
      "Canonical URL discards invalid filter values",
    );
    await openDisclosure(page, "#collection-filter-options");
    await page.locator("#clear-filters").click();
    check(new URL(page.url()).search === "", "Clear filters clears URL");
    await page.locator(".game-card[data-game=avalon] .favorite-toggle").click();
    await openDisclosure(page, "#collection-filter-options");
    await page.locator("#filter-players").selectOption("7");
    await page.locator("#filter-duration").selectOption("60");
    await page.locator("#filter-favorites").click();
    await page.locator("#game-search").fill("avalon");
    await page.waitForFunction(
      () => new URLSearchParams(location.search).get("q") === "avalon",
    );
    const filteredURL = page.url();
    check(
      (await page.locator(".returning-hero").count()) === 0,
      "First-visit introduction survives filter edits",
    );
    check(
      (await page.locator(".game-card").count()) === 1,
      "Combined filters show bookmarked match",
    );
    await page.locator(".card-learn").scrollIntoViewIfNeeded();
    await page.locator(".card-learn").focus();
    const y = await page.evaluate(() => scrollY);
    check(y > 50, "Browsing position test has meaningful scroll");
    await page.keyboard.press("Enter");
    await ready();
    await page.waitForFunction(
      (search) =>
        new URL(document.querySelector(".breadcrumb").href).search === search,
      new URL(filteredURL).search,
    );
    const breadcrumb = await page.locator(".breadcrumb").getAttribute("href");
    check(
      new URL(breadcrumb, base).search === new URL(filteredURL).search,
      "Guide breadcrumb retains all filters",
    );
    await page.locator(".breadcrumb").click();
    await page.waitForFunction(
      () => document.querySelector("#game-search")?.value === "avalon",
    );
    await page.waitForTimeout(200);
    check(
      (await page.locator("#filter-favorites").getAttribute("aria-pressed")) ===
        "true" && (await page.locator("#filter-players").inputValue()) === "7",
      "Client return restores controls",
    );
    check(
      Math.abs((await page.evaluate(() => scrollY)) - y) < 3,
      `Breadcrumb restores browsing position (expected ${y}, actual ${await page.evaluate(() => scrollY)})`,
    );
    await page.locator("#lang-es").click();
    await page.waitForURL(base + "/es/" + new URL(filteredURL).search);
    await page.waitForFunction(
      () => document.querySelector("#game-search")?.value === "avalon",
    );
    check(
      (await page.locator("#game-search").inputValue()) === "avalon",
      "Language preserves query",
    );
    await page.reload();
    await page.waitForFunction(
      () => document.querySelector("#game-search")?.value === "avalon",
    );
    check(
      (await page.locator(".game-card").count()) === 1 &&
        (await page
          .locator("#filter-favorites")
          .getAttribute("aria-pressed")) === "true",
      "Reload preserves favorites and all filters",
    );
    await openDisclosure(page, "#collection-filter-options");
    await page.locator("#clear-filters").click();
    await page.goBack();
    await page.waitForFunction(
      () => document.querySelector("#game-search")?.value === "avalon",
    );
    check(
      (await page.locator(".game-card").count()) === 1,
      "Back restores filter history",
    );
    await page.goForward();
    await page.waitForFunction(
      () => document.querySelector("#game-search")?.value === "",
    );
    check(
      (await page.locator(".game-card").count()) === 15,
      "Forward restores cleared collection",
    );

    // Every player count, locale and setup step fits at the previously failing width.
    for (const width of [320, 390, 1440])
      for (const lang of ["en", "es"]) {
        await page.setViewportSize({ width, height: 900 });
        await navigate(`/${lang}/avalon/learn/`);
        await learningStage(page, "setup");
        for (const count of [5, 6, 7, 8, 9, 10]) {
          await learningLesson(page, "basic-roles");
          await page.locator("#players").selectOption(String(count));
          await page.locator("#avalon-mode").selectOption("basic");
          check(
            (await page.locator("[data-role]").count()) === 0,
            "Basic roles stay simple",
          );
          await fits(`${width}/${lang}/${count}: basic roles fit`);
          await page.locator("#avalon-mode").selectOption("optional");
          const evil = count <= 6 ? 2 : count <= 9 ? 3 : 4;
          check(
            (await page.locator("#role-mordred").isDisabled()) === (evil === 2),
            "Capacity reserves an Evil slot for Assassin",
          );
          if (evil >= 3) await page.locator("#role-mordred").check();
          if (evil === 4) await page.locator("#role-oberon").check();
          await page.locator("#lady-option").check();
          check(
            (
              await page.locator("[data-tool=setup-roles] .callout").innerText()
            ).includes(lang === "en" ? "2, 3 and 4" : "2, 3 y 4"),
            "Lady timing and restrictions remain available",
          );
          await fits(`${width}/${lang}/${count}: optional roles fit`);
          await page.locator("#lesson-next").click();
          if (count === 5) check(
            !(await page.locator("#avalon-roster").evaluate(node => node.open)) &&
            !(await page.locator("#avalon-quests").evaluate(node => node.open)),
            "References begin collapsed",
          );
          else check(
            await page.locator("#avalon-roster").evaluate(node => node.open) &&
            await page.locator("#avalon-quests").evaluate(node => node.open),
            "Mounted setup references stay open between lessons",
          );
          if (!await page.locator("#avalon-roster").evaluate(node => node.open))
          await page.locator("#avalon-roster > summary").click();
          check(
            (await page.locator("#roster").innerText()).includes(
              "Percival, Morgana",
            ),
            "Selected roster survives steps",
          );
          if (!await page.locator("#avalon-quests").evaluate(node => node.open))
            await page.locator("#avalon-quests > summary").click();
          const questSizes = {
            5: [2, 3, 2, 3, 3],
            6: [2, 3, 4, 3, 4],
            7: [2, 3, 3, 4, 4],
            8: [3, 4, 4, 5, 5],
            9: [3, 4, 4, 5, 5],
            10: [3, 4, 4, 5, 5],
          };
          check(
            JSON.stringify(
              await page
                .locator("#avalon-quests .quest strong")
                .allTextContents(),
            ) === JSON.stringify(questSizes[count].map(String)),
            "Quest sizes match player-count exceptions",
          );
          check(
            (await page.locator("#avalon-quests .quest.special").count()) ===
              (count >= 7 ? 1 : 0),
            "Fourth quest needs two Fails at 7–10",
          );
          await fits(`${width}/${lang}/${count}: expanded references fit`);
          await page.locator("#setup-check-0").check();
          await page.locator("#setup-check-1").check();
          await page.locator("#lesson-next").click();
          await page.waitForSelector(
            "[data-tool=setup-script][data-ready=true]",
          );
          const script = await page.locator("[data-tool=setup-script] .script").innerText();
          check(
            script.includes(
              lang === "en" ? "Merlin and Morgana" : "Merlín y Morgana",
            ),
            `${width}/${lang}/${count}: Recognition script follows Percival and Morgana: ${script}`,
          );
          check(
            evil < 3 ||
              script.includes(
                lang === "en" ? "EXCEPT Mordred" : "EXCEPTO Mordred",
              ),
            "Mordred stays hidden from Merlin",
          );
          check(
            evil < 4 ||
              script.includes(
                lang === "en" ? "EXCEPT Oberon" : "EXCEPTO Oberón",
              ),
            "Oberon does not recognize Evil",
          );
          check(
            (await page.locator("#setup-check-0").isChecked()) &&
              (await page.locator("#setup-check-1").isChecked()),
            "Checklist retained between steps",
          );
          await fits(`${width}/${lang}/${count}: script fits`);
        }
        await page.locator("#theme").click();
        await fits(`${width}/${lang}: alternate theme fits`);
        await page.screenshot({
          path: path.join(output, `avalon-${lang}-${width}.png`),
        });
      }
    await page.evaluate(() => {
      const config = JSON.parse(
        localStorage.getItem("tablefolk-avalon-setup-v1"),
      );
      localStorage.setItem(
        "tablefolk-setup-checklist-avalon",
        JSON.stringify({
          signature: JSON.stringify([
            config.players,
            config.avalonMode,
            [...config.optional].sort(),
            config.lady,
          ]),
          checked: [true, true, false],
        }),
      );
    });
    await page.reload();
    await ready();
    check(
      (await page.locator("[data-learning-step]").getAttribute("data-learning-step")) ===
        "avalon-opening",
      "Flow position recovers after reload",
    );
    check(
      (await page.locator("#setup-check-0").isChecked()) &&
        (await page.locator("#setup-check-1").isChecked()) &&
        !(await page.locator("#setup-check-3").isChecked()),
      "Legacy checklist recovers after reload with the new choice check unmarked",
    );
    await learningLesson(page, "basic-roles");
    check(
      (await page.locator("#players").inputValue()) === "10",
      "Saved setup survives reload",
    );
    await page.locator("#players").selectOption("5");
    check(
      (await page.locator("[data-role]:checked").count()) === 2 &&
        (await page.locator("#role-mordred").isDisabled()),
      "Reducing players normalizes role capacity",
    );
    await page.waitForFunction(
      () => !document.querySelector("#setup-check-0").checked,
    );
    check(
      !(await page.locator("#setup-check-0").isChecked()),
      "Configuration change invalidates old checks",
    );
    await page.locator("#lesson-next").focus();
    await page.keyboard.press("Enter");
    check(
      (await page.locator("[data-learning-step]").getAttribute("data-learning-step")) ===
        "avalon-prepare",
      "Flow works with keyboard",
    );
    await page.waitForFunction(() =>
      document.activeElement?.matches(".lesson-copy h3"),
    );
    check(
      await page
        .locator(".lesson-copy h3")
        .evaluate((node) => node === document.activeElement),
      "Step change focuses the heading",
    );

    // Activity metadata is independent of both timer snapshots and refresh events.
    await navigate("/en/chess/play/");
    await page.locator("#chess-clock-toggle").click();
    await page.locator("#chess-clock-toggle").click();
    await navigate("/en/poker/play/");
    await page.locator("#poker-timer-toggle").click();
    await page.locator("#poker-timer-toggle").click();
    const snapshots = await page.evaluate(() =>
      ["tablefolk-chess-clock", "tablefolk-poker-tournament-v1"].map((key) =>
        localStorage.getItem(key),
      ),
    );
    const activity = await page.evaluate(() =>
      localStorage.getItem("tablefolk-game-activity-v1"),
    );
    await page.goto(base + "/en/");
    await page.waitForSelector("#view-saved-games");
    check(
      (await page.locator(".resume-card").count()) === 1 &&
        (await page.locator(".resume-card").getAttribute("data-game")) ===
          "poker",
      "Latest unfinished session first and one card shown",
    );
    check(
      (await page.locator(".returning-hero").isVisible()) &&
        !(await page.locator(".hero-gallery").isVisible()),
      "Returning introduction is compact",
    );
    await page.locator("#view-saved-games").focus();
    await page.keyboard.press("Enter");
    check(
      (await page.locator(".resume-card").count()) === 2 &&
        (await page
          .locator("#view-saved-games")
          .getAttribute("aria-expanded")) === "true",
      "Accessible control reveals every unfinished entry",
    );
    for (const width of [390, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await fits(`Resume cards fit at ${width}`);
      check(
        await page
          .locator(".resume-card img")
          .evaluateAll((images) =>
            images.every(
              (img) =>
                img.srcset &&
                img.sizes === "60px" &&
                img.width > 0 &&
                img.height > 0,
            ),
          ),
        "Resume uses responsive thumbnails and dimensions",
      );
      await page.screenshot({ path: path.join(output, `resume-${width}.png`) });
    }
    await page.locator("#view-saved-games").click();
    await page.locator("#lang-es").click();
    await page.waitForURL(base + "/es/");
    await page.waitForSelector("#view-saved-games");
    await page.reload();
    await page.waitForSelector("#view-saved-games");
    await page.waitForTimeout(1100);
    check(
      (await page.evaluate(() =>
        localStorage.getItem("tablefolk-game-activity-v1"),
      )) === activity,
      "Locale, reload and timer refresh do not reorder activity",
    );
    check(
      JSON.stringify(
        await page.evaluate(() =>
          ["tablefolk-chess-clock", "tablefolk-poker-tournament-v1"].map(
            (key) => localStorage.getItem(key),
          ),
        ),
      ) === JSON.stringify(snapshots),
      "Expand, collapse, locale and reload leave paused clocks unchanged",
    );
    await page.locator(".resume-link").click();
    await ready();
    check(
      (await page.locator("#poker-timer-phase").innerText()) === "En pausa",
      "Resume does not restart paused poker timer",
    );
    await navigate("/en/chess/play/");
    await page.locator("#chess-clock-toggle").click();
    const activeBeforeTicks = await page.evaluate(() =>
      localStorage.getItem("tablefolk-game-activity-v1"),
    );
    await page.waitForTimeout(1200);
    check(
      (await page.evaluate(() =>
        localStorage.getItem("tablefolk-game-activity-v1"),
      )) === activeBeforeTicks,
      "Running timer ticks never update activity",
    );
    await page.locator("#chess-clock-toggle").click();

    // Art uses WebP previews, while enlargement always fetches the published original.
    for (const width of [390, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await navigate("/en/avalon/learn/");
      await page.locator(".guide-artwork").evaluate((img) => img.decode());
      check(
        await page
          .locator(".guide-artwork")
          .evaluate(
            (img) =>
              img.currentSrc.includes("/responsive/") &&
              img.currentSrc.endsWith(".webp"),
          ),
        "Guide artwork is responsive WebP",
      );
      if (width === 390)
        check(
          await page
            .locator(".guide-artwork")
            .evaluate((img) => /-(96|192)\.webp$/.test(img.currentSrc)),
          "Phone guide artwork uses a small thumbnail",
        );
      await page.locator("#learning-tools > summary").click();
      const thumb = page.locator("[data-art]:visible").first();
      const original = await thumb.getAttribute("data-art");
      await thumb.scrollIntoViewIfNeeded();
      await thumb.locator("img").evaluate((img) => img.decode());
      check(
        await thumb
          .locator("img")
          .evaluate(
            (img) => img.srcset && img.currentSrc.includes("/responsive/"),
          ),
        "Guide component thumbnails are responsive",
      );
      await thumb.click();
      const dialog = page.locator("#image-viewer[open]");
      check(
        await dialog.isVisible(),
        "Image dialog opens on phone and desktop",
      );
      await dialog.locator(".image-stage img").evaluate((img) => img.decode());
      const catalog = JSON.parse(
        fs.readFileSync(path.join(__dirname, "../src/generated/catalog.json")),
      );
      check(
        (await dialog.locator(".image-stage img").getAttribute("src")) ===
          "/" + catalog.official[original].src.replace(/^\//, ""),
        "Enlarged artwork uses the original image",
      );
      await fits(`Image dialog fits at ${width}`);
      await page.screenshot({ path: path.join(output, `dialog-${width}.png`) });
      await page.keyboard.press("Escape");
      check(
        await thumb.evaluate((node) => node === document.activeElement),
        "Image dialog returns focus",
      );
      await page.goto(base + "/en/");
      await page.locator("#collection").scrollIntoViewIfNeeded();
      check(
        await page
          .locator(".game-card img")
          .evaluateAll((images) =>
            images.every(
              (img) =>
                img.srcset && img.sizes && img.width > 0 && img.height > 0,
            ),
          ),
        "Every collection card uses responsive images and dimensions",
      );
      if (width === 390) {
        const manifest = JSON.parse(
          fs.readFileSync(path.join(__dirname, "../src/generated/images.json")),
        );
        const desktopPhotos = [
          "/assets/avalon.jpg",
          "/assets/coup.jpg",
          "/assets/poker.jpg",
        ].flatMap((src) =>
          manifest[src].variants.map((variant) => variant.src),
        );
        check(
          await page.evaluate(
            (paths) =>
              performance
                .getEntriesByType("resource")
                .every(
                  (entry) => !paths.includes(new URL(entry.name).pathname),
                ),
            desktopPhotos,
          ),
          "Phones never fetch hidden homepage hero photos",
        );
      }
      await fits(`Collection fits at ${width}`);
      await page.screenshot({
        path: path.join(output, `collection-${width}.png`),
      });
    }
    check(errors.length === 0, "No browser errors: " + errors.join("; "));
    console.log(
      `Passed ${checks} experience checks (${engine}). Screenshots: ${output}`,
    );
  } finally {
    await browser.close();
  }
})()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => server.kill());
