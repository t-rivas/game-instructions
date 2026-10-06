import type { Artwork, Language } from "@/lib/types";
import { ResponsiveImage } from "./ResponsiveImage";

/** Shared published artwork control for lesson cards and worked examples. */
export function LessonCardArt({ id, art, lang }: { id: string; art: Artwork; lang: Language }) {
  return (
    <button type="button" className="official-thumb lesson-card-art" data-art={id}
      aria-label={`${lang === "es" ? "Ampliar imagen:" : "Enlarge image:"} ${art.title[lang]}`}>
      <ResponsiveImage src={art.src} sizes="(max-width: 600px) 118px, 160px"
        width={art.width} height={art.height} alt={art.title[lang]} loading="lazy"
        onError={(event) => { event.currentTarget.hidden = true; }} />
      <span className="zoom-hint" aria-hidden="true">↗</span>
    </button>
  );
}
