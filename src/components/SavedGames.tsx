"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { loadTools } from "@/lib/tool-client";
import {
  gameStorageKeys,
  readStored,
  recentGamesKey,
  savedGamesEvent,
} from "@/lib/browser-storage";
import type { GameCardData, Language, SavedGame } from "@/lib/types";
const time = (ms: number) => {
  const seconds = Math.ceil(ms / 1000);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
};
function summary(session: SavedGame, lang: Language) {
  const tr = (en: string, es: string) => (lang === "es" ? es : en);
  if (session.id === "chess")
    return `${tr("White", "Blancas")} ${time(session.remaining![0])} · ${tr("Black", "Negras")} ${time(session.remaining![1])} · ${session.phase === "running" ? tr("Running", "En marcha") : tr("Paused", "En pausa")}`;
  if (session.id === "poker")
    return `${tr("Schedule row", "Fila del programa")} ${session.completed! + 1} / ${session.goal} · ${time(session.remaining![0])} · ${session.phase === "running" ? tr("Running", "En marcha") : tr("Paused", "En pausa")}`;
  const scores = session.players
    ?.slice(0, 3)
    .map((player) => `${player.name}: ${player.score}`)
    .join(" · ");
  const more =
    (session.players?.length || 0) > 3
      ? ` · +${session.players!.length - 3}`
      : "";
  return `${scores}${more}${session.goal ? ` · ${session.completed} / ${session.goal} ${session.id === "coup" ? tr("games", "partidas") : tr("rounds", "rondas")}` : ""}`;
}
export function SavedGames({
  cards,
  lang,
}: {
  cards: GameCardData[];
  lang: Language;
}) {
  const [saved, setSaved] = useState<SavedGame[]>([]),
    [recent, setRecent] = useState<string[]>([]);
  const tr = (en: string, es: string) => (lang === "es" ? es : en);
  useEffect(() => {
    let cancelled = false,
      cleanup = () => {};
    const recent = readStored<unknown>(recentGamesKey, []);
    setRecent(
      Array.isArray(recent)
        ? recent
            .filter((id) => cards.some((card) => card.id === id))
            .slice(0, 4)
        : [],
    );
    let hasSaved = false;
    try {
      hasSaved = gameStorageKeys.some((key) => localStorage.getItem(key));
    } catch {}
    if (hasSaved)
      loadTools()
        .then((engine) => {
          if (cancelled) return;
          const refresh = () => setSaved(engine.savedGames());
          refresh();
          window.addEventListener(savedGamesEvent, refresh);
          const interval = window.setInterval(refresh, 1000);
          cleanup = () => {
            window.removeEventListener(savedGamesEvent, refresh);
            clearInterval(interval);
          };
        })
        .catch(() => {});
    return () => {
      cancelled = true;
      cleanup();
    };
  }, [cards]);
  return (
    <>
      {saved.length > 0 ? (
        <section className="continue-playing" aria-labelledby="continue-title">
          <div className="section-heading">
            <div>
              <p className="eyebrow">{tr("YOUR TABLE", "TU MESA")}</p>
              <h2 id="continue-title">
                {tr("Continue playing", "Seguir jugando")}
              </h2>
            </div>
            <span className="muted">
              {tr("On this device", "En este dispositivo")}
            </span>
          </div>
          <div className="resume-grid">
            {saved.map((session) => {
              const card = cards.find((card) => card.id === session.id);
              if (!card) return null;
              return (
                <article
                  className="resume-card"
                  key={session.id}
                  data-game={session.id}
                >
                  <img
                    src={card.cover.src}
                    alt=""
                    width={card.cover.width}
                    height={card.cover.height}
                  />
                  <div>
                    <h3>{card.game.name[lang]}</h3>
                    <p>{summary(session, lang)}</p>
                    <Link
                      prefetch={false}
                      className="resume-link"
                      href={`/${lang}/${session.id}/play/`}
                      aria-label={tr(
                        `Resume ${card.game.name[lang]}`,
                        `Retomar ${card.game.name[lang]}`,
                      )}
                    >
                      {tr("Resume game", "Retomar partida")}{" "}
                      <span aria-hidden="true">↗</span>
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      ) : null}
      {recent.length > 0 ? (
        <nav
          className="recent-games"
          aria-label={tr("Recently played", "Juegos recientes")}
        >
          <span>{tr("Recently opened", "Vistos recientemente")}</span>
          {recent.map((id) => (
            <Link key={id} prefetch={false} href={`/${lang}/${id}/play/`}>
              {cards.find((card) => card.id === id)?.game.name[lang]}
            </Link>
          ))}
        </nav>
      ) : null}
    </>
  );
}
