import type { Metadata } from "next";
import { artwork, gamePath, games } from "./games";
import type { Language, View } from "./types";
const configuredOrigin =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : undefined);
export const siteOrigin = configuredOrigin
  ? new URL(configuredOrigin)
  : undefined;
export function guideMetadata(
  lang: Language,
  id: string,
  view: View,
): Metadata {
  const game = games[id];
  const label = {
    learn: { en: "Learn", es: "Aprender" },
    play: { en: "While playing", es: "Al jugar" },
    rules: { en: "Full rules", es: "Reglas completas" },
  }[view][lang];
  const title = `${game.name[lang]} · ${label}`;
  return {
    title,
    description: game.description[lang],
    alternates: siteOrigin
      ? {
          canonical: gamePath(lang, id, view),
          languages: {
            en: gamePath("en", id, view),
            es: gamePath("es", id, view),
          },
        }
      : undefined,
    openGraph: {
      title: `${title} · Tablefolk`,
      description: game.description[lang],
      siteName: "Tablefolk",
      locale: lang === "es" ? "es_UY" : "en_US",
      type: "website",
      images: siteOrigin
        ? [
            {
              url: artwork(id).src,
              width: artwork(id).width,
              height: artwork(id).height,
            },
          ]
        : undefined,
    },
  };
}
