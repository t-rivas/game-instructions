# Collection composition review

The collection now opens with a direct bilingual headline and a compact arrangement of the published Coup, Avalon, and Sushi Go Party box artwork. The introduction uses the existing display/body typography and shared surface tokens. Decorative slogans, duplicate counts, and floating card badges are removed; Poker's Texas Hold’em identity moves into its description.

Search has a larger desktop field. Three desktop columns and two tablet columns give game titles, player counts, durations, descriptions, and Learn/Play actions room to breathe. Phone cards use a compact artwork column and stack when enlarged text needs the full width. Each game retains its own font, palette, patterned artwork surface, original assets, and existing guide credits. Returning players see their saved game and an accented Resume action before a short welcome heading.

Filtering, favorites, language routing, browser history, saved sessions, and collection scroll restoration retain their existing state logic. All 15 cards and their 30 Learn/Play links remain in prerendered HTML. Images reserve their frames, use responsive variants and explicit sizes, and retain lazy loading in the grid. Phone browsers do not fetch the decorative hero images. This pass adds no animation and removes the card hover translation.

## Before / after screenshots

Open the [comparison gallery](index.html) to select the width, language, theme, visitor state, and first-viewport or full-page capture.

The 128 PNGs cover 320, 390, 768, and 1440px; English and Spanish; light and dark; new visitors and returning players with a paused chess game; before and after. Each viewport is 900px high at DPR 1 with reduced motion. Before captures were taken from a production build of the existing workspace before this pass. Full-page captures scroll through the collection to load its lazy artwork before returning to the top. The capture script never rewrites images to disguise layout differences.

| Example | First viewport before | First viewport after | Full page before | Full page after |
| --- | --- | --- | --- | --- |
| English · light · desktop | [Before](before/new-en-light-1440-viewport.png) | [After](after/new-en-light-1440-viewport.png) | [Before](before/new-en-light-1440-full.png) | [After](after/new-en-light-1440-full.png) |
| Spanish · dark · phone | [Before](before/new-es-dark-390-viewport.png) | [After](after/new-es-dark-390-viewport.png) | [Before](before/new-es-dark-390-full.png) | [After](after/new-es-dark-390-full.png) |
| Spanish · light · narrow phone | [Before](before/new-es-light-320-viewport.png) | [After](after/new-es-light-320-viewport.png) | [Before](before/new-es-light-320-full.png) | [After](after/new-es-light-320-full.png) |
| English · dark · tablet | [Before](before/new-en-dark-768-viewport.png) | [After](after/new-en-dark-768-viewport.png) | [Before](before/new-en-dark-768-full.png) | [After](after/new-en-dark-768-full.png) |
| Returning · Spanish · light · phone | [Before](before/returning-es-light-390-viewport.png) | [After](after/returning-es-light-390-viewport.png) | [Before](before/returning-es-light-390-full.png) | [After](after/returning-es-light-390-full.png) |

Refresh the final screenshots after building with `node docs/collection-review/capture.cjs after`. Only run `before` against an unchanged baseline export; `TABLEFOLK_EXPORT_DIR` can select a preserved export.

## Verification

- `npm run build` — production compilation, type checking, and 95 static pages passed.
- `npm run test:collection` — 248 checks passed in each of Chromium and WebKit (`BROWSER=webkit npm run test:collection`): both languages/themes at all four widths, first-viewport search and game title, 200% text, touch targets, compact returning layout, Resume navigation, saved-session preservation, initial HTML without JavaScript, responsive lazy images, and exact geometry before/after delayed image loads.
- `npm run test:experience` — 596 checks passed, including collection filter URLs, favorites, language changes, browser history, and scroll restoration.
- `npm run test:images` — 488 image variants verified; responsive transfer checks passed.
- `npm run test:web` — 1,361 hosted-site checks passed, including saved games, collection search/favorites, navigation, and mobile layouts.
- `npm run test:surfaces` — 936 shared palette, contrast, artwork, and responsive checks passed.

The focused collection results are recorded in `checks.json` and `checks-webkit.json`.
