import "server-only";
import catalog from "@/generated/catalog.json";
import type { Artwork, Game, GameCardData, Language, ScoringTeaching, LessonCardTeaching, LessonCard, SkullTrickTeaching, CoupTeaching, AvalonTeaching, PracticeDecision, View } from "./types";
export const languages: Language[] = ["es", "en"];
export const views: View[] = ["learn", "play", "rules"];
export const games = catalog.games as unknown as Record<string, Game>;
export const gameIds = Object.keys(games);
export const icons: Record<string, string> = catalog.icons;
export function lessonCardTeaching(id: string): LessonCardTeaching {
  const source = catalog as unknown as {
    lessonCardSteps: Record<string, string[][]>;
    lessonCardFacts: Record<string, Omit<LessonCard, "id" | "art">>;
    official: Record<string, Artwork>;
  };
  const steps = source.lessonCardSteps[id] || [];
  const cards: Record<string, LessonCard> = {};
  for (const key of new Set(steps.flat())) {
    const art = source.official[key];
    const fact = source.lessonCardFacts[key];
    if (art && fact) cards[key] = { ...fact, id: key, art };
  }
  const tricks = id === "skull_king" ? {
    ...(catalog as unknown as { skullTricks: Omit<SkullTrickTeaching, "artwork"> }).skullTricks,
    artwork: Object.fromEntries(Object.entries(source.official).filter(([key]) => key.startsWith("sk-") || key.startsWith("exp-"))),
  } : undefined;
  const coup = id === "coup" ? (catalog as unknown as {coupLesson: CoupTeaching}).coupLesson : undefined;
  const avalon = id === "avalon" ? (catalog as unknown as {avalonTeaching: AvalonTeaching}).avalonTeaching : undefined;
  const componentId = [`${id}-components`, `${id}-overview`, ...({catan:["catan-board"], truco:["truco-deck"], moth:["moth-guard"]}[id] || [])].find(key => source.official[key]);
  const components = componentId ? { ...source.official[componentId], officialId: componentId } : undefined;
  const pieces = id === "chess" ? Object.fromEntries(Object.entries(source.official).filter(([key]) => /^chess-(king|queen|rook|bishop|knight|pawn)$/.test(key))) : undefined;
  const scoring = (catalog as unknown as {scoringExamples: Record<string, ScoringTeaching>}).scoringExamples[id];
  const scoringArtwork = scoring ? Object.fromEntries(Object.entries(source.official).filter(([key]) => scoring.scenarios.some(s => s.states.some(state => state.cards.some(c => c.art === key))))) : undefined;
  const setupIds: Record<string, string[]> = {
    chess: ["chess-rook","chess-knight","chess-bishop","chess-queen","chess-king","chess-pawn"],
    catan: ["catan-board","catan-cards"],
    sushi_go_party: ["sushi_go_party-components", ...["nigiri","maki","tempura","sashimi","dumpling","chopsticks","wasabi","pudding"].map(key => `party-${key}`)],
  };
  const setupArtwork = Object.fromEntries((setupIds[id] || []).filter(key => source.official[key]).map(key => [key, source.official[key]]));
  const practice = (catalog as unknown as {lessonPractice: Record<string, PracticeDecision[]>}).lessonPractice[id] || [];
  for (const key of new Set(practice.flatMap(item => item.cards || []))) {
    const art = source.official[key], fact = source.lessonCardFacts[key];
    if (art && fact) cards[key] = { ...fact, id:key, art };
  }
  return { practice, setupArtwork, scoring, scoringArtwork, components, pieces, steps, cards, ...(avalon ? {avalon} : {}), ...(tricks ? {tricks} : {}), ...(coup ? {coup} : {}) };
}
export function cover(id: string): Artwork {
  const entry = (catalog.official as unknown as Record<string, Artwork>)[
    id + "-box"
  ];
  return { ...entry, src: "/" + entry.src.replace(/^\//, "") };
}
export function artwork(id: string): Artwork {
  const art = (
    catalog.artwork as unknown as Record<string, [string, number, number]>
  )[id];
  return art
    ? {
        src: "/" + art[0].replace(/^\//, ""),
        width: art[1],
        height: art[2],
        title: games[id].name,
      }
    : { ...cover(id), officialId: id + "-box" };
}
export function collection(): GameCardData[] {
  return gameIds.map((id) => {
    const { name, category, description, players, time, color } = games[id];
    return {
      id,
      game: { name, category, description, players, time, color },
      cover: cover(id),
    };
  });
}
export function gamePath(
  lang: Language,
  game: string,
  view: View,
  section?: string,
) {
  return `/${lang}/${game}/${view}/${section ? "#" + section : ""}`;
}
export function isLanguage(value: string): value is Language {
  return value === "en" || value === "es";
}
export function isView(value: string): value is View {
  return value === "learn" || value === "play" || value === "rules";
}
