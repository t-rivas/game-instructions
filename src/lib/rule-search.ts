import { glossaryVocabulary } from "./glossary";
import type { Language, LessonCard, RuleSection, ToolState, Translation } from "./types";
export const normalizeRuleText = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
const words = (value: string): string[] =>
  normalizeRuleText(value).match(/[\p{L}\p{N}]+/gu) || [];
// Only one edit, on words of at least five letters; no fuzzy numbers or short words.
function near(a: string, b: string) {
  if (a === b) return true;
  if (!/^\p{L}+$/u.test(a) || !/^\p{L}+$/u.test(b)) return false;
  if (a.length < 5 || b.length < 5 || Math.abs(a.length - b.length) > 1)
    return false;
  if (a.length === b.length) {
    const diffs = [...a].flatMap((letter, i) => (letter === b[i] ? [] : [i]));
    return (
      diffs.length === 1 ||
      (diffs.length === 2 &&
        diffs[1] === diffs[0] + 1 &&
        a[diffs[0]] === b[diffs[1]] &&
        a[diffs[1]] === b[diffs[0]])
    );
  }
  const shorter = a.length < b.length ? a : b,
    longer = a.length < b.length ? b : a;
  let i = 0;
  while (i < shorter.length && shorter[i] === longer[i]) i++;
  return shorter.slice(i) === longer.slice(i + 1);
}
// Curated vocabulary points to words already used in the paired rules, never new answers.
const commonVocabulary: [string[], string[]][] = [
  [
    ["card", "cards"],
    ["carta", "cartas"],
  ],
  [["deck"], ["mazo"]],
  [["hand"], ["mano"]],
  [
    ["discard", "discarded", "discarding"],
    ["descartar", "descarte", "descarta", "descartadas"],
  ],
  [["discard pile"], ["pila de descarte"]],
  [
    ["coin", "coins"],
    ["moneda", "monedas"],
  ],
  [
    ["turn", "turns"],
    ["turno", "turnos"],
  ],
  [
    ["player", "players"],
    ["jugador", "jugadores"],
  ],
  [
    ["point", "points"],
    ["punto", "puntos"],
  ],
  [
    ["score", "scoring"],
    ["puntuación", "puntuar", "puntúa"],
  ],
  [
    ["round", "rounds"],
    ["ronda", "rondas"],
  ],
  [
    ["tie", "ties"],
    ["empate", "empates"],
  ],
];
const vocabulary: Record<string, [string[], string[]][]> = {
  monopoly: [
    [
      ["auction", "auctions"],
      ["subasta", "subastas"],
    ],
    [["jail"], ["cárcel"]],
    [
      ["mortgage", "mortgaged"],
      ["hipoteca", "hipotecada"],
    ],
    [
      ["trade", "trading"],
      ["intercambiar", "intercambio"],
    ],
    [["rent"], ["alquiler"]],
  ],
  coup: [
    [
      ["challenge", "challenged", "challenger"],
      ["desafío", "desafiar", "desafían"],
    ],
    [
      ["block", "blocked"],
      ["bloqueo", "bloquear"],
    ],
    [["tax"], ["impuestos"]],
    [
      ["assassinate", "assassination"],
      ["asesinar", "asesinato"],
    ],
    [["steal"], ["robar"]],
    [["exchange"], ["intercambiar", "intercambio"]],
    [["embezzle", "embezzlement"], ["malversar"]],
    [["treasury reserve"], ["reserva del tesoro"]],
    [["ambassador"], ["embajador"]],
    [["inquisitor"], ["inquisidor"]],
    [["examine"], ["examinar"]],
  ],
  avalon: [
    [
      ["quest", "quests"],
      ["misión", "misiones"],
    ],
    [["fail"], ["fracaso", "fracasos"]],
    [
      ["reject", "rejection"],
      ["rechazo", "rechazos"],
    ],
    [["lady of the lake"], ["dama del lago"]],
    [["evil"], ["mal"]],
    [["good"], ["bien"]],
  ],
  chess: [
    [["checkmate"], ["jaque mate"]],
    [["check"], ["jaque"]],
    [["castling", "castle"], ["enroque"]],
    [["draw", "draws"], ["tablas"]],
    [["stalemate"], ["ahogado"]],
    [["pawn"], ["peón"]],
    [["en passant"], ["al paso"]],
  ],
  poker: [
    [["blinds"], ["ciegas"]],
    [["raise"], ["subir", "sube"]],
    [["fold"], ["retirarse", "retírate"]],
    [["pot"], ["pozo"]],
    [
      ["tie", "ties"],
      ["empate", "empates"],
    ],
  ],
  catan: [
    [["robber"], ["ladrón"]],
    [
      ["trade", "trading"],
      ["comerciar", "intercambiar"],
    ],
    [["development"], ["desarrollo"]],
    [
      ["settlement", "settlements"],
      ["poblado", "poblados"],
    ],
    [
      ["road", "roads"],
      ["camino", "caminos"],
    ],
  ],
  skull_king: [
    [
      ["trick", "tricks"],
      ["baza", "bazas"],
    ],
    [
      ["bid", "bidding"],
      ["apuesta", "apuestas"],
    ],
    [["mermaid"], ["sirena"]],
    [
      ["pirate", "pirates"],
      ["pirata", "piratas"],
    ],
    [["walk the plank"], ["caminar por la plancha"]],
    [["stingray"], ["mantarraya"]],
    [["white whale"], ["ballena blanca"]],
  ],
  moth: [
    [["cheating"], ["trampa", "trampas"]],
    [["guard"], ["guardián"]],
    [["discard"], ["descarte"]],
  ],
  dixit: [
    [["storyteller"], ["narrador"]],
    [["clue"], ["pista"]],
    [
      ["vote", "voting"],
      ["voto", "votos"],
    ],
    [["scoring"], ["puntuación"]],
  ],
  secret_hitler: [
    [["chaos"], ["caos"]],
    [["election"], ["elección"]],
    [["veto"], ["veto"]],
    [["president"], ["presidente"]],
  ],
  burako: [
    [
      ["wild", "wilds"],
      ["comodín", "comodines"],
    ],
    [["dead pile"], ["muerto"]],
    [["scoring"], ["puntuación"]],
  ],
  truco: [
    [["tricks"], ["bazas"]],
    [
      ["bid", "bidding"],
      ["canto", "cantos"],
    ],
    [["pieces"], ["piezas"]],
  ],
  el_camarero: [
    [["bell"], ["campana"]],
    [["orders"], ["pedidos"]],
    [["scoring"], ["puntuación"]],
  ],
  sushi_go: [
    [["chopsticks"], ["palillos"]],
    [["dessert"], ["postre"]],
    [["scoring"], ["puntuación"]],
  ],
  sushi_go_party: [
    [["appetizers"], ["aperitivos"]],
    [["dessert"], ["postre"]],
    [["menu"], ["menú"]],
  ],
};
function matchingTerms(text: string, query: string, fuzzy: boolean) {
  const tokens = words(query),
    normalized = normalizeRuleText(text);
  if (normalized.includes(normalizeRuleText(query))) return [query];
  return tokens.flatMap((token) =>
    words(text).filter((word) => (fuzzy ? near(token, word) : token === word)),
  );
}
export function translatedTerms(
  id: string,
  query: string,
  lang: Language,
  fuzzy = true,
) {
  const normalized = normalizeRuleText(query.trim());
  const terms = [query];
  for (const [en, es] of [...commonVocabulary, ...(vocabulary[id] || []), ...glossaryVocabulary(id)]) {
    const all = [...en, ...es];
    if (
      all.some(
        (term) =>
          normalizeRuleText(term) === normalized ||
          (fuzzy &&
            words(normalized).length === 1 &&
            words(term).length === 1 &&
            near(normalized, normalizeRuleText(term))),
      )
    )
      terms.push(...(lang === "en" ? en : es));
  }
  return [...new Set(terms.filter(Boolean))];
}
export interface SearchMatch {
  section: RuleSection;
  score: number;
  paragraph: Translation;
  terms: string[];
  approximate: boolean;
}
export function searchRules(
  id: string,
  sections: RuleSection[],
  query: string,
  lang: Language,
): SearchMatch[] {
  const q = normalizeRuleText(query.trim());
  if (!q) return [];
  const tokens = words(q);
  if (!tokens.length) return [];
  const matches: SearchMatch[] = [];
  for (const section of sections) {
    let best: SearchMatch | undefined;
    for (const [i, pair] of [section.title, ...section.paragraphs].entries())
      for (const language of ["en", "es"] as Language[]) {
        const text = normalizeRuleText(pair[language]);
        const exact = text.includes(q);
        const textWords = words(text);
        const allExact = tokens.every((token) => textWords.includes(token));
        const fuzzy =
          !exact &&
          !allExact &&
          tokens.every((token) => textWords.some((word) => near(token, word)));
        const related = translatedTerms(id, query, language)
          .slice(1)
          .some((term) => text.includes(normalizeRuleText(term)));
        const relatedTypo =
          related && translatedTerms(id, query, language, false).length === 1;
        if (!exact && !allExact && !fuzzy && !related) continue;
        const approximate = !exact && !allExact && (fuzzy || relatedTypo);
        const score =
          (exact ? 100 : allExact ? 80 : fuzzy ? 30 : relatedTypo ? 20 : 70) +
          (i === 0 ? 10 : 0) +
          (language === lang ? 2 : 0);
        const paragraph =
          i === 0
            ? section.paragraphs.find((p) =>
                ["en", "es"].some((l) =>
                  normalizeRuleText(p[l as Language]).includes(q),
                ),
              ) || section.paragraphs[0]
            : pair;
        const terms = [
          ...translatedTerms(id, query, lang),
          ...matchingTerms(paragraph[lang], query, fuzzy),
        ];
        if (!best || score > best.score)
          best = { section, score, paragraph, terms, approximate };
      }
    if (best) matches.push(best);
  }
  return matches.sort((a, b) => b.score - a.score);
}
export function highlightRanges(text: string, terms: string[]) {
  // Keep offsets in the original text, including accented and decomposed letters.
  let normalized = "",
    offset = 0;
  const starts: number[] = [],
    ends: number[] = [],
    ranges: [number, number][] = [];
  for (const letter of text) {
    const folded = normalizeRuleText(letter);
    for (let i = 0; i < folded.length; i++) {
      starts.push(offset);
      ends.push(offset + letter.length);
    }
    normalized += folded;
    offset += letter.length;
  }
  const word = (letter: string) => /[\p{L}\p{N}\p{M}]/u.test(letter);
  for (const term of terms) {
    const q = normalizeRuleText(term.trim());
    if (!q) continue;
    let index = normalized.indexOf(q);
    while (index >= 0) {
      let from = starts[index],
        to = ends[index + q.length - 1];
      while (from > 0 && word(text[from - 1])) from--;
      while (to < text.length && word(text[to])) to++;
      ranges.push([from, to]);
      index = normalized.indexOf(q, index + q.length);
    }
  }
  ranges.sort((a, b) => a[0] - b[0]);
  return ranges.reduce<[number, number][]>((merged, range) => {
    const last = merged.at(-1);
    if (last && last[1] >= range[0]) last[1] = Math.max(last[1], range[1]);
    else merged.push([...range]);
    return merged;
  }, []);
}
type Question = {
  section: string;
  query: string;
  label: Translation;
  option?: "reformation" | "inquisitor" | "lady";
};
const question = (
  section: string,
  query: string,
  en: string,
  es: string,
  option?: Question["option"],
): Question => ({ section, query, label: { en, es }, option });
const questions: Record<string, Question[]> = {
  monopoly: [
    question(
      "movement",
      "auction",
      "What if nobody buys a property?",
      "¿Qué pasa si nadie compra una propiedad?",
    ),
    question(
      "jail",
      "jail",
      "How do I leave jail?",
      "¿Cómo salgo de la cárcel?",
    ),
  ],
  coup: [
    question(
      "challenges",
      "challenge",
      "What happens after a challenge?",
      "¿Qué pasa después de un desafío?",
    ),
    question(
      "reformation",
      "embezzle",
      "How does embezzlement work?",
      "¿Cómo funciona malversar?",
      "reformation",
    ),
    question(
      "inquisitor",
      "examine",
      "How does Examine work?",
      "¿Cómo funciona Examinar?",
      "inquisitor",
    ),
  ],
  avalon: [
    question(
      "quests",
      "fail",
      "How many Fail cards fail a quest?",
      "¿Cuántos Fracasos hacen fallar una misión?",
    ),
    question(
      "lady",
      "lady of the lake",
      "When do we use the Lady?",
      "¿Cuándo usamos la Dama?",
      "lady",
    ),
  ],
  chess: [
    question(
      "special",
      "castling",
      "When can I castle?",
      "¿Cuándo puedo enrocar?",
    ),
    question("draws", "stalemate", "What is stalemate?", "¿Qué es el ahogado?"),
  ],
  poker: [
    question(
      "showdown",
      "tie",
      "What happens in a tie?",
      "¿Qué pasa si hay empate?",
    ),
  ],
  skull_king: [
    question(
      "hierarchy",
      "mermaid",
      "Does a Mermaid beat the Skull King?",
      "¿Una Sirena le gana a Skull King?",
    ),
    question(
      "scoring",
      "zero",
      "How do zero bids score?",
      "¿Cómo se puntúa una apuesta de cero?",
    ),
    question(
      "expansion-effects",
      "Walk the Plank",
      "How does Walk the Plank work?",
      "¿Cómo funciona Walk the Plank?",
    ),
  ],
  dixit: [
    question(
      "scoring",
      "everyone",
      "What if everyone guesses correctly?",
      "¿Qué pasa si todos aciertan?",
    ),
  ],
  catan: [
    question(
      "robber",
      "7",
      "What happens when we roll seven?",
      "¿Qué pasa si sale un siete?",
    ),
  ],
  moth: [
    question(
      "cheating",
      "moth",
      "Can I discard a moth?",
      "¿Puedo descartar una polilla?",
    ),
  ],
};
export function commonQuestions(
  id: string,
  sections: RuleSection[],
  options?: ToolState,
) {
  return (questions[id] || []).filter(
    (q) =>
      sections.some(
        (section) =>
          section.id === q.section &&
          [section.title, ...section.paragraphs].some((pair) =>
            ["en", "es"].some((lang) =>
              normalizeRuleText(pair[lang as Language]).includes(
                normalizeRuleText(q.query),
              ),
            ),
          ),
      ) &&
      (!q.option ||
        !options ||
        (q.option === "reformation"
          ? options.reformation
          : q.option === "inquisitor"
            ? options.exchange === "inquisitor"
            : options.lady)),
  );
}

export function matchingHighlightTerms(
  id: string,
  text: string,
  query: string,
  lang: Language,
) {
  return [
    ...translatedTerms(id, query, lang),
    ...matchingTerms(text, query, true),
  ];
}

/** Relationships use authored section/card IDs; titles are never used to guess a card. */
export function relatedRuleCards(
  section: string,
  cards: Record<string, LessonCard>,
  options?: ToolState,
) {
  return Object.values(cards).filter((card) =>
    card.rule === section &&
    (!card.exchange || card.exchange === options?.exchange) &&
    (!card.expansion || options?.skullExpansion) &&
    (!card.role || (options?.avalonMode !== "basic" && options?.optional.includes(card.role))),
  );
}
