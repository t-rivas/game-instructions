# Tablefolk

A bilingual, offline game-night guide for No-Limit Texas Hold’em, Coup, Coup: Reformation (with either Ambassador or Inquisitor), The Resistance: Avalon, Cheating Moth / La Polilla Tramposa, and Dixit (standard 2021 base game).

## Open

Double-click **game-night.html**. Everything is included in that one file; no installation, account, internet connection, or server is needed. External rulebook links need internet.

Alternatively, open **index.html**, keeping all five CSS files, all six JavaScript files, and the `assets/` folder alongside it.

## Deploy on Vercel

Import [t-rivas/game-instructions](https://github.com/t-rivas/game-instructions) from [Vercel's new project page](https://vercel.com/new) and click **Deploy**. Keep the root directory at the repository root.

The included `vercel.json` selects the **Other** framework preset, skips installation and building, and serves the root directory. No environment variables are required. Vercel serves `index.html` with its local scripts, styles and assets; `game-night.html` remains available as the standalone offline version.

See [Vercel's build configuration documentation](https://vercel.com/docs/builds/configure-a-build) for static-site settings.

## Features

- Five game-specific visual themes across the collection and all guide views: Coup (steel/crimson), Avalon (gold/misty blue), Poker (green felt/brass), Polilla (yellow/pink comic styling), and Dixit (sunset/storybook styling). Each supports light and dark modes and print-friendly output.
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
- 32 published images: game boxes, Coup characters/action reference, Avalon roles/vote/quest cards, Polilla insect cards, a Bicycle deck example, and Dixit artwork. Tap images to enlarge them and see their source. The Inquisitor uses the official box portrait, explicitly captioned as such.
- Generated artwork is reserved for the decorative home-page hero. Source/edition details for published artwork are in `assets/official/SOURCES.md` and the guide’s expandable image credits.
- Phone layouts from 320px up, sticky language and guide controls, 44px navigation targets, 16px mobile form inputs, safe-area spacing, landscape adjustments, and reduced-motion support.
- System fonts and local assets; no trackers or network dependencies.

## Edit

`data.js` contains paired English/Spanish explanations and source references; `dixit.js` adds the Dixit rules. `table-guide.js` and `table-guide.css` implement the compact table references, Dixit scoring and reference print layout. `app.js` contains the interface, translated labels and interactive helpers. `enhancements.js` contains the illustrations and interactive learning tools. `official.js` contains the image registry, bilingual captions, credits and accessible image viewer; `official.css` styles these additions. `styles.css` and `enhancements.css` control the shared presentation, including the phone layouts. `game-themes.css` supplies game-specific palettes, typography, borders and decorative textures. `app.js` assigns the active game to the HTML `data-game` attribute and to each collection card; returning home resets the page palette.

After editing, run:

```sh
python3 build.py
```

This regenerates `game-night.html`. There is no build dependency to install. The export embeds the illustrations and published images and is approximately 3.0 MB. Original downloaded source material is kept separately in `assets/official/sources/`; it is not embedded in the export.

## Rule scope

Coup covers the base game, the independent Inquisitor replacement, Reformation allegiances, and the published player-count variants. Avalon covers its classic base box, four optional roles, Lady of the Lake and optional quest targeting. The setup helper uses normal quest order. Crossovers requiring other games’ expansion cards and Avalon Big Box modules are outside this edition.

Dixit follows Libellud’s 2021 standard base-game rules (3–8 players), including the three-player setup. Some older 3–6-player boxes have different ending rules; the edition note explains this. Odyssey and Disney are separate editions and are not covered.

Rule references are linked inside each guide. Poker uses No-Limit Texas Hold’em with clearly identified choices for casual sessions and tournaments. These are companion explanations, not official publisher rulebooks.

## Verification

The current update passed 221 headless Chrome checks: all five games, three views, both languages and widths of 320, 390, 768 and 1440px; Dixit scoring outcomes and three-player adjustments; Coup role/expansion switching; Avalon quest exceptions; lesson navigation; offline decoding of all 32 official images; image dialogs; print layout; search; and the source and standalone builds. Phone and print screenshots were also reviewed. Actual Safari/iOS hardware was not available.

The game-theme update additionally passed 358 theme checks across all five games, all three views, both languages and both color modes at 320–1440px. Palette checks verify at least 4.5:1 contrast for text, muted text and accent text against panels, and for selected-button text. Collection theme reset, offline source build and print decoration removal were also checked. Desktop and phone previews were visually reviewed.

The language and mobile-controls update was checked in headless Chrome across all five games, three views, both languages and both themes at 320, 390, 768 and 1440px. Checks cover text rendering, horizontal overflow, Reformation touch/keyboard input, independent Inquisitor settings, saved preferences, and the offline export. Mobile screenshots were reviewed. These are browser-emulated phone checks, not tests on physical iOS devices.
