# Tablefolk

A bilingual, offline game-night guide for No-Limit Texas Hold’em, Coup, Coup: Reformation, The Resistance: Avalon, Cheating Moth / La Polilla Tramposa, Dixit, Catan, Secret Hitler, El Camarero, Monopoly, Chess, Burako, Uruguayan Truco, Skull King, Sushi Go! and Sushi Go Party!.

## Open

Double-click **game-night.html**. Everything is included in that one file; no installation, account, internet connection, or server is needed. External rulebook links need internet.

Alternatively, open **index.html**, keeping all CSS and JavaScript files and the `assets/` folder alongside it.

## Deploy on Vercel

Import [t-rivas/game-instructions](https://github.com/t-rivas/game-instructions) from [Vercel's new project page](https://vercel.com/new) and click **Deploy**. Keep the root directory at the repository root.

The included `vercel.json` selects the **Other** framework preset, skips installation and building, and serves the root directory. No environment variables are required. Vercel serves `index.html` with its local scripts, styles and assets; `game-night.html` remains available as the standalone offline version.

See [Vercel's build configuration documentation](https://vercel.com/docs/builds/configure-a-build) for static-site settings.

## Features

- Game-specific visual themes across the full collection and all guide views. Each supports light and dark modes and print-friendly output.
- Spanish is the default on first visit; a saved English or Spanish choice is restored on later visits.
- Clear Spanish for readers in Uruguay, without local slang, and plain English for non-native speakers. Game terms are explained where they are introduced, with consistent wording across Learn, While playing, and Full rules.
- The collection opens compact table references: turn order, short action rows and key reminders. Examples, practice tools and credits are expandable; Coup and Skull King option controls stay visible.
- Print the compact reference directly with its print button. Dixit prints all scoring outcomes, independent of the selected interactive outcome.
- Dixit includes full base-game rules, a live scoring selector, the three-player adjustments, and official box/component/card imagery.
- Inquisitor and Reformation each have an always-visible, full-row switch on every Coup view. Both support touch and keyboard input and save choices locally. Inquisitor replaces Ambassador; Reformation independently adds sides and the coin reserve.
- Skull King has an always-visible switch for Grandpa Beck’s separate Expansion Pack. It updates the lesson, quick reference, complete rules and player count, and saves the choice locally. The optional Kraken, White Whale and Loot cards in the base box are explained separately.
- Sushi Go! and Sushi Go Party! have separate guides, including their different maki and pudding tie rules. Party covers menu building, player-count limits and every dish type.
- Avalon setup for 5–10 players, optional-role capacity checks, quest sizes and an opening script adapted to the selected roles.
- Step-by-step lessons with progress preserved when switching languages.
- A visual poker hand you can reveal from pre-flop through showdown.
- Coup coin-budget helper and challenge example; Avalon quest-result simulator that follows player-count exceptions.
- Interactive Polilla discard practice with guard/moth restrictions, plus a round penalty calculator.
- Two bilingual decision exercises for each of the ten added games, with immediate explanations, links to the relevant rule, keyboard controls and progress preserved when switching language or view.
- Search, dark/light themes, keyboard navigation, print layout and local language/theme/Coup/Skull King preferences.
- The collection cards use real product photographs. Earlier added boxes use clean transparent cutouts; the Skull King and Sushi Go editions use their publisher box images. Chess includes a photographed reference for every piece and its movement; Uruguayan Truco highlights the Mazo Yorugua and the five pieces created by the muestra.
- Inside most game guides, the header keeps its atmospheric AI illustration. Skull King and the Sushi Go editions use publisher box images there. Factual box, card, board and component references can be enlarged to see their source.
- Source and edition details are available in `assets/official/SOURCES.md`, `assets/real/SOURCES.md`, `assets/ARTWORK.md` and the guide’s expandable image credits.
- Phone layouts from 320px up, sticky language and guide controls, 44px navigation targets, 16px mobile form inputs, safe-area spacing, landscape adjustments, and reduced-motion support.
- System fonts and local assets; no trackers or network dependencies.

## Edit

`data.js` contains the original paired English/Spanish explanations; `dixit.js`, `new-games.js` and `more-games.js` add the remaining guides. `table-guide.js` and `table-guide.css` implement the compact table references and print layout. `app.js` contains the interface and translated labels. `enhancements.js` contains the interactive learning tools. `official.js` contains the real-image registry, the separate in-guide illustration registry, bilingual captions, credits and accessible image viewer; `official.css` styles these additions. `styles.css`, `enhancements.css` and `game-themes.css` control the responsive presentation and game-specific themes. Run `scripts/make-cover-cutouts.ps1` to recreate the transparent product cutouts from the downloaded real photographs.

After editing, run:

```sh
python3 build.py
# or: node build.mjs
```

This regenerates `game-night.html`. There is no build dependency to install. Both builders produce the same output, including with Windows line endings or when invoked from another directory. The export embeds the photographs, card references and decorative illustrations so it works offline. The current export is approximately 41.5 MiB; the source version loads its images separately.

`practice.js` contains the ten added games’ teaching scenarios and their interaction state. These are examples for learning; each explanation links to its corresponding full-rules section.

## Rule scope

Coup supports 2–10 players with the extra Reformation cards. Use five character types with 3 copies each for 2–6 players, 4 for 7–8, or 5 for 9–10; leave extra copies out and deal 2 influence cards per player. The larger deck works with or without the Reformation side rules. Coup covers the base game, the independent Inquisitor replacement, Reformation allegiances, and the published player-count variants. Avalon covers its classic base box, four optional roles, Lady of the Lake and optional quest targeting. The setup helper uses normal quest order. Crossovers requiring other games’ expansion cards and Avalon Big Box modules are outside this edition.

Dixit follows Libellud’s 2021 standard base-game rules (3–8 players), including the three-player setup. Some older 3–6-player boxes have different ending rules; the edition note explains this. Odyssey and Disney are separate editions and are not covered.

Rule references are linked inside each guide. Poker uses No-Limit Texas Hold’em with clearly identified choices for casual sessions and tournaments. These are companion explanations, not official publisher rulebooks.

The new guides cover base CATAN, Secret Hitler, Maldón’s 2018 El Camarero, classic Monopoly, basic FIDE chess, the Argentine coastal Burako variant described by Al Burako, and Uruguayan Truco with muestra. Burako variants differ on groups, discards and closing; use the stated variant consistently. Truco’s local calling windows, Falta Envido and contested-flor raises must be agreed at the table; the guide labels that scope explicitly.

Skull King follows Grandpa Beck’s current base rules and the separately sold Expansion Pack. The base guide uses classic Skull King scoring and labels optional cards from the base box. The pack switch includes the additional numbered cards, Wild 15, Mary Thorne, First Mate Con and the other special cards. Sushi Go! follows its 108-card original rules; Sushi Go Party! follows the deluxe rules, including its different tie scoring and custom menus.

## Verification

Run the repeatable checks with:

```sh
npm ci
npx playwright install chromium
npm test
```

If using an installed Google Chrome instead, run `CHROME_CHANNEL=chrome npm test`. Python 3 is required to compare the two dependency-free builders. Playwright is used only for development checks; opening or deploying the guide still requires no installation.

The PR #1 review passed **1,405 checks** in headless Chrome: 1,152 view combinations across all twelve games, three views, both languages, both themes and widths of 320, 390, 768 and 1440px in both HTML entry points, plus build parity with CRLF/from another directory, embedded-script syntax, stale-export detection, image decoding, offline requests, fourteen practice scenarios, keyboard navigation, language persistence, image dialogs, Coup options, Avalon quest exceptions, Poker, Polilla and Dixit helpers, and reference printing. Mobile and desktop practice screenshots were reviewed visually. The suite writes screenshots to a temporary directory and prints its location.

GitHub Actions runs the same suite for pushes and pull requests. Browser-emulated checks do not replace physical iOS/Android or assistive-technology testing, and cannot prove every regional rules variant. See [the PR review](docs/pr-1-review.md) for the corrected findings and rule references.

Mobile header regressions are checked separately in Chromium and WebKit (Safari’s engine): all games, first visits, returning visits and all guide views at 320, 393 and 600px, in both HTML entry points. These checks bound the banner dimensions, keep the tabs on the first screen and verify that navigation stays pinned below the site header when scrolling. Run `npm run test:mobile` for Chromium, or install WebKit with `npx playwright install webkit` and run `BROWSER=webkit npm run test:mobile`. CI runs both engines. This does not replace testing on a physical iPhone.
