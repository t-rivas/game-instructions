const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");
const { spawn } = require("node:child_process");
const { chromium, webkit } = require("playwright");
const root = path.resolve(__dirname, "..");
const catalog = JSON.parse(
  fs.readFileSync(path.join(root, "src/generated/catalog.json")),
);
const games = Object.keys(catalog.games);
let checks = 0;
const check = (value, message) => {
  assert.ok(value, message);
  checks++;
};
const server = spawn(
  process.execPath,
  [path.join(root, "scripts/serve-export.mjs")],
  { cwd: root, stdio: ["ignore", "pipe", "inherit"] },
);
const origin = new Promise((resolve, reject) => {
  server.stdout.once("data", (chunk) => resolve(chunk.toString().trim()));
  server.once("error", reject);
  server.once("exit", (code) =>
    reject(new Error(`Static server exited ${code}`)),
  );
});
(async () => {
  const base = await origin;
  const engine = process.env.BROWSER || "chromium";
  const browser = await { chromium, webkit }[engine].launch({
    headless: true,
    ...(engine === "chromium" && process.env.CHROME_CHANNEL
      ? { channel: process.env.CHROME_CHANNEL }
      : {}),
  });
  const output = fs.mkdtempSync(path.join(os.tmpdir(), "tablefolk-next-"));
  try {
    const noJS = await browser.newContext({ javaScriptEnabled: false });
    const staticPage = await noJS.newPage();
    for (const lang of ["es", "en"])
      for (const game of games)
        for (const view of ["learn", "play", "rules"]) {
          const response = await staticPage.goto(
            `${base}/${lang}/${game}/${view}/`,
          );
          check(
            response.status() === 200,
            `${lang}/${game}/${view}: direct static route`,
          );
          check(
            (await staticPage.locator("html").getAttribute("lang")) === lang,
            "HTML language is correct before JavaScript",
          );
          check(
            (await staticPage.locator("h1").textContent()) ===
              catalog.games[game].name[lang],
            "Game heading is rendered before JavaScript",
          );
          check(
            (await staticPage.title()).includes(catalog.games[game].name[lang]),
            "Per-game metadata",
          );
          check(
            (await staticPage
              .locator("meta[name=description]")
              .getAttribute("content")) ===
              catalog.games[game].description[lang],
            "Per-game description",
          );
          if (view === "rules") {
            check(
              (await staticPage.locator(".rule-section").count()) ===
                catalog.games[game].sections.length,
              "All base rules are present in the HTML",
            );
            check(
              (await staticPage
                .locator(".rule-body p")
                .first()
                .textContent()) ===
                catalog.games[game].sections[0].paragraphs[0][lang],
              "Rule text is readable without JavaScript",
            );
          }
          if (view === "learn")
            check(
              await staticPage.locator("#learn-setup").isVisible(),
              "Essential setup is visible before JavaScript",
            );
        }
    for (const invalid of [
      "/en/not-a-game/rules/",
      "/fr/chess/play/",
      "/es/chess/not-a-view/",
    ])
      check(
        (await staticPage.goto(base + invalid)).status() === 404,
        "Invalid routes return 404",
      );
    await noJS.close();
    check(
      fs
        .readFileSync(path.join(root, "out/game-night.html"))
        .equals(fs.readFileSync(path.join(root, "game-night.html"))),
      "Offline download matches the portable guide",
    );
    console.log("Static pages, metadata, language and offline export passed.");

    const context = await browser.newContext({
        viewport: { width: 390, height: 900 },
      }),
      page = await context.newPage(),
      errors = [],
      requests = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    page.on("request", (request) => requests.push(request.url()));
    const ready = async () => {
      await page.waitForFunction(
        () =>
          document.querySelector("main")?.dataset.route === location.pathname &&
          document.querySelector("[data-tool=sources][data-ready=true]"),
      );
    };
    const clickRoute = async (selector, path) => {
      await page.locator(selector).click();
      await page.waitForURL(base + path);
      await ready();
    };
    const visit = async (game, view = "play", lang = "en") => {
      await page.goto(`${base}/${lang}/${game}/${view}/`);
      await ready();
    };
    await page.goto(base + "/en/");
    await page.locator("#filter-players").selectOption("3");
    check(
      (await page.locator(".game-card[data-game=truco]").count()) === 0 &&
        (await page.locator(".game-card[data-game=burako]").count()) === 0,
      "Player filter respects exact 2/4-player games",
    );
    await page.locator("#filter-duration").selectOption("30");
    check(
      (await page.locator(".game-card[data-game=coup]").count()) === 1 &&
        (await page.locator(".game-card[data-game=poker]").count()) === 0,
      "Time filter uses the full listed duration",
    );
    await page.locator(".game-card[data-game=coup] .favorite-toggle").click();
    await page.locator("#clear-filters").click();
    await page.locator("#filter-favorites").click();
    check((await page.locator(".game-card").count()) === 1, "Favorites filter");
    await page.reload();
    await page.waitForFunction(
      () =>
        document
          .querySelector(".game-card[data-game=coup] .favorite-toggle")
          ?.getAttribute("aria-pressed") === "true",
    );
    await page.locator("#filter-favorites").click();
    check(
      (await page.locator(".game-card").count()) === 1,
      "Favorite selection survives reload",
    );
    await page.locator("#clear-filters").click();
    await page.locator("#game-search").fill("ajedrez");
    check(
      (await page.locator(".game-card").count()) === 1,
      "Bilingual collection search",
    );
    await clickRoute(".card-learn", "/en/chess/learn/");
    check(
      page.url().endsWith("/en/chess/learn/"),
      "Learn follows a Next route",
    );
    await page.locator("#lesson-next").click();
    check(
      (await page.locator(".lesson-counter").textContent()).startsWith("2 /"),
      "React lesson advances",
    );
    await clickRoute(
      "#lang-es",
      page.url().replace(base, "").replace("/en/", "/es/"),
    );
    check(
      page.url().endsWith("/es/chess/learn/") &&
        (await page.locator(".lesson-counter").textContent()).startsWith("2 /"),
      "Language routing preserves lesson progress",
    );
    await visit("avalon", "learn");
    check(
      (await page
        .locator(".detail-hero")
        .evaluate((node) => node.getBoundingClientRect().height)) < 170,
      "First-visit phone guide banner is compact",
    );
    check(
      (await page
        .locator("#learn-setup")
        .evaluate((node) => node.getBoundingClientRect().top)) < 800,
      "Phone setup is brought forward",
    );
    await page.locator("#players").selectOption("5");
    await page.locator("#avalon-mode").selectOption("optional");
    check(
      (await page.locator("#roster").innerText()).includes(
        "Percival, Morgana, 1 Loyal Servant",
      ),
      "Avalon setup still computes the roster",
    );
    check(
      await page.locator("#role-mordred").isDisabled(),
      "Role capacity still enforced",
    );
    await page.locator("#setup-check-0").check();
    await page.locator("#setup-check-1").check();
    await clickRoute(
      "#lang-es",
      page.url().replace(base, "").replace("/en/", "/es/"),
    );
    check(
      (await page.locator("#players").inputValue()) === "5" &&
        (await page.locator("#roster").innerText()).includes(
          "Percival, Morgana",
        ),
      "Language switch preserves Avalon setup",
    );
    check(
      (await page.locator("#setup-check-0").isChecked()) &&
        (await page.locator("#setup-check-1").isChecked()),
      "Checklist preserves completion across languages",
    );
    await page.reload();
    await ready();
    check(
      (await page.locator("#players").inputValue()) === "5" &&
        (await page.locator("#setup-check-0").isChecked()),
      "Avalon configuration and checklist recover after reload",
    );
    await page.locator("#players").selectOption("6");
    await page.waitForFunction(
      () => !document.querySelector("#setup-check-0").checked,
    );
    check(
      !(await page.locator("#setup-check-1").isChecked()),
      "Changing setup invalidates completed checks",
    );
    await page.locator("#players").selectOption("5");
    check(
      !(await page.locator("#setup-check-0").isChecked()),
      "Changing back does not restore outdated setup checks",
    );
    await page.locator("#learning-tools > summary").click();
    await page.locator('[data-quest="4"]').click();
    await page.locator("#fail-more").click();
    check(
      (await page.locator("#quest-demo .failure").count()) === 1,
      "Quest practice remains interactive",
    );
    await page.locator("[data-art]").first().click();
    check(
      (await page.locator("dialog[open]").count()) === 1,
      "Image viewer opens",
    );
    await page.keyboard.press("Escape");
    check(
      (await page.locator("dialog[open]").count()) === 0,
      "Image viewer closes",
    );

    await visit("monopoly");
    await page.locator("#find-rule").click();
    await page.locator("#rule-search-dialog").fill("auction");
    check(
      (await page.locator(".rule-search-result").count()) > 0,
      "Search finds the selected game’s rules",
    );
    await page.locator(".rule-search-result").first().click();
    await page.waitForURL(base + "/en/monopoly/rules/?q=auction#movement");
    await ready();
    await page.waitForFunction(() => document.querySelector("#movement")?.open);
    check(
      page.url().includes("/monopoly/rules/?q=auction#movement"),
      "Search opens the matching Next page and section",
    );
    check(
      (await page.locator("#movement .rule-body mark").count()) > 0,
      "Search highlights matches in the opened rule",
    );
    await page.goBack();
    await ready();
    await page.locator("#find-rule").click();
    check(
      (await page.locator("#rule-search-dialog").inputValue()) === "auction",
      "Back navigation restores the search",
    );
    await page.keyboard.press("Escape");
    await page.waitForFunction(
      () => document.activeElement?.id === "find-rule",
    );
    check(
      await page
        .locator("#find-rule")
        .evaluate((node) => node === document.activeElement),
      "Search dialog returns keyboard focus",
    );
    await page.goForward();
    await ready();
    await page.locator("#expand-all").click();
    check(
      (await page.locator(".rule-section:not([open])").count()) === 0,
      "Expand all works",
    );
    await page.locator("#rule-search").fill("zzzz");
    check(
      (await page.locator("#rule-search-results").innerText()).includes(
        "No rules found",
      ),
      "Empty search feedback",
    );
    await page.locator("#rule-search-clear").click();
    check(
      (await page.locator("#rule-search").inputValue()) === "",
      "Clear search",
    );
    await page.locator("#section-jump").selectOption("jail");
    await page.waitForFunction(() => document.querySelector("#jail")?.open);
    check(page.url().endsWith("#jail"), "Section jump uses a section fragment");

    await page.goto(base + "/es/monopoly/rules/?q=carcel#jail");
    await ready();
    check(
      (await page.locator("#jail .rule-body mark").count()) > 0,
      "Shared search links highlight accented Spanish terms",
    );
    await clickRoute("#tab-play", "/es/monopoly/play/");
    await page.locator("#find-rule").click();
    check(
      (await page.locator("#rule-search-dialog").inputValue()) === "carcel",
      "A shared query remains available after changing views",
    );
    await page.keyboard.press("Escape");

    await visit("coup");
    await page.locator("#theme").click();
    const theme = await page.locator("html").getAttribute("data-theme");
    await page.locator("#reformation-toggle").click();
    check(
      (await page.evaluate(
        () => JSON.parse(localStorage.getItem("tablefolk-preferences")).theme,
      )) === theme,
      "Variant changes preserve the React theme preference",
    );
    await clickRoute(
      "#tab-rules",
      new URL(page.url()).pathname.replace("/play/", "/rules/"),
    );
    check(
      (await page
        .locator("#reformation-toggle")
        .getAttribute("aria-checked")) === "true",
      "Variant follows view navigation",
    );
    check(
      (await page.locator(".edition").innerText()).includes("Reformation"),
      "Edition follows variant",
    );
    await visit("skull_king");
    await page.locator("#skull-expansion-toggle").click();
    await clickRoute(
      "#tab-rules",
      new URL(page.url()).pathname.replace("/play/", "/rules/"),
    );
    check(
      (await page.locator("#expansion-setup").count()) === 1,
      "Expansion rules follow the selected edition",
    );
    await page.locator("#rule-search").fill("Walk the Plank");
    check(
      (await page.locator(".rule-search-result").count()) > 0,
      "Expansion rules are searchable",
    );
    await page.locator("#skull-expansion-toggle").click();

    // A clock survives client navigation, locale changes and page reloads.
    await visit("chess");
    const time = new Date("2026-10-02T12:00:00Z");
    await page.clock.install({ time });
    await page.clock.pauseAt(new Date(time.getTime() + 1000));
    await page.locator("#chess-clock-preset").selectOption("3");
    await page.locator("#chess-clock-increment").fill("2");
    await page.locator("#chess-clock-toggle").click();
    await page.clock.runFor(1500);
    await page.locator("#chess-clock-player-0").click();
    check(
      (await page.locator("#chess-clock-time-0").textContent()) === "3:01",
      "Chess increment applies once",
    );
    await clickRoute(
      "#tab-rules",
      new URL(page.url()).pathname.replace("/play/", "/rules/"),
    );
    await page.clock.fastForward(10000);
    await clickRoute(
      "#tab-play",
      new URL(page.url()).pathname
        .replace("/rules/", "/play/")
        .replace("/learn/", "/play/"),
    );
    check(
      (await page.locator("#chess-clock-time-1").textContent()) === "2:50",
      "Clock runs while reading rules",
    );
    await clickRoute(
      "#lang-es",
      page.url().replace(base, "").replace("/en/", "/es/"),
    );
    check(
      (await page
        .locator("#chess-clock-player-1")
        .getAttribute("aria-disabled")) === "false",
      "Locale change preserves the active side",
    );
    await page.reload();
    await ready();
    check(
      (await page.locator("#chess-clock-time-1").textContent()) === "2:50",
      "Reload restores remaining time",
    );
    await page.locator("#chess-clock-toggle").click();
    await page.reload();
    await ready();
    await page.clock.fastForward(60000);
    check(
      (await page.locator("#chess-clock-time-1").textContent()) === "2:50",
      "Paused reload stays paused",
    );
    await page.clock.resume();
    await page.locator("#focus-play").click();
    await page.waitForFunction(
      () => document.querySelector("#main")?.dataset.focus === "true",
    );
    check(
      !(await page.locator("#header").isVisible()) &&
        !(await page.locator("#table-sheet").isVisible()),
      "Full-screen play keeps the clock in focus",
    );
    check(
      !(await page.locator("#chess-clock-settings").isVisible()),
      "Active clock settings collapse",
    );
    check(
      (await page
        .locator("#chess-clock-time-0")
        .evaluate((node) => parseFloat(getComputedStyle(node).fontSize))) >= 52,
      "Full-screen clock digits are enlarged",
    );
    await page.locator("#find-rule").click();
    await page.keyboard.press("Escape");
    check(
      (await page.locator("#main").getAttribute("data-focus")) === "true",
      "Closing search keeps full-screen play",
    );
    await page.reload();
    await ready();
    check(
      (await page.locator("#main").getAttribute("data-focus")) === "true" &&
        (await page.locator("#chess-clock-toggle").textContent()) ===
          "Continuar",
      "Full-screen preference and paused clock recover independently",
    );
    await page.keyboard.press("Escape");
    await page.waitForFunction(
      () => document.querySelector("#main")?.dataset.focus === "false",
    );
    check(
      await page.locator("#header").isVisible(),
      "Escape exits full-screen play",
    );

    await visit("truco");
    await page.locator("#truco-name-0").fill("Ana");
    await page.locator("#truco-name-1").fill("Bea");
    await page.locator("#truco-start").click();
    await page.locator("#truco-add-0-3").click();
    await page.locator("#truco-custom-1").fill("4");
    await clickRoute(
      "#tab-learn",
      new URL(page.url()).pathname.replace("/play/", "/learn/"),
    );
    await clickRoute(
      "#tab-play",
      new URL(page.url()).pathname
        .replace("/rules/", "/play/")
        .replace("/learn/", "/play/"),
    );
    check(
      (await page.locator("#truco-custom-1").inputValue()) === "4",
      "Unfinished award survives view navigation",
    );
    await page.reload();
    await ready();
    check(
      (await page.locator("#truco-custom-1").inputValue()) === "4" &&
        (
          await page.locator('[data-truco-side="0"] .truco-total').textContent()
        ).includes("3 / 30"),
      "Existing scores and drafts survive reload",
    );
    await page.locator("#truco-custom-save-1").click();
    await page.locator("#truco-correct-0").click();
    await page.locator("#truco-edit-points").fill("5");
    await page.reload();
    await ready();
    check(
      (await page.locator("#truco-edit-points").inputValue()) === "5",
      "Unfinished correction recovers",
    );
    await page.locator("#truco-save-correction").click();
    check(
      (
        await page.locator('[data-truco-side="0"] .truco-total').textContent()
      ).includes("5 / 30"),
      "Recovered correction can be saved",
    );
    await page.locator("#focus-play").click();
    check(
      (await page.locator("#truco-custom-1").inputValue()) === "",
      "Full-screen preserves the active scoreboard",
    );
    await page.locator("#truco-custom-1").fill("2");
    await page.locator("#focus-play").click();
    check(
      (await page.locator("#truco-custom-1").inputValue()) === "2",
      "Leaving full-screen preserves unfinished inputs",
    );

    await visit("moth");
    for (const [i, name] of ["Ana", "Bea", "Camilo"].entries())
      await page.locator(`#moth-name-${i}`).fill(name);
    await page.locator("#moth-player-form button[type=submit]").click();
    await page.locator("#moth-out").selectOption("0");
    await page.locator("#moth-count-1-0").fill("4");
    await page.reload();
    await ready();
    check(
      (await page.locator("#moth-count-1-0").inputValue()) === "4",
      "Moth draft recovery",
    );
    await page.locator("#moth-save-round").click();
    check(
      (await page.locator('[data-moth-total="1"]').textContent()) === "4",
      "Moth saves correct penalties",
    );

    await visit("skull_king");
    await page.locator("#skull-name-0").fill("Ana");
    await page.locator("#skull-name-1").fill("Bea");
    await page.locator("#skull-score-setup button[type=submit]").click();
    await page.locator("#skull-bid-0").fill("1");
    await page.locator("#skull-tricks-0").fill("1");
    await page.reload();
    await ready();
    check(
      (await page.locator("#skull-bid-0").inputValue()) === "1",
      "Skull King draft recovery",
    );
    await page.locator("#skull-round-form button[type=submit]").click();
    check(
      (await page.locator('[data-skull-total="0"]').textContent()) === "20",
      "Skull King scoring is preserved",
    );

    await visit("coup");
    for (const [i, name] of [
      "Ana",
      "Bea",
      "Camilo",
      "Dan",
      "Eve",
      "Flo",
    ].entries()) {
      if (await page.locator(`#coup-name-${i}`).count())
        await page.locator(`#coup-name-${i}`).fill(name);
    }
    await page.locator("#coup-start").click();
    await page.locator("#coup-winner").selectOption("0");
    await page.reload();
    await ready();
    check(
      (await page.locator("#coup-winner").inputValue()) === "0",
      "Coup result draft recovers",
    );
    if (await page.locator("#coup-runner-up").count())
      await page.locator("#coup-runner-up").selectOption("1");
    await page.locator("#coup-save-result").click();
    check(
      (await page.locator(".coup-session-history li").count()) === 1,
      "Coup confirms one result",
    );

    await visit("poker");
    await page.locator("#poker-timer-toggle").click();
    await page.locator("#poker-timer-toggle").click();
    await page.reload();
    await ready();
    check(
      (await page.locator("#poker-timer-phase").textContent()) === "Paused",
      "Poker timer recovery",
    );
    await page.locator("#table-practice > summary").click();
    await page.locator("#street-next").click();
    check(
      (await page.locator("#poker-demo").innerText()).includes(
        "Three shared cards",
      ),
      "Poker hand practice",
    );
    await visit("catan");
    await page.locator("#table-practice > summary").click();
    await page.locator("#scenario-choice-0").click();
    check(
      (await page.locator("#scenario-feedback").innerText()).length > 20,
      "Decision practice answers",
    );
    const practiceHref = await page
      .locator("#scenario-practice > a")
      .getAttribute("href");
    await clickRoute("#scenario-practice > a", practiceHref);
    check(
      page.url().includes("/catan/rules/"),
      "Practice link uses Next navigation",
    );
    console.log(
      "Next navigation, variants, practice and all six play tools passed.",
    );

    await page.goto(base + "/en/");
    await page.waitForSelector(".resume-card[data-game=truco]");
    check(
      (
        await page.locator(".resume-card[data-game=truco]").innerText()
      ).includes("Ana: 5"),
      "Homepage summarizes validated saved scores",
    );
    check(
      (await page.locator(".resume-card").count()) === 6,
      "All six unfinished games are discoverable",
    );
    await clickRoute(
      ".resume-card[data-game=truco] .resume-link",
      "/en/truco/play/",
    );
    check(
      (await page.locator("#truco-custom-1").inputValue()) === "2",
      "Resume restores an unfinished award",
    );
    await page.goto(base + "/es/");
    await page.waitForSelector(".resume-card[data-game=chess]");
    check(
      (
        await page.locator(".resume-card[data-game=chess]").innerText()
      ).includes("En pausa"),
      "Resume summaries follow the selected language",
    );
    await page.reload();
    await page.waitForSelector(".resume-card[data-game=truco]");
    check(
      (
        await page.locator(".resume-card[data-game=truco]").innerText()
      ).includes("Ana: 5"),
      "Saved-game shortcuts survive a fresh page load",
    );

    for (const width of [320, 390, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      for (const lang of ["en", "es"])
        for (const game of games)
          for (const view of ["learn", "play", "rules"]) {
            await visit(game, view, lang);
            const layout = await page.evaluate(() => {
              const ids = [...document.querySelectorAll("[id]")].map(
                (node) => node.id,
              );
              return {
                overflow: document.documentElement.scrollWidth > innerWidth + 1,
                duplicates: ids.length !== new Set(ids).size,
                badText: /undefined|\[object Object\]/.test(
                  document.getElementById("main").innerText,
                ),
                banner: document
                  .querySelector(".detail-hero")
                  .getBoundingClientRect().height,
                setup: document.querySelectorAll(
                  ".setup-checklist input[type=checkbox]",
                ).length,
              };
            });
            check(
              !layout.overflow && !layout.duplicates && !layout.badText,
              `${width}/${lang}/${game}/${view}: ${JSON.stringify(layout)}`,
            );
            if (width <= 390)
              check(
                layout.banner < 170,
                `${width}/${lang}/${game}/${view}: compact guide banner`,
              );
            if (view === "learn")
              check(layout.setup >= 3, "Every game has a setup checklist");
          }
      await page.goto(base + "/en/");
      await page
        .locator("#collection")
        .screenshot({ path: path.join(output, `collection-${width}.png`) });
      console.log(`All Next routes at ${width}px passed.`);
    }
    await visit("avalon", "learn");
    await page.screenshot({ path: path.join(output, "avalon-learn.png") });
    await visit("monopoly", "rules");
    await page.locator("#rule-search").fill("auction");
    await page.screenshot({ path: path.join(output, "rule-search.png") });

    await page.locator("#tab-rules").focus();
    await page.keyboard.press("ArrowLeft");
    await page.waitForURL(base + "/en/monopoly/play/");
    await ready();
    await page.waitForFunction(() => document.activeElement?.id === "tab-play");
    check(
      (await page.locator("#tab-play").getAttribute("aria-selected")) ===
        "true",
      "Keyboard navigation follows the selected tab",
    );
    await page.keyboard.press("Home");
    await page.waitForURL(base + "/en/monopoly/learn/");
    await ready();
    await page.waitForFunction(
      () => document.activeElement?.id === "tab-learn",
    );

    await page.evaluate(() => {
      window.print = () => {
        window.__printed = true;
      };
    });
    await page.locator("#print").click();
    await page.waitForURL(base + "/en/monopoly/rules/");
    await ready();
    await page.waitForFunction(() => window.__printed);
    check(
      (await page.locator(".rule-section:not([open])").count()) === 0,
      "Print guide navigates to and expands every rule",
    );
    await page.emulateMedia({ media: "print" });
    check(
      !(await page.locator("#header").isVisible()) &&
        !(await page.locator(".rule-search").isVisible()),
      "Print hides interactive navigation and search",
    );
    check(
      (await page
        .locator(".site-shell")
        .evaluate((node) => getComputedStyle(node).backgroundColor)) ===
        "rgb(255, 255, 255)",
      "Game theme prints on white paper",
    );
    await page.emulateMedia({ media: "screen" });
    await visit("dixit");
    await page.emulateMedia({ media: "print" });
    check(
      (await page.locator(".print-dixit-rules").isVisible()) &&
        !(await page.locator(".dixit-score").isVisible()),
      "Compact Dixit print includes every scoring outcome",
    );
    await page.emulateMedia({ media: "screen" });

    for (const width of [320, 390, 1440])
      for (const lang of ["en", "es"])
        for (const game of [
          "chess",
          "poker",
          "coup",
          "truco",
          "moth",
          "skull_king",
        ]) {
          await page.setViewportSize({ width, height: 900 });
          await visit(game, "play", lang);
          await page.locator("#focus-play").click();
          await page.waitForFunction(
            () => document.querySelector("#main")?.dataset.focus === "true",
          );
          check(
            await page
              .locator("#main")
              .evaluate((node) => node.scrollWidth <= node.clientWidth + 1),
            `${width}/${lang}/${game}: full-screen controls fit`,
          );
          check(
            !(await page.locator(".detail-hero").isVisible()),
            "Full-screen play removes the guide banner at every size",
          );
          check(
            (await page.locator("#find-rule").getAttribute("aria-label")) ===
              (lang === "es" ? "Buscar una regla" : "Find a rule"),
            "Full-screen search remains labeled",
          );
          await page.keyboard.press("Escape");
          await page.waitForFunction(
            () => document.querySelector("#main")?.dataset.focus === "false",
          );
        }

    const blockedContext = await browser.newContext({
      viewport: { width: 390, height: 900 },
    });
    await blockedContext.addInitScript(() => {
      Storage.prototype.setItem = function () {
        throw new Error("Storage blocked");
      };
    });
    const blocked = await blockedContext.newPage(),
      blockedErrors = [];
    blocked.on("pageerror", (error) => blockedErrors.push(error.message));
    await blocked.goto(base + "/en/truco/play/");
    await blocked.waitForSelector("[data-tool=play][data-ready=true]");
    check(
      (await blocked.locator(".save-status").innerText()).includes(
        "Saving unavailable",
      ),
      "Full-screen toolbar reports unavailable saving honestly",
    );
    await blocked.locator("#truco-name-0").fill("Ana");
    await blocked.locator("#truco-name-1").fill("Bea");
    await blocked.locator("#truco-start").click();
    await blocked.locator("#truco-add-0-3").click();
    check(
      (
        await blocked
          .locator('[data-truco-side="0"] .truco-total')
          .textContent()
      ).includes("3 / 30"),
      "Scoring still works when storage is unavailable",
    );
    await blocked.goto(base + "/en/chess/learn/");
    await blocked.waitForSelector("[data-tool=sources][data-ready=true]");
    await blocked.locator("#setup-check-0").check();
    check(
      (await blocked.locator(".setup-checklist").innerText()).includes(
        "could not be saved",
      ),
      "Checklist reports failed saving",
    );
    await blocked.goto(base + "/en/");
    await blocked
      .locator(".game-card[data-game=chess] .favorite-toggle")
      .click();
    check(
      (await blocked.locator("#collection").innerText()).includes(
        "Favorites could not be saved",
      ),
      "Favorite storage failure feedback",
    );
    check(
      blockedErrors.length === 0,
      "Unavailable storage causes no uncaught errors",
    );
    await blockedContext.close();

    await page.goto(base + "/#chess/reference");
    await ready();
    check(
      page.url().includes("/chess/play/"),
      "Old hash bookmarks are migrated",
    );
    check(
      requests.every((url) => url.startsWith(base) || url.startsWith("data:")),
      "All runtime assets are local",
    );
    check(
      errors.length === 0,
      "No page or hydration errors: " + errors.join("; "),
    );
    await context.close();
    console.log(
      `Passed ${checks} Next.js migration checks (${engine}). Screenshots: ${output}`,
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
