"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Language, RuleSection } from "@/lib/types";
import { Icon } from "./Icon";
export const normalizeRuleText = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
export function useRuleQuery(id: string, lang: Language) {
  const [query, setQuery] = useState(""),
    key = `tablefolk-rule-search-${lang}-${id}`;
  useEffect(() => {
    const restore = () => {
      const sharedQuery = new URLSearchParams(location.search).get("q");
      try {
        if (sharedQuery !== null) sessionStorage.setItem(key, sharedQuery);
        setQuery(sharedQuery ?? sessionStorage.getItem(key) ?? "");
      } catch {
        setQuery(sharedQuery || "");
      }
    };
    restore();
    window.addEventListener("popstate", restore);
    return () => window.removeEventListener("popstate", restore);
  }, [key]);
  return [
    query,
    (value: string) => {
      setQuery(value);
      try {
        sessionStorage.setItem(key, value);
      } catch {}
      const url = new URL(location.href);
      if (url.searchParams.has("q")) {
        if (value) url.searchParams.set("q", value);
        else url.searchParams.delete("q");
        history.replaceState(
          history.state,
          "",
          url.pathname + url.search + url.hash,
        );
      }
    },
  ] as const;
}
export function HighlightedText({
  text,
  query,
}: {
  text: string;
  query: string;
}) {
  const q = normalizeRuleText(query.trim());
  if (!q) return text;
  const normalized = normalizeRuleText(text),
    pieces: React.ReactNode[] = [];
  let start = 0,
    index = normalized.indexOf(q);
  while (index >= 0) {
    pieces.push(
      text.slice(start, index),
      <mark key={index}>{text.slice(index, index + q.length)}</mark>,
    );
    start = index + q.length;
    index = normalized.indexOf(q, start);
  }
  pieces.push(text.slice(start));
  return <>{pieces}</>;
}
export function RuleSearch({
  id,
  lang,
  sections,
  icons,
  query,
  onQuery,
  onSelect,
  prefix = "",
}: {
  id: string;
  lang: Language;
  sections: RuleSection[];
  icons: Record<string, string>;
  query: string;
  onQuery: (value: string) => void;
  onSelect?: () => void;
  prefix?: string;
}) {
  const input = useRef<HTMLInputElement>(null),
    tr = (en: string, es: string) => (lang === "es" ? es : en),
    q = normalizeRuleText(query.trim());
  const inputId = `rule-search${prefix}`,
    resultsId = `rule-search-results${prefix}`;
  const matches = q
    ? sections.filter((section) =>
        [section.title[lang], ...section.paragraphs.map((p) => p[lang])].some(
          (text) => normalizeRuleText(text).includes(q),
        ),
      )
    : [];
  return (
    <section
      className="rule-search"
      aria-label={tr("Find a rule", "Buscar una regla")}
    >
      <label htmlFor={inputId}>
        {tr("Search this game’s rules", "Buscar en las reglas de este juego")}
      </label>
      <div className="rule-search-controls">
        <div className="search">
          <Icon path={icons.search} />
          <input
            ref={input}
            id={inputId}
            type="search"
            value={query}
            onChange={(event) => onQuery(event.target.value)}
            placeholder={tr(
              "Search a word or phrase…",
              "Busca una palabra o frase…",
            )}
            aria-controls={resultsId}
          />
        </div>
        <button
          type="button"
          id={`rule-search-clear${prefix}`}
          onClick={() => {
            onQuery("");
            input.current?.focus();
          }}
        >
          {tr("Clear", "Borrar")}
        </button>
      </div>
      <div id={resultsId} hidden={!q}>
        <p className="muted" role="status" aria-atomic="true">
          {matches.length
            ? tr(
                `${matches.length} matching sections`,
                `${matches.length} secciones encontradas`,
              )
            : tr(
                "No rules found. Try another term.",
                "No se encontraron reglas. Prueba otro término.",
              )}
        </p>
        {matches.map((section) => {
          const text = (section.paragraphs.find((p) =>
              normalizeRuleText(p[lang]).includes(q),
            ) || section.paragraphs[0])[lang],
            index = Math.max(0, normalizeRuleText(text).indexOf(q)),
            start = Math.max(0, index - 60),
            end = Math.min(
              text.length,
              Math.max(start + 220, index + q.length),
            );
          return (
            <Link
              key={section.id}
              prefetch={false}
              className="rule-search-result"
              href={`/${lang}/${id}/rules/?q=${encodeURIComponent(query.trim())}#${section.id}`}
              onClick={onSelect}
            >
              <strong>
                <HighlightedText text={section.title[lang]} query={query} />
              </strong>
              <span>
                {start ? "…" : ""}
                <HighlightedText text={text.slice(start, end)} query={query} />
                {end < text.length ? "…" : ""}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
export function RuleSearchDialog({
  open,
  onClose,
  ...props
}: React.ComponentProps<typeof RuleSearch> & {
  open: boolean;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null),
    returnFocus = useRef<HTMLElement | null>(null),
    tr = (en: string, es: string) => (props.lang === "es" ? es : en);
  useEffect(() => {
    const node = dialog.current;
    if (!node) return;
    if (open) {
      returnFocus.current =
        document.activeElement === document.body
          ? document.getElementById("find-rule")
          : (document.activeElement as HTMLElement);
      node.showModal();
      node.querySelector<HTMLInputElement>("input")?.focus();
    } else if (node.open) {
      node.close();
      returnFocus.current?.focus();
    }
    const escape = (event: KeyboardEvent) => {
      if (open && event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        node.close();
        onClose();
        requestAnimationFrame(() => returnFocus.current?.focus());
      }
    };
    document.addEventListener("keydown", escape, true);
    return () => {
      document.removeEventListener("keydown", escape, true);
      if (node.open) node.close();
    };
  }, [open]);
  return (
    <dialog
      ref={dialog}
      id="rule-dialog"
      className="rule-dialog"
      aria-labelledby="rule-dialog-title"
      onCancel={() => {
        onClose();
        returnFocus.current?.focus();
      }}
      onClose={() => {
        onClose();
        returnFocus.current?.focus();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="dialog-heading">
        <h2 id="rule-dialog-title">{tr("Find a rule", "Buscar una regla")}</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label={tr("Close rule search", "Cerrar búsqueda de reglas")}
        >
          ×
        </button>
      </div>
      {open ? (
        <RuleSearch
          {...props}
          prefix="-dialog"
          onSelect={() => {
            dialog.current?.close();
            onClose();
          }}
        />
      ) : null}
    </dialog>
  );
}
