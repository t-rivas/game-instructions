"use client";
import Link from "next/link";
import { useState } from "react";
import type { GameCardData, Language } from "@/lib/types";
import { Icon } from "./Icon";
const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
export function Collection({
  cards,
  lang,
  icons,
}: {
  cards: GameCardData[];
  lang: Language;
  icons: Record<string, string>;
}) {
  const [query, setQuery] = useState("");
  const tr = (en: string, es: string) => (lang === "es" ? es : en);
  const matches = cards.filter(({ id, game }) =>
    normalize(
      `${id} ${game.name.en} ${game.name.es} ${game.category.en} ${game.category.es} ${id === "coup" ? "inquisitor inquisidor reformation embajador ambassador" : ""} ${id === "skull_king" ? "expansion pack expansión" : ""}`,
    ).includes(normalize(query)),
  );
  return (
    <main id="main" tabIndex={-1}>
      <div className="wrap">
        <section className="hero">
          <div>
            <span className="pill">
              {tr("YOUR GAME NIGHT COMPANION", "TU COMPAÑERO DE JUEGOS")}
            </span>
            <h1>
              {tr("Less reading.", "Menos lectura.")}
              <br />
              <em>{tr("More playing.", "Más juego.")}</em>
            </h1>
            <p>
              {tr(
                "Clear rules for your favorite games. Learn before you start and find answers while you play.",
                "Las reglas, sin complicaciones. Guías sencillas para tus juegos favoritos, siempre a mano.",
              )}
            </p>
            <div className="hero-note">
              <Icon path={icons.check} />
              {tr(
                "Easy to learn. Easy to look up. In your language.",
                "Fácil de aprender. Fácil de consultar. En tu idioma.",
              )}
            </div>
          </div>
          <div className="hero-gallery" aria-hidden="true">
            <div className="gallery-main">
              <img src="/assets/avalon.jpg" alt="" width="1200" height="800" />
            </div>
            <div className="gallery-small">
              <img src="/assets/coup.jpg" alt="" width="1200" height="800" />
            </div>
            <div className="gallery-tiny">
              <img src="/assets/poker.jpg" alt="" width="1200" height="800" />
            </div>
            <span className="gallery-note">
              {tr(
                "Ready for another round?",
                "Siempre hay tiempo para otra ronda.",
              )}
            </span>
          </div>
        </section>
        <section id="collection" aria-labelledby="collection-title">
          <div className="collection-head">
            <div>
              <p className="eyebrow">{tr("THE GAMES", "LOS JUEGOS")}</p>
              <h2 id="collection-title">
                {tr("Choose a game", "Elige el juego de hoy")}{" "}
                <span className="muted" style={{ fontSize: 15, marginLeft: 8 }}>
                  {String(cards.length).padStart(2, "0")}
                </span>
              </h2>
            </div>
            <div className="search">
              <Icon path={icons.search} />
              <input
                id="game-search"
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={tr("Find a game…", "Busca un juego…")}
                aria-label={tr(
                  "Search the collection",
                  "Buscar en la colección",
                )}
              />
            </div>
          </div>
          <div className="game-grid" id="game-grid">
            {matches.length ? (
              matches.map(({ id, game, cover }) => (
                <article
                  key={id}
                  className={`game-card ${game.color}`}
                  data-game={id}
                >
                  <div className="game-art">
                    {id === "coup" ? (
                      <span className="art-tag">
                        {tr("2 variants", "2 variantes")}
                      </span>
                    ) : id === "poker" ? (
                      <span className="art-tag">Texas Hold’em</span>
                    ) : null}
                    <img
                      className="official-cover"
                      src={cover.src}
                      alt={cover.title[lang]}
                      width={cover.width}
                      height={cover.height}
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                  <div className="card-body">
                    <h3>{game.name[lang]}</h3>
                    <div className="meta">
                      <span>
                        <Icon path={icons.people} />
                        {game.players} {tr("players", "jugadores")}
                      </span>
                      <span>
                        <Icon path={icons.clock} />
                        {game.time} min
                      </span>
                    </div>
                    <p style={{ marginTop: 13 }}>{game.description[lang]}</p>
                    <div className="card-bottom">
                      <Link
                        prefetch={false}
                        className="card-learn"
                        href={`/${lang}/${id}/learn/`}
                        aria-label={tr(
                          `Learn ${game.name[lang]}`,
                          `Aprender ${game.name[lang]}`,
                        )}
                      >
                        {tr("Learn", "Aprender")}
                      </Link>
                      <Link
                        prefetch={false}
                        className="card-play"
                        href={`/${lang}/${id}/play/`}
                        aria-label={tr(
                          `Play ${game.name[lang]} now`,
                          `Jugar ${game.name[lang]} ahora`,
                        )}
                      >
                        {tr("Play now", "Jugar ahora")}
                      </Link>
                    </div>
                  </div>
                </article>
              ))
            ) : (
              <p className="no-results muted">
                {tr(
                  "No games found. Try Catan, Chess, Truco, Coup or Dixit.",
                  "No hay resultados. Prueba Catan, Ajedrez, Truco, Coup o Dixit.",
                )}
              </p>
            )}
          </div>
        </section>
        <div className="bottom-note">
          <Icon path={icons.book} />
          <span>
            {tr(
              "New to a game? Start with Learn. Need a rule during the game? Open While playing.",
              "¿Es tu primera vez? Abre Aprender. ¿Tienes una duda durante la partida? Consulta la pestaña Al jugar.",
            )}
          </span>
        </div>
      </div>
    </main>
  );
}
