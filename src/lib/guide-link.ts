import { guidePlayerCount } from "@/generated/setup-context";
import type { Game, Language, RuleSection, ToolState, View } from "./types";
export const cleanQuery = (value: string) =>
  value.replace(/[\u0000-\u001f\u007f]/g, "").slice(0, 120);
const keys = [
  "shared",
  "exchange",
  "reformation",
  "expansion",
  "players",
  "roles",
  "optional",
  "lady",
];
const optionsCount = (id: string, state: ToolState) => guidePlayerCount(id, state.guidePlayers);
function parsedGuideCount(id: string, params: URLSearchParams) {
  const value = params.get("players") || "";
  return /^\d{1,2}$/.test(value) ? guidePlayerCount(id, Number(value)) : null;
}
const avalonRoles = ["percival", "morgana", "mordred", "oberon"];
// An explicit marker prevents collection filters from becoming setup choices.
export function sharedOptions(
  id: string,
  params: URLSearchParams,
): Partial<ToolState> | null {
  if (params.get("shared") !== "1") return null;
  if (id === "coup")
    return {
      exchange:
        params.get("exchange") === "inquisitor" ? "inquisitor" : "ambassador",
      guidePlayers: parsedGuideCount(id, params),
      reformation: params.get("reformation") === "1",
    };
  if (id === "sushi_go_party") return { guidePlayers: parsedGuideCount(id, params) };
  if (id === "skull_king")
    return { skullExpansion: params.get("expansion") === "1" };
  if (id === "avalon") {
    const count = params.get("players") || "";
    const players = /^[5-9]$|^10$/.test(count) ? Number(count) : 7;
    const avalonMode =
      params.get("roles") === "optional" ? "optional" : "basic";
    const requested = [
      ...new Set((params.get("optional") || "").split(",")),
    ].filter((role) => avalonRoles.includes(role));
    let evil = 0;
    const capacity = (players <= 6 ? 2 : players <= 9 ? 3 : 4) - 1;
    const optional =
      avalonMode === "basic"
        ? []
        : requested.filter((role) => role === "percival" || ++evil <= capacity);
    return { players, avalonMode, optional, lady: params.get("lady") === "1" };
  }
  return {};
}
export function editionParams(
  id: string,
  state: ToolState,
  params = new URLSearchParams(),
) {
  for (const key of keys) params.delete(key);
  params.set("shared", "1");
  if (id === "coup") {
    if (optionsCount(id, state)) params.set("players", String(state.guidePlayers));
    params.set("exchange", state.exchange);
    params.set("reformation", state.reformation ? "1" : "0");
  }
  if (id === "sushi_go_party" && optionsCount(id, state)) params.set("players", String(state.guidePlayers));
  if (id === "skull_king")
    params.set("expansion", state.skullExpansion ? "1" : "0");
  if (id === "avalon") {
    params.set("players", String(state.players));
    params.set("roles", state.avalonMode);
    params.set("optional", [...state.optional].sort().join(","));
    params.set("lady", state.lady ? "1" : "0");
  }
  return params;
}
export function guideHref(
  lang: Language,
  id: string,
  view: View,
  query: string,
  options: ToolState,
  shared: boolean,
  section?: string,
) {
  const params = shared ? editionParams(id, options) : new URLSearchParams();
  if (shared || cleanQuery(query).trim())
    params.set("q", cleanQuery(query).trim());
  return `/${lang}/${id}/${view}/${params.size ? "?" + params : ""}${section ? "#" + encodeURIComponent(section) : ""}`;
}
export function editionLabel(
  id: string,
  game: Game,
  options: ToolState,
  lang: Language,
) {
  const tr = (en: string, es: string) => (lang === "es" ? es : en);
  if (id === "coup")
    return `${optionsCount(id, options) ? `${options.guidePlayers} ${tr("players", "jugadores")} · ` : ""}${tr(options.exchange === "inquisitor" ? "Inquisitor" : "Ambassador", options.exchange === "inquisitor" ? "Inquisidor" : "Embajador")}${options.reformation ? " + Reformation" : ""}`;
  if (id === "skull_king")
    return tr(
      options.skullExpansion ? "Base + Expansion Pack" : "Base box",
      options.skullExpansion ? "Caja base + paquete de expansión" : "Caja base",
    );
  if (id === "avalon")
    return `${options.players} ${tr("players", "jugadores")} · ${tr("Merlin & Assassin", "Merlín y Asesino")}${options.optional.length ? ", " + options.optional.map((role) => ({ percival: "Percival", morgana: "Morgana", mordred: "Mordred", oberon: tr("Oberon", "Oberón") })[role]).join(", ") : ""} · ${tr("Lady of the Lake", "Dama del Lago")}: ${options.lady ? tr("on", "sí") : tr("off", "no")}`;
  if (id === "sushi_go_party" && optionsCount(id, options)) return `${options.guidePlayers} ${tr("players", "jugadores")} · Sushi Go Party!`;
  return game.edition?.[lang] || game.name[lang];
}
export function editionSections(
  id: string,
  game: Game,
  options: ToolState,
): RuleSection[] {
  const sections = [
    ...game.sections,
    ...(id === "skull_king" && options.skullExpansion
      ? game.expansionSections || []
      : []),
  ];
  if (id !== "coup") return sections;
  return sections
    .filter(
      (section) =>
        (section.id !== "reformation" || options.reformation) &&
        (section.id !== "inquisitor" || options.exchange === "inquisitor"),
    )
    .map((section) =>
      section.id === "turn" && options.exchange === "inquisitor"
        ? {
            ...section,
            paragraphs: section.paragraphs.filter(
              (p) => !p.en.startsWith("Ambassador exchange:"),
            ),
          }
        : section,
    );
}
export function canonicalGuideURL(url: URL, id: string) {
  const patch = sharedOptions(id, url.searchParams);
  const params = new URLSearchParams();
  if (patch)
    editionParams(
      id,
      {
        exchange: "ambassador",
        reformation: false,
        skullExpansion: false,
        players: 7,
        avalonMode: "basic",
        optional: [],
        lady: false,
        ...patch,
      },
      params,
    );
  const q = cleanQuery(url.searchParams.get("q") || "");
  if (q || patch) params.set("q", q);
  // Guide URLs accept only guide parameters; fragments are resolved against rule IDs.
  url.search = params.toString();
  return url;
}
