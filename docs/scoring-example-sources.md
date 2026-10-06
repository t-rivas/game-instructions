# Item 09 — Visible scoring examples

Implemented for Skull King, Sushi Go!, Sushi Go Party!, and Dixit. Shared finite fixtures live in `scoring-examples.js`; React renders the hosted lesson in `ScoringExample.tsx`. Portable guides render the same fixtures. Examples appear in Learn’s End & win stage and directly after the portable lesson. The existing Dixit helper links to them.

## Rule verification

Checked the repository’s named editions and existing rules, card guides, and score model against these rulebooks on 2026-10-05:

- [Skull King base rulebook](https://circlejgames.com/wp-content/uploads/2023/10/sk_rulebook_optimized.pdf): printed p. 15, classic positive and zero bids; p. 16, capture-bonus eligibility and the four-player Mermaid/Pirate/King/yellow-14 example; p. 17, cards-dealt versus round fields and cumulative totals. The [publisher FAQ](https://www.grandpabecksgames.com/pages/skull-king) confirms Mermaid wins the three-character combination. `skull-score.js` was consulted for consistency, but does not calculate the teaching fixtures or their test expectations.
- [Original Sushi Go! rules](https://gamewright.com/pdfs/Rules/SushiGoTM-RULES.pdf): PDF p. 2, four players receive eight cards and Wasabi precedes Nigiri; p. 3, Maki awards and split ties; p. 4, sets, Nigiri/Wasabi and Chopsticks; p. 5, Pudding and the game-end tiebreak.
- [Sushi Go Party! rules](https://gamewright.com/pdfs/Rules/SushiGoPartyTM-RULES.pdf): PDF pp. 2–3, a legal example menu and player-count limits; p. 4, four-player eight-card deals and round/game end; p. 5 (printed pp. 8–9), Maki including 6–8 players; p. 6, sets; p. 8, Wasabi; p. 9 (printed pp. 16–17), Pudding. Party’s full tied awards remain separate from original Sushi Go’s split awards. Only the stated sample menu is used; these examples do not assume a real selected menu.
- [Dixit 2021 refresh](https://cdn.svc.asmodee.net/production-asmodeeca/uploads/2023/07/DIXIT_REFRESH_RULES_US-UK-AU_BD.pdf), also present at `assets/official/sources/dixit.pdf`: PDF p. 2, voting restrictions, scoring, decoy bonuses and game end; p. 3, the worked scoring phase. These are five-player examples for the 2021 base game, not Odyssey or Disney. Every transition changes only Dani’s vote. Storyteller Ana never votes; nobody votes for their own card.

No conflict with the repository’s current rules was found. Zero bids explicitly use the actual five cards dealt. Base classic examples remain labeled when the guide’s expansion switch is enabled. Optional powers, expansion bonuses, Rascal and Cannonball scoring are excluded from these examples; the full rules remain available. Desserts are scored after round three, separately from dish and Maki round points. With two players, Pudding has no penalty. An all-player Pudding tie gives zero.

## Independent expected totals

The regression suite hardcodes these results independently of fixture construction and the live scoring models. Lists follow the displayed order of players.

| Game / example | Initial totals | Changed totals |
| --- | --- | --- |
| Skull King / positive bid 2 | Ana 40 | Winning 1 or 3: −10 |
| Skull King / zero bid, five cards dealt | Ana 50 | Winning 1: −50 |
| Skull King / Mermaid captures King, Pirate, yellow 14 | Dani 20 + 10 + 40 + 0 = 70 | Bid missed: −10 + 0 + 0 = −10 |
| Both Sushi games / complete plate | Ana 5 + 10 + 6 + 1 = 22 | Replace one Sashimi with Chopsticks: 12 |
| Original / Maki totals 5, 5, 3, 1 | 3, 3, 0, 0 | Cami has 5: 2, 2, 2, 0 |
| Party / Maki totals 5, 5, 3, 1 | 6, 6, 3, 0 | Cami has 5: 6, 6, 6, 3 |
| Original / Pudding counts 3, 3, 1, 0 | 3, 3, 0, −6 | Dani has 1: 3, 3, −3, −3 |
| Party / Pudding counts 3, 3, 1, 0 | 6, 6, 0, −6 | Dani has 1: 6, 6, −6, −6 |
| Party / six-player Maki 4, 4, 3, 2, 1, 0 | 6, 6, 4, 2, 0, 0 | Eva has 2: 6, 6, 4, 2, 2, 0 |
| Dixit / three correct, Dani votes Bruno | 3, 4, 3, 0, 3 | Dani votes Ana, everyone correct: 0, 2, 2, 2, 2 |
| Dixit / nobody correct | 0, 5, 3, 2, 2 | Dani votes Ana, one correct: 3, 2, 1, 3, 0 |

## Artwork and implementation

Reuse the published art and original credits/image viewer. Inspected the Salmon Nigiri and Maki reference images: the originals identify Salmon accurately; Maki is a three-icon face and is explicitly presented as a type reference alongside schematic icon totals. The yellow 14 and cards without matching art are labeled schematic, never modified official artwork. The existing small Dixit images stay at restrained display sizes. Card identity, quantities, conditions and arithmetic are readable outside every image and remain usable if images fail.

Fixtures do not read or write score/session storage. Hosted examples remain mounted across learning stages; the portable binder explicitly avoids React-owned controls. Every scenario has a selector, one controlled fact, worked terms, summed total, explanation, replay with focus return, and source/full-rule links. Per-game runtime generation includes only that game’s fixtures.

## Validation

`test:scoring-examples` checks 25 independently expected outcomes on both hosted and portable offline guides, valid eight-card Sushi plates, legal Dixit votes and one-vote transitions, unchanged score storage, replay/focus, keyboard zoom and focus return, SSR text, broken images, scoring deep links, stage-state retention, English/Spanish, dark/light, 320/390/768/1440px, internal overflow, 44px controls, reduced motion and enlarged text. It also verifies the portable runtime cannot replace the hosted React example. The workflow runs this suite after building.

Before captures: `/tmp/tablefolk-scoring-before` (four games, EN/ES, four widths; dark theme). Final captures and completed check results are recorded below after validation.

Limits: finite examples do not cover every Sushi Party menu, every Skull King optional bonus, or Dixit’s three-player special setup. No live scores are entered here. Browser checks do not measure first-time-player comprehension or replace physical-device and screen-reader sessions.

Completed checks (Chrome): `npm run build`; `test:scoring-examples` (25 authored outcomes on both guides, rerun on the final export); `test:cards`; `test:skull` (669 checks); `test:flows` (146); `test:web` (1,360); `test:learning`; `test:runtimes` (808); `git diff --check`. The first web-suite run timed out during an overlapping export rebuild; its rerun against the completed export passed. The final styling adjustment was followed by another successful build and scoring-example suite.

Final screenshots: `/var/folders/6n/3dlk445524vfg6082fr5z8nh0000gp/T/tablefolk-scoring-j7yOt2` — each game in EN/ES and dark/light at all four widths, plus enlarged Spanish text at 320px. Reviewed the card names, quantities, totals, themed controls, published-image aspect ratios, and wrapped explanations visually. Saved-game isolation is checked with an existing scored Skull King round and unfinished next-round draft.
