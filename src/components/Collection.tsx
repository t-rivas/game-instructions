"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { GameCardData, Language } from "@/lib/types";
import { Icon } from "./Icon";
import { SavedGames } from "./SavedGames";
import { readStored, writeStored } from "@/lib/browser-storage";
const star =
  '<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9L12 3Z"/>';
function supportsPlayers(value: string, count: number) {
  const numbers = value.match(/\d+/g)?.map(Number) || [];
  return value.includes("/")
    ? numbers.includes(count)
    : count >= numbers[0] && count <= (numbers[1] || numbers[0]);
}
function maxTime(value: string) {
  return value.includes("+")
    ? Infinity
    : Math.max(...(value.match(/\d+/g)?.map(Number) || []));
}
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
  const [players, setPlayers] = useState(""),
    [duration, setDuration] = useState(""),
    [favoritesOnly, setFavoritesOnly] = useState(false),
    [favorites, setFavorites] = useState<string[]>([]),
    [favoriteError, setFavoriteError] = useState(false),
    [expansion, setExpansion] = useState(false);
  useEffect(() => {
    const saved = readStored<unknown>("tablefolk-favorites", []);
    setFavorites(
      Array.isArray(saved)
        ? saved.filter((id) => cards.some((card) => card.id === id))
        : [],
    );
    setExpansion(
      readStored<{ skullExpansion?: boolean }>("tablefolk-preferences", {})
        .skullExpansion === true,
    );
  }, [cards]);
  const playerRange = (id: string, value: string) =>
    id === "skull_king" && expansion ? "2–9" : value;
  const toggleFavorite = (id: string) => {
    const next = favorites.includes(id)
      ? favorites.filter((game) => game !== id)
      : [...favorites, id];
    setFavorites(next);
    setFavoriteError(!writeStored("tablefolk-favorites", next));
  };
  const tr = (en: string, es: string) => (lang === "es" ? es : en);
  const matches = cards.filter(
    ({ id, game }) =>
      normalize(
        `${id} ${game.name.en} ${game.name.es} ${game.category.en} ${game.category.es} ${id === "coup" ? "inquisitor inquisidor reformation embajador ambassador" : ""} ${id === "skull_king" ? "expansion pack expansión" : ""}`,
      ).includes(normalize(query.trim())) &&
      (!players ||
        supportsPlayers(playerRange(id, game.players), Number(players))) &&
      (!duration ||
        (duration === "long"
          ? maxTime(game.time) > 120
          : maxTime(game.time) <= Number(duration))) &&
      (!favoritesOnly || favorites.includes(id)),
  );
  return (
    <main id="main" tabIndex={-1}>
      <div className="wrap">
        <SavedGames cards={cards} lang={lang} />
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
          <div
            className="collection-filters"
            aria-label={tr("Filter games", "Filtrar juegos")}
          >
            <label htmlFor="filter-players">
              {tr("Players", "Jugadores")}
              <select
                id="filter-players"
                value={players}
                onChange={(event) => setPlayers(event.target.value)}
              >
                <option value="">
                  {tr("Any group size", "Cualquier grupo")}
                </option>
                {[2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                  <option key={n} value={n}>
                    {n} {tr("players", "jugadores")}
                  </option>
                ))}
              </select>
            </label>
            <label htmlFor="filter-duration">
              {tr("Time available", "Tiempo disponible")}
              <select
                id="filter-duration"
                value={duration}
                onChange={(event) => setDuration(event.target.value)}
              >
                <option value="">
                  {tr("Any duration", "Cualquier duración")}
                </option>
                {[30, 60, 120].map((n) => (
                  <option key={n} value={n}>
                    {tr(`Up to ${n} min`, `Hasta ${n} min`)}
                  </option>
                ))}
                <option value="long">
                  {tr("More than 120 min", "Más de 120 min")}
                </option>
              </select>
            </label>
            <button
              type="button"
              id="filter-favorites"
              aria-pressed={favoritesOnly}
              onClick={() => setFavoritesOnly(!favoritesOnly)}
            >
              <Icon path={star} />
              {tr("Favorites", "Favoritos")}
            </button>
            {query || players || duration || favoritesOnly ? (
              <button
                type="button"
                className="clear-filters"
                id="clear-filters"
                onClick={() => {
                  setQuery("");
                  setPlayers("");
                  setDuration("");
                  setFavoritesOnly(false);
                }}
              >
                {tr("Clear filters", "Limpiar filtros")}
              </button>
            ) : null}
          </div>
          <p
            className="collection-results muted"
            role="status"
            aria-atomic="true"
          >
            {tr(
              `${matches.length} of ${cards.length} games`,
              `${matches.length} de ${cards.length} juegos`,
            )}
            {duration
              ? ` · ${tr("Allow for the longest time listed.", "Considera el mayor tiempo indicado.")}`
              : ""}
          </p>
          {favoriteError ? (
            <p role="status">
              {tr(
                "Favorites could not be saved on this device.",
                "No se pudieron guardar los favoritos en este dispositivo.",
              )}
            </p>
          ) : null}
          <div className="game-grid" id="game-grid">
            {matches.length ? (
              matches.map(({ id, game, cover }) => (
                <article
                  key={id}
                  className={`game-card ${game.color}`}
                  data-game={id}
                >
                  <div className="game-art">
                    <button
                      type="button"
                      className="favorite-toggle"
                      aria-pressed={favorites.includes(id)}
                      aria-label={
                        favorites.includes(id)
                          ? tr(
                              `Remove ${game.name[lang]} from favorites`,
                              `Quitar ${game.name[lang]} de favoritos`,
                            )
                          : tr(
                              `Favorite ${game.name[lang]}`,
                              `Marcar ${game.name[lang]} como favorito`,
                            )
                      }
                      onClick={() => toggleFavorite(id)}
                    >
                      <Icon path={star} />
                    </button>
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
                        {playerRange(id, game.players)}{" "}
                        {tr("players", "jugadores")}
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
                  "No games match. Try fewer filters or a different name.",
                  "No hay juegos que coincidan. Prueba menos filtros u otro nombre.",
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
