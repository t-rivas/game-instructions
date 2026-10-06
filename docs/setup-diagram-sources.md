# Physical setup diagrams — item 07

Implemented 2026-10-06. Hosted Learn places each diagram immediately below its
checklist action. The portable guide uses the same authored model, SVG and labels.
All placement instructions remain readable text. Existing Coup and Avalon teaching
visuals remain available in the learning sequence.

## Sources checked

- **Chess:** [FIDE Laws, Article 2](https://handbook.fide.com/chapter/e012023),
  especially 2.1–2.3: board orientation, the 16 pieces per side and initial position.
  The diagram is seen from White's seat: h1 and a8 are light; queens occupy d1
  (light) and d8 (dark), kings e1/e8, pawns ranks 2/7. The text lists all starting
  squares. Piece photos retain their existing Chess Villa credit and viewer links;
  the board uses schematic symbols rather than a decorative hero illustration.
- **Catan base game, 3–4 players:** [official base rules and almanac](https://www.catan.com/sites/default/files/2021-06/catan_base_rules_2020_200707.pdf),
  printed pp. 3–4 (beginner layout and components), p. 7 (Distance Rule), and p. 12
  (Set-up Phase); [current official FAQ](https://www.catan.com/faq/basegame),
  “Settlements and Cities — What exactly does the distance rule say?” and the
  setup connection exception. The repository names the base game; its component
  photo shows the sixth edition. This is a partial geometry example, not a full
  sixth-edition map. The current rulebook download exceeded the browser tool's
  size limit; the archived base rules and current FAQ support these setup facts.
  Beginner maps use the box's fixed positions/resources. Free placement uses
  clockwise then reverse order and resources from the second settlement. The
  checklist now makes that distinction explicit.
- **Sushi Go Party!:** [Gamewright Rules of Play](https://gamewright.com/pdfs/Rules/SushiGoPartyTM-RULES.pdf),
  printed pp. 2–3 (components, setup and published Sushi Go! menu), pp. 4–5
  (menu composition, restrictions, dessert additions and deal). The pictured
  published menu works at every supported count: Nigiri; Maki; Tempura, Sashimi,
  Dumpling; Chopsticks, Wasabi; Pudding. It uses Party rules. Published card crops
  retain Gamewright / Nan Rangsima credits in the viewer. The tin-back photo is
  labeled accurately; neither tiny card text nor that photo supplies instructions.

## Independently expected outcomes

- Chess: 64 squares, 32 pieces, 16 pawns, correct queen/king files and both light
  near-right corners. Both locales list piece identities and square positions.
- Catan: A's three immediate neighbors stay empty. B is one edge from A and cannot
  hold a settlement; C is two edges away via B and meets spacing if its other
  neighbors are empty. A's road occupies one adjacent edge. For four people the
  placement order is **1, 2, 3, 4, 4, 3, 2, 1**; for three it is
  **1, 2, 3, 3, 2, 1**. Hypothetical second settlement A touches forest, hills and
  fields: **1 lumber + 1 brick + 1 grain**.
- Party: two/three players receive 10 cards each; four/five receive 9; six/seven
  receive 8; eight receive 7. Dessert additions are **5, 3, 2** at two–five and
  **7, 5, 3** at six–eight. The five unused dessert cards at smaller counts stay
  out. All selected non-dessert cards enter the main deck; only each round's
  dessert batch enters. Played desserts remain with their players.

## State and output

`setup-diagrams.js` is the shared source, exported for React by the existing prepare
script. It takes bounded counts and a locale, and reads no storage or session data.
React owns the hosted figure and controls. Published artwork uses ResponsiveImage
and the existing zoom dialog. All diagram markup is authored locally and escaped;
no user text enters its HTML/SVG.

The Party example defaults visibly to four people when no guide count is chosen.
Its local example selector writes no preferences and keeps its value when setup is
reopened. A selected guide count takes precedence. Existing checklist signatures
and shared-guide isolation remain in force. Portable diagrams use the selected
guide count, or the explicitly labeled four-person example.

## Validation

`tests/setup-diagrams.cjs` checks starting positions, all seven deal schedules,
checklist reload/language recovery, example state isolation, selected-count changes,
zoom and focus return, failed-image readable fallback, server-rendered instructions,
and both source and bundled portable pages with networking disabled. It captures
both locales/themes at 320, 390, 768 and 1440px, plus enlarged-text/reduced-motion
views. Baseline captures: `/tmp/tablefolk-setup-before/`.

`npm run build` passed, including TypeScript and 95 exported pages.
`test:experience` passed 596 checks; `test:cards` passed; `test:images` verified
488 responsive variants and its transfer checks; runtime parity passed 808 checks.
The final focused suite passed in Chromium, including both portable file exports.
It also passed in WebKit for hosted output. `test:web` passed **1360** checks
against the stable export. WebKit screenshots are in
`/tmp/tablefolk-setup-after-webkit/`.
Its screenshots are in `/tmp/tablefolk-setup-after-chromium/` (48 locale/theme/size
captures and three enlarged-text captures). Visual review caught and corrected
Chess square parity, artwork IDs, image clipping, narrow order labels and inherited
SVG icon sizing before the final focused pass.

Playwright WebKit's offline emulation rejects local file navigation before app code
runs. WebKit covers the hosted diagrams; Chromium covers portable file URLs. The
suite records that distinction instead of claiming a WebKit offline pass.

Other work was building/testing the shared workspace concurrently. Final checks
use the stable export snapshot `/tmp/tablefolk-item7-verification-0bHHul/`.
These checks establish layout and deterministic examples; novice-player testing
and a physical screen-reader review remain outside this implementation.
