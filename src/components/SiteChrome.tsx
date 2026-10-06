"use client";
import {
  rememberCollection,
  useCollectionReturn,
} from "@/lib/collection-state";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Icon } from "./Icon";
import type { Language } from "@/lib/types";
const validLanguages = ["en", "es"];
export function SiteChrome({
  icons,
  gameIcons,
  children,
}: {
  icons: Record<string, string>;
  gameIcons: Record<string, string>;
  children: React.ReactNode;
}) {
  const pathname = usePathname(),
    router = useRouter();
  const parts = pathname.split("/").filter(Boolean);
  const lang: Language = parts[0] === "en" ? "en" : "es";
  const collectionHref = useCollectionReturn(lang);
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const tr = (en: string, es: string) => (lang === "es" ? es : en);
  useEffect(() => {
    // The visual viewport follows the software keyboard without remounting tools.
    const viewport = window.visualViewport;
    if (!viewport) return;
    const sync = () => {
      document.documentElement.style.setProperty("--visible-height", `${viewport.height}px`);
      document.documentElement.style.setProperty("--visible-top", `${viewport.offsetTop}px`);
    };
    sync();
    viewport.addEventListener("resize", sync);
    viewport.addEventListener("scroll", sync);
    return () => {
      viewport.removeEventListener("resize", sync);
      viewport.removeEventListener("scroll", sync);
    };
  }, []);
  useEffect(() => {
    try {
      const saved = JSON.parse(
        localStorage.getItem("tablefolk-preferences") || "{}",
      );
      setTheme(saved.theme === "light" ? "light" : "dark");
      // Honor saved language on the unlocalized entry point only.
      if (
        pathname === "/" &&
        saved.lang === "en" &&
        (!location.hash || location.hash === "#collection")
      )
        router.replace("/en/" + location.search + location.hash);
    } catch {}
  }, [pathname, router]);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.lang = lang;
    document.documentElement.dataset.game = parts[1] || "library";
  }, [theme, lang, pathname]);
  const save = (patch: object) => {
    if (new URLSearchParams(location.search).get("shared") === "1") return;
    try {
      const saved = JSON.parse(
        localStorage.getItem("tablefolk-preferences") || "{}",
      );
      localStorage.setItem(
        "tablefolk-preferences",
        JSON.stringify({ ...saved, ...patch }),
      );
    } catch {}
  };
  const languagePath = (next: Language) =>
    validLanguages.includes(parts[0])
      ? `/${[next, ...parts.slice(1)].join("/")}/`
      : `/${next}/`;
  return (
    <div className="site-shell" data-game={parts[1] || "library"}>
      <a className="skip-link" href="#main">
        {tr("Skip to content", "Ir al contenido")}
      </a>
      <header id="header">
        <div className="wrap header-inner">
          <Link
            prefetch={false}
            className="brand"
            href={`/${lang}/`}
            aria-label={`Tablefolk · ${tr("Home", "Inicio")}`}
          >
            <span className="brand-mark">
              <Icon path={icons[gameIcons[parts[1]] || "spade"]} />
            </span>
            <span>
              tablefolk<span style={{ color: "var(--accent)" }}>.</span>
            </span>
          </Link>
          <div className="header-actions">
            <Link
              prefetch={false}
              className="library-link"
              href={collectionHref}
            >
              <Icon path={icons.grid} />
              {tr("The collection", "La colección")}
            </Link>
            <div
              className="language"
              role="group"
              aria-label={tr("Language", "Idioma")}
            >
              {(["en", "es"] as Language[]).map((next) => (
                <button
                  key={next}
                  id={`lang-${next}`}
                  aria-pressed={lang === next}
                  onClick={() => {
                    save({ lang: next });
                    rememberCollection();
                    router.push(
                      languagePath(next) + location.search + location.hash,
                      { scroll: false },
                    );
                  }}
                >
                  {next.toUpperCase()}
                </button>
              ))}
            </div>
            <button
              className="icon-button"
              id="theme"
              aria-label={
                theme === "dark"
                  ? tr("Switch to light theme", "Cambiar al tema claro")
                  : tr("Switch to dark theme", "Cambiar al tema oscuro")
              }
              onClick={() => {
                const next = theme === "dark" ? "light" : "dark";
                save({ theme: next });
                setTheme(next);
              }}
            >
              <Icon path={theme === "dark" ? icons.sun : icons.moon} />
            </button>
          </div>
        </div>
      </header>
      {children}
      <footer id="footer">
        <div className="wrap footer-inner">
          <span>
            {tr(
              "Made for good company and one more round.",
              "Para disfrutar en compañía y jugar una ronda más.",
            )}
          </span>
          <a href="/game-night.html" download>
            {tr("Download the offline guide", "Descargar la guía sin conexión")}
          </a>
        </div>
      </footer>
    </div>
  );
}
