# Tablefolk

A bilingual, offline game-night guide for No-Limit Texas Hold’em, Coup, Coup: Reformation, The Resistance: Avalon, Cheating Moth / La Polilla Tramposa, Dixit, Catan, Secret Hitler, El Camarero, Monopoly, Chess, Burako and Uruguayan Truco.

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
- The collection opens compact table references: turn order, short action rows and key reminders. Examples, practice tools and credits are expandable; Coup variant controls stay visible.
- Print the compact reference directly with its print button. Dixit prints all scoring outcomes, independent of the selected interactive outcome.
- Dixit includes full base-game rules, a live scoring selector, the three-player adjustments, and official box/component/card imagery.
- Inquisitor and Reformation each have an always-visible, full-row switch on every Coup view. Both support touch and keyboard input and save choices locally. Inquisitor replaces Ambassador; Reformation independently adds sides and the coin reserve.
- Avalon setup for 5–10 players, optional-role capacity checks, quest sizes and an opening script adapted to the selected roles.
- Step-by-step lessons with progress preserved when switching languages.
- A visual poker hand you can reveal from pre-flop through showdown.
- Coup coin-budget helper and challenge example; Avalon quest-result simulator that follows player-count exceptions.
- Interactive Polilla discard practice with guard/moth restrictions, plus a round penalty calculator.
- Search, dark/light themes, keyboard navigation, print layout and local language/theme/Coup preferences.
- The collection cards use real product photographs. The new boxes are clean transparent cutouts, so they sit directly on each card’s theme without a white rectangle. Chess includes a photographed reference for every piece and its movement; Uruguayan Truco highlights the Mazo Yorugua and the five pieces created by the muestra.
- Inside each game guide, the header keeps its atmospheric AI illustration. Factual box, card, board and component references remain published photographs or scans that can be enlarged to see their source.
- Source and edition details are available in `assets/official/SOURCES.md`, `assets/real/SOURCES.md`, `assets/ARTWORK.md` and the guide’s expandable image credits.
- Phone layouts from 320px up, sticky language and guide controls, 44px navigation targets, 16px mobile form inputs, safe-area spacing, landscape adjustments, and reduced-motion support.
- System fonts and local assets; no trackers or network dependencies.

## Edit

`data.js` contains the original paired English/Spanish explanations; `dixit.js` and `new-games.js` add the remaining guides. `table-guide.js` and `table-guide.css` implement the compact table references and print layout. `app.js` contains the interface and translated labels. `enhancements.js` contains the interactive learning tools. `official.js` contains the real-image registry, the separate in-guide illustration registry, bilingual captions, credits and accessible image viewer; `official.css` styles these additions. `styles.css`, `enhancements.css` and `game-themes.css` control the responsive presentation and game-specific themes. Run `scripts/make-cover-cutouts.ps1` to recreate the transparent product cutouts from the downloaded real photographs.

After editing, run:

```sh
python3 build.py
# or: node build.mjs
```

This regenerates `game-night.html`. There is no build dependency to install. The export embeds the published photographs and card references so it works offline.

## Rule scope

Coup supports 2–10 players with the extra Reformation cards. Use five character types with 3 copies each for 2–6 players, 4 for 7–8, or 5 for 9–10; leave extra copies out and deal 2 influence cards per player. The larger deck works with or without the Reformation side rules. Coup covers the base game, the independent Inquisitor replacement, Reformation allegiances, and the published player-count variants. Avalon covers its classic base box, four optional roles, Lady of the Lake and optional quest targeting. The setup helper uses normal quest order. Crossovers requiring other games’ expansion cards and Avalon Big Box modules are outside this edition.

Dixit follows Libellud’s 2021 standard base-game rules (3–8 players), including the three-player setup. Some older 3–6-player boxes have different ending rules; the edition note explains this. Odyssey and Disney are separate editions and are not covered.

Rule references are linked inside each guide. Poker uses No-Limit Texas Hold’em with clearly identified choices for casual sessions and tournaments. These are companion explanations, not official publisher rulebooks.

## Verification

The source scripts pass Node syntax checks, every registered real-image asset is present locally, and the standalone offline build is regenerated after each content change. The new product, component, card and chess-piece images were also reviewed visually. Browser-emulated checks do not replace testing on physical iOS or Android devices.
