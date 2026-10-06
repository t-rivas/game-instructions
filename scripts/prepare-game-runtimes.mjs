import fs from "node:fs";
import path from "node:path";
import { parse } from "acorn";
import { generate } from "astring";
import { createHash } from "node:crypto";

export const gameModels = {
  chess: ["chess-clock.js", "bindChessClock"],
  poker: ["poker-timer.js", "bindPokerTimer"],
  coup: ["coup-session.js", "bindCoupSession"],
  skull_king: ["skull-score.js", "bindSkullScore"],
  truco: ["truco-score.js", "bindTrucoScore"],
  moth: ["moth-score.js", "bindMothScore"],
};
const summaries = {
  chess:
    "const s=chessClock.snapshot();return ['running','paused'].includes(s.phase)?[{id:'chess',phase:s.phase,remaining:s.remaining}]:[];",
  poker:
    "const s=pokerTimer.snapshot();return ['running','paused'].includes(s.phase)?[{id:'poker',phase:s.phase,completed:s.index,goal:s.schedule.length,remaining:[s.remaining]}]:[];",
  coup: "const s=coupSession.snapshot();return s.started&&!s.finished?[{id:'coup',players:s.standings.map(p=>({name:p.name,score:p.points})),completed:s.results.length,goal:s.planned}]:[];",
  truco:
    "const s=trucoScore.snapshot();return s.started&&!s.finished?[{id:'truco',players:s.names.map((name,i)=>({name,score:s.totals[i]}))}]:[];",
  moth: "if(!mothScoreGame)return [];const s=mothGameSummary(mothScoreGame);return s.finished?[]:[{id:'moth',players:mothScoreGame.players.map((name,i)=>({name,score:s.totals[i]})),completed:mothScoreGame.rounds.length,goal:mothScoreGame.players.length}];",
  skull_king:
    "if(!skullScoreGame)return [];const s=skullGameSummary(skullScoreGame);return s.finished?[]:[{id:'skull_king',players:skullScoreGame.setup.players.map((name,i)=>({name,score:s.totals[i]})),completed:skullScoreGame.rounds.length,goal:10}];",
};
const statuses = {
  chess: "{active:chessClock.snapshot().phase!=='ready',storage:true}",
  poker:
    "{active:pokerTimer.snapshot().phase!=='ready',storage:pokerTimerStorageOK}",
  coup: "{active:coupSession.snapshot().started,storage:coupStorageOK}",
  truco: "{active:trucoScore.snapshot().started,storage:trucoStorageOK}",
  moth: "{active:!!mothScoreGame,storage:mothStorageOK}",
  skull_king: "{active:!!skullScoreGame,storage:skullStorageOK}",
};

