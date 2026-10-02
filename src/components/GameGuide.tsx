"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { loadTools } from "@/lib/tool-client";
import type {
  Artwork,
  Game,
  Language,
  ToolKind,
  ToolRuntime,
  ToolState,
  Translation,
  View,
} from "@/lib/types";
import { Icon } from "./Icon";
import {
  HighlightedText,
  RuleSearch,
  RuleSearchDialog,
  useRuleQuery,
} from "./RuleSearch";
import { SetupChecklist } from "./SetupChecklist";
import { setupSteps } from "@/lib/setup-steps";
import {
  readStored,
  writeStored,
  recentGamesKey,
  savedGamesEvent,
} from "@/lib/browser-storage";
interface GuideProps {
  id: string;
  game: Game;
  lang: Language;
  view: View;
  art: Artwork;
  icons: Record<string, string>;
  tools: Partial<Record<ToolKind, string>>;
}
const defaults: ToolState = {
  exchange: "inquisitor",
  reformation: false,
  skullExpansion: false,
  players: 7,
  avalonMode: "basic",
  optional: [],
  lady: false,
};
const EngineContext = createContext<ToolRuntime | null>(null);
let pendingTabFocus: string | undefined;
function Tool({ kind, initial }: { kind: ToolKind; initial: string }) {
  const runtime = useContext(EngineContext),
    router = useRouter();
  const [html, setHtml] = useState(initial),
    [prepared, setPrepared] = useState<ToolRuntime | null>(null),
    root = useRef<HTMLDivElement>(null),
    open = useRef<string[]>([]);
  useEffect(() => {
    if (!runtime) return;
    const refresh = () => {
      open.current = [
        ...(root.current?.querySelectorAll<HTMLDetailsElement>(
          "details[open][id]",
        ) || []),
      ].map((node) => node.id);
      setHtml(runtime.view(kind));
      setPrepared(runtime);
    };
    refresh();
    return runtime.subscribe(refresh);
  }, [runtime, kind]);
  useLayoutEffect(() => {
    // Saved games can have different controls from the server's fresh setup.
    // Bind only after React has committed the recovered tool markup.
    if (!runtime || prepared !== runtime) return;
    runtime.bind(kind);
    for (const id of open.current) {
      const node = root.current?.querySelector<HTMLDetailsElement>(
        `#${CSS.escape(id)}`,
      );
      if (node) node.open = true;
    }
    root.current?.setAttribute("data-ready", "true");
  }, [html, runtime, prepared, kind]);
  return (
    <div
      ref={root}
      data-tool={kind}
      onClickCapture={(event) => {
        const link = (event.target as Element).closest("a");
        if (
          !link ||
          link.target ||
          link.download ||
          event.ctrlKey ||
          event.metaKey ||
          event.shiftKey ||
          event.altKey
        )
          return;
        const href = link.getAttribute("href");
        if (href?.startsWith("/") && !href.startsWith("//")) {
          event.preventDefault();
          router.push(href);
        }
      }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
function useLessonStep(id: string) {
  const [step, setStep] = useState(0);
  useEffect(() => {
    try {
      const value = Number(sessionStorage.getItem(`tablefolk-lesson-${id}`));
      setStep(Number.isInteger(value) && value >= 0 ? value : 0);
    } catch {}
  }, [id]);
  return [
    step,
    (next: number) => {
      setStep(next);
      try {
        sessionStorage.setItem(`tablefolk-lesson-${id}`, String(next));
      } catch {}
    },
  ] as const;
}
const lessonTitles: Record<string, Translation[]> = {
  coup: [
    { en: "Set the table", es: "Prepara la mesa" },
    { en: "Make your move", es: "Haz tu jugada" },
    { en: "Challenge a character", es: "Desafía un personaje" },
    { en: "Stay in the game", es: "Sigue en la partida" },
    { en: "Change sides", es: "Cambia de bando" },
  ],
  avalon: [
    { en: "Deal secret roles", es: "Reparte personajes" },
    { en: "Propose a team", es: "Propón un equipo" },
    { en: "Vote together", es: "Voten juntos" },
    { en: "Go on the quest", es: "Completen la misión" },
    { en: "Protect Merlin", es: "Protejan a Merlín" },
  ],
  poker: [
    { en: "Cards, chips & blinds", es: "Cartas, fichas y ciegas" },
    { en: "Make your first bet", es: "Haz tu primera apuesta" },
    { en: "Reveal the shared cards", es: "Muestra las cartas compartidas" },
    { en: "Find the winning hand", es: "Encuentra la mano ganadora" },
  ],
  moth: [
    { en: "Meet the guard", es: "Conoce al guardián" },
    { en: "Play your card", es: "Juega tu carta" },
    { en: "Be a little sneaky", es: "Haz una pequeña trampa" },
    { en: "When the guard catches you", es: "Cuando el guardián te descubre" },
  ],
  dixit: [
    { en: "Deal the pictures", es: "Reparte las imágenes" },
    { en: "Give a clue", es: "Da una pista" },
    {
      en: "Find the storyteller’s card",
      es: "Encuentra la carta del narrador",
    },
    { en: "Count the points", es: "Cuenta los puntos" },
    { en: "Start the next round", es: "Empieza la siguiente ronda" },
  ],
};
function Lesson({
  id,
  game,
  lang,
  icons,
  options,
}: {
  id: string;
  game: Game;
  lang: Language;
  icons: Record<string, string>;
  options: ToolState;
}) {
  const runtime = useContext(EngineContext),
    [savedStep, setStep] = useLessonStep(id);
  const tr = (en: string, es: string) => (lang === "es" ? es : en);
  const steps = runtime ? runtime.lessonSteps() : game.basics;
  const titles = lessonTitles[id] || [
    ...(game.lessonTitles || []),
    ...(id === "skull_king" && options.skullExpansion
      ? game.expansionLessonTitles || []
      : []),
  ];
  const step = Math.min(savedStep, steps.length - 1);
  return (
    <section id="basics" className="block">
      <div className="lesson-heading">
        <h2>
          {tr("Learn one move at a time.", "Aprende una jugada a la vez.")}
        </h2>
        <span className="lesson-counter">
          {step + 1} / {steps.length}
        </span>
      </div>
      <div
        className="lesson"
        aria-roledescription={tr("Step-by-step guide", "Guía paso a paso")}
      >
        <div
          className="lesson-dots"
          role="group"
          aria-label={tr("Choose a step", "Elige un paso")}
        >
          {steps.map((_, i) => (
            <button
              key={i}
              id={`lesson-step-${i}`}
              data-step={i}
              aria-label={`${tr("Step", "Paso")} ${i + 1}: ${titles[i]?.[lang] || ""}`}
              aria-current={i === step ? "step" : "false"}
              onClick={() => setStep(i)}
            >
              <span>{i < step ? "✓" : i + 1}</span>
            </button>
          ))}
        </div>
        <div className="lesson-copy" aria-live="polite" aria-atomic="true">
          <span className="eyebrow muted">
            {tr("STEP", "PASO")} {step + 1}
          </span>
          <h3>{titles[step]?.[lang]}</h3>
          <p>{steps[step][lang]}</p>
        </div>
        <div className="lesson-buttons">
          <button
            id="lesson-prev"
            disabled={step === 0}
            onClick={() => setStep(step - 1)}
          >
            <Icon path={icons.back} />
            {tr("Previous", "Anterior")}
          </button>
          {step < steps.length - 1 ? (
            <button
              id="lesson-next"
              className="accent-button"
              onClick={() => setStep(step + 1)}
            >
              {tr("Next step", "Siguiente")}
              <Icon path={icons.arrow} />
            </button>
          ) : (
            <Link
              prefetch={false}
              className="accent-button"
              href={`/${lang}/${id}/play/`}
            >
              {tr("Ready to play", "Listo para jugar")}
              <Icon path={icons.check} />
            </Link>
          )}
        </div>
      </div>
      <details className="lesson-overview" id="lesson-overview">
        <summary>
          {tr("See all steps together", "Ver todos los pasos juntos")}
        </summary>
        <ol className="step-list">
          {steps.map((text, i) => (
            <li key={i}>{text[lang]}</li>
          ))}
        </ol>
      </details>
    </section>
  );
}
function Variants({
  id,
  lang,
  options,
}: {
  id: string;
  lang: Language;
  options: ToolState;
}) {
  const runtime = useContext(EngineContext),
    tr = (en: string, es: string) => (lang === "es" ? es : en);
  const switches =
    id === "coup"
      ? [
          {
            id: "inquisitor-toggle",
            label: tr("Inquisitor variant", "Variante Inquisidor"),
            on: options.exchange === "inquisitor",
            onCopy: tr(
              "On · replaces Ambassador",
              "Activada · reemplaza al Embajador",
            ),
            offCopy: tr(
              "Off · use Ambassador",
              "Desactivada · usa el Embajador",
            ),
            toggle: () =>
              runtime?.update({
                exchange:
                  options.exchange === "inquisitor"
                    ? "ambassador"
                    : "inquisitor",
              }),
          },
          {
            id: "reformation-toggle",
            label: tr("Reformation expansion", "Expansión Reformation"),
            on: options.reformation,
            onCopy: tr(
              "On · adds sides and a coin reserve",
              "Activada · agrega bandos y una reserva de monedas",
            ),
            offCopy: tr(
              "Off · play without this expansion",
              "Desactivada · juega sin esta expansión",
            ),
            toggle: () =>
              runtime?.update({ reformation: !options.reformation }),
          },
        ]
      : id === "skull_king"
        ? [
            {
              id: "skull-expansion-toggle",
              label: tr("Expansion Pack", "Paquete de expansión"),
              on: options.skullExpansion,
              onCopy: tr(
                "On · new cards, powers and scoring",
                "Activado · cartas, poderes y puntos nuevos",
              ),
              offCopy: tr(
                "Off · base box rules",
                "Desactivado · reglas de la caja base",
              ),
              toggle: () =>
                runtime?.update({ skullExpansion: !options.skullExpansion }),
            },
          ]
        : [];
  if (!switches.length) return null;
  return (
    <div
      className="settings coup-variants"
      role="group"
      aria-label={tr("Game options", "Opciones de juego")}
    >
      {switches.map((item) => (
        <button
          key={item.id}
          type="button"
          id={item.id}
          disabled={!runtime}
          className="variant-switch"
          role="switch"
          aria-checked={item.on}
          aria-label={item.label}
          onClick={item.toggle}
        >
          <span className="variant-copy">
            <strong>{item.label}</strong>
            <span>{item.on ? item.onCopy : item.offCopy}</span>
          </span>
          <span className="switch-track" aria-hidden="true">
            <span />
          </span>
        </button>
      ))}
    </div>
  );
}
export function GameGuide({
  id,
  game,
  lang,
  view,
  art,
  icons,
  tools,
}: GuideProps) {
  const router = useRouter(),
    [runtime, setRuntime] = useState<ToolRuntime | null>(null),
    [options, setOptions] = useState<ToolState>(defaults),
    [loadError, setLoadError] = useState(false),
    [retry, setRetry] = useState(0),
    panel = useRef<HTMLElement>(null);
  const [compact, setCompact] = useState(view === "play");
  const [query, onQuery] = useRuleQuery(id, lang),
    [searchOpen, setSearchOpen] = useState(false),
    [focusPlay, setFocusPlay] = useState(false),
    [playStatus, setPlayStatus] = useState<{
      active: boolean;
      storage: boolean;
    } | null>(null);
  const hasPlayTool = [
    "chess",
    "poker",
    "coup",
    "truco",
    "moth",
    "skull_king",
  ].includes(id);
  const tr = (en: string, es: string) => (lang === "es" ? es : en);
  const changeFocus = (enabled: boolean) => {
    setFocusPlay(enabled);
    try {
      sessionStorage.setItem(`tablefolk-focus-play-${id}`, String(enabled));
    } catch {}
    requestAnimationFrame(() => document.getElementById("focus-play")?.focus());
  };
  useEffect(() => {
    try {
      setFocusPlay(
        view === "play" &&
          sessionStorage.getItem(`tablefolk-focus-play-${id}`) === "true",
      );
    } catch {}
  }, [id, view]);
  useEffect(() => {
    const shortcut = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
      }
      if (
        event.key === "Escape" &&
        focusPlay &&
        !document.querySelector("dialog[open]")
      )
        changeFocus(false);
    };
    window.addEventListener("keydown", shortcut);
    return () => window.removeEventListener("keydown", shortcut);
  }, [focusPlay, id]);
  useEffect(() => {
    if (!runtime || view !== "play") return;
    const refresh = () => setPlayStatus(runtime.playStatus());
    refresh();
    window.addEventListener(savedGamesEvent, refresh);
    const interval = window.setInterval(refresh, 1000);
    return () => {
      window.removeEventListener(savedGamesEvent, refresh);
      clearInterval(interval);
    };
  }, [runtime, view]);
  useLayoutEffect(() => {
    if (pendingTabFocus === `/${lang}/${id}/${view}/`) {
      document.getElementById(`tab-${view}`)?.focus();
      pendingTabFocus = undefined;
    }
  }, [id, lang, view]);
  useEffect(() => {
    let cancelled = false,
      unsubscribe: (() => void) | undefined;
    setLoadError(false);
    loadTools()
      .then((engine) => {
        if (cancelled) return;
        engine.setRoute(lang, id, view);
        setRuntime(engine);
        const sync = () =>
          setOptions({ ...engine.state, optional: [...engine.state.optional] });
        sync();
        unsubscribe = engine.subscribe(sync);
      })
      .catch(() => {
        if (!cancelled) setLoadError(true);
      });
    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [id, lang, view, retry]);
  useEffect(() => {
    try {
      const saved = JSON.parse(
          localStorage.getItem("tablefolk-preferences") || "{}",
        ),
        seen = Array.isArray(saved.seen) ? saved.seen : [];
      setCompact(view === "play" || seen.includes(id));
      if (!seen.includes(id))
        localStorage.setItem(
          "tablefolk-preferences",
          JSON.stringify({ ...saved, seen: [...seen, id] }),
        );
      const recent = readStored<unknown>(recentGamesKey, []);
      writeStored(
        recentGamesKey,
        [
          id,
          ...(Array.isArray(recent)
            ? recent.filter((game) => typeof game === "string" && game !== id)
            : []),
        ].slice(0, 6),
      );
    } catch {}
    document.body.classList.toggle("table-mode", view === "play");
    document.body.classList.toggle("centered-guide", view === "learn");
    return () =>
      document.body.classList.remove(
        "table-mode",
        "centered-guide",
        "compact-hero",
      );
  }, [id, view]);
  useEffect(() => {
    document.body.classList.toggle("compact-hero", compact);
  }, [compact]);
  const sections = useMemo(
    () => [
      ...game.sections,
      ...(id === "skull_king" && options.skullExpansion
        ? game.expansionSections || []
        : []),
    ],
    [game, id, options.skullExpansion],
  );
  const [expanded, setExpanded] = useState<Set<string>>(
    () => new Set([game.sections[0].id]),
  );
  useEffect(() => {
    const jump = () => {
      const section = decodeURIComponent(location.hash.slice(1));
      if (section && panel.current?.querySelector(`#${CSS.escape(section)}`)) {
        setExpanded((previous) => new Set([...previous, section]));
        requestAnimationFrame(() =>
          document
            .getElementById(section)
            ?.scrollIntoView({ behavior: "instant" }),
        );
      }
    };
    jump();
    window.addEventListener("hashchange", jump);
    try {
      if (
        view === "rules" &&
        sessionStorage.getItem("tablefolk-print") === id
      ) {
        sessionStorage.removeItem("tablefolk-print");
        setExpanded(new Set(sections.map((section) => section.id)));
        setTimeout(() => window.print(), 200);
      }
    } catch {}
    return () => window.removeEventListener("hashchange", jump);
  }, [id, view, sections]);
  const setup =
    game.sections.find(
      (section) => section.id === "setup" || section.id === "menu",
    ) || game.sections[0];
  const edition =
    id === "skull_king"
      ? tr(
          options.skullExpansion ? "Base + Expansion Pack" : "Base box",
          options.skullExpansion
            ? "Caja base + paquete de expansión"
            : "Caja base",
        )
      : id === "coup"
        ? `${tr(options.exchange === "inquisitor" ? "Inquisitor" : "Ambassador", options.exchange === "inquisitor" ? "Inquisidor" : "Embajador")}${options.reformation ? " + Reformation" : ""}`
        : game.edition?.[lang] || game.name[lang];
  const tabs: [View, string][] = [
    ["learn", tr("Learn", "Aprender")],
    ["play", tr("While playing", "Al jugar")],
    ["rules", tr("Full rules", "Reglas completas")],
  ];
  return (
    <EngineContext.Provider value={runtime}>
      <main
        id="main"
        tabIndex={-1}
        data-focus={view === "play" && focusPlay}
        data-active-tool={playStatus?.active || false}
        data-has-play-tool={hasPlayTool}
        data-route={`/${lang}/${id}/${view}/`}
      >
        <div className="wrap">
          <Link
            prefetch={false}
            className="breadcrumb"
            href={`/${lang}/#collection`}
          >
            <Icon path={icons.back} />
            {tr("Back to the collection", "Volver a la colección")}
          </Link>
          <div className="detail-hero">
            <div className="theme-title">
              <span className="theme-seal" aria-hidden="true">
                <Icon path={icons[game.icon] || icons.book} />
              </span>
              <span className="eyebrow muted">{game.category[lang]}</span>
              <h1>{game.name[lang]}</h1>
              <div className="theme-caption">
                {game.caption?.[lang] || edition}
              </div>
              <p>{game.subtitle[lang]}</p>
              <div className="meta">
                <span>
                  <Icon path={icons.people} />
                  {id === "skull_king" && options.skullExpansion
                    ? "2–9"
                    : game.players}{" "}
                  {tr("players", "jugadores")}
                </span>
                <span>
                  <Icon path={icons.clock} />
                  {game.time} min
                </span>
              </div>
            </div>
            <div className={`detail-cover guide-art-cover ${game.color}`}>
              <>
                {art.officialId ? (
                  <button
                    className="official-cover"
                    data-art={art.officialId}
                    aria-label={tr(
                      "Enlarge game image",
                      "Ampliar imagen del juego",
                    )}
                  >
                    <img
                      src={art.src}
                      alt={art.title[lang]}
                      width={art.width}
                      height={art.height}
                      decoding="async"
                    />
                    <span>{tr("View image ↗", "Ver imagen ↗")}</span>
                  </button>
                ) : (
                  <img
                    className="guide-artwork"
                    src={art.src}
                    alt={tr(
                      `Illustration for ${game.name[lang]}`,
                      `Ilustración de ${game.name[lang]}`,
                    )}
                    width={art.width}
                    height={art.height}
                    decoding="async"
                  />
                )}
              </>
            </div>
          </div>
          <div className="detail-controls">
            <div
              className="tabs"
              role="tablist"
              aria-label={tr("Guide view", "Vista de la guía")}
            >
              {tabs.map(([key, label], i) => (
                <button
                  key={key}
                  id={`tab-${key}`}
                  role="tab"
                  aria-controls="guide-panel"
                  aria-selected={view === key}
                  tabIndex={view === key ? 0 : -1}
                  onClick={() => {
                    pendingTabFocus = undefined;
                    router.push(`/${lang}/${id}/${key}/`);
                  }}
                  onKeyDown={(event) => {
                    if (
                      !["ArrowLeft", "ArrowRight", "Home", "End"].includes(
                        event.key,
                      )
                    )
                      return;
                    event.preventDefault();
                    const next =
                      event.key === "Home"
                        ? 0
                        : event.key === "End"
                          ? 2
                          : (i + (event.key === "ArrowRight" ? 1 : 2)) % 3;
                    if (tabs[next][0] === view) {
                      document.getElementById(`tab-${view}`)?.focus();
                    } else {
                      pendingTabFocus = `/${lang}/${id}/${tabs[next][0]}/`;
                      router.push(pendingTabFocus);
                    }
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
            {!focusPlay ? (
              <button
                type="button"
                className="find-rule-button"
                id="find-rule"
                aria-label={tr("Find a rule", "Buscar una regla")}
                aria-haspopup="dialog"
                aria-controls="rule-dialog"
                onClick={(event) => {
                  event.currentTarget.focus();
                  setSearchOpen(true);
                }}
              >
                <Icon path={icons.search} />
                <span>{tr("Find a rule", "Buscar una regla")}</span>
              </button>
            ) : null}
            <button
              className="print"
              id="print"
              onClick={() => {
                if (view === "rules") {
                  setExpanded(new Set(sections.map((section) => section.id)));
                  setTimeout(() => window.print(), 100);
                } else {
                  try {
                    sessionStorage.setItem("tablefolk-print", id);
                  } catch {}
                  router.push(`/${lang}/${id}/rules/`);
                }
              }}
            >
              <Icon path={icons.print} />
              {tr("Print guide", "Imprimir guía")}
            </button>
          </div>
          <div className="detail-layout">
            {view === "rules" ? (
              <aside className="side-nav">
                <p className="eyebrow">{tr("IN THIS GUIDE", "EN ESTA GUÍA")}</p>
                {sections.map((section) => (
                  <a
                    key={section.id}
                    href={`#${section.id}`}
                    onClick={() =>
                      setExpanded(
                        (previous) => new Set([...previous, section.id]),
                      )
                    }
                  >
                    {section.title[lang]}
                  </a>
                ))}
                <div className="edition muted">
                  {tr("Your edition", "Tu edición")}
                  <br />
                  {edition}
                  <p style={{ marginTop: 10 }}>
                    {tr(
                      "Complete guides in English and Spanish.",
                      "Guías completas en inglés y español.",
                    )}
                  </p>
                </div>
              </aside>
            ) : null}
            <article
              ref={panel}
              id="guide-panel"
              className="content"
              role="tabpanel"
              aria-labelledby={`tab-${view}`}
            >
              {loadError ? (
                <p role="alert">
                  {tr(
                    "Could not load the interactive tools.",
                    "No se pudieron cargar las herramientas interactivas.",
                  )}{" "}
                  <button onClick={() => setRetry((value) => value + 1)}>
                    {tr("Retry", "Reintentar")}
                  </button>
                </p>
              ) : null}
              <Variants id={id} lang={lang} options={options} />
              {view === "learn" ? (
                <>
                  <div id="goal" className="goal-box">
                    <div className="eyebrow">
                      {tr("THE GOAL", "EL OBJETIVO")}
                    </div>
                    <p>{game.goal[lang]}</p>
                  </div>
                  <section
                    id="learn-setup"
                    className="learning-setup block"
                    aria-labelledby="learn-setup-heading"
                  >
                    <span className="eyebrow">
                      {tr("BEFORE THE FIRST TURN", "ANTES DEL PRIMER TURNO")}
                    </span>
                    <h2 id="learn-setup-heading">
                      {tr("Set up the game", "Prepara la partida")}
                    </h2>
                    {id === "avalon" ? (
                      <Tool
                        key={`${id}-${lang}-setup`}
                        kind="setup"
                        initial={tools.setup || ""}
                      />
                    ) : null}
                    <SetupChecklist
                      id={id}
                      lang={lang}
                      ready={!!runtime}
                      steps={setupSteps(id, options)}
                      signature={
                        id === "avalon"
                          ? JSON.stringify([
                              options.players,
                              options.avalonMode,
                              [...options.optional].sort(),
                              options.lady,
                            ])
                          : id === "coup"
                            ? `${options.exchange}-${options.reformation}`
                            : id === "skull_king"
                              ? String(options.skullExpansion)
                              : "base"
                      }
                    />
                    <details className="setup-notes" id="setup-notes">
                      <summary>
                        {tr(
                          "Setup notes & exceptions",
                          "Notas de preparación y excepciones",
                        )}
                      </summary>
                      {setup.paragraphs.map((paragraph, i) => (
                        <p key={i}>{paragraph[lang]}</p>
                      ))}
                      {id === "skull_king" && options.skullExpansion
                        ? game.expansionSections
                            ?.find(
                              (section) => section.id === "expansion-setup",
                            )
                            ?.paragraphs.map((paragraph, i) => (
                              <p key={`exp-${i}`}>{paragraph[lang]}</p>
                            ))
                        : null}
                    </details>
                  </section>
                  <Lesson
                    id={id}
                    game={game}
                    lang={lang}
                    icons={icons}
                    options={options}
                  />
                  <div className="callout">
                    <strong>{tr("Keep in mind.", "Recuerda.")} </strong>
                    {game.reminder[lang]}
                  </div>
                  <section id="helper">
                    <details
                      className="practice-fold feature-fold"
                      id="learning-tools"
                    >
                      <summary>
                        <span className="fold-title">
                          {tr(
                            "Card photos & practice",
                            "Fotos de cartas y práctica",
                          )}
                        </span>
                        <span className="fold-hint">
                          {tr(
                            "Try a decision and see why it works",
                            "Prueba una decisión y descubre por qué funciona",
                          )}
                        </span>
                      </summary>
                      <div className="fold-body">
                        <Tool
                          key={`${id}-${lang}-helper`}
                          kind="helper"
                          initial={tools.helper || ""}
                        />
                      </div>
                    </details>
                  </section>
                  <Link
                    prefetch={false}
                    className="inline-link"
                    href={`/${lang}/${id}/rules/`}
                  >
                    {tr(
                      "Read the full rules & exceptions",
                      "Leer las reglas completas y excepciones",
                    )}
                    <Icon path={icons.arrow} />
                  </Link>
                </>
              ) : (
                <>
                  {view === "rules" ? (
                    <RuleSearch
                      key={id}
                      id={id}
                      lang={lang}
                      sections={sections}
                      icons={icons}
                      query={query}
                      onQuery={onQuery}
                    />
                  ) : null}
                  {view === "play" ? (
                    <>
                      <div className="play-toolbar">
                        <div>
                          <span className="focus-game-name">
                            {game.name[lang]}
                          </span>
                          {hasPlayTool && playStatus ? (
                            <span
                              className={`save-status ${playStatus.storage ? "" : "save-unavailable"}`}
                              role="status"
                            >
                              {playStatus.storage
                                ? tr(
                                    playStatus.active
                                      ? "Saved on this device"
                                      : "Progress saves on this device",
                                    playStatus.active
                                      ? "Guardado en este dispositivo"
                                      : "El progreso se guarda en este dispositivo",
                                  )
                                : tr(
                                    "Saving unavailable · keep this page open",
                                    "No se puede guardar · mantén esta página abierta",
                                  )}
                            </span>
                          ) : null}
                        </div>
                        <div className="play-toolbar-actions">
                          {focusPlay ? (
                            <button
                              type="button"
                              id="find-rule"
                              className="find-rule-button"
                              aria-label={tr("Find a rule", "Buscar una regla")}
                              aria-haspopup="dialog"
                              aria-controls="rule-dialog"
                              onClick={(event) => {
                                event.currentTarget.focus();
                                setSearchOpen(true);
                              }}
                            >
                              <Icon path={icons.search} />
                              <span>
                                {tr("Find a rule", "Buscar una regla")}
                              </span>
                            </button>
                          ) : null}
                          <button
                            type="button"
                            id="focus-play"
                            aria-pressed={focusPlay}
                            onClick={() => changeFocus(!focusPlay)}
                          >
                            <span aria-hidden="true">
                              {focusPlay ? "↙" : "⛶"}
                            </span>
                            {focusPlay
                              ? tr(
                                  "Exit full-screen",
                                  "Salir de pantalla completa",
                                )
                              : tr(
                                  "Full-screen play",
                                  "Jugar en pantalla completa",
                                )}
                          </button>
                        </div>
                      </div>
                      <Tool
                        key={`${id}-${lang}-play`}
                        kind="play"
                        initial={tools.play || ""}
                      />
                    </>
                  ) : (
                    <>
                      <div className="mobile-jump field">
                        <label htmlFor="section-jump">
                          {tr("Jump to a rule", "Ir a una regla")}
                        </label>
                        <select
                          id="section-jump"
                          defaultValue=""
                          onChange={(event) => {
                            if (event.target.value)
                              location.hash = event.target.value;
                          }}
                        >
                          <option value="">
                            {tr("Choose a section…", "Elige una sección…")}
                          </option>
                          {sections.map((section) => (
                            <option key={section.id} value={section.id}>
                              {section.title[lang]}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="section-tools">
                        <h2 style={{ margin: 0 }}>
                          {tr("The complete guide", "La guía completa")}
                        </h2>
                        <button
                          id="expand-all"
                          onClick={() =>
                            setExpanded(
                              expanded.size >= sections.length
                                ? new Set()
                                : new Set(
                                    sections.map((section) => section.id),
                                  ),
                            )
                          }
                        >
                          {expanded.size >= sections.length
                            ? tr("Collapse all", "Cerrar todo")
                            : tr("Expand all", "Abrir todo")}
                        </button>
                      </div>
                      <p className="muted">
                        {tr(
                          "Everything you need, one section at a time. Tap a heading to open it.",
                          "Todo lo que necesitas, sección por sección. Toca un título para abrirlo.",
                        )}
                      </p>
                      {sections.map((section) => (
                        <details
                          className="rule-section"
                          id={section.id}
                          key={section.id}
                          open={expanded.has(section.id)}
                          onToggle={(event) => {
                            const isOpen = event.currentTarget.open;
                            setExpanded((previous) => {
                              if (previous.has(section.id) === isOpen)
                                return previous;
                              const next = new Set(previous);
                              if (isOpen) next.add(section.id);
                              else next.delete(section.id);
                              return next;
                            });
                          }}
                        >
                          <summary>{section.title[lang]}</summary>
                          <div className="rule-body">
                            {section.paragraphs.map((paragraph, i) => (
                              <p key={i}>
                                <HighlightedText
                                  text={paragraph[lang]}
                                  query={query}
                                />
                              </p>
                            ))}
                          </div>
                        </details>
                      ))}
                      <section id="helper" style={{ marginTop: 32 }}>
                        <Tool
                          key={`${id}-${lang}-helper`}
                          kind="helper"
                          initial={tools.helper || ""}
                        />
                      </section>
                    </>
                  )}
                </>
              )}
              <Tool
                key={`${id}-${lang}-sources`}
                kind="sources"
                initial={tools.sources || ""}
              />
            </article>
          </div>
        </div>
        <RuleSearchDialog
          open={searchOpen}
          onClose={() => setSearchOpen(false)}
          id={id}
          lang={lang}
          sections={sections}
          icons={icons}
          query={query}
          onQuery={onQuery}
        />
      </main>
    </EngineContext.Provider>
  );
}
