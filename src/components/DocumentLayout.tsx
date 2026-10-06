import toolStyles from "@/generated/tool-styles.json";
import type { Metadata, Viewport } from "next";
import type { Language } from "@/lib/types";
import { games, icons } from "@/lib/games";
import { siteOrigin } from "@/lib/metadata";
import { SiteChrome } from "./SiteChrome";
import "../../styles.css";
import "../../enhancements.css";
import "../../official.css";
import "../../table-guide.css";
import "../../game-themes.css";
export const metadata: Metadata = {
  metadataBase: siteOrigin,
  title: {
    default: "Tablefolk · Tu compañero de juegos",
    template: "%s · Tablefolk",
  },
  description:
    "Guías bilingües para aprender y consultar tus juegos de mesa favoritos.",
  applicationName: "Tablefolk",
  icons: { icon: "/favicon.svg" },
};
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#171b18",
};
const themeScript = `try{var saved=JSON.parse(localStorage.getItem('tablefolk-preferences')||'{}');document.documentElement.dataset.theme=saved.theme==='light'?'light':'dark';}catch{}`;
export function DocumentLayout({
  lang,
  children,
}: {
  lang: Language;
  children: React.ReactNode;
}) {
  return (
    <html
      lang={lang}
      data-theme="dark"
      data-game="library"
      suppressHydrationWarning
    >
      <head>
        <style href="tablefolk-game-tools" precedence="game-tools">
          {"/* Per-game styles precede hosted overrides. */"}
        </style>
        <link
          rel="stylesheet"
          href={toolStyles.web}
          precedence="hosted-overrides"
        />
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <SiteChrome
          icons={icons}
          gameIcons={Object.fromEntries(
            Object.entries(games).map(([id, game]) => [id, game.icon]),
          )}
        >
          {children}
        </SiteChrome>
      </body>
    </html>
  );
}