// Specialize only the fixed game identity and static catalog. Rules, scoring,
// validation, saved snapshots and timer code still come from the shared sources.
function specialize(source, id, data) {
  const parsed = parse(source, { ecmaVersion: "latest", sourceType: "module" });
  const literal = (value) =>
    value === undefined
      ? {
          type: "UnaryExpression",
          operator: "void",
          prefix: true,
          argument: { type: "Literal", value: 0 },
        }
      : { type: "Literal", value };
  const valueOf = (node) =>
    node.type === "Literal"
      ? { known: true, value: node.value }
      : node.type === "UnaryExpression" && node.operator === "void"
        ? { known: true, value: undefined }
        : { known: false };
  const children = (node) =>
    Object.entries(node).filter(
      ([, value]) => value && typeof value === "object",
    );
  const transform = (node, parent) => {
    if (
      node.type === "VariableDeclarator" &&
      Object.hasOwn(data, node.id.name)
    ) {
      node.init = parse(`(${JSON.stringify(data[node.id.name])})`, {
        ecmaVersion: "latest",
      }).body[0].expression;
      return node;
    }
    if (
      node.type === "MemberExpression" &&
      !node.computed &&
      node.object.name === "state" &&
      node.property.name === "game" &&
      !(parent?.type === "AssignmentExpression" && parent.left === node)
    )
      return literal(id);
    for (const [key, value] of children(node))
      node[key] = Array.isArray(value)
        ? value.map((child) => (child?.type ? transform(child, node) : child))
        : value.type
          ? transform(value, node)
          : value;
    if (node.type === "ConditionalExpression" || node.type === "IfStatement") {
      const test = valueOf(node.test);
      if (test.known)
        return (
          (test.value ? node.consequent : node.alternate) || {
            type: "EmptyStatement",
          }
        );
    }
    if (
      node.type === "BinaryExpression" &&
      ["===", "!=="].includes(node.operator)
    ) {
      const left = valueOf(node.left),
        right = valueOf(node.right);
      if (left.known && right.known)
        return literal(
          node.operator === "==="
            ? left.value === right.value
            : left.value !== right.value,
        );
    }
    if (node.type === "LogicalExpression") {
      const left = valueOf(node.left);
      if (left.known && node.operator === "||")
        return left.value ? node.left : node.right;
      if (left.known && node.operator === "&&")
        return left.value ? node.right : node.left;
    }
    if (
      node.type === "MemberExpression" &&
      node.computed &&
      node.object.type === "ObjectExpression"
    ) {
      const key = valueOf(node.property);
      if (key.known) {
        const property = node.object.properties.find(
          (p) => (p.key.name ?? p.key.value) === String(key.value),
        );
        return property ? property.value : literal(undefined);
      }
    }
    return node;
  };
  transform(parsed);
  const factory = parsed.body.find(
    (node) => node.type === "ExportNamedDeclaration",
  ).declaration;
  const declarations = new Map(),
    needed = new Set();
  const references = (node) => {
    const refs = new Set();
    const walk = (child) => {
      if (child.type === "Identifier") refs.add(child.name);
      for (const [, value] of children(child)) {
        if (Array.isArray(value))
          value.forEach((item) => {
            if (item?.type) walk(item);
          });
        else if (value.type) walk(value);
      }
    };
    walk(node);
    return refs;
  };
  const body = factory.body.body.filter(
    (statement) =>
      statement.type !== "ExpressionStatement" ||
      !/^(?:GAMES\.|Object\.assign\((?:GAMES|OFFICIAL|NEW_GAME_ART),)/.test(
        generate(statement),
      ),
  );
  for (const statement of body) {
    if (statement.type === "FunctionDeclaration")
      declarations.set(statement.id.name, statement);
    else if (statement.type === "VariableDeclaration")
      for (const declaration of statement.declarations)
        declarations.set(declaration.id.name, declaration);
    else for (const ref of references(statement)) needed.add(ref);
  }
  const visit = (name) => {
    const declaration = declarations.get(name);
    if (!declaration) return;
    for (const ref of references(declaration))
      if (!needed.has(ref)) {
        needed.add(ref);
        visit(ref);
      }
  };
  for (const name of [...needed]) visit(name);
  factory.body.body = body.flatMap((statement) => {
    if (statement.type === "FunctionDeclaration")
      return needed.has(statement.id.name) ? [statement] : [];
    if (statement.type === "VariableDeclaration") {
      statement.declarations = statement.declarations.filter((declaration) =>
        needed.has(declaration.id.name),
      );
      return statement.declarations.length ? [statement] : [];
    }
    return [statement];
  });
  return (
    generate(parsed) +
    `\nexport const runtimeId = ${JSON.stringify("tablefolk-runtime:" + id)};\n`
  );
}

export function prepareGameRuntimes({
  root,
  factoryFor,
  adapter,
  catalog,
  practice,
}) {
  const styleFiles = {};
  const writeStyle = (id, file) => {
    const css = fs.readFileSync(path.join(root, file), "utf8");
    const hash = createHash("sha256").update(css).digest("hex").slice(0, 12);
    const href = `/assets/styles/${id}.${hash}.css`;
    fs.mkdirSync(path.join(root, "public/assets/styles"), { recursive: true });
    fs.writeFileSync(path.join(root, "public", href), css);
    styleFiles[id] = href;
  };
  writeStyle("web", "src/components/web.css");
  for (const [id, [model]] of Object.entries(gameModels))
    writeStyle(id, model.replace(/\.js$/, ".css"));
  fs.writeFileSync(
    path.join(root, "src/generated/tool-styles.json"),
    JSON.stringify(styleFiles),
  );
  for (const id of Object.keys(catalog.games)) {
    const selected = adapter
      .replace(
        / savedGames\(\)\{[\s\S]*?\n \},\n playStatus/,
        ` savedGames(){${summaries[id] || "return [];"}\n },\n playStatus`,
      )
      .replace(
        /  const status=.*\n/,
        `  const status=${statuses[id] || "{active:false,storage:true}"};\n`,
      )
      .replace(
        "bindTableGuide();bindChessClock();bindPokerTimer();bindCoupSession();bindSkullScore();bindMothScore();bindTrucoScore();",
        `bindTableGuide();${gameModels[id] ? gameModels[id][1] + "();" : ""}`,
      );
    const data = {
      GAMES: { [id]: catalog.games[id] },
      AVALON_TEACHING: id === "avalon" ? catalog.avalonTeaching || {} : {},
      SKULL_TRICKS: id === "skull_king" ? catalog.skullTricks || {} : {},
      SCORING_EXAMPLES: catalog.scoringExamples?.[id] ? { [id]: catalog.scoringExamples[id] } : {},
      COUP_LESSON: id === "coup" ? catalog.coupLesson || {} : {},
      // Concurrent lesson-card work shares the catalog; keep only this game's
      // examples in its client runtime while retaining the complete server data.
      LESSON_CARD_STEPS: catalog.lessonCardSteps?.[id]
        ? { [id]: catalog.lessonCardSteps[id] }
        : {},
      LESSON_CARD_FACTS: Object.fromEntries(
        Object.entries(catalog.lessonCardFacts || {}).filter(
          ([key]) => catalog.official[key]?.group === id,
        ),
      ),
      OFFICIAL: Object.fromEntries(
        Object.entries(catalog.official).filter(([, art]) => art.group === id),
      ),
      CARD_ART: Object.fromEntries(
        Object.entries(catalog.official).filter(
          ([, art]) => art.group === id && art.cardGuide,
        ),
      ),
      GUIDE_ART: catalog.artwork[id] ? { [id]: catalog.artwork[id] } : {},
      PRACTICE: practice[id] ? { [id]: practice[id] } : {},
      BASE_LESSON_PRACTICE: {},
      EXTRA_LESSON_PRACTICE: {},
      LESSON_PRACTICE: catalog.lessonPractice[id] ? {[id]:catalog.lessonPractice[id]} : {},
    };
    const generated = specialize(factoryFor(id, selected), id, data);
    fs.writeFileSync(
      path.join(root, `src/generated/runtime-${id}.js`),
      generated,
    );
  }
  fs.writeFileSync(
    path.join(root, "src/generated/tool-loaders.ts"),
    `// Generated; edit scripts/prepare-game-runtimes.mjs.\nexport const toolLoaders = {\n${Object.keys(
      catalog.games,
    )
      .map((id) => `  ${id}: () => import('./runtime-${id}'),`)
      .join("\n")}\n};\n`,
  );
  console.log(
    `Prepared ${Object.keys(catalog.games).length} independent game runtimes and game-specific styles.`,
  );
}
