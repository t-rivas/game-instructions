# Contextual practice — item 11

Practice appears immediately after its matching Learn concept. Each concept offers
one decision at a time; Burako's two turn questions share a selector. The existing
Poker card reveal and Moth discard helper sit directly in their matching lessons.
Dixit's question follows the existing worked scoring example. Rules, skipping,
lesson navigation and returning to the table remain available without answering.

The same shared questions and feedback serve hosted and portable Learn. Existing
reference practice remains available. Learn's reference gallery omits the relocated
practice leaves to keep control IDs unique. No scoring engine, secret-role entry,
new artwork, mastery claim, or deployment was added.

## Rule and outcome verification

New feedback describes a specific wrong option before giving the correct reasoning.
Nineteen original questions retain their answers and edition qualifications. The
zero-bid question uses the existing scoring fixture’s five cards (−50), keeping the
same verified scoring formula and showing the same context on revisit. Their
rule sections were checked against the repository's named-edition guides:

| Game | Decision and independently expected answer | Existing source content |
| --- | --- | --- |
| Skull King | Failed zero with five cards: −50; Pirate + King + Mermaid: Mermaid | `more-games.js` scoring/hierarchy; `docs/skull-trick-sources.md`; publisher [FAQ](https://www.grandpabecksgames.com/pages/skull-king), three-character exception |
| Sushi Go! | Squid nigiri on empty wasabi: 9; two tied Maki leaders: 3 each and no second place | `more-games.js` draft/round-scoring; `docs/scoring-example-sources.md` |
| Sushi Go Party! | Special Order excludes seven players; tied Pudding leaders receive 6 each | `more-games.js` menu/dessert; `docs/scoring-example-sources.md` |
| Catan | Nine resources on a seven: discard 4; city requires a third ore | `new-games.js` robber/building |
| Secret Hitler | Hitler elected with three Fascist policies: immediate Fascist win; veto at tracker two: chaos | `new-games.js` victory/legislation; veto requires five Fascist policies |
| El Camarero | Six players attempt two returns; empty draw pile alone does not end service | `new-games.js` service/scoring |
| Monopoly | Declined unowned property: immediate auction; unmortgaged unimproved street in complete group: double rent | `new-games.js` movement/property |
| Chess | No legal move without check: stalemate/draw; attacked crossing square: no castling | `new-games.js` check/special; the guide's FIDE edition |
| Burako | Coastal-variant groups allow repeated colors; rack two + pile two: draw from stock | `new-games.js` turn; retained variant label |
| Uruguayan Truco | Muestra 4 of coins: 12 of coins replaces it; piece + six: envido 35 | `new-games.js` ranking/flor-envido; retained Uruguayan muestra rules |

Five short checks reuse already verified example outcomes rather than implementing
new mechanics:

- **Coup Duke proof:** Ana and Bruno start with two coins and two influence each.
  Bruno challenges Ana's Tax and Ana proves Duke. Bruno loses one influence;
  Ana replaces Duke and finishes with five coins and two influence. Bruno has two
  coins and one influence and acts next. This is `COUP_LESSON`'s
  `tax-start → tax-challenge → tax-proof → tax-true` path. Source:
  `assets/official/sources/coup.pdf`, pp. 3 and 5; independently specified in
  `docs/coup-lesson-sources.md` and `tests/coup-lessons.cjs`.
- **Coup Contessa block:** Ana starts with five coins and two influence, pays three
  to assassinate, and Bruno's Contessa block is unchallenged. Ana retains two
  coins/two influence; Bruno retains two coins/two influence and acts next. The
  block does not refund the action cost and proves no hidden card. This reuses
  `assassin-start → assassin-response → block-claim → block-pass`. Source:
  the same rulebook pp. 3–5. The UI labels these fictional base-game examples,
  including when Reformation is selected.
- **Avalon voting:** everyone votes, including people outside the proposed team.
  Strict majority approves; a tie rejects. Source: classic Avalon rulebook
  `assets/official/sources/avalon.pdf`, Team Vote, p. 4; online
  [publisher-authored rulebook](https://avalon.fun/pdfs/rules.pdf).
- **Avalon quest submission:** only the approved team submits secret quest cards.
  Good must submit Success; Evil may choose either; cards are shuffled before
  reveal. Source: the same rulebook, Quest Phase, p. 5. Revisit opens the existing
  voting or quest stage from item 04; no actual assignments are entered.
- **Dixit:** all players finding the storyteller's card gives the storyteller zero
  and everyone else two. Decoy vote bonuses retain this edition's three-point cap.
  Source: `assets/official/sources/dixit.pdf`, 2021 refresh pp. 2–3; the existing
  `some-to-all` fixture and its independent `[0, 2, 2, 2, 2]` outcome in
  `tests/scoring-examples.cjs`. The helper remains the existing scoring component.

No source conflicts, new editions or house rules were introduced. Existing artwork
and captions retain their credits, proportions and enlargement/focus controls.

## Learning state

Answers use explicit scenario and option IDs, with metadata joined by scenario ID.
Reordering exercise definitions retains both concept assignments and expected
options. The hosted concept selector, Skull King selected example/predictions,
Coup selected example/branches, Avalon quest stage and settings, and worked scoring
choices survive language/view changes. Avalon stages use semantic phase IDs.
Existing native Poker/Moth helpers reuse their mechanics and save only example
choices. Avalon resets its example when the selected public setup changes; it
restores a stored stage only when that setup still matches. Scoring revisits select
the matching stable scenario ID and relevant controlled fact, including the failed
zero bid, tied Maki/Pudding leaders and all-correct Dixit votes. Retry clears the current answer/example and returns keyboard focus.

Session keys start with `tablefolk-practice-`, or `tablefolk-shared-practice-`
for temporary shared guides. Live game snapshots, scores, drafts, clocks and secret
roles are not read or written by this learning state. Missing, malformed and
unavailable session storage fall back to usable examples. Portable lesson navigation
keeps its established interface; its answers and helper choices use the same stable
learning keys. Dedicated screen-reader and physical-device sessions were not run.

## Validation

The new `test:practice` suite checks 25 independently expected decisions, feedback,
keyboard answers, retries/focus, skipping unanswered questions, correct example
revisits, language/view recovery, shared isolation, malformed storage, exercise
reordering, unique helper IDs and portable offline behavior. Captures cover 320,
390, 768 and 1440px, both locales/themes, plus enlarged Spanish text and image
viewer focus return with reduced motion. Screenshots disable animation for capture.

Completion checks (2026-10-06):

- `npm run build`: pass, including TypeScript and 95 static pages.
- Required suites: `test:flows` (146), `test:cards`, `test:experience` (596), and
  `test:web` (1,361) pass in Chrome.
- `test:practice`: pass in Chrome and WebKit, with 25 independent expected choices,
  precise scoring revisits, portable failed-zero total −50, state/focus checks and
  80 responsive captures plus enlarged text per browser.
- Reused lessons: `test:coup-lessons` (10 outcomes, 22 stages), `test:avalon`
  (54 quest outcomes per surface), `test:skull-tricks` (15 scenarios) and
  `test:scoring-examples` (25 worked outcomes) pass.
- `test:runtimes`: 808 checks pass. `git diff --check` and JavaScript syntax checks
  pass. The final scoring-revisit adjustment was followed by another successful
  build and the practice/scoring suites.
- Final screenshots: `/tmp/tablefolk-lesson-practice-chromium` and
  `/tmp/tablefolk-lesson-practice-webkit`. Representative captures were visually
  inspected at all four widths, including English/Spanish, both themes, Poker/Moth
  helpers, and enlarged text. A historical pre-implementation screenshot set was
  not retained; the initial helper placement was inspected in source.

Legacy lesson tests now replay explicitly when starting a fresh fixture, accept
the existing inline glossary definition, and measure visible controls rather than
collapsed glossary close buttons. The concurrent rule-search addition had a
question in the alias list; moving it to the question list preserved the addition
and fixed TypeScript. Its new preview test now expects the Play view it visits.
The initial visual pass found browser-default gray retry/navigation buttons; those
were corrected to use the existing theme before final screenshots. Earlier hosted
checks encountered export/readiness timeouts; completion runs use a fixed copy of
the built export in `/tmp/tablefolk-item11-verification`.
