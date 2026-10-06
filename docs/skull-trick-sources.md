# Item 02: Skull King visual trick lesson

Implemented 2026-10-05. Finite, authored three-player examples; no general trick engine. The hosted React lesson and portable HTML guide use `skull-tricks.js`. Character images reuse the item 01 artwork control, official image viewer, and credits. Numbered cards are explicitly schematic: none of the existing numbered artwork is altered to imply a different rank or suit.

## Verified sources

- [Grandpa Beck’s Games base rulebook](https://circlejgames.com/wp-content/uploads/2023/10/sk_rulebook_optimized.pdf), the edition already named in `more-games.js`. Printed pages equal PDF pages here. Sections: Key Terms (5), Suit Cards (8–9), Special Cards (10–11), Leading with Special Cards (12), On Your Turn (13), advanced base-box cards (23–25), Advanced Pirate Abilities (26).
- [Publisher FAQ](https://www.grandpabecksgames.com/pages/skull-king), checked 2026-10-05: Mermaid/Pirate/King, Kraken’s next leader, White Whale’s follow-suit duty, pirate-power timing.
- [Expansion Pack rulebook](https://cdn.shopify.com/s/files/1/0565/3230/4053/files/Skull_King_Expansion_Rulebook_Web.pdf?v=1753214318), page 7, First Mate Con.
- [Publisher expansion FAQ](https://www.grandpabecksgames.com/pages/skull-king-expansion), checked 2026-10-05: Pirate + First Mate + Mermaid.
- Published character art and crop dimensions: `assets/official/CARD-SOURCES.md`. Existing small images are displayed at restrained sizes, with names, effects, declarations and outcomes outside the artwork. Source links remain in the enlargement dialog.

## Independently expected outcomes

All rows play clockwise as Ana → Bruno → Cami. Cami’s full sample hand and legality explanations are included in each fixture. Outcome tests specify this matrix independently of those fixtures and do not call a rule evaluator to produce expected results.

| Fixture | Played cards | Winner | Next leader | Source pages |
| --- | --- | --- | --- | --- |
| follow-suit | Green 7, purple 14, green 10 | Cami | Cami | Base 5, 8–9, 13 |
| black-trump | Yellow 12, yellow 2, black 2 | Cami | Cami | Base 8–9, 13 |
| escape-lead | Escape, green 7, Escape | Bruno | Bruno | Base 10, 12–13 |
| all-escapes | Escape, Escape, Tigress declared Escape | Ana | Ana | Base 10–12 |
| mermaid-numbers | Black 14, yellow 14, Mermaid | Cami | Cami | Base 8–11 |
| pirate-mermaid | Mermaid, black 14, Pirate | Cami | Cami | Base 10–12 |
| king-pirate | Pirate, black 14, King | Cami | Cami | Base 10–12 |
| three-characters | Pirate, King, Mermaid | Cami | Cami | Base 11; FAQ |
| tigress-pirate | Tigress declared Pirate, Pirate, Mermaid | Ana | Ana | Base 10–12 |
| tigress-escape | Tigress declared Escape, yellow 12, yellow 2 | Bruno | Bruno | Base 10–12 |
| kraken | Green 7, black 2, Kraken | Nobody | Bruno | Base 23; FAQ |
| white-whale | Black 2, yellow 14, Whale | Bruno | Bruno | Base 24; FAQ |
| loot | Loot, green 7, green 10 | Cami | Cami | Base 10, 12, 25 |
| rosie-power | Rosie, black 14, Mermaid | Ana | Cami, chosen by Ana | Base 26; FAQ |
| first-mate | Pirate, Con, Mermaid | Cami | Cami | Expansion 7; expansion FAQ |

The publisher explicitly notes a Kraken disagreement in one print run’s player aids. These examples use its correction: the player who would have won without Kraken leads next. No contradiction with the repository’s current full rules was found. Mermaid wins the three-character combination regardless of play order; the guide’s previous universal-looking quick ranking was replaced with conditional prose. Rosie’s optional power is an explicit exception to the usual winner-leading-next rule.

## Scope and verification

Ten core examples appear in Learn. Three base-box examples and one pirate-power example are opt-ins for this practice only; they never change guide preferences or a live session. The First Mate example appears only with the guide’s Expansion Pack switch on, and explicitly asks that Con be included for that example. All are fictional three-player tables, with no Graybeard simulation, scoring exercise, or secret state.

`npm run test:skull-tricks` covers independent outcomes and legality, wrong/correct guesses, reveal/replay, previous/next and keyboard focus, variant removal, unchanged score storage, image enlargement/focus return, failed images, meaningful initial HTML without JavaScript, portable offline operation, English/Spanish, both themes, reduced motion, 320/390/768/1440px, internal overflow, touch target sizes, and enlarged text. It captures review screenshots in the printed temporary output directory. The CI workflow runs this suite after the build.

Completed checks (Chrome): production build; `test:skull-tricks` (15 independently specified scenarios on hosted and portable guides); `test:cards`; `test:flows` (146 checks); `test:rules-table` (266); `test:web` (1,276); `test:lesson-cards`; `test:runtimes` (748). `git diff --check` passed. The final build and new lesson suite were rerun after the last narrow-screen styling adjustment.

Before screenshots: `/tmp/tablefolk-skull-before`. Final EN/ES, dark/light, four-width screenshots plus enlarged text: `/var/folders/6n/3dlk445524vfg6082fr5z8nh0000gp/T/tablefolk-skull-tricks-7kCjxY`. Additional 320px numbered-card and Tigress captures: `/tmp/tablefolk-skull-final`.

The shared artwork extraction preserves the existing lesson-card behavior; runtime parity confirms the new teaching content stays with Skull King. Browser automation does not establish novice comprehension; physical-device, first-time-player and assistive screen-reader usability sessions remain outside this implementation.
