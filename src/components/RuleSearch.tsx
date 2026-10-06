"use client";
import { trapDialogTab } from "@/lib/dialog-focus";
import Link from "next/link";
import { requestRuleFocus, focusRequestedRule } from "@/lib/rule-focus";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { cleanQuery } from "@/lib/guide-link";
import {
  commonQuestions,
  highlightRanges,
  matchingHighlightTerms,
  normalizeRuleText,
  searchRules,
  relatedRuleCards,
} from "@/lib/rule-search";
import type { Language, LessonCard, RuleSection, ToolState, View } from "@/lib/types";
import { Icon } from "./Icon";
import { LessonCardArt } from "./LessonCardArt";
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
  onPreview,
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
  onPreview?: (section: string, opener: HTMLElement) => void;
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
    if (onPreview) {
      event.preventDefault();
      onPreview(section, event.currentTarget);
      return;
    }
    const target = new URL(event.currentTarget.href);
    requestRuleFocus(target.pathname, section);
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
      requestAnimationFrame(focusRequestedRule);
    }
  };
  return (
    <section
      className="rule-search"
      aria-label={tr("Find a rule", "Buscar una regla")}
    >
      <label htmlFor={inputId}>
        {tr("Search rules", "Buscar reglas")}
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
              "Word or phrase…",
              "Palabra o frase…",
            )}
            aria-controls={resultsId}
          />
        </div>
        <button
          type="button"
          id={`rule-search-clear${prefix}`}
          disabled={!query}
          onClick={() => {
            onQuery("");
            input.current?.focus();
          }}
        >
          {tr("Clear", "Borrar")}
        </button>
      </div>
      {shortcuts.length ? (
        <section className="common-questions" aria-labelledby={`common-questions-title${prefix}`}>
          <h3 id={`common-questions-title${prefix}`}>{tr("Common questions", "Preguntas frecuentes")}</h3>
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
        </section>
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
  cards = {},
  edition = "",
  view,
  onShare,
  ...props
}: React.ComponentProps<typeof RuleSearch> & {
  open: boolean;
  onClose: () => void;
  cards?: Record<string, LessonCard>;
  edition?: string;
  view?: View;
  onShare: (section: string) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null),
    selectedRule = useRef(false),
    handledCloses = useRef(0),
    returnFocus = useRef<HTMLElement | null>(null),
    resultFocus = useRef<HTMLElement | null>(null),
    resultScroll = useRef(0),
    inputFocusPending = useRef(false),
    heading = useRef<HTMLHeadingElement>(null),
    tr = (en: string, es: string) => (props.lang === "es" ? es : en);
  const [selected, setSelected] = useState<string>();
  const [keepContent, setKeepContent] = useState(false);
  const section = props.sections.find((item) => item.id === selected);
  const related = section ? relatedRuleCards(section.id, cards, props.options) : [];
  const href = section
    ? props.hrefFor?.(section.id, props.query) || `/${props.lang}/${props.id}/rules/?q=${encodeURIComponent(props.query)}#${section.id}`
    : "";
  useEffect(() => {
    const node = dialog.current;
    if (!node) return;
    if (open) {
      selectedRule.current = false;
      setSelected(undefined);
      returnFocus.current =
        document.activeElement === document.body
          ? document.getElementById("find-rule")
          : (document.activeElement as HTMLElement);
      node.showModal();
      inputFocusPending.current = !!heading.current;
      if (!inputFocusPending.current) node.querySelector<HTMLInputElement>("input")?.focus();
    } else if (node.open) {
      inputFocusPending.current = false;
      handledCloses.current++;
      node.close();
      if (!selectedRule.current) returnFocus.current?.focus({ preventScroll: true });
    }
    const escape = (event: KeyboardEvent) => {
      // Image enlargement and sharing are separate top-layer dialogs. Escape
      // dismisses only the dialog currently holding focus.
      if (open && event.key === "Escape" && document.activeElement?.closest("dialog") === node) {
        event.preventDefault();
        event.stopPropagation();
        handledCloses.current++;
        node.inert = true;
        node.close();
        onClose();
        requestAnimationFrame(() => { if (!node.open && (document.activeElement === document.body || node.contains(document.activeElement))) returnFocus.current?.focus({ preventScroll: true }); });
      }
    };
    document.addEventListener("keydown", escape, true);
    return () => {
      document.removeEventListener("keydown", escape, true);
      if (node.open) { handledCloses.current++; node.close(); }
    };
  }, [open]);
  useEffect(() => {
    if (open) { setKeepContent(true); return; }
    const node = dialog.current;
    const exiting = node?.getAnimations().filter(animation => animation.playState === "running") || [];
    if (!exiting.length) { setKeepContent(false); return; }
    let current = true;
    // Native close already released focus and interaction. Retain only the exit paint.
    Promise.allSettled(exiting.map(animation => animation.finished)).then(() => {
      if (current && !node?.open) setKeepContent(false);
    });
    return () => { current = false; };
  }, [open]);
  useLayoutEffect(() => {
    // Reopening from a preview first reveals the search body, then focuses its input.
    if (open && !section && inputFocusPending.current && dialog.current?.open) {
      inputFocusPending.current = false;
      dialog.current.querySelector<HTMLInputElement>("input")?.focus();
    }
  }, [open, section?.id]);
  useEffect(() => {
    if (section) {
      heading.current?.focus({ preventScroll: true });
      if (dialog.current) dialog.current.scrollTop = 0;
    }
  }, [section?.id]);
  const back = () => {
    setSelected(undefined);
    requestAnimationFrame(() => {
      const activeDialog = document.activeElement?.closest("dialog");
      if (!dialog.current?.open || heading.current || (activeDialog && activeDialog !== dialog.current)) return;
      resultFocus.current?.focus({ preventScroll: true });
      if (dialog.current) dialog.current.scrollTop = resultScroll.current;
    });
  };
  return (
    <dialog
      ref={dialog}
      inert={!open}
      onKeyDown={(event) => trapDialogTab(event.currentTarget, event)}
      id="rule-dialog"
      className="rule-dialog"
      aria-labelledby="rule-dialog-title"
      onCancel={(event) => {
        event.preventDefault();
        handledCloses.current++;
        event.currentTarget.inert = true;
        event.currentTarget.close();
        onClose();
        returnFocus.current?.focus({ preventScroll: true });
      }}
      onClose={(event) => {
        if (handledCloses.current) { handledCloses.current--; return; }
        if (event.currentTarget.open) return;
        onClose();
        if (!selectedRule.current && (document.activeElement === document.body || event.currentTarget.contains(document.activeElement))) returnFocus.current?.focus({ preventScroll: true });
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
          className="dialog-close"
        >
          <span aria-hidden="true">×</span>
          <span>{tr("Close", "Cerrar")}</span>
        </button>
      </div>
      {/* Keep only the exit paint; native close makes it inert immediately. */}
      {open || keepContent ? (
        <>
          <div className="rule-preview-navigation">
            {section ? <button type="button" onClick={back}>{tr("Back to results", "Volver a los resultados")}</button> : null}
            <button type="button" onClick={onClose}>
              {view === "play" ? tr("Back to table", "Volver a la mesa") : tr("Back to guide", "Volver a la guía")}
            </button>
          </div>
          <div hidden={!!section}>
            <RuleSearch {...props} prefix="-dialog" onPreview={(id, opener) => {
              resultFocus.current = opener;
              resultScroll.current = dialog.current?.scrollTop || 0;
              setSelected(id);
            }} />
          </div>
          {section ? (
            <article className="rule-preview" data-rule-preview={section.id} aria-labelledby="rule-preview-title">
              <h3 id="rule-preview-title" ref={heading} tabIndex={-1}>{section.title[props.lang]}</h3>
              {edition ? <p className="muted">{edition}</p> : null}
              <div className="rule-body">
                {section.paragraphs.map((paragraph, i) => <p key={i}>
                  <HighlightedText text={paragraph[props.lang]} query={props.query} id={props.id} lang={props.lang} />
                </p>)}
              </div>
              {related.length ? (
                <section className="rule-preview-cards" aria-labelledby="rule-preview-cards-title">
                  <h4 id="rule-preview-cards-title">{tr("Related cards", "Cartas relacionadas")}</h4>
                  {related.map((card) => (
                    <article className="rule-preview-card" key={card.id} data-rule-card={card.id}>
                      <LessonCardArt id={card.id} art={card.art} lang={props.lang} />
                      <div>
                        <h5>{(card.name || card.art.title)[props.lang]}</h5>
                        <p>{card.effect[props.lang]}</p>
                        <p><strong>{tr("When it matters:", "Cuándo importa:")}</strong> {card.when[props.lang]}</p>
                        {card.note ? <small>{card.note[props.lang]}</small> : null}
                      </div>
                    </article>
                  ))}
                </section>
              ) : null}
              <div className="rule-preview-actions">
                <Link prefetch={false} className="accent-button" href={href} onClick={(event) => {
                  if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
                  selectedRule.current = true;
                  requestRuleFocus(new URL(event.currentTarget.href).pathname, section.id);
                  props.onSelect?.(section.id);
                  onClose();
                }}>{tr("Open full rules", "Abrir reglas completas")}</Link>
                <button type="button" onClick={(event) => {
                  // Safari does not focus buttons on pointer activation. Give the
                  // share dialog an explicit opener so closing returns here.
                  event.currentTarget.focus({ preventScroll: true });
                  onShare(section.id);
                }}>{tr("Share rule", "Compartir regla")}</button>
              </div>
            </article>
          ) : null}
        </>
      ) : null}
    </dialog>
  );
}
