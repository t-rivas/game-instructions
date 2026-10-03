"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { cleanQuery } from "@/lib/guide-link";
import {
  commonQuestions,
  highlightRanges,
  matchingHighlightTerms,
  normalizeRuleText,
  searchRules,
} from "@/lib/rule-search";
import type { Language, RuleSection, ToolState } from "@/lib/types";
import { Icon } from "./Icon";
export function useRuleQuery(id: string, lang: Language) {
  const [query, setQuery] = useState(""),
    key = `tablefolk-rule-search-${lang}-${id}`;
  useEffect(() => {
    const restore = () => {
      const rawQuery = new URLSearchParams(location.search).get("q");
      const sharedQuery = rawQuery === null ? null : cleanQuery(rawQuery);
      try {
        if (sharedQuery !== null) sessionStorage.setItem(key, sharedQuery);
        setQuery(
          cleanQuery(
            sharedQuery ??
              sessionStorage.getItem(key) ??
              sessionStorage.getItem(
                `tablefolk-rule-search-${lang === "en" ? "es" : "en"}-${id}`,
              ) ??
              "",
          ),
        );
      } catch {
        setQuery(sharedQuery || "");
      }
    };
    restore();
    window.addEventListener("popstate", restore);
    window.addEventListener("tablefolk-guide-location", restore);
    return () => {
      window.removeEventListener("popstate", restore);
      window.removeEventListener("tablefolk-guide-location", restore);
    };
  }, [key]);
  return [
    query,
    (value: string) => {
      value = cleanQuery(value);
      setQuery(value);
      try {
        sessionStorage.setItem(key, value);
      } catch {}
      const url = new URL(location.href);
      if (url.searchParams.has("q")) {
        if (value || url.searchParams.get("shared") === "1")
          url.searchParams.set("q", value);
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
  id = "",
  lang = "en",
  terms,
}: {
  text: string;
  query: string;
  id?: string;
  lang?: Language;
  terms?: string[];
}) {
  const ranges = highlightRanges(
    text,
    terms || matchingHighlightTerms(id, text, query, lang),
  );
  if (!ranges.length) return text;
  const pieces: React.ReactNode[] = [];
  let start = 0;
  for (const [from, to] of ranges) {
    pieces.push(
      text.slice(start, from),
      <mark key={from}>{text.slice(from, to)}</mark>,
    );
    start = to;
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
  options,
  hrefFor,
}: {
  id: string;
  lang: Language;
  sections: RuleSection[];
  icons: Record<string, string>;
  query: string;
  onQuery: (value: string) => void;
  onSelect?: (section?: string) => void;
  prefix?: string;
  options?: ToolState;
  hrefFor?: (section: string, query: string) => string;
}) {
  const input = useRef<HTMLInputElement>(null),
    tr = (en: string, es: string) => (lang === "es" ? es : en),
    q = normalizeRuleText(query.trim());
  const inputId = `rule-search${prefix}`,
    resultsId = `rule-search-results${prefix}`;
  const matches = searchRules(id, sections, query, lang);
  const shortcuts = commonQuestions(id, sections, options);
  const select = (
    event: React.MouseEvent<HTMLAnchorElement>,
    section: string,
  ) => {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey)
      return;
    const target = new URL(event.currentTarget.href);
    onSelect?.(section);
    if (
      target.origin === location.origin &&
      target.pathname === location.pathname
    ) {
      // Same-guide search changes the address and section without fetching the page again.
      event.preventDefault();
      if (target.href !== location.href)
        history.pushState(
          history.state,
          "",
          target.pathname + target.search + target.hash,
        );
      window.dispatchEvent(new Event("tablefolk-guide-location"));
      requestAnimationFrame(() =>
        document
          .getElementById(section)
          ?.scrollIntoView({ behavior: "instant" }),
      );
    }
  };
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
            maxLength={120}
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
      {shortcuts.length ? (
        <details className="common-questions">
          <summary>{tr("Common questions", "Preguntas frecuentes")}</summary>
          <ul>
            {shortcuts.map((item) => (
              <li key={item.section}>
                <Link
                  prefetch={false}
                  href={
                    hrefFor
                      ? hrefFor(item.section, item.query)
                      : `/${lang}/${id}/rules/?q=${encodeURIComponent(item.query)}#${item.section}`
                  }
                  onClick={(event) => {
                    if (
                      !event.ctrlKey &&
                      !event.metaKey &&
                      !event.shiftKey &&
                      !event.altKey
                    )
                      onQuery(item.query);
                    select(event, item.section);
                  }}
                >
                  {item.label[lang]}
                </Link>
              </li>
            ))}
          </ul>
        </details>
      ) : null}
      <div id={resultsId} data-query={query} hidden={!q}>
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
        {matches.map(({ section, paragraph, terms, approximate }) => {
          const text = paragraph[lang];
          const ranges = highlightRanges(text, terms);
          const index = ranges[0]?.[0] || 0,
            start = Math.max(0, index - 60),
            end = Math.min(
              text.length,
              Math.max(
                start + 220,
                index + (ranges[0] ? ranges[0][1] - ranges[0][0] : 0),
              ),
            );
          return (
            <Link
              key={section.id}
              prefetch={false}
              className="rule-search-result"
              href={
                hrefFor
                  ? hrefFor(section.id, query)
                  : `/${lang}/${id}/rules/?q=${encodeURIComponent(query.trim())}#${section.id}`
              }
              onClick={(event) => select(event, section.id)}
            >
              <strong>
                <HighlightedText
                  text={section.title[lang]}
                  query={query}
                  id={id}
                  lang={lang}
                  terms={terms}
                />
              </strong>
              {approximate ? (
                <small>
                  {tr(
                    "Close spelling match",
                    "Coincidencia de escritura similar",
                  )}
                </small>
              ) : null}
              <span>
                {start ? "…" : ""}
                <HighlightedText
                  text={text.slice(start, end)}
                  query={query}
                  id={id}
                  lang={lang}
                  terms={terms}
                />
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
          onSelect={(section) => {
            props.onSelect?.(section);
            dialog.current?.close();
            onClose();
          }}
        />
      ) : null}
    </dialog>
  );
}
