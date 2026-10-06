"use client";
import { GuideSetupContext } from "./GuideSetupContext";
import { contextualBasics } from "@/generated/setup-context";
import { focusRequestedRule } from "@/lib/rule-focus";
import { ShareDialog } from "./ShareDialog";
import { TableControls } from "./TableControls";
import {
  canonicalGuideURL,
  editionParams,
  editionLabel,
  editionSections,
  guideHref,
  sharedOptions,
} from "@/lib/guide-link";
import { useCollectionReturn } from "@/lib/collection-state";
import { ScoringExample } from "./ScoringExample";
import { SkullTrickLesson } from "./SkullTrickLesson";
import { CoupLesson } from "./CoupLesson";
import { AvalonLesson } from "./AvalonLesson";
import { ResponsiveImage } from "./ResponsiveImage";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Suspense,
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
  LessonCardTeaching,
  ToolKind,
  ToolRuntime,
  ToolState,
  View,
} from "@/lib/types";
import { Icon } from "./Icon";
import {
  HighlightedText,
  RuleSearch,
  RuleSearchDialog,
  useRuleQuery,
} from "./RuleSearch";
import { LearningSequence } from "./LearningSequence";
import { SetupChecklist } from "./SetupChecklist";
import { setupSteps } from "@/lib/setup-steps";
import {
  readStored,
  writeStored,
  recentGamesKey,
  savedGamesEvent,
  markGameActivity,
  recordGameVisit,
} from "@/lib/browser-storage";
interface GuideProps {
  id: string;
  game: Game;
  lang: Language;
  view: View;
  art: Artwork;
  icons: Record<string, string>;
  tools: Partial<Record<ToolKind, string>>;
  cardTeaching: LessonCardTeaching;
}
const defaults: ToolState = {
  exchange: "ambassador",
  reformation: false,
  skullExpansion: false,
  players: 7,
  avalonMode: "basic",
  optional: [],
  lady: false,
};
const EngineContext = createContext<ToolRuntime | null>(null);
let pendingTabFocus: string | undefined;
// Only this observer needs query parameters; the guide itself remains prerendered.
function GuideLocation() {
  const params = useSearchParams().toString();
  useEffect(() => {
    window.dispatchEvent(new Event("tablefolk-guide-location"));
  }, [params]);
  return null;
}
function Tool({ kind, initial, onTableJump }: {
  kind: ToolKind;
  initial: string;
  onTableJump?: (tool: boolean) => void;
}) {
  const runtime = useContext(EngineContext),
    router = useRouter();
  const [html, setHtml] = useState(() =>
      runtime ? runtime.view(kind) : initial,
    ),
    [prepared, setPrepared] = useState<ToolRuntime | null>(runtime),
    root = useRef<HTMLDivElement>(null),
    open = useRef<string[]>([]),
    resumeFocused = useRef(false);
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
    // Recovery replaces the SSR markup. Resume must focus the bound controls,
    // rather than a heading that is about to be detached by that replacement.
    if (kind === "play" && !resumeFocused.current && location.hash === "#active-table-tool") {
      resumeFocused.current = true;
      const tool = root.current?.querySelector<HTMLElement>("#active-table-tool");
      let fullScreen = false;
      try {
        fullScreen = sessionStorage.getItem(`tablefolk-focus-play-${runtime.state.game}`) === "true";
      } catch {}
      const focus = tool?.querySelector<HTMLElement>(fullScreen
        ? "button:not(:disabled), input, select" : "#active-table-tool-heading");
      tool?.scrollIntoView({ block: "start" });
      focus?.focus({ preventScroll: true });
    }
  }, [html, runtime, prepared, kind]);
  useEffect(() => {
    if (kind !== "play" || !root.current) return;
    const node = root.current;
    const fitTime = () => {
      node
        .querySelectorAll<HTMLElement>(
          "#chess-clock-time-0, #chess-clock-time-1, #poker-timer-time",
        )
        .forEach((time) => {
          const length = String(Math.max(1, time.textContent?.length || 4));
          if (time.style.getPropertyValue("--clock-length") !== length)
            time.style.setProperty("--clock-length", length);
        });
    };
    fitTime();
    const observer = new MutationObserver(fitTime);
    observer.observe(node, {
      subtree: true,
      childList: true,
      characterData: true,
    });
    return () => observer.disconnect();
  }, [kind]);
  return (
    <div
      ref={root}
      data-tool={kind}
      id={kind === "play" ? "play-tools" : undefined}
      onInputCapture={() => {
        if (kind === "play" && runtime)
          markGameActivity(runtime.state.game as string);
      }}
      onClickCapture={(event) => {
        const jump = (event.target as Element).closest("#jump-to-tool, #back-to-reference");
        if (jump && onTableJump) {
          event.preventDefault();
          event.stopPropagation();
          onTableJump(jump.id === "jump-to-tool");
          return;
        }
        if (
          kind === "play" &&
          runtime &&
          (event.target as Element).closest("button, input, select")
        )
          markGameActivity(runtime.state.game as string);
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
          const url = new URL(href, location.origin);
          const route = url.pathname.match(
            /^\/(en|es)\/([^/]+)\/(learn|play|rules)\/$/,
          );
          if (
            runtime &&
            route &&
            route[2] === runtime.state.game &&
            new URLSearchParams(location.search).get("shared") === "1"
          ) {
            router.push(
              guideHref(
                route[1] as Language,
                route[2],
                route[3] as View,
                new URLSearchParams(location.search).get("q") || "",
                runtime.state,
                true,
                url.hash.slice(1),
              ),
            );
          } else router.push(href);
        }
      }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
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
function AvalonSetup({
  onContinue,
  lang,
  options,
  tools,
  ready,
  shared = false,
  readyHref,
}: {
  lang: Language;
  options: ToolState;
  tools: Partial<Record<ToolKind, string>>;
  ready: boolean;
  shared?: boolean;
  readyHref: string;
  onContinue: () => void;
}) {
  const stepKey = shared
    ? "tablefolk-shared-avalon-step"
    : "tablefolk-avalon-step";
  const [step, setStep] = useState(0),
    heading = useRef<HTMLHeadingElement>(null),
    pendingHeadingFocus = useRef(false);
  const tr = (en: string, es: string) => (lang === "es" ? es : en);
  useEffect(() => {
    try {
      const saved = Number(sessionStorage.getItem(stepKey));
      if ([0, 1, 2].includes(saved)) setStep(saved);
    } catch {}
  }, [stepKey]);
  const titles = [
    tr("Choose players and roles", "Elige jugadores y personajes"),
    tr("Prepare and deal", "Prepara y reparte"),
    tr("Read the opening script", "Lee el guion inicial"),
  ];
  const kinds: ToolKind[] = ["setup-roles", "setup-components", "setup-script"];
  useLayoutEffect(() => {
    if (pendingHeadingFocus.current) {
      pendingHeadingFocus.current = false;
      heading.current?.focus();
    }
  }, [step]);
  const changeStep = (next: number) => {
    if (next === step) heading.current?.focus();
    else {
      pendingHeadingFocus.current = true;
      setStep(next);
    }
    try {
      sessionStorage.setItem(stepKey, String(next));
    } catch {}
  };
  const steps = [
    ...setupSteps("avalon", options),
    {
      en: "Confirm the player count, selected roles and Lady of the Lake option.",
      es: "Confirma la cantidad de jugadores, los personajes y la opción de la Dama del Lago.",
    },
  ];
  return (
    <div className="avalon-flow">
      <nav
        aria-label={tr("Setup steps", "Pasos de preparación")}
        className="avalon-step-nav"
      >
        {titles.map((title, i) => (
          <button
            type="button"
            id={`avalon-step-${i}`}
            key={i}
            aria-current={step === i ? "step" : undefined}
            onClick={() => changeStep(i)}
          >
            <span>{i + 1}</span>
            {title}
          </button>
        ))}
      </nav>
      <h3 ref={heading} tabIndex={-1} className="avalon-step-title">
        {step + 1} / 3 · {titles[step]}
      </h3>
      <div className="avalon-step-layout">
        <Tool
          key={`${lang}-${kinds[step]}`}
          kind={kinds[step]}
          initial={tools[kinds[step]] || ""}
        />
        <SetupChecklist
          id="avalon"
          temporary={shared}
          readyHref={readyHref}
          onContinue={onContinue}
          lang={lang}
          ready={ready}
          steps={steps}
          activeIndices={step === 0 ? [3] : step === 1 ? [0, 1] : [2]}
          showActions={step === 2}
          signature={JSON.stringify([
            options.players,
            options.avalonMode,
            [...options.optional].sort(),
            options.lady,
          ])}
        />
      </div>
      <div className="lesson-buttons">
        <button
          type="button"
          id="avalon-prev"
          disabled={step === 0}
          onClick={() => changeStep(step - 1)}
        >
          {tr("Previous", "Anterior")}
        </button>
        {step < 2 ? (
          <button
            type="button"
            id="avalon-next"
            className="accent-button"
            onClick={() => changeStep(step + 1)}
          >
            {tr("Next step", "Siguiente")}
          </button>
        ) : null}
      </div>
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
  cardTeaching,
}: GuideProps) {
  const collectionHref = useCollectionReturn(lang);
  const router = useRouter(),
    [runtime, setRuntime] = useState<ToolRuntime | null>(null),
    [options, setOptions] = useState<ToolState>(defaults),
    [loadError, setLoadError] = useState(false),
    [retry, setRetry] = useState(0),
    panel = useRef<HTMLElement>(null);
  const [shared, setShared] = useState(false),
    [sharing, setSharing] = useState<string | null | undefined>(),
    [opponentFacing, setOpponentFacing] = useState(false),
    [showHelp, setShowHelp] = useState(false);
  useEffect(() => {
    try {
      setOpponentFacing(
        sessionStorage.getItem("tablefolk-chess-orientation") === "opponent",
      );
    } catch {}
  }, []);
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
    if (enabled) setShowHelp(false);
    try {
      sessionStorage.setItem(`tablefolk-focus-play-${id}`, String(enabled));
    } catch {}
    requestAnimationFrame(() => document.getElementById("focus-play")?.focus());
  };
  useEffect(() => {
    if (!runtime) return;
    try {
      // A stale full-screen preference must not hide a fresh game's reference.
      // Active sessions and explicit tool bookmarks retain the saved preference.
      setFocusPlay(
        view === "play" &&
          sessionStorage.getItem(`tablefolk-focus-play-${id}`) === "true" &&
          (runtime.playStatus().active || location.hash === "#active-table-tool"),
      );
    } catch {}
  }, [id, view, runtime]);
  useEffect(() => {
    const shortcut = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        if (!document.querySelector("dialog[open]")) setSearchOpen(true);
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
    loadTools(id)
      .then((engine) => {
        if (cancelled) return;
        let previousChoices: string | undefined;
        const route = () => {
          const url = new URL(location.href);
          const patch = sharedOptions(id, url.searchParams);
          const choicesKey = JSON.stringify(patch);
          if (choicesKey !== previousChoices) {
            previousChoices = choicesKey;
            setShared(patch !== null);
            engine.setRoute(lang, id, view, patch);
          }
          const canonical = canonicalGuideURL(url, id);
          let hash = "";
          try {
            hash = decodeURIComponent(canonical.hash.slice(1));
          } catch {}
          const valid = [
            ...editionSections(id, game, engine.state).map(
              (section) => section.id,
            ),
            "basics",
            "goal",
            "helper",
            "learn-setup",
            "setup-notes",
            ...(cardTeaching.scoring ? ["scoring-example"] : []),
            ...(cardTeaching.tricks ? ["skull-trick-lesson"] : []),
            ...(cardTeaching.coup ? ["coup-lesson"] : []),
            ...(cardTeaching.avalon ? ["avalon-lesson"] : []),
            "learning-tools",
            "chess-clock",
            "poker-timer",
            "table-sheet",
            "active-table-tool",
          ];
          if (canonical.hash && !valid.includes(hash)) canonical.hash = "";
          if (canonical.href !== location.href)
            history.replaceState(
              history.state,
              "",
              canonical.pathname + canonical.search + canonical.hash,
            );
        };
        route();
        window.addEventListener("popstate", route);
        window.addEventListener("tablefolk-guide-location", route);
        setRuntime(engine);
        const sync = () =>
          setOptions({ ...engine.state, optional: [...engine.state.optional] });
        sync();
        const stop = engine.subscribe(sync);
        unsubscribe = () => {
          stop();
          window.removeEventListener("popstate", route);
          window.removeEventListener("tablefolk-guide-location", route);
        };
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
    recordGameVisit(`${id}/${view}`);
    try {
      const saved = JSON.parse(
          localStorage.getItem("tablefolk-preferences") || "{}",
        ),
        seen = Array.isArray(saved.seen) ? saved.seen : [];
      setCompact(view === "play" || seen.includes(id));
      if (
        !sharedOptions(id, new URLSearchParams(location.search)) &&
        !seen.includes(id)
      )
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
    () => (runtime ? editionSections(id, game, options) : game.sections),
    [
      game,
      id,
      !!runtime,
      options.skullExpansion,
      options.exchange,
      options.reformation,
    ],
  );
  useEffect(() => {
    if (!runtime || !shared) return;
    const url = new URL(location.href);
    // A temporary option change must also be reflected in the address being shared.
    if (url.searchParams.get("shared") !== "1") return;
    editionParams(id, options, url.searchParams);
    if (url.href !== location.href)
      history.replaceState(
        history.state,
        "",
        url.pathname + url.search + url.hash,
      );
  }, [
    runtime,
    shared,
    id,
    options.exchange,
    options.reformation,
    options.skullExpansion,
    options.players,
    options.guidePlayers,
    options.avalonMode,
    options.optional.join(","),
    options.lady,
  ]);
  const [expanded, setExpanded] = useState<Set<string>>(
    () => new Set([game.sections[0].id]),
  );
  const lastFragment = useRef<string | undefined>(undefined);
  useLayoutEffect(() => {
    focusRequestedRule();
  }, [expanded, searchOpen, id, lang, view]);
  useEffect(() => {
    const jump = () => {
      if (lastFragment.current === location.hash) return;
      let section = "";
      try {
        section = decodeURIComponent(location.hash.slice(1));
      } catch {}
      if (!section) lastFragment.current = location.hash;
      if (section && panel.current?.querySelector(`#${CSS.escape(section)}`)) {
        lastFragment.current = location.hash;
        const target = document.getElementById(section);
        if (target instanceof HTMLDetailsElement) target.open = true;
        setExpanded((previous) => new Set([...previous, section]));
        requestAnimationFrame(() => {
          target?.scrollIntoView({ behavior: "instant" });
          if (section === "active-table-tool") {
            const heading = document.getElementById("active-table-tool-heading");
            const focus = heading?.getClientRects().length ? heading
              : target?.querySelector<HTMLElement>("button:not(:disabled), input, select");
            focus?.focus({ preventScroll: true });
          }
        });
      }
    };
    jump();
    window.addEventListener("hashchange", jump);
    window.addEventListener("popstate", jump);
    window.addEventListener("tablefolk-guide-location", jump);
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
    return () => {
      window.removeEventListener("hashchange", jump);
      window.removeEventListener("popstate", jump);
      window.removeEventListener("tablefolk-guide-location", jump);
    };
  }, [id, view, sections]);
  const setup =
    game.sections.find(
      (section) => section.id === "setup" || section.id === "menu",
    ) || game.sections[0];
  const edition = editionLabel(id, game, options, lang);
  const navHref = (
    next: View,
    section?: string,
    search = shared ? query : "",
  ) => guideHref(lang, id, next, search, options, shared, section);
  const searchHref = (section: string, search: string) =>
    guideHref(
      lang,
      id,
      "rules",
      search,
      options,
      shared || ["coup", "skull_king", "avalon", "sushi_go_party"].includes(id),
      section,
    );
  const tabs: [View, string][] = [
    ["learn", tr("Learn", "Aprender")],
    ["play", tr("While playing", "Al jugar")],
    ["rules", tr("Full rules", "Reglas completas")],
  ];
  return (
    <EngineContext.Provider value={runtime}>
      <Suspense fallback={null}>
        <GuideLocation />
      </Suspense>
      <main
        id="main"
        tabIndex={-1}
        data-focus={view === "play" && focusPlay}
        data-help={showHelp}
        data-clock-facing={opponentFacing ? "opponent" : "same"}
        data-shared={shared}
        data-active-tool={playStatus?.active || false}
        data-has-play-tool={hasPlayTool}
        data-route={`/${lang}/${id}/${view}/`}
      >
        <div className="wrap">
          <Link prefetch={false} className="breadcrumb" href={collectionHref}>
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
                    <ResponsiveImage
                      sizes="(max-width: 680px) 68px, (max-width: 1000px) 35vw, 450px"
                      src={art.src}
                      alt={art.title[lang]}
                      width={art.width}
                      height={art.height}
                      decoding="async"
                    />
                    <span>{tr("View image ↗", "Ver imagen ↗")}</span>
                  </button>
                ) : (
                  <ResponsiveImage
                    sizes="(max-width: 680px) 68px, (max-width: 1000px) 35vw, 450px"
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
                    router.push(navHref(key));
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
                      router.push(navHref(tabs[next][0]));
                    }
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
            <button
              type="button"
              id="share-guide"
              className="share-button"
              aria-haspopup="dialog"
              aria-controls="share-dialog"
              onClick={(event) => {
                event.currentTarget.focus();
                setSharing(null);
              }}
            >
              {tr("Share guide", "Compartir guía")}
            </button>
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
                  router.push(navHref("rules"));
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
              {shared ? (
                <p className="shared-edition" role="status">
                  <strong>
                    {tr("Shared edition", "Edición compartida")}: {edition}
                  </strong>
                  <br />
                  {tr(
                    "These guide choices are temporary. Your saved setup and games are unchanged.",
                    "Estas opciones de la guía son temporales. Tu preparación y tus partidas guardadas siguen iguales.",
                  )}
                </p>
              ) : null}
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
              <GuideSetupContext id={id} game={game} lang={lang} options={options} ready={!!runtime} onChange={(guidePlayers) => runtime?.update({guidePlayers})} />
              {view === "learn" ? (
                <>
                  <LearningSequence
                    id={id} game={game} lang={lang} options={options}
                    steps={runtime ? runtime.lessonSteps() : contextualBasics(id, game.basics, options)}
                    temporary={shared} ready={!!runtime} cardTeaching={cardTeaching}
                    readyHref={navHref("play")} ruleHref={(section) => navHref("rules", section)}
                    setup={(onContinue) => (
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
                          <AvalonSetup
                            lang={lang}
                            options={options}
                            tools={tools}
                            ready={!!runtime}
                            shared={shared}
                            readyHref={navHref("play")}
                            onContinue={onContinue}
                          />
                        ) : (
                          <SetupChecklist
                            id={id}
                            lang={lang}
                            ready={!!runtime}
                            temporary={shared}
                            readyHref={navHref("play")}
                            onContinue={onContinue}
                            steps={setupSteps(id, options)}
                            artwork={cardTeaching.setupArtwork}
                            players={options.guidePlayers}
                            signature={
                              id === "avalon"
                                ? JSON.stringify([
                                    options.players,
                                    options.avalonMode,
                                    [...options.optional].sort(),
                                    options.lady,
                                  ])
                                : id === "coup"
                                  ? `${options.exchange}-${options.reformation}-${options.guidePlayers}`
                                  : id === "skull_king"
                                    ? String(options.skullExpansion)
                                    : id === "sushi_go_party" ? String(options.guidePlayers) : "base"
                            }
                          />
                    )}
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
                    )}
                    practiceHelper={["poker","moth"].includes(id) ? <Tool kind="practice-helper" initial={tools["practice-helper"] || ""} /> : null}
                    scoring={cardTeaching.scoring ? <ScoringExample gameId={id} temporary={shared} data={cardTeaching.scoring} artwork={cardTeaching.scoringArtwork || {}} lang={lang} ruleHref={(section) => navHref("rules", section)} /> : null}
                    examples={<>
                      {cardTeaching.tricks ? <SkullTrickLesson temporary={shared} data={cardTeaching.tricks} lang={lang} expansion={options.skullExpansion} ruleHref={(section) => navHref("rules", section)} /> : null}
                      {cardTeaching.coup ? <CoupLesson temporary={shared} data={cardTeaching.coup} cards={cardTeaching.cards} lang={lang} exchange={options.exchange} reformation={options.reformation} ruleHref={(section) => navHref("rules", section)} /> : null}
                      {cardTeaching.avalon ? <AvalonLesson temporary={shared} key={`${options.players}:${options.avalonMode}:${options.optional.join(",")}`} data={cardTeaching.avalon} cards={cardTeaching.cards} lang={lang} options={options} script={runtime?.view("setup-script") || tools["setup-script"] || ""} ruleHref={(section) => navHref("rules", section)} /> : null}
                    </>}
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
                          kind="lesson-helper"
                          initial={tools["lesson-helper"] || ""}
                        />
                      </div>
                    </details>
                  </section>
                  <Link
                    prefetch={false}
                    className="inline-link"
                    href={navHref("rules")}
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
                      options={options}
                      hrefFor={searchHref}
                      onSelect={(section) => {
                        if (section)
                          setExpanded(
                            (previous) => new Set([...previous, section]),
                          );
                      }}
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
                          {focusPlay ? (
                            <button
                              type="button"
                              id="share-table-guide"
                              aria-haspopup="dialog"
                              aria-controls="share-dialog"
                              onClick={(event) => {
                                event.currentTarget.focus();
                                setSharing(null);
                              }}
                            >
                              {tr("Share", "Compartir")}
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
                      {focusPlay ? (
                        <TableControls
                          lang={lang}
                          chess={id === "chess"}
                          orientation={opponentFacing}
                          onOrientation={(value) => {
                            setOpponentFacing(value);
                            try {
                              sessionStorage.setItem(
                                "tablefolk-chess-orientation",
                                value ? "opponent" : "same",
                              );
                            } catch {}
                          }}
                          help={showHelp}
                          onHelp={setShowHelp}
                        />
                      ) : null}
                      <Tool
                        key={`${id}-${lang}-play`}
                        kind="play"
                        initial={tools.play || ""}
                        onTableJump={(tool) => {
                          if (focusPlay) setShowHelp(!tool);
                          const move = () => {
                            const heading = document.getElementById(
                              tool ? "active-table-tool-heading" : "table-sheet-heading",
                            );
                            const focus = heading?.getClientRects().length ? heading
                              : document.querySelector<HTMLElement>("#active-table-tool button:not(:disabled)");
                            (tool ? document.getElementById("active-table-tool") : heading)
                              ?.scrollIntoView({ block: "start" });
                            focus?.focus({ preventScroll: true });
                          };
                          // Wait for React to reveal the full-screen reference.
                          if (focusPlay) requestAnimationFrame(move);
                          else move();
                        }}
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
                            <button
                              type="button"
                              className="share-rule"
                              aria-label={`${tr("Share rule", "Compartir regla")}: ${section.title[lang]}`}
                              aria-haspopup="dialog"
                              aria-controls="share-dialog"
                              onClick={(event) => {
                                event.currentTarget.focus();
                                setSharing(section.id);
                              }}
                            >
                              {tr("Share this rule", "Compartir esta regla")}
                            </button>
                            {section.paragraphs.map((paragraph, i) => (
                              <p key={i}>
                                <HighlightedText
                                  text={paragraph[lang]}
                                  id={id}
                                  lang={lang}
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
                          kind="lesson-helper"
                          initial={tools["lesson-helper"] || ""}
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
        <ShareDialog
          open={sharing !== undefined}
          onClose={() => setSharing(undefined)}
          href={guideHref(
            lang,
            id,
            searchOpen && typeof sharing === "string" ? "rules" : view,
            query,
            options,
            true,
            typeof sharing === "string"
              ? sharing
              : typeof window !== "undefined" &&
                  sections.some((section) => "#" + section.id === location.hash)
                ? location.hash.slice(1)
                : undefined,
          )}
          title={
            typeof sharing === "string"
              ? sections.find((section) => section.id === sharing)?.title[
                  lang
                ] || game.name[lang]
              : game.name[lang]
          }
          edition={edition}
          lang={lang}
        />
        <RuleSearchDialog
          onShare={setSharing}
          cards={cardTeaching.cards}
          edition={edition}
          view={view}
          onSelect={(section) => {
            if (section)
              setExpanded((previous) => new Set([...previous, section]));
          }}
          open={searchOpen}
          onClose={() => setSearchOpen(false)}
          id={id}
          lang={lang}
          sections={sections}
          options={options}
          hrefFor={searchHref}
          icons={icons}
          query={query}
          onQuery={onQuery}
        />
      </main>
    </EngineContext.Provider>
  );
}
