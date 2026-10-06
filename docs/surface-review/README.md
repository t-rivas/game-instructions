# Surfaces and published artwork review

The shared visual system builds on the typography pass in `src/components/web.css`. Each game keeps its existing accent family, heading font, shape language, and banner identity. Patterned backgrounds are reserved for game banners and covers; explanations sit on quiet reading surfaces.

The surface tokens distinguish the page, reading surfaces, grouped examples, and restrained accent highlights. Essential control borders use a stronger token than decorative separators. Primary actions use the game accent; secondary actions use neutral surfaces. Selected tabs retain a visible underline, and keyboard focus has a clear outline, including in forced colors. The dark Secret Hitler accent was adjusted within its vermilion family to improve contrast on grouped surfaces.

`LessonCardArt` now shares a neutral mount, restrained shadow, full-aspect-ratio image area, and visible enlargement affordance. Lead cards are larger; component photos have a separate presentation up to 520px wide. Compact examples keep their existing card layouts and a smaller arrow affordance. Native schematics retain names, symbols, values, and outcome markers. Missing images show their localized name/status and leave all lesson copy and Next actions available. Existing credits and the image viewer are retained.

Original asset files, source URLs, and artwork colors are unchanged. Images use `object-fit: contain`, their published proportions, and no filters. No navigation, rules, scenario state, or animation was changed.

## Before / after

Spanish production pages, fresh storage, reduced motion, light and dark themes at 390px and 1440px. Baseline images were captured before this pass, after the completed typography work. Detail captures omit pinned page chrome; page captures show the surrounding game identity.

Open [the side-by-side gallery](index.html) or the individual PNGs below.

| Game / theme | 390px before | 390px after | 1440px before | 1440px after |
| --- | --- | --- | --- | --- |
| Skull King · light | [Before](before/skull_king-card-light-390.png) | [After](after/skull_king-card-light-390.png) | [Before](before/skull_king-card-light-1440.png) | [After](after/skull_king-card-light-1440.png) |
| Skull King · dark | [Before](before/skull_king-card-dark-390.png) | [After](after/skull_king-card-dark-390.png) | [Before](before/skull_king-card-dark-1440.png) | [After](after/skull_king-card-dark-1440.png) |
| Coup · light | [Before](before/coup-card-light-390.png) | [After](after/coup-card-light-390.png) | [Before](before/coup-card-light-1440.png) | [After](after/coup-card-light-1440.png) |
| Coup · dark | [Before](before/coup-card-dark-390.png) | [After](after/coup-card-dark-390.png) | [Before](before/coup-card-dark-1440.png) | [After](after/coup-card-dark-1440.png) |
| Avalon · light | [Before](before/avalon-card-light-390.png) | [After](after/avalon-card-light-390.png) | [Before](before/avalon-card-light-1440.png) | [After](after/avalon-card-light-1440.png) |
| Avalon · dark | [Before](before/avalon-card-dark-390.png) | [After](after/avalon-card-dark-390.png) | [Before](before/avalon-card-dark-1440.png) | [After](after/avalon-card-dark-1440.png) |
| CATAN · components · light | [Before](before/catan-components-light-390.png) | [After](after/catan-components-light-390.png) | [Before](before/catan-components-light-1440.png) | [After](after/catan-components-light-1440.png) |
| CATAN · components · dark | [Before](before/catan-components-dark-390.png) | [After](after/catan-components-dark-390.png) | [Before](before/catan-components-dark-1440.png) | [After](after/catan-components-dark-1440.png) |

## Examples and board setup

These captures include published portraits and full cards, compact factual examples, anonymous schematic cards, changed-fact markers, and CATAN's authored board-setup diagram.

| Game / theme | 390px before | 390px after | 1440px before | 1440px after |
| --- | --- | --- | --- | --- |
| Skull King · light | [Before](before/skull_king-example-light-390.png) | [After](after/skull_king-example-light-390.png) | [Before](before/skull_king-example-light-1440.png) | [After](after/skull_king-example-light-1440.png) |
| Skull King · dark | [Before](before/skull_king-example-dark-390.png) | [After](after/skull_king-example-dark-390.png) | [Before](before/skull_king-example-dark-1440.png) | [After](after/skull_king-example-dark-1440.png) |
| Coup · light | [Before](before/coup-example-light-390.png) | [After](after/coup-example-light-390.png) | [Before](before/coup-example-light-1440.png) | [After](after/coup-example-light-1440.png) |
| Coup · dark | [Before](before/coup-example-dark-390.png) | [After](after/coup-example-dark-390.png) | [Before](before/coup-example-dark-1440.png) | [After](after/coup-example-dark-1440.png) |
| Avalon · light | [Before](before/avalon-example-light-390.png) | [After](after/avalon-example-light-390.png) | [Before](before/avalon-example-light-1440.png) | [After](after/avalon-example-light-1440.png) |
| Avalon · dark | [Before](before/avalon-example-dark-390.png) | [After](after/avalon-example-dark-390.png) | [Before](before/avalon-example-dark-1440.png) | [After](after/avalon-example-dark-1440.png) |
| CATAN · initial placements · light | [Before](before/catan-diagram-light-390.png) | [After](after/catan-diagram-light-390.png) | [Before](before/catan-diagram-light-1440.png) | [After](after/catan-diagram-light-1440.png) |
| CATAN · initial placements · dark | [Before](before/catan-diagram-dark-390.png) | [After](after/catan-diagram-dark-390.png) | [Before](before/catan-diagram-dark-1440.png) | [After](after/catan-diagram-dark-1440.png) |

## Image failure at 320px

[Skull King](after/skull_king-missing-320.png) · [Coup](after/coup-missing-320.png) · [Avalon](after/avalon-missing-320.png) · [CATAN](after/catan-missing-320.png)

## Validation

- `npm run build` — production build and static export passed.
- `npm run test:images` — 488 responsive WebP variants verified for dimensions, proportions, and transparency; image transfer checks passed.
- `npm run test:surfaces` — 936 checks: every game and the collection in both themes, 4.5:1 text/action contrast, 3:1 essential border/focus contrast, unfiltered artwork and original ratios, all four responsive widths, viewer focus recovery, forced colors, and failed images.
- `npm run test:typography` — 816 reflow/readability checks at 320/390/768/1440px and 200% text passed.
- `npm run test:lesson-cards` — responsive cards, variants, enlargement, and image fallback passed.
- `npm run test:comparisons` — six independently expected outcomes, published cards and rosters, keyboard/replay, state isolation, both languages/themes, enlarged text, and failed images passed.
- `npm run test:watch-turn` — animated table states, rapid input, privacy, saved learning state, enlargement, keyboard, reduced motion, and responsive tables passed.
- `npm run test:setup-diagrams` — board setup and component-recognition checks passed.
- `npm run test:web` — 1,361 hosted-site checks passed.

`checks.json` records the surface verification results. Refresh after captures with `node docs/surface-review/capture.cjs after` following a build. Before captures require a preserved baseline export, selectable through `TABLEFOLK_EXPORT_DIR`.
