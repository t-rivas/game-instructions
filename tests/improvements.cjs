const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawn } = require("node:child_process");
const { chromium, webkit } = require("playwright");
const styles = JSON.parse(fs.readFileSync("src/generated/tool-styles.json"));
let checks = 0;
function check(value, message) {
  assert.ok(value, message);
  checks++;
}
const server = spawn(process.execPath, ["scripts/serve-export.mjs"], {
  stdio: ["ignore", "pipe", "inherit"],
});
(async () => {
  const base = await new Promise((resolve, reject) => {
    server.stdout.once("data", (d) => resolve(String(d).trim()));
    server.once("error", reject);
  });
  const engine = process.env.BROWSER || "chromium";
  const browser = await { chromium, webkit }[engine].launch({
    headless: true,
    ...(engine === "chromium" && process.env.CHROME_CHANNEL
      ? { channel: process.env.CHROME_CHANNEL }
      : {}),
  });
  const output = fs.mkdtempSync(
    path.join(os.tmpdir(), "tablefolk-improvements-"),
  );
  const ready = async (page) => {
    try {
      await page.waitForFunction(
        () =>
          document.querySelector("main")?.dataset.route === location.pathname &&
          document.querySelector("[data-tool=sources][data-ready=true]") &&
          [...document.querySelectorAll("[data-tool]")].every(
            (n) => n.dataset.ready === "true",
          ),
      );
    } catch (error) {
      console.error(
        "Guide did not initialize",
        await page.evaluate(() => ({
          url: location.href,
          tools: [...document.querySelectorAll("[data-tool]")].map((n) => ({
            kind: n.dataset.tool,
            ready: n.dataset.ready,
          })),
          alerts: [...document.querySelectorAll('[role="alert"]')].map(
            (n) => n.textContent,
          ),
        })),
      );
      await page.screenshot({
        path: path.join(output, "initialization-failure.png"),
        fullPage: true,
      });
      throw error;
    }
  };
  const collectionReady = async (page) => {
    await page.waitForFunction(() => {
      try {
        return (
          document.querySelector("#game-search") &&
          JSON.parse(localStorage.getItem("tablefolk-preferences") || "{}")
            .visited
        );
      } catch {
        return false;
      }
    });
    // The collection restores browsing position over two animation frames.
    // Exercise links after that restoration, when their touch coordinates settle.
    await page.evaluate(
      () =>
        new Promise((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(resolve)),
        ),
    );
  };
  const focused = async (page, section) => {
    await page.waitForFunction(
      (id) =>
        document.activeElement ===
        document.querySelector(`#${CSS.escape(id)} > summary`),
      section,
    );
    check(
      (await page.locator(`#${section}`).getAttribute("open")) !== null,
      "Selected rule opens and receives focus",
    );
  };
  try {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
    });
    const a = await context.newPage(),
      b = await context.newPage();
    await Promise.all([a.goto(base + "/en/"), b.goto(base + "/es/")]);
    await Promise.all([collectionReady(a), collectionReady(b)]);
    const favorite = (page, id) =>
      page.locator(`.game-card[data-game=${id}] .favorite-toggle`);
    await favorite(a, "avalon").click();
    await b.waitForFunction(
      () =>
        document
          .querySelector(".game-card[data-game=avalon] .favorite-toggle")
          ?.getAttribute("aria-pressed") === "true",
    );
    await favorite(b, "chess").click();
    await a.waitForFunction(
      () =>
        document
          .querySelector(".game-card[data-game=chess] .favorite-toggle")
          ?.getAttribute("aria-pressed") === "true",
    );
    check(
      JSON.stringify(
        JSON.parse(
          await a.evaluate(() => localStorage.getItem("tablefolk-favorites")),
        ).sort(),
      ) === JSON.stringify(["avalon", "chess"]),
      "Favorites added in different tabs both survive",
    );
    await favorite(a, "avalon").click();
    await b.waitForFunction(
      () =>
        document
          .querySelector(".game-card[data-game=avalon] .favorite-toggle")
          ?.getAttribute("aria-pressed") === "false",
    );
    check(
      (await favorite(b, "chess").getAttribute("aria-pressed")) === "true",
      "Removing one favorite preserves another tab’s selection",
    );
    // Coordinate native activations across both tabs to exercise lock contention.
    await Promise.all([
      favorite(a, "coup").evaluate((button) => button.click()),
      favorite(b, "moth").evaluate((button) => button.click()),
    ]);
    try {
      await a.waitForFunction(() => {
        const saved = JSON.parse(localStorage.getItem("tablefolk-favorites"));
        return ["chess", "coup", "moth"].every((id) => saved.includes(id));
      });
    } catch (error) {
      for (const tab of [a, b])
        console.error(
          "Concurrent favorites failed",
          await tab.evaluate(() => ({
            url: location.href,
            saved: localStorage.getItem("tablefolk-favorites"),
            locks: !!navigator.locks,
            selected: [
              ...document.querySelectorAll(
                '.favorite-toggle[aria-pressed="true"]',
              ),
            ].map((n) => n.closest("[data-game]").dataset.game),
          })),
        );
      throw error;
    }
    check(true, "Concurrent edits preserve both additions");
    await a.evaluate(() => localStorage.clear());
    await b.waitForFunction(() =>
      [...document.querySelectorAll(".favorite-toggle")].every(
        (n) => n.getAttribute("aria-pressed") === "false",
      ),
    );
    check(true, "Clearing storage updates the other tab");
    await context.close();
    const blockedContext = await browser.newContext({
      viewport: { width: 390, height: 844 },
    });
    await blockedContext.addInitScript(() => {
      Storage.prototype.setItem = function () {
        throw new Error("Storage blocked");
      };
    });
    const blockedPage = await blockedContext.newPage();
    await blockedPage.goto(base + "/en/");
    await blockedPage.locator(".favorite-toggle").first().click();
    check(
      (await blockedPage.locator("#collection [role=status]").allTextContents())
        .join(" ")
        .includes("Favorites could not be saved"),
      "Blocked storage feedback appears during the favorite action",
    );
    check(
      (await blockedPage
        .locator(".favorite-toggle")
        .first()
        .getAttribute("aria-pressed")) === "true",
      "Unsaved favorites still work for the current page",
    );
    await blockedContext.close();
    console.log("Cross-tab favorites passed.");

    for (const lang of ["en", "es"]) {
      const context = await browser.newContext({
        viewport: { width: 320, height: 740 },
      });
      const page = await context.newPage();
      await page.goto(`${base}/${lang}/?players=7`);
      await collectionReady(page);
      const before = await page.evaluate(() => history.length);
      await page.locator("#game-search").focus();
      await page.keyboard.type("avalon", { delay: 40 });
      await page.waitForFunction(
        () => new URLSearchParams(location.search).get("q") === "avalon",
      );
      check(
        (await page.evaluate(() => history.length)) === before + 1,
        "Continuous typing creates one history entry",
      );
      await page.goBack();
      await page.waitForFunction(
        () => document.querySelector("#game-search").value === "",
      );
      check(
        (await page.locator("#filter-players").inputValue()) === "7",
        "Back restores the prior whole search with filters",
      );
      await page.goForward();
      await page.waitForFunction(
        () => document.querySelector("#game-search").value === "avalon",
      );
      check(true, "Forward restores the complete query");
      await page.locator("#filter-players").selectOption("5");
      await page.goBack();
      await page.waitForFunction(
        () => document.querySelector("#filter-players").value === "7",
      );
      check(
        (await page.locator("#game-search").inputValue()) === "avalon",
        "Discrete filter changes remain separate history entries",
      );
      await page.locator("#clear-filters").click();
      check(new URL(page.url()).search === "", "Clear resets filters and URL");
      await page.locator(".game-card[data-game=avalon] .card-learn").click();
      await ready(page);
      check(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
        "Avalon still fits 320px",
      );
      await page.locator("#lang-" + (lang === "en" ? "es" : "en")).click();
      await page.waitForURL((url) =>
        url.pathname.startsWith("/" + (lang === "en" ? "es" : "en") + "/"),
      );
      await ready(page);
      check(
        (await page.locator("html").getAttribute("lang")) !== lang,
        "Language navigation remains functional",
      );
      await context.close();
    }
    const entry = await browser.newContext();
    await entry.addInitScript(() =>
      localStorage.setItem(
        "tablefolk-preferences",
        JSON.stringify({ lang: "en", theme: "light" }),
      ),
    );
    const redirected = await entry.newPage();
    await redirected.goto(
      base + "/?q=avalon&players=7&duration=60&utm_source=table#collection",
    );
    await redirected.waitForURL((url) => url.pathname === "/en/");
    await redirected.waitForFunction(
      () => document.querySelector("#game-search").value === "avalon",
    );
    check(
      new URL(redirected.url()).searchParams.get("players") === "7" &&
        new URL(redirected.url()).searchParams.get("duration") === "60",
      "Entry redirect preserves validated collection filters",
    );
    check(
      new URL(redirected.url()).searchParams.get("utm_source") === "table" &&
        new URL(redirected.url()).hash === "#collection",
      "Entry redirect preserves relevant query and fragment",
    );
    await redirected.goto(
      base +
        "/?shared=1&exchange=ambassador&reformation=1&q=block#coup/full/blocks",
    );
    await redirected.waitForURL((url) => url.pathname === "/en/coup/rules/");
    await ready(redirected);
    check(
      new URL(redirected.url()).searchParams.get("exchange") === "ambassador" &&
        new URL(redirected.url()).searchParams.get("q") === "block",
      "Legacy guide redirect preserves shared choices and query",
    );
    await entry.close();
    console.log("History and redirect recovery passed.");

    for (const lang of ["en", "es"]) {
      const context = await browser.newContext({
        viewport: { width: 390, height: 844 },
      });
      const page = await context.newPage();
      await page.goto(`${base}/${lang}/catan/rules/`);
      await ready(page);
      await page.locator("#share-guide").focus();
      await page.keyboard.press("Enter");
      await page.keyboard.press("Control+k");
      await page.keyboard.press("Meta+k");
      check(
        (await page.locator("dialog[open]").count()) === 1 &&
          (await page
            .locator("#share-dialog")
            .evaluate((n) => n.contains(document.activeElement))),
        "Search shortcut preserves the current sharing dialog and focus",
      );
      await page.keyboard.press("Escape");
      await page.waitForFunction(
        () => document.activeElement?.id === "share-guide",
      );
      check(true, "Escape restores the sharing opener");
      await page.keyboard.press("Control+k");
      await page.waitForSelector("#rule-dialog[open]");
      await page.keyboard.press("Control+k");
      check(
        (await page.locator("dialog[open]").count()) === 1 &&
          (await page
            .locator("#rule-search-dialog")
            .evaluate((n) => n === document.activeElement)),
        "Repeating search shortcut keeps one focused dialog",
      );
      await page.keyboard.press("Escape");
      await page
        .locator("#rule-search")
        .fill(lang === "en" ? "robber" : "ladrón");
      const result = page.locator(".rule-search-result").first();
      const section = new URL(
        await result.getAttribute("href"),
        base,
      ).hash.slice(1);
      await result.focus();
      await page.keyboard.press("Enter");
      await focused(page, section);
      await page.screenshot({
        path: path.join(output, `focused-rule-${lang}.png`),
      });
      // Selecting an already-open rule must also move focus, without a new hash.
      await result.focus();
      await page.keyboard.press("Enter");
      await focused(page, section);
      await page.locator("#tab-play").click();
      await page.waitForURL((url) => url.pathname.endsWith("/play/"));
      await ready(page);
      await page.keyboard.press("Control+k");
      await page
        .locator("#rule-search-dialog")
        .fill(lang === "en" ? "robber" : "ladrón");
      const dialogResult = page
        .locator("#rule-dialog .rule-search-result")
        .first();
      const nextSection = new URL(
        await dialogResult.getAttribute("href"),
        base,
      ).hash.slice(1);
      await dialogResult.focus();
      await page.keyboard.press("Enter");
      await page.waitForURL((url) => url.pathname.endsWith("/rules/"));
      await ready(page);
      await focused(page, nextSection);
      check(
        (await page.locator("dialog[open]").count()) === 0,
        "Cross-view result closes the dialog and focuses the opened rule",
      );
      await context.close();
    }
    console.log("Modal and rule focus passed.");

    const playing = await browser.newContext({
      viewport: { width: 390, height: 844 },
    });
    const page = await playing.newPage();
    page.on("pageerror", (error) =>
      console.error("Recovery page error:", error.message),
    );
    await page.goto(base + "/en/chess/play/");
    await ready(page);
    await page.locator("#chess-clock-toggle").click();
    const start = await page.evaluate(() =>
      JSON.parse(localStorage.getItem("tablefolk-chess-clock")),
    );
    await page.locator(".breadcrumb").click();
    await collectionReady(page);
    await page.locator(".game-card[data-game=poker] .card-play").click();
    await ready(page);
    await page.locator("#poker-timer-toggle").click();
    await page.locator("#poker-timer-toggle").click();
    const poker = await page.evaluate(() =>
      localStorage.getItem("tablefolk-poker-tournament-v1"),
    );
    await page.locator(".breadcrumb").click();
    await collectionReady(page);
    await page.locator("#view-saved-games").click();
    await page.locator(".resume-card[data-game=chess] .resume-link").click();
    await ready(page);
    check(
      (await page.locator("#chess-clock-toggle").innerText()) === "Pause" &&
        (await page.evaluate(
          () => JSON.parse(localStorage.getItem("tablefolk-chess-clock")).phase,
        )) === "running",
      "Chess keeps running across a different game runtime and collection",
    );
    await page.locator("#chess-clock-toggle").click();
    const paused = await page.evaluate(() =>
      localStorage.getItem("tablefolk-chess-clock"),
    );
    check(
      JSON.parse(paused).remaining[0] < start.remaining[0] &&
        JSON.parse(paused).active === start.active,
      "Elapsed time advances without losing player identity",
    );
    await page.locator(".breadcrumb").click();
    await collectionReady(page);
    await page.locator("#view-saved-games").click();
    check(
      (await page.locator(".resume-card").count()) === 2,
      "Both runtime snapshots remain recoverable",
    );
    await page.locator("#lang-es").click();
    await page.waitForURL(base + "/es/");
    await collectionReady(page);
    await page.reload();
    await page.waitForSelector("#view-saved-games");
    check(
      (await page.evaluate(() =>
        localStorage.getItem("tablefolk-chess-clock"),
      )) === paused &&
        (await page.evaluate(() =>
          localStorage.getItem("tablefolk-poker-tournament-v1"),
        )) === poker,
      "Language and reload preserve both paused snapshots exactly",
    );
    // Independent cached editions must only persist their own preference keys.
    await page.locator(".game-card[data-game=coup] .card-learn").click();
    await ready(page);
    await page.locator("#inquisitor-toggle").click();
    check(
      (await page
        .locator("#inquisitor-toggle")
        .getAttribute("aria-checked")) === "false",
      "Coup uses the selected Ambassador edition",
    );
    await page.locator(".breadcrumb").click();
    await collectionReady(page);
    await page.locator(".game-card[data-game=skull_king] .card-learn").click();
    await ready(page);
    await page.locator("#skull-expansion-toggle").click();
    const preferences = await page.evaluate(() =>
      JSON.parse(localStorage.getItem("tablefolk-preferences")),
    );
    await page.locator(".breadcrumb").click();
    await collectionReady(page);
    await page.locator(".game-card[data-game=coup] .card-learn").click();
    await ready(page);
    await page.locator("#reformation-toggle").click();
    check(
      (await page.evaluate(
        () =>
          JSON.parse(localStorage.getItem("tablefolk-preferences"))
            .skullExpansion,
      )) === preferences.skullExpansion,
      "A cached Coup runtime preserves Skull King preferences",
    );
    for (const id of ["coup", "avalon", "coup"]) {
      await page.locator(".breadcrumb").click();
      await collectionReady(page);
      await page.locator(`.game-card[data-game=${id}] .card-learn`).click();
      await ready(page);
      const art = page.locator("[data-art]").first();
      await art.evaluate((n) => {
        let parent = n.parentElement;
        while (parent) {
          if (parent.tagName === "DETAILS") parent.open = true;
          parent = parent.parentElement;
        }
      });
      await art.focus();
      await page.keyboard.press("Enter");
      await page.waitForSelector("#image-viewer[open]");
      await page.keyboard.press("Control+k");
      check(
        (await page.locator("dialog[open]").count()) === 1,
        "Search shortcut respects artwork dialog across cached runtimes",
      );
      await page.keyboard.press("Escape");
      check(
        await art.evaluate((n) => n === document.activeElement),
        "Artwork focus returns to the current game’s opener",
      );
    }
    await playing.close();
    console.log("Independent game navigation and recovery passed.");

    const measurements = [];
    for (const width of [390, 1440])
      for (const id of [
        "chess",
        "poker",
        "coup",
        "moth",
        "truco",
        "skull_king",
        "avalon",
      ]) {
        const fresh = await browser.newContext({
            viewport: { width, height: 900 },
          }),
          p = await fresh.newPage();
        const errors = [],
          loaded = [];
        p.on("pageerror", (e) => errors.push(e.message));
        const responses = [];
        p.on("response", (response) => {
          if (new URL(response.url()).pathname.endsWith(".js"))
            responses.push(response);
        });
        await p.goto(`${base}/en/${id}/play/`);
        await ready(p);
        for (const response of responses) loaded.push(await response.text());
        const runtimeIds = [
          ...new Set(
            loaded.flatMap((text) =>
              [...text.matchAll(/tablefolk-runtime:([a-z_]+)/g)].map(
                (match) => match[1],
              ),
            ),
          ),
        ];
        check(
          JSON.stringify(runtimeIds) === JSON.stringify([id]),
          `${id}: only its own game runtime loads`,
        );
        const measured = await p.evaluate(() => {
          const entries = performance.getEntriesByType("resource");
          return {
            jsBytes: entries
              .filter((r) => new URL(r.name).pathname.endsWith(".js"))
              .reduce((n, r) => n + r.encodedBodySize, 0),
            cssBytes: entries
              .filter((r) => new URL(r.name).pathname.endsWith(".css"))
              .reduce((n, r) => n + r.encodedBodySize, 0),
            styles: entries
              .filter((r) => r.name.includes("/assets/styles/"))
              .map((r) => new URL(r.name).pathname),
          };
        });
        for (const [other, href] of Object.entries(styles))
          if (other !== "web" && other !== id)
            check(
              !measured.styles.includes(href),
              `${id}: does not download ${other} styles`,
            );
        check(
          measured.cssBytes < 114892,
          `${id}: CSS payload improves on the previous 114892 bytes`,
        );
        if (id === "chess")
          check(
            measured.jsBytes < 700000,
            "Chess raw JavaScript falls by at least 29% from 996110 bytes",
          );
        check(
          await p.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth + 1,
          ),
          `${id} fits ${width}px`,
        );
        check(!errors.length, `${id}: browser errors: ${errors.join(", ")}`);
        measurements.push({ width, id, ...measured });
        await fresh.close();
      }
    const staticContext = await browser.newContext({
        javaScriptEnabled: false,
      }),
      staticPage = await staticContext.newPage();
    await staticPage.goto(base + "/en/chess/play/");
    check(
      await staticPage.locator("#chess-clock").isVisible(),
      "Static guide remains readable without JavaScript",
    );
    check(
      (
        await staticPage
          .locator("link[rel=stylesheet]")
          .evaluateAll((ns) => ns.map((n) => n.getAttribute("href")))
      ).includes(styles.chess),
      "Selected game stylesheet is present in static HTML",
    );
    await staticContext.close();
    fs.writeFileSync(
      path.join(output, "loading.json"),
      JSON.stringify(measurements, null, 2),
    );
    console.log(
      JSON.stringify(
        measurements.map(({ styles, ...row }) => row),
        null,
        2,
      ),
    );
    console.log(
      `Passed ${checks} improvement checks (${engine}). Artifacts: ${output}`,
    );
  } finally {
    await browser.close();
    server.kill();
  }
})().catch((error) => {
  server.kill();
  console.error(error);
  process.exitCode = 1;
});
