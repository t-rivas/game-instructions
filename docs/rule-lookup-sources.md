# Item 12: in-place rule lookup

Implemented 2026-10-06 in the hosted React guide. Common questions are visible beside
search, including a Skull King Mermaid question. Results open complete localized
sections inside the existing dialog. Back to results restores the query, originating
link focus and result scroll position; Back to table and Escape restore the opener.
Full Rules retains ordinary section links. Open full rules and Share rule remain
available from previews, carrying the query, section and selected/shared edition.

Related cards use the existing `LessonCard.rule` section IDs and stable artwork IDs.
Exchange characters, optional Avalon roles and expansion cards follow the selected
guide options. Artwork, effects, conditions, portrait/crop notes, responsive images,
enlargement and original-source credits reuse the existing teaching data. The image
viewer and share dialog close independently, returning focus inside the preview.
Safari pointer activation explicitly focuses Share rule before opening sharing.

## Sources and preserved rule coverage

Previews reproduce every paragraph from the same edition-filtered sections used on
Full Rules, with existing bilingual/typo matching and highlighting. They display
authored content rather than constructing answers from a query or a live game.
Unmatched searches retain the existing no-results feedback. No rule paragraphs or
card effects were rewritten for this item.

- Chess: `new-games.js`, `special`, including the entire castling paragraph, the
  rook exception, en passant timing and promotion. Checked against
  [FIDE Laws of Chess](https://handbook.fide.com/chapter/E012023), articles 3.8.2,
  3.8.2.1–2 and 3.7.3.1–5. Castling requires an unmoved king/rook, an empty path,
  and safety for the king's starting, crossing and destination squares.
- Skull King: `more-games.js`, `hierarchy`, and `card-guides.js`,
  `LESSON_CARD_FACTS`. The existing named edition and base-rule sections are
  documented in [item 02 source notes](skull-trick-sources.md). Independently
  rechecked the Mermaid/Pirate/Skull King combination against the
  [publisher FAQ](https://www.grandpabecksgames.com/pages/skull-king): Mermaid wins.
  The preview preserves play-order tie rules, Tigress's declaration and the
  optional-pirate-power conditions. The complete section and related Mermaid,
  Pirate and King cards appear together in the lookup dialog.
- Other games reuse their existing localized rule sections and teaching facts.
  No new scenarios or factual answers were added for those games.

## State and output

Opening a preview changes dialog state only. The table tool DOM remains mounted.
Running Chess/Poker deadlines and countdowns continue during lookup, and a paused
Chess snapshot stays identical after dismissal. Lookup and fictional card content
preserve score storage. Sharing from a preview targets Full Rules, carrying temporary
guide choices; the existing shared-guide isolation model is retained.

Production static export and the portable offline artifacts are regenerated through
the existing build. This item changes the hosted lookup UI; the portable guide's
existing rule navigation is preserved and covered by its card/clock/timer suites.

## Validation and screenshots

`npm run build` passed, including TypeScript checking and all 95 static routes.
`git diff --check` passed. Required Chrome suites passed:

- `test:rules-table`: 266 checks.
- `test:chess`: 170 checks, including both portable pages.
- `test:poker`: 177 checks, including deterministic timing and offline pages.
- `test:cards`: published photos, variants, translations, keyboard zoom and offline pages.
- `test:web`: 1,361 hosted application checks.

`test:rule-preview` passed 93 checks in each of Chrome and WebKit and is added
to CI for both engines. It checks complete
canonical section text, independently specified castling/character conditions,
empty-query questions, bilingual/typo search, keyboard selection, focus/query
restoration, nested image/share dialogs, shared expansion links, inactive exchange
rules, unmatched queries, active/paused clocks, mounted tool identity, unchanged
scores, image failures and server-rendered questions without JavaScript.
Its screenshots cover Chess and Skull King at 320, 390, 768 and 1440px, both
languages and themes, reduced motion, internal clipping, 44px touch targets and
enlarged Spanish text/cards.

Before captures: `/tmp/tablefolk-lookup-before/empty.png` and `results.png` show
the 390px English dialog. The baseline interaction confirmed that selecting castling
left `/play/` for `/rules/`.

Final screenshot directories:

- Chrome: `/var/folders/6n/3dlk445524vfg6082fr5z8nh0000gp/T/tablefolk-rule-preview-7G3h0N`.
- WebKit: `/var/folders/6n/3dlk445524vfg6082fr5z8nh0000gp/T/tablefolk-rule-preview-SDxVNV`.

Browser checks and screenshot inspection cover the implemented UI;
first-time-player comprehension, physical-device use and assistive screen-reader
sessions remain untested.
