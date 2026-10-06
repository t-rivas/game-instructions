# Item 03: Coup lesson

Implemented with shared finite examples in `coup-lessons.js`, React rendering in
`src/components/CoupLesson.tsx`, and portable rendering in the shared module.
All new text is available in English and Spanish. Reveals advance on explicit
button presses; there are no automatic timers or hidden assignment inputs.

## Verified rule sources

- `assets/official/sources/coup.pdf`; [online rulebook](https://officialgamerules.org/wp-content/uploads/2025/02/Coup-Rulebook.pdf).
  Pages 2–5: influence, actions, counteractions, challenges, replacements and
  refunds. Page 7: both double-loss cases.
- `assets/official/sources/reformation.pdf`; [online rulebook](https://www.spelhuis.be/Files/7/112000/112353/Attachments/Product/aD1jf4U81u46a97ia1719S97Nm9925v8.pdf).
  Page 1: allegiance restrictions. Page 2: Inquisitor abilities.

Confirmed against existing complete rules: blocked assassination costs 3 coins;
losing the challenge to the Assassin action refunds them. Proving a character
replaces the shown card without losing influence. A target with influence left
after losing an Assassin challenge may still claim Contessa. Double loss requires
a lost challenge followed by successful assassination. Elimination returns coins
to the bank and play skips the eliminated player.

The examples are fictional, deterministic and separate from live sessions.
Published portraits/crops retain their existing credits and enlargement controls.
Inquisitor artwork is a box portrait, not a complete card face.

## Independently expected outcomes

Order is Ana → Bruno → Cami. Everyone starts with 2 influence and 2 coins,
except Ana starts with 5 coins in the assassination example. The tuples below
are **coins / remaining influence**. Cami always keeps 2 coins and 2 influence.

| Branch | Ana | Bruno | Next | Source |
| --- | --- | --- | --- | --- |
| Tax unchallenged, truthful or bluffing | 5 / 2 | 2 / 2 | Bruno | Base 3, 5 |
| Duke proved; Bruno loses challenge | 5 / 2 | 2 / 1 | Bruno | Base 5 |
| Duke bluff challenged successfully | 2 / 1 | 2 / 2 | Bruno | Base 5 |
| Assassination without challenge/block | 2 / 2 | 2 / 1 | Bruno | Base 3 |
| Assassin bluff challenged successfully | 5 / 1 | 2 / 2 | Bruno | Base 5 |
| Assassin proved; Bruno does not block | 2 / 2 | 0 / 0 | Cami | Base 2, 5, 7 |
| Assassin proved; later Contessa block unchallenged | 2 / 2 | 2 / 1 | Bruno | Base 4–5 |
| Contessa block unchallenged, truthful or bluffing | 2 / 2 | 2 / 2 | Bruno | Base 4 |
| Contessa proved; Ana loses challenge | 2 / 1 | 2 / 2 | Bruno | Base 4–5 |
| Contessa bluff exposed, then assassination | 2 / 2 | 0 / 0 | Cami | Base 2, 5, 7 |

These are different authored hands, not a simulator with a changing secret deal.
Only proof cards and lost influence become public. A proof is replaced before
continuing; its replacement identity stays hidden. All lost influence is explicitly
named. A double loss skips eliminated Bruno and returns his coins to the bank.
The remaining-influence exception is explained alongside the scenarios.

The active exchange choice filters the visible reference characters. Reformation
has its own labeled note and rule link when enabled; the examples explicitly use
base Coup rules. Existing saved/shared guide choices and live session state are
not changed by the examples.

## Validation

`test:coup-lessons` independently specifies all 10 outcomes and traverses all 22
steps. It checks both exchange choices and languages on hosted and fully offline
guides, proof timing, unknown replacements, replay/back, keyboard focus, artwork
enlargement and focus return, image failures, meaningful prerendered text, and
unchanged live session results/drafts. Responsive captures cover 320, 390, 768 and
1440px in both themes, with reduced motion and enlarged Spanish text.

Completed checks (Chrome): `npm run build`; `test:coup-lessons` (10 outcomes,
22 steps); `test:flows` (146 checks); `test:coup` (245); `test:rules-table` (266);
`test:web` (1,276); `test:runtimes` (778). `git diff --check` passed. The final
build, new lesson suite and runtime parity were rerun after isolating example
player selectors from the session scoreboard selectors.

An initial session-reset assertion and a broad site readiness timeout failed
during parallel checks; each suite passed on its standalone rerun. Separate
Avalon work arrived in the shared workspace during this implementation and was
preserved. No Coup session/scoring implementation was changed.

Before captures: `/tmp/tablefolk-coup-before`.
Final captures: `/var/folders/6n/3dlk445524vfg6082fr5z8nh0000gp/T/tablefolk-coup-lessons-jI28hL`.
The 34 images include both language/theme combinations at all four widths,
Spanish response controls at 320px, and enlarged Spanish proof/replacement text.
Fixed page chrome is hidden only during cropped screenshot capture.

Remaining limits: these finite examples do not cover every possible deal or
Reformation turn. Browser automation and visual review do not establish novice
comprehension. Physical-device, assistive screen-reader and first-time-player
usability sessions have not been performed.
