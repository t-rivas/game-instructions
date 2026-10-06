import type { ReactNode } from "react";
import type { Language } from "@/lib/types";
import "./watch-turn.css";

export const watchWords = (lang: Language) => lang === "es" ? {
  title: "Mira un turno", previous: "Anterior", next: "Siguiente", replay: "Repetir",
  step: "Paso", public: "Mesa pública", hidden: "Boca abajo", bank: "Banco", deck: "Mazo",
} : {
  title: "Watch one turn", previous: "Previous", next: "Next", replay: "Replay",
  step: "Step", public: "Public table", hidden: "Face down", bank: "Bank", deck: "Deck",
};

/** Presentation only: each game owns its authored, reversible sequence. */
export function WatchTurn({ lang, progress, children, kind }: {
  lang: Language; progress: string; children: ReactNode; kind: string;
}) {
  const w = watchWords(lang);
  return <div className={`watch-turn watch-${kind}`} data-watch-turn={kind}>
    <div className="watch-heading"><strong>{w.title}</strong><span>{progress}</span></div>
    {children}
  </div>;
}

export function WatchControls({ lang, previous, next, replay }: {
  lang: Language; previous?: () => void; next?: () => void; replay: () => void;
}) {
  const w = watchWords(lang);
  return <nav className="watch-controls" aria-label={w.title}>
    <button type="button" data-watch-previous disabled={!previous} onClick={previous}>← {w.previous}</button>
    <button type="button" data-watch-replay onClick={replay}>{w.replay}</button>
    <button type="button" data-watch-next disabled={!next} onClick={next}>{w.next} →</button>
  </nav>;
}
