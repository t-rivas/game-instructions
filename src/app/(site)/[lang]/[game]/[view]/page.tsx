import toolStyles from "@/generated/tool-styles.json";
import { notFound } from "next/navigation";
import { GameGuide } from "@/components/GameGuide";
import {
  artwork,
  gameIds,
  games,
  icons,
  isLanguage,
  isView,
  lessonCardTeaching,
  views,
} from "@/lib/games";
import { guideMetadata } from "@/lib/metadata";
import { renderTools } from "@/lib/tool-renderer";
type Params = { lang: string; game: string; view: string };
export const dynamicParams = false;
export function generateStaticParams() {
  return gameIds.flatMap((game) => views.map((view) => ({ game, view })));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}) {
  const { lang, game, view } = await params;
  if (!Object.hasOwn(games, game) || !isLanguage(lang) || !isView(view))
    notFound();
  return guideMetadata(lang, game, view);
}
export default async function Page({ params }: { params: Promise<Params> }) {
  const { lang, game, view } = await params;
  if (!Object.hasOwn(games, game) || !isLanguage(lang) || !isView(view))
    notFound();
  return (
    <>
      {Object.hasOwn(toolStyles, game) ? (
        <link
          rel="stylesheet"
          href={toolStyles[game as keyof typeof toolStyles]}
          precedence="game-tools"
        />
      ) : null}
      <GameGuide
        key={`${lang}-${game}-${view}`}
        id={game}
        game={games[game]}
        lang={lang}
        view={view}
        art={artwork(game)}
        icons={icons}
      tools={renderTools(lang, game, view)}
      cardTeaching={lessonCardTeaching(game)}
      />
    </>
  );
}
