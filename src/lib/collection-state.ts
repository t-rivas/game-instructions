"use client";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import type { Language } from "./types";
export interface Filters {
  query: string;
  players: string;
  duration: string;
  favoritesOnly: boolean;
}
export const emptyFilters: Filters = {
  query: "",
  players: "",
  duration: "",
  favoritesOnly: false,
};
export function parseFilters(params: URLSearchParams): Filters {
  const players = params.get("players") || "",
    duration = params.get("duration") || "";
  return {
    query: (params.get("q") || "")
      .replace(/[\u0000-\u001f\u007f]/g, "")
      .slice(0, 120),
    players: /^(?:[2-9]|10)$/.test(players) ? players : "",
    duration: ["30", "60", "120", "long"].includes(duration) ? duration : "",
    favoritesOnly: params.get("favorites") === "1",
  };
}
export function filterParams(filters: Filters, params = new URLSearchParams()) {
  for (const [key, value] of Object.entries({
    q: filters.query,
    players: filters.players,
    duration: filters.duration,
    favorites: filters.favoritesOnly ? "1" : "",
  })) {
    params.delete(key);
    if (value) params.set(key, value);
  }
  return params;
}
const positionKey = "tablefolk-collection-position-v1";
export function rememberCollection() {
  if (!/^\/(en|es)\/$/.test(location.pathname) && location.pathname !== "/")
    return;
  try {
    const stored = JSON.parse(sessionStorage.getItem(positionKey) || "{}");
    const positions =
      stored.positions && typeof stored.positions === "object"
        ? stored.positions
        : {};
    const entries = Object.entries(positions)
      .filter(
        ([search, y]) =>
          search !== location.search &&
          search.length <= 2048 &&
          typeof y === "number" &&
          Number.isFinite(y) &&
          y >= 0,
      )
      .slice(-19);
    sessionStorage.setItem(
      positionKey,
      JSON.stringify({
        search: location.search,
        y: window.scrollY,
        positions: {
          ...Object.fromEntries(entries),
          [location.search]: window.scrollY,
        },
      }),
    );
  } catch {}
}
function previousCollection(
  search?: string,
): { search: string; y: number } | null {
  try {
    const saved = JSON.parse(sessionStorage.getItem(positionKey) || "null");
    if (
      search !== undefined &&
      saved?.positions &&
      Number.isFinite(saved.positions[search]) &&
      saved.positions[search] >= 0
    )
      return { search, y: saved.positions[search] };
    if (
      saved &&
      typeof saved.search === "string" &&
      saved.search.length <= 2048 &&
      Number.isFinite(saved.y) &&
      saved.y >= 0
    )
      return { search: saved.search, y: saved.y };
  } catch {}
  return null;
}
export function useCollectionReturn(lang: Language) {
  const pathname = usePathname();
  const [href, setHref] = useState(`/${lang}/#collection`);
  useEffect(() => {
    const saved = previousCollection();
    if (saved) {
      const params = filterParams(
        parseFilters(new URLSearchParams(saved.search)),
      );
      setHref(`/${lang}/${params.size ? "?" + params : ""}`);
    } else setHref(`/${lang}/#collection`);
  }, [lang, pathname]);
  return href;
}
export function useCollectionFilters(lang: Language, ready: boolean) {
  const [filters, setFilters] = useState(emptyFilters);
  useEffect(() => {
    const restore = () => {
      const url = new URL(location.href);
      const parsed = parseFilters(url.searchParams);
      setFilters(parsed);
      const canonical = filterParams(parsed, new URLSearchParams(url.search));
      if (canonical.toString() !== url.searchParams.toString())
        history.replaceState(
          history.state,
          "",
          url.pathname + (canonical.size ? "?" + canonical : "") + url.hash,
        );
    };
    restore();
    window.addEventListener("popstate", restore);
    return () => window.removeEventListener("popstate", restore);
  }, [lang]);
  useEffect(() => {
    if (!ready) return;
    const saved = previousCollection(location.search);
    if (saved && saved.search === location.search && !location.hash) {
      let innerFrame = 0;
      const frame = requestAnimationFrame(() => {
        innerFrame = requestAnimationFrame(() =>
          window.scrollTo({ top: saved.y, behavior: "instant" }),
        );
      });
      return () => {
        cancelAnimationFrame(frame);
        cancelAnimationFrame(innerFrame);
      };
    }
  }, [lang, ready, filters]);
  useEffect(() => {
    const save = () => rememberCollection();
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(save);
    };
    window.addEventListener("pagehide", save);
    if (ready) window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pagehide", save);
      window.removeEventListener("scroll", onScroll);
    };
  }, [ready]);
  return [
    filters,
    (patch: Partial<Filters>) => {
      rememberCollection();
      const next = { ...filters, ...patch };
      setFilters(next);
      const url = new URL(location.href),
        params = filterParams(next, url.searchParams);
      const href = url.pathname + (params.size ? "?" + params : "") + url.hash;
      if (href !== location.pathname + location.search + location.hash)
        history.pushState(null, "", href);
      rememberCollection();
    },
  ] as const;
}
