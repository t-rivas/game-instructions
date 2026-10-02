# Tablefolk

A bilingual, offline game-night guide for No-Limit Texas Hold’em, Coup, Coup: Reformation, The Resistance: Avalon, Cheating Moth / La Polilla Tramposa, Dixit, Catan, Secret Hitler, El Camarero, Monopoly, Chess, Burako, Uruguayan Truco, Skull King, Sushi Go! and Sushi Go Party!.

## Develop and build the website

The hosted site uses Next.js App Router, React and TypeScript. Node.js 20.9+ is required.

```sh
npm ci
npm run dev
```

Open `http://localhost:3000`. The collection is available at `/`, `/es/` and `/en/`. Every game has `/[lang]/[game]/learn/`, `/[lang]/[game]/play/` and `/[lang]/[game]/rules/` routes. Rule sections use ordinary fragments, such as `/en/monopoly/rules/#movement`. Old root bookmarks such as `/#chess/reference` are migrated in the browser.

```sh
npm run build
npm run serve
```

The production build statically generates all 90 game views plus the collection pages into `out/`. `serve` prints a local URL for inspecting that export. The deployed website needs only static file hosting; no application server or database is required. Page titles, descriptions, localized HTML and all rule text are generated before JavaScript runs. Interactive tools load in a separate browser module.

The hosted website also includes:

- Compact game banners on phones, with the game name, player count and a thumbnail.
- A “Continue playing” section with validated summaries and Resume links for unfinished clocks, tournaments and scoreboards, plus recently opened games.
- Favorites saved on the device, exact player-count filters and duration filters based on the longest listed time.
- A sticky rule-search shortcut and `Ctrl/Cmd+K`. Searches survive view changes and Back navigation; result links include the query and highlight matches in the opened rules.
- A full-screen table view with enlarged clock and score displays, a pinned exit/search toolbar and local-save feedback. Escape exits this view; closing a search first returns to the game. Active chess-clock configuration collapses after starting.
- Bilingual setup checklists for every game. Completion is saved locally and cleared when the relevant setup changes. Avalon player and role choices also recover after reload. Setup notes retain the detailed rules and exceptions.

## Open the offline guide

Double-click **game-night.html**. Everything is included in that one file; no installation, account, internet connection, or server is needed. External rulebook links need internet.

Alternatively, open **index.html**, keeping all CSS and JavaScript files and the `assets/` folder alongside it.

## Deploy on Vercel

