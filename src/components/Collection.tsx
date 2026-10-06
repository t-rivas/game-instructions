"use client";
import {
  emptyFilters,
  rememberCollection,
  useCollectionFilters,
} from "@/lib/collection-state";
import { ResponsiveImage } from "./ResponsiveImage";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { GameCardData, Language } from "@/lib/types";
import { Icon } from "./Icon";
import { SavedGames } from "./SavedGames";
import {
  canWriteStored,
  readStored,
  writeStored,
  recordGameVisit,
} from "@/lib/browser-storage";
// Keep the first-visit introduction stable during this browsing session.
let returningVisitor: boolean | undefined;
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
  const [savedReady, setSavedReady] = useState(false),
    [returning, setReturning] = useState(false);
  const [
    { query, players, duration, favoritesOnly },
    updateFilters,
    finishSearch,
  ] = useCollectionFilters(lang, savedReady);
  const [favorites, setFavorites] = useState<string[]>([]),
    [favoriteError, setFavoriteError] = useState(false),
    [expansion, setExpansion] = useState(false);
  useEffect(() => {
    recordGameVisit("collection");
    const preferences = readStored<{ seen?: unknown; visited?: boolean }>(
      "tablefolk-preferences",
      {},
    );
    returningVisitor ??=
      preferences.visited === true ||
      (Array.isArray(preferences.seen) && preferences.seen.length > 0);
    setReturning(returningVisitor);
    writeStored("tablefolk-preferences", { ...preferences, visited: true });
  }, []);
  const storedFavorites = (fallback: string[] = []) => {
    const saved = readStored<unknown>("tablefolk-favorites", fallback);
    return Array.isArray(saved)
      ? [...new Set(saved.filter((id) => cards.some((card) => card.id === id)))]
      : [];
  };
  useEffect(() => {
    const sync = () => {
      setFavorites(storedFavorites());
      setExpansion(
        readStored<{ skullExpansion?: boolean }>("tablefolk-preferences", {})
          .skullExpansion === true,
      );
    };
    sync();
    const changed = (event: StorageEvent) => {
      if (
        event.key === null ||
        ["tablefolk-favorites", "tablefolk-preferences"].includes(event.key)
      )
        sync();
    };
    window.addEventListener("storage", changed);
    return () => window.removeEventListener("storage", changed);
  }, [cards]);
  const playerRange = (id: string, value: string) =>
    id === "skull_king" && expansion ? "2–9" : value;
  const toggleFavorite = (id: string) => {
    const wanted = !favorites.includes(id);
    const save = () => {
      // Read inside the lock, so concurrent tabs cannot replace each other's edits.
      const current = storedFavorites(favorites);
      const next = wanted
        ? [...new Set([...current, id])]
        : current.filter((game) => game !== id);
      setFavorites(next);
      setFavoriteError(!writeStored("tablefolk-favorites", next));
    };
    // Reflect the user's intent and report blocked storage during this event,
    // rather than waiting for the asynchronous cross-tab lock callback.
    setFavorites(
      wanted
        ? [...new Set([...favorites, id])]
        : favorites.filter((game) => game !== id),
    );
    if (!canWriteStored()) {
      save();
      return;
    }
    setFavoriteError(false);
    if (navigator.locks?.request)
      void navigator.locks.request("tablefolk-favorites", save).catch(save);
    else save();
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
    <main id="main" className="collection-page" tabIndex={-1}>
      <div className="wrap">
        <SavedGames
          cards={cards}
          lang={lang}
          onReady={() => setSavedReady(true)}
        />
        <section
          className={`hero${returning ? " returning-hero" : ""}`}
          aria-labelledby="welcome-title"
        >
          <div className="hero-copy">
            <h1 id="welcome-title">
              <span className="new-visitor-title">
                {tr("Learn the game.", "Aprende el juego.")}
                <br />
                <em>{tr("Enjoy the night.", "Disfruta la partida.")}</em>
              </span>
              <span className="returning-title">
                {tr("Back to the table.", "Volvamos a la mesa.")}
              </span>
            </h1>
            <p>
              {tr(
                "Pick a game for clear rules, quick answers, and tools for your table.",
                "Elige un juego: reglas claras, respuestas rápidas y herramientas para tu mesa.",
              )}
            </p>
          </div>
          <div className="hero-gallery" aria-hidden="true">
            {["coup", "avalon", "sushi_go_party"].map((id) => {
              const card = cards.find((card) => card.id === id);
              if (!card) return null;
              return (
                <div className={`hero-box hero-box-${id}`} key={id}>
                  <ResponsiveImage
                    desktopOnly
                    sizes="(max-width: 1000px) 130px, 190px"
                    src={card.cover.src}
                    alt=""
                    width={card.cover.width}
                    height={card.cover.height}
                    decoding="async"
                  />
                </div>
              );
            })}
          </div>
        </section>
        <section id="collection" aria-labelledby="collection-title">
          <div className="collection-head">
            <div>
              <h2 id="collection-title">
                {tr("Choose a game", "Elige un juego")}
              </h2>
            </div>
            <div className="search">
              <Icon path={icons.search} />
              <input
                id="game-search"
                type="search"
                maxLength={120}
                onBlur={finishSearch}
                value={query}
                onChange={(event) =>
                  updateFilters({ query: event.target.value })
                }
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
                onChange={(event) =>
                  updateFilters({ players: event.target.value })
                }
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
                onChange={(event) =>
                  updateFilters({ duration: event.target.value })
                }
              >
                <option value="">
                  {tr("Any duration", "Sin límite")}
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
              onClick={() => updateFilters({ favoritesOnly: !favoritesOnly })}
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
                  updateFilters(emptyFilters);
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
                    <ResponsiveImage
                      className="official-cover"
                      src={cover.src}
                      sizes="(max-width: 600px) 112px, (max-width: 1000px) 240px, 280px"
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
                    <p className="card-description">
                      {id === "poker"
                        ? `Texas Hold’em. ${game.description[lang]}`
                        : game.description[lang]}
                    </p>
                    <div className="card-bottom">
                      <Link
                        prefetch={false}
                        onClick={rememberCollection}
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
                        onClick={rememberCollection}
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
