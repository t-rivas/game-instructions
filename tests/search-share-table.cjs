const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawn } = require("node:child_process");
const { chromium, webkit } = require("playwright");
const jsQR = require("jsqr");
let checks = 0;
const check = (condition, message) => {
  assert.ok(condition, message);
  checks++;
};
const server = spawn(process.execPath, ["scripts/serve-export.mjs"], {
  stdio: ["ignore", "pipe", "inherit"],
});
(async () => {
  const base = await new Promise((resolve, reject) => {
    server.stdout.once("data", (data) => resolve(data.toString().trim()));
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
    path.join(os.tmpdir(), "tablefolk-rules-table-"),
  );
  const errors = [];
  const pageErrors = (page) =>
    page.on("pageerror", (error) => errors.push(error.message));
  const ready = (page) =>
    page.waitForFunction(
      () =>
        document.querySelector("main")?.dataset.route === location.pathname &&
        document.querySelector("[data-tool=sources][data-ready=true]") &&
        [...document.querySelectorAll("[data-tool]")].every(
          (node) => node.dataset.ready === "true",
        ),
    );
  const visit = async (page, route) => {
    await page.goto(base + route);
    await ready(page);
  };
  const fits = async (page, label) =>
    check(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth <= innerWidth + 1 &&
          (!document.querySelector("main[data-focus=true]") ||
            document.querySelector("main").scrollWidth <= innerWidth + 1),
      ),
      label,
    );
  try {
    const page = await browser.newPage({
      viewport: { width: 390, height: 844 },
    });
    pageErrors(page);
    // Language-independent search, conservative errors, exact ranking and real-word highlights.
    for (const lang of ["en", "es"]) {
      await visit(page, `/${lang}/monopoly/rules/`);
      for (const query of ["auction", "subasta", "auctoin", "subatsa"]) {
        await page.locator("#rule-search").fill(query);
        await page.waitForFunction(
          (value) =>
            document.querySelector("#rule-search-results")?.dataset.query ===
            value,
          query,
        );
        check(
          (await page.locator(".rule-search-result").count()) >= 2,
          `${lang}/${query}: paired rules searchable`,
        );
        const mark = (
          await page.locator(".rule-search-result mark").allTextContents()
        )
          .join(" ")
          .toLowerCase();
        check(
          lang === "es" ? /subast/.test(mark) : /auction/.test(mark),
          `${lang}/${query}: actual translated word highlighted`,
        );
        const first = page.locator(".rule-search-result").first();
        if (query === "auction")
          check(
            !(await first.locator("small").count()),
            "Exact match ranks ahead of approximate matches",
          );
        await first.click();
        await page.waitForURL((url) => url.searchParams.get("q") === query);
        await ready(page);
        const section = new URL(page.url()).hash.slice(1);
        await page.waitForFunction(
          (id) => document.getElementById(id)?.open,
          section,
        );
        check(
          (
            await page.locator(`#${section} .rule-body mark`).allTextContents()
          ).some((word) =>
            lang === "es" ? /subast/i.test(word) : /auction/i.test(word),
          ),
          "Opened rules highlight the matching word",
        );
      }
      for (const query of ["jil", "aucxxon", "123456789", "no-such-rule-xyz"]) {
        await page.locator("#rule-search").fill(query);
        await page.waitForFunction(
          (value) =>
            document.querySelector("#rule-search-results")?.dataset.query ===
            value,
          query,
        );
        check(
          (await page.locator(".rule-search-result").count()) === 0,
          `${query}: no broad spelling correction`,
        );
        check(
          (await page.locator("#rule-search-results").innerText()).includes(
            lang === "en" ? "No rules found" : "No se encontraron",
          ),
          "Empty-result feedback is localized",
        );
      }
      await page.locator("#rule-search-clear").click();
      await page.locator(".common-questions a").first().click();
      await ready(page);
      check(
        new URL(page.url()).hash === "#movement" &&
          (await page.locator("#movement").getAttribute("open")) !== null,
        "Question shortcut opens its existing rule",
      );
      check(
        (await page.locator("#rule-search").inputValue()) === "auction",
        "Shortcut uses recoverable rule query",
      );
      await page.reload();
      await ready(page);
      check(
        (await page.locator("#rule-search").inputValue()) === "auction",
        "Reload recovers query",
      );
      const nextLanguage = lang === "en" ? "es" : "en";
      await page.locator(`#lang-${nextLanguage}`).click();
      await page.waitForURL((url) =>
        url.pathname.startsWith(`/${nextLanguage}/`),
      );
      await ready(page);
      check(
        (await page.locator("html").getAttribute("lang")) === nextLanguage &&
          new URL(page.url()).searchParams.get("q") === "auction" &&
          new URL(page.url()).hash === "#movement",
        "Language keeps shared query and section",
      );
    }
    await visit(page, "/es/coup/rules/");
    for (const query of ["coins", "coims"]) {
      await page.locator("#rule-search").fill(query);
      await page.waitForFunction(
        (value) =>
          document.querySelector("#rule-search-results")?.dataset.query ===
          value,
        query,
      );
      check(
        (await page.locator(".rule-search-result").count()) > 0,
        "Shared bilingual vocabulary finds rule terms and one-letter typos",
      );
      check(
        (await page.locator(".rule-search-result mark").allTextContents()).some(
          (word) => /moneda/i.test(word),
        ),
        "Common translated words are highlighted in Spanish",
      );
    }
    await visit(
      page,
      "/en/skull_king/rules/?shared=1&expansion=0&q=Walk+the+Plank",
    );
    check(
      (await page.locator(".rule-search-result").count()) === 0 &&
        (await page.locator("#expansion-effects").count()) === 0,
      "Base edition excludes expansion matches",
    );
    check(
      !(await page.locator(".common-questions").innerText()).includes(
        "Walk the Plank",
      ),
      "Base edition excludes expansion question",
    );
    await page.locator("#skull-expansion-toggle").click();
    await page.waitForFunction(
      () => new URLSearchParams(location.search).get("expansion") === "1",
    );
    check(
      (await page.locator(".rule-search-result").count()) >= 2,
      "Selected expansion adds its matching rules",
    );
    check(
      (await page.locator(".common-questions").innerText()).includes(
        "Walk the Plank",
      ),
      "Expansion question is grounded in enabled rules",
    );
    await page.locator(".rule-search-result").first().click();
    await ready(page);
    check(
      new URL(page.url()).searchParams.get("expansion") === "1",
      "Search link carries selected expansion",
    );
    await visit(
      page,
      "/en/coup/rules/?shared=1&exchange=ambassador&reformation=0&q=embezzle",
    );
    check(
      (await page.locator(".rule-search-result").count()) === 0 &&
        (await page.locator("#inquisitor").count()) === 0,
      "Coup search respects character and expansion",
    );
    await page.locator("#reformation-toggle").click();
    await page.waitForFunction(
      () => new URLSearchParams(location.search).get("reformation") === "1",
    );
    check(
      (await page.locator(".rule-search-result").count()) === 1,
      "Reformation enables its rule match",
    );

    // Genuine control output is opened in fresh contexts with conflicting, unfinished saves.
    const saved = {
      "tablefolk-preferences": JSON.stringify({
        lang: "en",
        theme: "light",
        exchange: "inquisitor",
        reformation: false,
        skullExpansion: false,
        seen: ["chess", "avalon", "coup", "skull_king"],
      }),
      "tablefolk-avalon-setup-v1": JSON.stringify({
        players: 5,
        avalonMode: "basic",
        optional: [],
        lady: false,
      }),
      "tablefolk-setup-checklist-avalon": JSON.stringify({
        signature: JSON.stringify([5, "basic", [], false]),
        checked: [true, false, true, true],
      }),
      "tablefolk-setup-checklist-coup": JSON.stringify({
        signature: "inquisitor-false",
        checked: [true, false, true],
      }),
      "tablefolk-setup-checklist-skull_king": JSON.stringify({
        signature: "false",
        checked: [true, false, true],
      }),
      "tablefolk-chess-clock": JSON.stringify({
        phase: "paused",
        active: 1,
        remaining: [90000, 80000],
        minutes: 5,
        increment: 3,
        deadline: 0,
      }),
      "tablefolk-poker-tournament-v1": JSON.stringify({
        version: 1,
        schedule: [
          {
            type: "level",
            duration: 10,
            smallBlind: 25,
            bigBlind: 50,
            ante: 0,
          },
        ],
        phase: "paused",
        index: 0,
        remaining: 321000,
        deadline: null,
        notice: null,
      }),
      "tablefolk-coup-session": JSON.stringify({
        names: ["Ana", "Sol"],
        mode: "default",
        planned: 6,
        started: true,
        locked: true,
        results: [{ winner: 0, runnerUp: 1 }],
      }),
      "tablefolk-skull-score-v1": JSON.stringify({
        version: 1,
        game: {
          setup: { mode: "classic", expansion: false, players: ["Ana", "Sol"] },
          rounds: [
            {
              round: 1,
              cards: 1,
              entries: [
                { bid: 0, tricks: 0, bonus: 0, adjustment: 0, explanation: "" },
                { bid: 1, tricks: 1, bonus: 0, adjustment: 0, explanation: "" },
              ],
            },
          ],
        },
      }),
      "tablefolk-moth-score-v1": '{"recoverable":"moth-existing"}',
      "tablefolk-truco-score-v1": '{"recoverable":"truco-existing"}',
    };
    const routes = [
      [
        "/es/coup/rules/?shared=1&exchange=ambassador&reformation=1&q=malversar#reformation",
        "reformation",
        { exchange: "ambassador", reformation: "1" },
        "Embajador",
      ],
      [
        "/en/skull_king/rules/?shared=1&expansion=1&q=Walk+the+Plank#expansion-effects",
        "expansion-effects",
        { expansion: "1" },
        "Expansion Pack",
      ],
      [
        "/es/avalon/learn/?shared=1&players=10&roles=optional&optional=percival,morgana,mordred,oberon&lady=1&q=Merlin",
        null,
        {
          players: "10",
          roles: "optional",
          lady: "1",
          optional: "mordred,morgana,oberon,percival",
        },
        "10 jugadores",
      ],
    ];
    for (const [route, section, choices, label] of routes) {
      await visit(page, route);
      const trigger = section
        ? page.locator(`#${section} .share-rule`)
        : page.locator("#share-guide");
      await trigger.click();
      check(
        await page.locator("#share-dialog").isVisible(),
        "Sharing opens an accessible dialog",
      );
      check(
        (await page.locator("#share-edition").innerText()).includes(label),
        "Shared edition is clearly labeled",
      );
      const link = await page.locator("#share-link").inputValue(),
        url = new URL(link);
      for (const [key, value] of Object.entries(choices))
        check(url.searchParams.get(key) === value, `Link preserves ${key}`);
      check(
        url.pathname === new URL(base + route).pathname &&
          url.searchParams.get("q") ===
            new URL(base + route).searchParams.get("q") &&
          url.hash === (section ? "#" + section : ""),
        "Link preserves language, view, query and rule",
      );
      await page.keyboard.press("Escape");
      await page.waitForFunction(
        () => !document.querySelector("#share-dialog")?.open,
      );
      check(
        await trigger.evaluate((node) => node === document.activeElement),
        "Sharing returns focus to its trigger",
      );
      const context = await browser.newContext();
      await context.addInitScript((data) => {
        if (!localStorage.getItem("tablefolk-test-seeded")) {
          for (const [key, value] of Object.entries(data))
            localStorage.setItem(key, value);
          localStorage.setItem("tablefolk-test-seeded", "1");
        }
      }, saved);
      const fresh = await context.newPage();
      pageErrors(fresh);
      await fresh.goto(link);
      await ready(fresh);
      check(
        (await fresh.locator(".shared-edition").innerText()).includes(label),
        "Fresh context opens the intended edition",
      );
      if (section) {
        await fresh.waitForFunction(
          (id) => document.getElementById(id)?.open,
          section,
        );
        check(
          (await fresh.locator(`#${section} .rule-body mark`).count()) > 0,
          "Fresh link opens and highlights its exact rule",
        );
      } else {
        await fresh.locator("[data-learning-stage=setup]").click();
      await fresh.locator("#avalon-step-0").click();
        check(
          (await fresh.locator("#players").inputValue()) === "10" &&
            (await fresh.locator("[data-role]:checked").count()) === 4,
          "Fresh setup preserves players and roles",
        );
        await fresh.locator("#setup-check-3").check();
        await fresh.locator("#avalon-step-2").click();
        check(
          (await fresh.locator("[data-tool=setup-script] .script").innerText()).includes(
            "EXCEPTO Mordred",
          ),
          "Fresh setup renders its selected recognition script",
        );
      }
      for (const [key, value] of Object.entries(saved))
        check(
          (await fresh.evaluate((key) => localStorage.getItem(key), key)) ===
            value,
          `Opening shared guide preserves ${key}`,
        );
      await fresh.locator("#tab-play").click();
      await fresh.waitForURL((url) => url.pathname.endsWith("/play/"));
      await ready(fresh);
      for (const [key, value] of Object.entries(choices))
        check(
          new URL(fresh.url()).searchParams.get(key) === value,
          "Client tab preserves shared choices",
        );
      await fresh.reload();
      await ready(fresh);
      for (const [key, value] of Object.entries(saved))
        check(
          (await fresh.evaluate((key) => localStorage.getItem(key), key)) ===
            value,
          `Reloading shared guide preserves ${key}`,
        );
      const nextLocale = new URL(fresh.url()).pathname.startsWith("/en/")
        ? "es"
        : "en";
      await fresh.locator(`#lang-${nextLocale}`).click();
      await fresh.waitForURL((url) =>
        url.pathname.startsWith(`/${nextLocale}/`),
      );
      await ready(fresh);
      for (const [key, value] of Object.entries(choices))
        check(
          new URL(fresh.url()).searchParams.get(key) === value,
          "Language keeps shared choices",
        );
      await visit(fresh, "/en/avalon/learn/");
      await fresh.locator("[data-learning-stage=setup]").click();
      await fresh.locator("#avalon-step-0").click();
      check(
        (await fresh.locator("#players").inputValue()) === "5",
        "Leaving shared setup restores local configuration",
      );
      await visit(fresh, "/en/chess/play/");
      check(
        (await fresh.locator("#chess-clock-toggle").innerText()) === "Resume",
        "Shared guide never restarts paused chess clock",
      );
      await context.close();
    }
    await visit(
      page,
      "/en/avalon/learn/?shared=1&players=99&roles=anything&optional=evil,morgana,mordred,mordred&lady=true&extra=1#%ZZ",
    );
    await page.locator("[data-learning-stage=setup]").click();
    await page.locator("#avalon-step-0").click();
    const invalid = new URL(page.url());
    check(
      invalid.searchParams.get("players") === "7" &&
        invalid.searchParams.get("roles") === "basic" &&
        invalid.searchParams.get("optional") === "" &&
        invalid.searchParams.get("lady") === "0" &&
        !invalid.searchParams.has("extra") &&
        !invalid.hash,
      "Invalid shared setup and fragment are normalized",
    );
    await visit(
      page,
      "/en/avalon/learn/?shared=1&players=5&roles=optional&optional=morgana,mordred,oberon,percival&lady=1",
    );
    await page.locator("[data-learning-stage=setup]").click();
    await page.locator("#avalon-step-0").click();
    check(
      (await page.locator("[data-role]:checked").count()) === 2 &&
        new URL(page.url()).searchParams.get("optional") === "morgana,percival",
      "Shared roles respect Evil capacity plus Assassin",
    );

    // Lazy local QR generation, independent decode, native share and selected-link fallback.
    const sharing = await browser.newContext({
      viewport: { width: 320, height: 640 },
    });
    await sharing.addInitScript(() => {
      Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value: {
          writeText: async (value) => {
            if (window.failClipboard) throw new Error("denied");
            window.copiedLink = value;
          },
        },
      });
      Object.defineProperty(navigator, "share", {
        configurable: true,
        value: async (data) => {
          window.nativeShare = data;
        },
      });
    });
    const sharePage = await sharing.newPage();
    pageErrors(sharePage);
    const requested = [],
      origins = [];
    sharePage.on("request", (request) => {
      requested.push(new URL(request.url()).pathname);
      origins.push(new URL(request.url()).origin);
    });
    const qrChunks = fs
      .readdirSync("out/_next/static/chunks")
      .filter(
        (name) =>
          name.endsWith(".js") &&
          fs
            .readFileSync("out/_next/static/chunks/" + name, "utf8")
            .includes("Invalid data"),
      )
      .map((name) => "/_next/static/chunks/" + name);
    check(qrChunks.length > 0, "QR encoder has a separate production chunk");
    await visit(
      sharePage,
      "/es/coup/rules/?shared=1&exchange=inquisitor&reformation=1&q=examinar#inquisitor",
    );
    await sharePage.locator("#inquisitor .share-rule").click();
    check(
      qrChunks.every((chunk) => !requested.includes(chunk)),
      "Opening a guide and share dialog does not load QR encoder",
    );
    const qrLink = await sharePage.locator("#share-link").inputValue();
    await sharePage.locator("#copy-rule-link").click();
    check(
      (await sharePage.evaluate(() => window.copiedLink)) === qrLink,
      "Copy link writes exact rule URL",
    );
    await sharePage.evaluate(() => {
      window.failClipboard = true;
    });
    await sharePage.locator("#copy-rule-link").click();
    check(
      await sharePage
        .locator("#share-link")
        .evaluate(
          (node) =>
            document.activeElement === node &&
            node.selectionStart === 0 &&
            node.selectionEnd === node.value.length,
        ),
      "Denied clipboard leaves a selected, keyboard-copyable link",
    );
    check(
      (
        await sharePage.locator("#share-dialog [role=status]").innerText()
      ).includes("Ctrl/Cmd+C"),
      "Clipboard fallback explains how to copy",
    );
    await sharePage.locator("#native-share").click();
    check(
      (await sharePage.evaluate(() => window.nativeShare)).url === qrLink,
      "Native share receives exact rule URL",
    );
    await sharePage.locator("#show-qr").click();
    await sharePage.locator(".share-qr").evaluate((img) => img.decode());
    check(
      qrChunks.some((chunk) => requested.includes(chunk)),
      "QR encoder loads on explicit request",
    );
    const pixels = await sharePage.locator(".share-qr").evaluate((img) => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      return {
        width: canvas.width,
        height: canvas.height,
        data: [...ctx.getImageData(0, 0, canvas.width, canvas.height).data],
      };
    });
    check(
      jsQR(new Uint8ClampedArray(pixels.data), pixels.width, pixels.height)
        ?.data === qrLink,
      "Independent QR decoder recovers the exact shared edition URL",
    );
    check(
      requested.every(
        (url) => !url.includes("qrserver") && !url.includes("chart.googleapis"),
      ),
      "QR uses no external service",
    );
    check(
      origins.every((origin) => origin === base),
      "Sharing fetches only local assets",
    );
    await sharePage.waitForFunction(() => {
      const img = document.querySelector(".share-qr");
      if (!img) return false;
      const bounds = img.getBoundingClientRect(),
        dialog = document
          .querySelector("#share-dialog")
          .getBoundingClientRect();
      return bounds.top >= dialog.top && bounds.bottom <= dialog.bottom;
    });
    check(
      (await sharePage.locator(".share-code figcaption").innerText()) ===
        "Inquisidor + Reformation",
      "Visible QR code includes its edition label",
    );
    check(
      await sharePage
        .locator(".share-dialog .dialog-heading button")
        .evaluate((node) => {
          const bounds = node.getBoundingClientRect(),
            dialog = node.closest("dialog").getBoundingClientRect();
          return bounds.top >= dialog.top && bounds.bottom <= dialog.bottom;
        }),
      "QR sharing keeps its close control visible on phones",
    );
    await fits(sharePage, "Share dialog fits at 320px");
    await sharePage.screenshot({ path: path.join(output, "share-320.png") });
    await sharePage.keyboard.press("Escape");
    await sharing.close();

    // An injected platform API exercises real lifecycle handlers without relying on hardware.
    const tabletop = await browser.newContext();
    await tabletop.addInitScript(() => {
      window.wakeRequests = 0;
      window.wakeReleases = 0;
      window.wakeMode = "ok";
      window.wakeLocks = [];
      let visibility = "visible";
      Object.defineProperty(document, "visibilityState", {
        configurable: true,
        get: () => visibility,
      });
      window.setVisibility = (value) => {
        visibility = value;
        document.dispatchEvent(new Event("visibilitychange"));
      };
      Object.defineProperty(navigator, "wakeLock", {
        configurable: true,
        value: {
          request: async () => {
            window.wakeRequests++;
            if (window.wakeMode === "denied") throw new Error("denied");
            if (window.wakeMode === "pending")
              await new Promise((resolve) => {
                window.finishWake = resolve;
              });
            const lock = new EventTarget();
            lock.released = false;
            lock.release = async () => {
              if (!lock.released) {
                lock.released = true;
                window.wakeReleases++;
                lock.dispatchEvent(new Event("release"));
              }
            };
            window.wakeLocks.push(lock);
            return lock;
          },
        },
      });
    });
    const table = await tabletop.newPage();
    pageErrors(table);
    await table.clock.setFixedTime(new Date("2026-10-03T12:00:00Z"));
    await visit(table, "/en/chess/play/");
    await table.locator("#chess-clock-minutes").fill("180");
    await table.locator("#chess-clock-increment").fill("60");
    await table.locator("#focus-play").click();
    await table.locator("#chess-clock-toggle").click();
    await table.clock.setFixedTime(new Date("2026-10-03T12:00:02.500Z"));
    await table.waitForTimeout(150);
    await table.locator("#clock-orientation").click();
    check(
      (await table
        .locator("#clock-orientation")
        .getAttribute("aria-pressed")) === "true",
      "Orientation is accessible toggle",
    );
    check(
      await table
        .locator("#chess-clock-player-1")
        .evaluate((node) =>
          getComputedStyle(node).transform.startsWith("matrix(-1"),
        ),
      "Opponent clock is rotated across table",
    );
    check(
      (await table.locator("#chess-clock-player-0").innerText()).includes(
        "White",
      ) &&
        (await table.locator("#chess-clock-player-1").innerText()).includes(
          "Black",
        ),
      "Rotation preserves player identities",
    );
    await table.locator("#chess-clock-player-0").focus();
    await table.keyboard.press("Enter");
    check(
      await table
        .locator("#chess-clock-player-1")
        .getAttribute("class")
        .then((value) => value.includes("is-active")),
      "Keyboard move switches active clock",
    );
    await table.locator("#chess-clock-toggle").click();
    const snapshot = await table.evaluate(() =>
      JSON.parse(localStorage.getItem("tablefolk-chess-clock")),
    );
    check(
      snapshot.phase === "paused" &&
        snapshot.active === 1 &&
        snapshot.remaining[0] === 180 * 60000 - 2500 + 60000,
      "Time and maximum increment remain exact after rotation",
    );
    const unchanged = async (label) =>
      check(
        (await table.evaluate(() =>
          localStorage.getItem("tablefolk-chess-clock"),
        )) === JSON.stringify(snapshot),
        label,
      );
    await table.locator("#table-help").click();
    check(
      await table.locator(".chess-clock-note").isVisible(),
      "Help remains available",
    );
    await table.locator("#table-help").click();
    check(
      !(await table.locator(".chess-clock-note").isVisible()),
      "Secondary instructions collapse",
    );
    for (const lang of ["en", "es"])
      for (const size of [
        { width: 320, height: 740 },
        { width: 390, height: 844 },
        { width: 844, height: 390 },
        { width: 1440, height: 900 },
      ]) {
        await table.setViewportSize(size);
        if (new URL(table.url()).pathname.split("/")[1] !== lang) {
          await table.locator("#focus-play").click();
          await table.locator(`#lang-${lang}`).click();
          await table.waitForURL((url) => url.pathname.startsWith(`/${lang}/`));
          await ready(table);
          await table.locator("#focus-play").click();
        }
        await fits(table, `${lang}/${size.width}: full table fits`);
        for (const player of [0, 1]) {
          check(
            await table
              .locator(`#chess-clock-player-${player}`)
              .evaluate(
                (node) =>
                  node.getBoundingClientRect().height >= 48 &&
                  node.scrollWidth <= node.clientWidth + 1 &&
                  node.querySelector("strong").getBoundingClientRect().width <=
                    node.clientWidth,
              ),
            "Maximum clock text fits touch target",
          );
        }
        check(
          await table.locator(".chess-clock-player").evaluateAll((nodes) =>
            nodes.every((node) => {
              const rect = node.getBoundingClientRect();
              return rect.top >= 0 && rect.bottom <= innerHeight;
            }),
          ),
          "Both clocks are visible together in portrait and landscape",
        );
        await table.screenshot({
          path: path.join(output, `clock-${lang}-${size.width}.png`),
        });
        await unchanged("Layout and language changes preserve paused snapshot");
      }
    await table.reload();
    await ready(table);
    await table.waitForFunction(
      () => document.querySelector("main")?.dataset.focus === "true",
    );
    await unchanged("Reload preserves paused clock");
    check(
      (await table
        .locator("#clock-orientation")
        .getAttribute("aria-pressed")) === "true",
      "Orientation recovers independently of clock snapshot",
    );
    await table.locator("#find-rule").focus();
    await table.keyboard.press("Control+k");
    check(
      (await table.locator("#rule-dialog").isVisible()) &&
        (await table
          .locator("#rule-search-dialog")
          .evaluate((node) => node === document.activeElement)),
      "Keyboard search works in full-screen table",
    );
    await table.locator("#rule-search-dialog").fill("castlng");
    check(
      (await table.locator("#rule-dialog .rule-search-result").count()) > 0,
      "Typo search works during play",
    );
    await table.keyboard.press("Escape");
    await table.waitForFunction(
      () => document.activeElement?.id === "find-rule",
    );
    check(
      (await table.locator("main").getAttribute("data-focus")) === "true",
      "Closing search keeps table mode",
    );
    await unchanged("Search never resumes a paused clock");
    const wakeStatus = (status) =>
      table.waitForFunction(
        (value) =>
          document.querySelector("#wake-status")?.dataset.status === value,
        status,
      );
    await table.locator("#keep-awake").click();
    await wakeStatus("active");
    check(
      (await table.evaluate(() => window.wakeRequests)) === 1,
      "Enable requests one wake lock",
    );
    await table.evaluate(() => window.wakeLocks.at(-1).release());
    await wakeStatus("released");
    check(
      (await table.locator("#keep-awake").getAttribute("aria-pressed")) ===
        "true",
      "Automatic release shows actual status while retaining user intent",
    );
    await table.evaluate(() => window.setVisibility("hidden"));
    await table.evaluate(() => window.setVisibility("visible"));
    await wakeStatus("active");
    check(
      (await table.evaluate(() => window.wakeRequests)) === 2,
      "Visibility restores a requested lock",
    );
    await table.locator("#keep-awake").click();
    await wakeStatus("off");
    check(
      await table.evaluate(() =>
        window.wakeLocks.every((lock) => lock.released),
      ),
      "Disabling releases all held locks",
    );
    await table.evaluate(() => {
      window.wakeMode = "denied";
    });
    await table.locator("#keep-awake").click();
    await wakeStatus("denied");
    check(
      (await table.locator("#wake-status").innerText()).length > 0,
      "Rejected request is announced",
    );
    await table.locator("#keep-awake").click();
    await table.evaluate(() => {
      window.wakeMode = "pending";
    });
    await table.locator("#keep-awake").click();
    await wakeStatus("requesting");
    await table.locator("#keep-awake").click();
    await table.evaluate(() => window.finishWake());
    await wakeStatus("off");
    await table.waitForFunction(() =>
      window.wakeLocks.every((lock) => lock.released),
    );
    check(
      await table.evaluate(() =>
        window.wakeLocks.every((lock) => lock.released),
      ),
      "Late request after disable is released",
    );
    await table.evaluate(() => {
      window.wakeMode = "ok";
    });
    await table.locator("#keep-awake").click();
    await wakeStatus("active");
    await table.locator("#focus-play").click();
    await table.waitForFunction(() =>
      window.wakeLocks.every((lock) => lock.released),
    );
    check(
      (await table.locator("#keep-awake").count()) === 0,
      "Leaving table mode releases wake lock",
    );
    await unchanged("Wake controls never change timing snapshot");
    await table.locator("#focus-play").click();
    await wakeStatus("off");
    check(
      (await table.locator("#keep-awake").getAttribute("aria-pressed")) ===
        "false",
      "Returning to table does not silently enable wake lock",
    );
    await table.locator("#keep-awake").click();
    await wakeStatus("active");
    await table.evaluate(() => window.dispatchEvent(new Event("pagehide")));
    await wakeStatus("released");
    check(
      await table.evaluate(() =>
        window.wakeLocks.every((lock) => lock.released),
      ),
      "Page exit releases held wake lock",
    );
    await table.locator("#focus-play").click();
    await table.locator("#tab-rules").click();
    await ready(table);
    await tabletop.close();
    const unsupported = await browser.newContext();
    await unsupported.addInitScript(() => {
      Object.defineProperty(navigator, "wakeLock", {
        configurable: true,
        value: undefined,
      });
    });
    const unsupportedPage = await unsupported.newPage();
    pageErrors(unsupportedPage);
    await visit(unsupportedPage, "/en/chess/play/");
    await unsupportedPage.locator("#focus-play").click();
    await unsupportedPage.waitForFunction(
      () =>
        document.querySelector("#wake-status")?.dataset.status ===
        "unsupported",
    );
    check(
      await unsupportedPage.locator("#keep-awake").isDisabled(),
      "Unsupported wake API has an honest disabled control",
    );
    check(
      (await unsupportedPage
        .locator("#wake-status")
        .getAttribute("data-status")) === "unsupported",
      "Unsupported status is explicit",
    );
    await unsupported.close();
    // The poker model also permits a single safe-integer maximum duration.
    const maximum = Math.floor(Number.MAX_SAFE_INTEGER / 60000);
    const maxContext = await browser.newContext();
    await maxContext.addInitScript((minutes) => {
      if (!localStorage.getItem("tablefolk-test-seeded")) {
        localStorage.setItem(
          "tablefolk-poker-tournament-v1",
          JSON.stringify({
            version: 1,
            schedule: [
              {
                type: "level",
                duration: minutes,
                smallBlind: 25,
                bigBlind: 50,
                ante: 0,
              },
            ],
            phase: "paused",
            index: 0,
            remaining: minutes * 60000,
            deadline: null,
            notice: null,
          }),
        );
        localStorage.setItem("tablefolk-test-seeded", "1");
      }
    }, maximum);
    const maxPage = await maxContext.newPage();
    pageErrors(maxPage);
    for (const lang of ["en", "es"])
      for (const size of [
        { width: 320, height: 740 },
        { width: 844, height: 390 },
      ]) {
        await maxPage.setViewportSize(size);
        await visit(maxPage, `/${lang}/poker/play/`);
        if (
          (await maxPage.locator("main").getAttribute("data-focus")) !== "true"
        )
          await maxPage.locator("#focus-play").click();
        await maxPage.waitForFunction(
          () => document.querySelector("main")?.dataset.focus === "true",
        );
        check(
          (await maxPage.locator("#poker-timer-time").innerText()) ===
            maximum + ":00",
          "Maximum poker duration recovers exactly",
        );
        await fits(maxPage, "Maximum poker duration fits table layout");
        check(
          await maxPage
            .locator("#poker-timer-time")
            .evaluate((node) => node.scrollWidth <= node.clientWidth),
          "Maximum poker digits stay within their display",
        );
      }
    await maxContext.close();

    check(errors.length === 0, "No browser errors: " + errors.join("; "));
    console.log(
      `Passed ${checks} rule search, sharing and table checks (${engine}). Screenshots: ${output}`,
    );
  } catch (error) {
    for (const context of browser.contexts())
      for (const page of context.pages()) {
        console.error("Failure page:", page.url());
        await page
          .screenshot({ path: path.join(output, `failure-${Date.now()}.png`) })
          .catch(() => {});
      }
    console.error("Failure screenshots:", output);
    throw error;
  } finally {
    await browser.close();
  }
})()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => server.kill());