Import [t-rivas/game-instructions](https://github.com/t-rivas/game-instructions) from [Vercel's new project page](https://vercel.com/new) and click **Deploy**. Keep the root directory at the repository root.

The included `vercel.json` selects **Next.js**, installs with `npm ci`, runs `npm run build` and publishes `out/`. If the existing Vercel project has dashboard overrides for installation, build or output, remove those overrides so the checked-in configuration takes effect. The hosted collection includes a download link to `/game-night.html`.

No environment variables are required. Optionally set `NEXT_PUBLIC_SITE_URL` to the production origin to generate absolute canonical URLs, language alternatives and social preview images. Vercel’s `VERCEL_PROJECT_PRODUCTION_URL` is used automatically when available. Local builds leave these absolute links out if no origin is configured.

See [Vercel's build configuration documentation](https://vercel.com/docs/builds/configure-a-build) for static-site settings.

## Features

- Game-specific visual themes across the full collection and all guide views. Each supports light and dark modes and print-friendly output.
- Spanish is the default on first visit; a saved English or Spanish choice is restored on later visits.
- Clear Spanish for readers in Uruguay, without local slang, and plain English for non-native speakers. Game terms are explained where they are introduced, with consistent wording across Learn, While playing, and Full rules.
- Play now opens compact table references: turn order, short action rows and key reminders. Examples, practice tools and credits are expandable; Coup and Skull King option controls stay visible.
- Print the compact reference directly with its print button. Dixit prints all scoring outcomes, independent of the selected interactive outcome.
- Every active scoreboard (Coup, La Polilla, Skull King and Truco) has a prominent “Reset · edit players” button beside its title. Reset clears results and unfinished entries and returns to editable setup. Chess and Poker keep their timer reset controls.
- Dixit includes full base-game rules, a live scoring selector, the three-player adjustments, and official box/component/card imagery.
- Inquisitor and Reformation each have an always-visible, full-row switch on every Coup view. Both support touch and keyboard input and save choices locally. Inquisitor replaces Ambassador; Reformation independently adds sides and the coin reserve.
- Skull King includes a ten-round classic score sheet in “While playing”: final bids, actual hand sizes (including repeated sizes), manually entered signed capture bonuses, explained manual adjustments, cumulative totals, editable history and joint winners. The game snapshots the expansion choice at startup; Graybeard is not scored. Scores and unfinished entries survive guide, language and theme switches. Scores, setup fields and unfinished entries also survive reloads when browser storage is available, including a correction and its pending next round. Bids, tricks won, bonuses and adjustments start at 0 for each round. Optional adjustments are expandable, missed-bid bonuses are explained beside the input, impossible aggregate trick totals are rejected, and undo reopens the last round. Rascal/Cannonball scoring and automatic card effects are outside its scope.
- Skull King has an always-visible switch for Grandpa Beck’s separate Expansion Pack. It updates the lesson, quick reference, complete rules and player count, and saves the choice locally. The optional Kraken, White Whale and Loot cards in the base box are explained separately.
- Sushi Go! and Sushi Go Party! have separate guides, including their different maki and pudding tie rules. Party covers menu building, player-count limits and every dish type.
- Avalon setup for 5–10 players, optional-role capacity checks, quest sizes and an opening script adapted to the selected roles.
- Step-by-step lessons with progress preserved when switching languages.
- A visual poker hand you can reveal from pre-flop through showdown.
- Coup coin-budget helper and challenge example; Avalon quest-result simulator that follows player-count exceptions.
- Interactive Polilla discard practice with guard/moth restrictions and a round penalty calculator. The multiplayer scoreboard in “While playing” supports 3–5 named players and one round per player, explicit card counts checked against the edition’s deck, preview before saving, cumulative penalties, editable history, undo and shared victory for tied lowest totals. The round preview updates automatically; “Confirm round” enables as soon as all counts and the empty-hand selection are valid. Any blocking error appears beside the button. Membership locks after the first saved round; names remain editable. Scores and drafts survive guide, language and theme switches. Confirmed rounds, setup fields and unfinished entries also survive reloads when browser storage is available. All card counts start at 0 for each round, so only nonzero counts need editing. Live per-hand penalties update automatically; a cleared field still needs a valid count. Player names must be distinct.
- Two bilingual decision exercises for each of the ten added games, with immediate explanations, links to the relevant rule, keyboard controls and progress preserved when switching language or view.
- Poker includes a local tournament blind timer in “While playing”: an editable ordered schedule of whole-minute levels and breaks, small/big blinds and optional per-player antes. Starting locks and collapses the schedule until reset. The running view has level progress, a distinct paused appearance, and explained navigation; reset asks before discarding timer progress. Invalid fields are highlighted and focused. Pause/resume, previous/next rows and reset preserve the intended timing; deadlines recover missed levels and breaks after reload or sleep, and paused timers stay paused. Transitions show a notice; optional sound requires a click after each reload and does not replay missed alerts. The final row completes without looping.
- Chess includes an offline two-player clock in “While playing”: 3/5/10-minute presets or 1–180 custom minutes, 0–60 seconds added per move, pause/resume, reset confirmation and time-up indicators. The clock keeps running across views and language/theme changes; reloading restores the current turn and remaining time. Running clocks account for elapsed time while the page was closed; paused clocks stay paused.
- Coup includes a session scoreboard above the quick rules in “While playing” for 2–10 players. Result selections preview the points to award, and the winner cannot also be chosen as runner-up. This is house scoring: default winner +3 / last eliminated +1 / others 0 (two-player loser 0), or Wins only +1 / others 0. Start with six games or another positive whole-number count. The first result locks participants, scoring mode and game count; names stay editable. Saved results, standings, corrections and undo survive guide variant switches and reloads when browser storage is available. Session ties use most wins, then shared victory. A new session keeps the names and clears scores.
- Uruguayan Truco includes a manual scoreboard in “While playing” for exactly two named sides (people or partnerships). The default target is 30, with 0–14 malas and 15–29 buenas alongside cumulative totals. A custom positive whole-number target uses total/target only; the first award locks it, even after undo. Award +1/+2/+3/+4 or custom points with optional Truco/Envido/Flor/Other labels. Edit, delete or undo chronological entries; the first side at or above target wins with its actual total. Corrections replay history and visibly exclude entries after a corrected winning award. New awards stop at completion, while corrections and undo remain available. No card or bid values are calculated. Switching guide, language or theme preserves the scoreboard. Saved points, targets, corrections and excluded history also survive reloads when browser storage is available. Each team’s quick point buttons and custom entry sit with its total; undo appears above the history.
- Each collection card offers Learn and Play now. Learn shows essential setup before the lesson, including Avalon player counts, roles and opening script.
- Search the selected game’s rule titles and text from While playing or Full rules, with matching excerpts and links to the relevant section. Search ignores case and accents and follows the selected language and Skull King expansion.
- Collection search, dark/light themes, keyboard navigation, print layout and local language/theme/Coup/Skull King preferences.
- The collection cards use real product photographs. Earlier added boxes use clean transparent cutouts; the Skull King and Sushi Go editions use their publisher box images. Chess includes a photographed reference for every piece and its movement; Uruguayan Truco highlights the Mazo Yorugua and the five pieces created by the muestra.
- Inside most game guides, the header keeps its atmospheric AI illustration. Skull King and the Sushi Go editions use publisher box images there. Factual box, card, board and component references can be enlarged to see their source.
- Source and edition details are available in `assets/official/SOURCES.md`, `assets/real/SOURCES.md`, `assets/ARTWORK.md` and the guide’s expandable image credits.
- Phone layouts from 320px up, sticky language and guide controls, 44px navigation targets, 16px mobile form inputs, safe-area spacing, landscape adjustments, and reduced-motion support.
- System fonts and local assets; no trackers or network dependencies.

## Edit

The website’s routes and layouts live in `src/app/`. `src/components/` contains the React collection, site controls, rule lookup and guides; `src/lib/` contains typed data access, metadata and the tool adapter. `npm run typecheck` checks the TypeScript code.

`scripts/prepare-web.mjs` generates `src/generated/catalog.json` and a scoped tool runtime from the shared game sources, then copies local assets and the portable guide into `public/`. The generated files are ignored by Git and regenerated by `dev`, `build` and `typecheck`. React owns the main interface; isolated tool components reuse the existing scoring, timing, setup and practice behavior. One browser runtime retains clocks and drafts across route changes, and existing storage keys are preserved. The root `app.js` and `index.html` remain the interface for the portable offline build.

`data.js` contains the original paired English/Spanish explanations; `dixit.js`, `new-games.js` and `more-games.js` add the remaining guides. `table-guide.js` and `table-guide.css` implement the compact table references and print layout. `app.js` contains the interface and translated labels. `enhancements.js` contains the interactive learning tools. `official.js` contains the real-image registry, the separate in-guide illustration registry, bilingual captions, credits and accessible image viewer; `official.css` styles these additions. `styles.css`, `enhancements.css` and `game-themes.css` control the responsive presentation and game-specific themes. Run `scripts/make-cover-cutouts.ps1` to recreate the transparent product cutouts from the downloaded real photographs.

After editing, run:

```sh
python3 build.py
# or: node build.mjs
```

This regenerates `game-night.html`. `npm run build:offline` runs the same Node builder. `npm run build` also prepares and builds the Next.js website. There is no build dependency to install. Both builders produce the same output, including with Windows line endings or when invoked from another directory. The export embeds the photographs, card references and decorative illustrations so it works offline. The current export is approximately 42.7 MiB; the source version loads its images separately.

`practice.js` contains the ten added games’ teaching scenarios and their interaction state. These are examples for learning; each explanation links to its corresponding full-rules section.

## Rule scope

Coup supports 2–10 players with the extra Reformation cards. Use five character types with 3 copies each for 2–6 players, 4 for 7–8, or 5 for 9–10; leave extra copies out and deal 2 influence cards per player. The larger deck works with or without the Reformation side rules. Coup covers the base game, the independent Inquisitor replacement, Reformation allegiances, and the published player-count variants. Avalon covers its classic base box, four optional roles, Lady of the Lake and optional quest targeting. The setup helper uses normal quest order. Crossovers requiring other games’ expansion cards and Avalon Big Box modules are outside this edition.

Dixit follows Libellud’s 2021 standard base-game rules (3–8 players), including the three-player setup. Some older 3–6-player boxes have different ending rules; the edition note explains this. Odyssey and Disney are separate editions and are not covered.

Rule references are linked inside each guide. Poker uses No-Limit Texas Hold’em with clearly identified choices for casual sessions and tournaments. These are companion explanations, not official publisher rulebooks.

The new guides cover base CATAN, Secret Hitler, Maldón’s 2018 El Camarero, classic Monopoly, basic FIDE chess, the Argentine coastal Burako variant described by Al Burako, and Uruguayan Truco with muestra. Burako variants differ on groups, discards and closing; use the stated variant consistently. Truco’s local calling windows, Falta Envido and contested-flor raises must be agreed at the table; the guide labels that scope explicitly.

Skull King follows Grandpa Beck’s current base rules and the separately sold Expansion Pack. The base guide uses classic Skull King scoring and labels optional cards from the base box. The pack switch includes the additional numbered cards, Wild 15, Mary Thorne, First Mate Con and the other special cards. Sushi Go! follows its 108-card original rules; Sushi Go Party! follows the deluxe rules, including its different tie scoring and custom menus.

The three guides include a bilingual card catalog with 53 published card-face images, accessible from “While playing” → “Card photos & guide” and the learning/full reference. Skull King’s catalog follows the expansion switch; optional base-box cards and Pirate powers are labeled separately. Two expansion number-card types have text references because their rulebook has no individual pictures. All artwork works offline and opens in the credited image viewer. Crop provenance is in [CARD-SOURCES.md](assets/official/CARD-SOURCES.md).

## Verification

Run the repeatable checks with:

```sh
npm ci
npx playwright install chromium
npm run build
npm run test:web
npm test
npm run test:cards
npm run test:flows
npm run test:poker
npm run test:skull
npm run test:moth
npm run test:chess
npm run test:coup
npm run test:truco
npm run test:scoreboard-ux
```

If using an installed Google Chrome instead, run `CHROME_CHANNEL=chrome npm run test:web` and `CHROME_CHANNEL=chrome npm test`. Python 3 is required to compare the two dependency-free offline builders. Playwright is used only for development checks; opening the portable guide requires no installation. Building the hosted website requires the npm dependencies above.

The PR #1 review passed **1,405 checks** in headless Chrome: 1,152 view combinations across all twelve games, three views, both languages, both themes and widths of 320, 390, 768 and 1440px in both HTML entry points, plus build parity with CRLF/from another directory, embedded-script syntax, stale-export detection, image decoding, offline requests, fourteen practice scenarios, keyboard navigation, language persistence, image dialogs, Coup options, Avalon quest exceptions, Poker, Polilla and Dixit helpers, and reference printing. Mobile and desktop practice screenshots were reviewed visually. The suite writes screenshots to a temporary directory and prints its location.

GitHub Actions runs the same suite for pushes and pull requests. Browser-emulated checks do not replace physical iOS/Android or assistive-technology testing, and cannot prove every regional rules variant. See [the PR review](docs/pr-1-review.md) for the corrected findings and rule references.

Mobile header regressions are checked separately in Chromium and WebKit (Safari’s engine): all games, first visits, returning visits and all guide views at 320, 393 and 600px, in both HTML entry points. These checks bound the banner dimensions, keep the tabs on the first screen and verify that navigation stays pinned below the site header when scrolling. Run `npm run test:mobile` for Chromium, or install WebKit with `npx playwright install webkit` and run `BROWSER=webkit npm run test:mobile`. CI runs both engines. This does not replace testing on a physical iPhone.

Chess clock checks cover deterministic timing, increments, suspension, keyboard controls, saved preferences, running/paused reload recovery, reset recovery, both offline entry points and responsive layouts. Run `BROWSER=webkit npm run test:chess` to repeat in Safari’s engine.

Coup session checks cover both scoring modes, the two-player exception, invalid and duplicate selections, one save per game, locked settings, ties, corrections, undoing the final result, renaming, new sessions, saved results, guide variants, and both offline entry points at mobile and desktop widths. Run `BROWSER=webkit npm run test:coup` to repeat in Safari’s engine.

Skull King score-sheet checks cover classic positive and zero bids, signed bonuses and adjustments, eligibility, repeated hand sizes, corrections and tied winners in both offline entry points. Run `BROWSER=webkit npm run test:skull` for Safari’s engine. `skull-score.js` and `skull-score.css` implement the sheet.

Poker timer checks use injected timestamps for transitions, missed levels and breaks, pause/resume, saved-state recovery, manual navigation, final completion, reset and schedule validation. Browser checks cover both offline entry points, editing locks, translated controls, notices, sound activation and responsive layouts. Run `CHROME_CHANNEL=chrome npm run test:poker` with installed Chrome, or `BROWSER=webkit npm run test:poker` with Playwright WebKit. `poker-timer.js` contains the timer and UI; `poker-timer.css` styles it.

Truco scoreboard checks cover 14→15, 29→30, overshoots, custom targets, target locking, invalid points, corrections, deleting entries, undoing winning awards and flagged history after corrected wins in both offline entry points and responsive bilingual layouts. Run `BROWSER=webkit npm run test:truco` for Safari’s engine. `truco-score.js` and `truco-score.css` implement the scoreboard.

The counter and timer usability review is documented in [docs/counters-review.md](docs/counters-review.md). `npm run test:scoreboard-ux` checks the five active tools in both HTML entry points, English and Spanish, at 320, 390 and 1440px. It also checks storage failure feedback, reload recovery, per-player controls, live previews and undo. Confirmed scores and unfinished fields are stored locally and restored after a reload when browser storage is available. Draft recovery keeps entries unconfirmed until the player saves them. No account or cloud synchronization is involved.

`npm run test:flows` checks the Learn/Play entry points, visible Avalon setup, game rule search and reload recovery for unfinished scoreboard entries and corrections in both offline entry points. Run `BROWSER=webkit npm run test:flows` to repeat in Safari’s engine.

`npm run test:web` starts a temporary local static server and checks the exported Next.js site: all localized routes without JavaScript, game metadata, old bookmark routing, client navigation, lessons, variants, setup checklists, collection filters and favorites, images, shared rule searches and keyboard focus, all six play tools, saved-game shortcuts, recovery, full-screen layouts and unavailable-storage feedback. Layouts are checked at 320, 390 and 1440px. Run `BROWSER=webkit npm run test:web` to repeat in Safari’s engine. The existing suites continue to check the portable version and the underlying game models.
