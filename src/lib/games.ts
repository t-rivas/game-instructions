import "server-only";
import catalog from "@/generated/catalog.json";
import type { Artwork, Game, GameCardData, Language, View } from "./types";
export const languages: Language[] = ["es", "en"];
export const views: View[] = ["learn", "play", "rules"];
export const games = catalog.games as unknown as Record<string, Game>;
export const gameIds = Object.keys(games);
export const icons: Record<string, string> = catalog.icons;
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
