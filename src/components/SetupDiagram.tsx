import type { Artwork, Language } from "@/lib/types";
import { setupVisual } from "@/generated/setup-model";
import { LessonCardArt } from "./LessonCardArt";

/** Shared, authored HTML/SVG only; no user text or session data enters this markup. */
export function SetupDiagram({ game, index, lang, players, artwork }: {
  game: string; index: number; lang: Language; players: number; artwork: Record<string, Artwork>;
}) {
  const visual = setupVisual(game, index, lang, players);
  if (!visual) return null;
  return <figure className="setup-visual" data-setup-visual={`${game}-${index}`}
    aria-live={game === "sushi_go_party" && index === 2 ? "polite" : undefined} aria-atomic={game === "sushi_go_party" && index === 2 ? true : undefined}>
    <figcaption><h4>{visual.title}</h4></figcaption>
    <div dangerouslySetInnerHTML={{ __html: visual.html }} />
    {visual.art.length ? <div className="setup-recognition">
      {visual.art.map((art: {id: string; label: string}) => <div key={art.id}>
        {artwork[art.id] ? <LessonCardArt id={art.id} art={artwork[art.id]} lang={lang} /> : null}
        <strong>{art.label}</strong>
      </div>)}
    </div> : null}
    {visual.instructions.map((text: string, i: number) => <p key={i}>{text}</p>)}
    <p className="setup-source"><a href={visual.source![1]} target="_blank" rel="noopener noreferrer">{visual.source![0]} ↗</a></p>
  </figure>;
}
