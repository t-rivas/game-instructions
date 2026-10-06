# Contextual glossary (item 08)

`glossary.js` owns 13 game-scoped stable term IDs, canonical bilingual labels,
recognition aliases and rule-section references. The preparation script exports
its data and plain-text parser for React; portable Learn uses the same facts.
Annotations consume plain strings and React nodes; they never replace HTML.
Each term is annotated at most once per passage, at whole-word boundaries.

Learn explains the first mention in each independently navigable passage directly.
Card explanations and later example passages offer inline button disclosures.
Escape or Close definition returns focus to the term. Printing includes closed
explanations. No learning or live-game storage is written by the glossary.
No new artwork or gameplay outcomes were introduced.

## Definition verification

- Skull King: `more-games.js` sections `tricks`, `hierarchy`, `setup`, `scoring`;
  [base rulebook](https://circlejgames.com/wp-content/uploads/2023/10/sk_rulebook_optimized.pdf),
  Playing a Round, Bidding, Card Types and Scoring. A trick is one card per player;
  Kraken can destroy it. Black numbered cards beat ordinary numbered suits, not
  every character. Bid means predicted tricks, not coins. See also
  [publisher rules and FAQ](https://www.grandpabecksgames.com/pages/skull-king).
- Coup: `data.js` sections `setup`, `turn`, `challenges`, checked against the
  [rulebook](https://officialgamerules.org/wp-content/uploads/2025/02/Coup-Rulebook.pdf),
  pages 2–5, Influence, Counteractions and Challenges. Each hidden card is one
  influence; a revealed card no longer supplies influence. Blocks are claims and
  challenges determine who loses influence. Existing Inquisitor exceptions remain
  in full rules; definitions do not change allowed actions or blockers.
- Avalon: `data.js` sections `teams` and `quests`; the repository's
  `assets/official/sources/avalon.pdf`, Team Building and Quest phases, and
  `docs/avalon-lesson-sources.md`. A Leader proposes; everybody votes; the approved
  team submits secret quest cards. Quest thresholds stay in the existing lesson.
- Uruguayan Truco: `new-games.js` sections `setup`, `ranking`, `tricks`, consistent
  with [Pagat's Uruguayan rules](https://www.pagat.com/put/truco_ur.html), Deal,
  Ranking and Play. Muestra determines the pieces' suit. Mano as a player means
  the person to the dealer's right; «la mano» also means the dealt hand. It is
  scoped to Truco and never annotated in other games as that player role.
- Catan: `new-games.js` section `building`, checked against
  [Game Rules & Almanac](https://www.catan.com/sites/default/files/2021-06/catan_base_rules_2020_200707.pdf),
  Building Roads / Longest Road (pages 4, 9–10), Knight Cards / Largest Army
  (pages 5, 9). Both awards are two points. Longest Road starts at five continuous
  roads; Largest Army starts at three played Knights; taking either requires
  exceeding its current holder. The full rule keeps branching/interruption/tie
  conditions. Spanish setup now uses «Camino más largo» and «Gran ejército», as
  in the existing rules. «Gran Ruta Comercial» remains a glossary/search alias.

The bilingual definitions are authored summaries, not verbatim translations of
edition labels. No source conflicts or house rules were introduced.

## Validation

- `npm run build`: production export, TypeScript and portable generation pass.
- `npm run test:glossary`: scoped parsing, valid rule IDs, contextual EN/ES
  definitions, Catan alias search, Enter/Escape/Close focus return, printed closed
  definitions, enlarged text at 320px, reduced motion, image enlargement,
  pre-script objective and portable Learn pass.
- `CHROME_CHANNEL=chrome npm run test:flows`: 146 checks pass. Bundled Chromium
  failed the harness's offline connectivity assertion; installed Chrome passes.
- `npm run test:rules-table`: 266 checks pass.
- `CHROME_CHANNEL=chrome npm run test:web`: 1,360 checks pass. The pre-script
  objective check compares the original text after excluding authored definitions.
- 80 lesson captures cover the five games, EN/ES, light/dark and 320/390/768/1440px
  in `/tmp/tablefolk-glossary-review`. Browser checks find no page overflow; visual
  review included Spanish Coup at 320px and English Skull King at 390px.
  Light-theme term button contrast and printed lesson visibility were corrected
  during review. Physical devices and a live screen reader were not tested.
