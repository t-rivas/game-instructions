import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import { createToolRuntime } from "../src/generated/tool-runtime.js";
const catalog = JSON.parse(
  fs.readFileSync("src/generated/catalog.json", "utf8"),
);
let checks = 0;
for (const id of Object.keys(catalog.games)) {
  const { createToolRuntime: createGameRuntime } = await import(
    `../src/generated/runtime-${id}.js`
  );
  for (const lang of ["en", "es"]) {
    const baseline = createToolRuntime(),
      split = createGameRuntime();
    assert.deepEqual(split.coupLesson, id === "coup" ? baseline.coupLesson : {}, `${id}: Coup examples stay with Coup`);
    checks++;
    assert.deepEqual(split.avalonTeaching, id === "avalon" ? baseline.avalonTeaching : {}, `${id}: Avalon teaching stays with Avalon`);
    checks++;
    assert.deepEqual(split.lessonComparisons, baseline.lessonComparisons[id] ? {[id]:baseline.lessonComparisons[id]} : {}, `${id}: comparisons stay with their game`);
    checks++;
    if (baseline.skullTricks) {
      assert.deepEqual(
        split.skullTricks,
        id === "skull_king" ? baseline.skullTricks : {},
        `${id}: trick teaching stays with Skull King`,
      );
      checks++;
    }
    if (baseline.lessonCardFacts) {
      assert.deepEqual(
        split.lessonCardFacts,
        Object.fromEntries(
          Object.entries(baseline.lessonCardFacts).filter(
            ([key]) => catalog.official[key]?.group === id,
          ),
        ),
        `${id}: current-game card facts preserved`,
      );
      checks++;
      assert.deepEqual(
        split.lessonCardSteps,
        baseline.lessonCardSteps[id]
          ? { [id]: baseline.lessonCardSteps[id] }
          : {},
        `${id}: current-game card steps preserved`,
      );
      checks++;
    }
    for (const view of ["learn", "play", "rules"]) {
      baseline.setRoute(lang, id, view);
      split.setRoute(lang, id, view);
      for (const kind of [
        "sources",
        "helper",
        "play",
        ...(id === "avalon"
          ? ["setup-roles", "setup-components", "setup-script"]
          : []),
      ]) {
        assert.equal(
          split.view(kind),
          baseline.view(kind),
          `${lang}/${id}/${view}/${kind}: exact shared markup`,
        );
        checks++;
      }
      assert.deepEqual(
        split.lessonSteps(),
        baseline.lessonSteps(),
        `${id}: unchanged lesson content`,
      );
      checks++;
      assert.deepEqual(
        split.savedGames(),
        baseline.savedGames(),
        `${id}: fresh snapshots`,
      );
      checks++;
      assert.deepEqual(
        split.playStatus(),
        baseline.playStatus(),
        `${id}: initial play status`,
      );
      checks++;
    }
    const choices =
      id === "avalon"
        ? [5, 6, 7, 8, 9, 10].flatMap((players) => [
            { players, avalonMode: "basic", optional: [], lady: false },
            {
              players,
              avalonMode: "optional",
              optional: ["percival", "morgana"],
              lady: true,
            },
          ])
        : id === "coup"
          ? [
              { exchange: "ambassador", reformation: false },
              { exchange: "inquisitor", reformation: true },
            ]
          : id === "skull_king"
            ? [{ skullExpansion: false }, { skullExpansion: true }]
            : [];
    for (const patch of choices) {
      baseline.update(patch);
      split.update(patch);
      for (const kind of ["helper", "play", "sources"]) {
        assert.equal(
          split.view(kind),
          baseline.view(kind),
          `${id}: unchanged variant ${JSON.stringify(patch)} ${kind}`,
        );
        checks++;
      }
    }
  }
}
// Instantiate each generated runtime with the same recovered snapshots as the
// full adapter; compare summaries and markup without writing to stored games.
const modelFiles = {
  chess: ["chess-clock.js", "createChessClock"],
  poker: ["poker-timer.js", "createPokerTimer"],
};
for (const [id, [file, factory]] of Object.entries(modelFiles)) {
  const text = fs.readFileSync(file, "utf8");
  const start = text.indexOf(`function ${factory}(`),
    end =
      id === "chess"
        ? text.indexOf("\nconst chessClock =")
        : text.indexOf("\nconst POKER_TIMER_KEY");
  const setup =
    id === "poker"
      ? text.slice(0, text.indexOf("function createPokerTimer"))
      : "";
  let now = 100000;
  const clock = vm.runInNewContext(
    setup + "\n" + text.slice(start, end) + `;${factory}`,
    { Date: { now: () => now } },
  )(() => now);
  if (id === "chess") {
    clock.configure(180, 60);
    clock.start();
  } else clock.start();
  now += 1234;
  clock.pause();
  const stored = new Map([
    [
      id === "chess"
        ? "tablefolk-chess-clock"
        : "tablefolk-poker-tournament-v1",
      JSON.stringify(id === "poker" ? clock.serialize() : clock.snapshot()),
    ],
  ]);
  const platform = {
    localStorage: {
      getItem: (key) => stored.get(key) || null,
      setItem: () =>
        assert.fail("Recovery must not persist an unchanged snapshot"),
    },
  };
  const baseline = createToolRuntime(platform);
  const { createToolRuntime: createGameRuntime } = await import(
    `../src/generated/runtime-${id}.js`
  );
  const split = createGameRuntime(platform);
  baseline.setRoute("en", id, "play");
  split.setRoute("en", id, "play");
  assert.deepEqual(
    split.savedGames(),
    baseline.savedGames(),
    `${id}: paused recovery parity`,
  );
  checks++;
  assert.equal(
    split.view("play"),
    baseline.view("play"),
    `${id}: paused markup parity`,
  );
  checks++;
}
console.log(`Passed ${checks} runtime parity checks.`);
