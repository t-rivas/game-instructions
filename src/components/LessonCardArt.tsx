import type { CSSProperties } from "react";
import type { Artwork, Language } from "@/lib/types";
import { ResponsiveImage } from "./ResponsiveImage";

/** Shared published artwork frame. Names and effects stay in the lesson copy. */
export function LessonCardArt({ id, art, lang, presentation = "card" }: {
  id: string; art: Artwork; lang: Language; presentation?: "card" | "components";
}) {
  const tr = (en: string, es: string) => lang === "es" ? es : en;
  return (
    <button type="button" className="official-thumb lesson-card-art" data-art={id}
      data-art-presentation={presentation}
      style={{ "--art-ratio": `${art.width} / ${art.height}` } as CSSProperties}
      aria-label={`${tr("Enlarge image:", "Ampliar imagen:")} ${art.title[lang]}`}>
      <span className="art-media">
        <ResponsiveImage src={art.src}
          sizes={presentation === "components" ? "(max-width: 600px) 80vw, 520px" : "(max-width: 600px) 160px, 184px"}
          width={art.width} height={art.height} alt={art.title[lang]} loading="lazy"
          onError={(event) => { event.currentTarget.hidden = true; }} />
        <span className="art-fallback"><strong>{art.title[lang]}</strong>
          <span>{tr("Image unavailable", "Imagen no disponible")}</span>
        </span>
      </span>
      <span className="art-enlarge" aria-hidden="true"><span className="art-enlarge-label">{tr("Enlarge", "Ampliar")}</span> ↗</span>
    </button>
  );
}
