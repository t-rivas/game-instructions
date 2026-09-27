# PR #1 review

Reviewed [7 nuevos juegos](https://github.com/t-rivas/game-instructions/pull/1), head `b120768`, against current `main` at `bbd0384`. The head already contains the latest base changes. Vercel succeeded, but the original PR needed corrections before approval.

## Findings corrected locally

| Severity | Finding | Correction |
| --- | --- | --- |
| Blocking | The Node builder used string replacements that interpret `$$` as `$`, corrupting the embedded JavaScript. CRLF in `index.html` also left external script tags in the supposed standalone file. Nearby source files masked the offline failure. | Use replacement callbacks, normalize line endings, resolve paths from the builder location, regenerate the export, and check identical Python/Node output with no external dependencies. |
| Rules | Burako required different colors in groups, contradicting its explicitly selected Argentine coastal variant. The discard-pile minimum was absent. | Allow repeated colors and explain the five-tile rack-plus-discard minimum in the full rules and quick reference. |
| Rules | Monopoly incorrectly removed double rent from an entire color group when one property was mortgaged. Hotel and building-shortage instructions were imprecise. | Preserve double rent on the other unimproved, unmortgaged streets; clarify hotels and competitive shortages. Include classic starting cash, GO payment and Jail fine. |
| Rules | El Camarero’s lesson ended the game when the kitchen could no longer be refilled, before the remaining dishes had been used. | Distinguish an empty draw pile from an empty kitchen in both languages and both explanations. |
| Rules | Secret Hitler’s short lesson permitted discussion during policy selection; the full guide omitted the normal election-tracker reset and was ambiguous about reshuffling. | Require silence during selection, explain policy enactment versus election/veto, combine remaining policies with discards, and exclude self-nomination. |
| Rules | Chess wording suggested castling could cross occupied squares. CATAN omitted development-card effects; Truco omitted basic envido stakes and flor counting. | Clarify the empty castling path; add card effects and side-bet examples while retaining explicit regional scope. |
| Regression | Coup’s edition label became a generic Ambassador/Inquisitor label regardless of active options. Some new quick-reference badges stayed English in Spanish mode. | Restore the selected Coup character and Reformation state; translate badges through the shared label renderer. |

## Teaching additions

The seven new games each have two optional decision exercises. Each offers answer feedback and a direct link to the relevant full-rule section. They use existing disclosure panels and game colors, have touch targets and keyboard controls, and keep the answer when switching language or view. Existing game helpers remain in place. Practice is omitted from print output.

## Rule references

- [CATAN rules and almanac](https://www.catan.com/sites/default/files/2021-06/catan_base_rules_2020_200707.pdf) and [official base-game FAQ](https://www.catan.com/faq/basegame): development cards and turn timing.
- [Secret Hitler rulebook](https://www.secrethitler.com/assets/Secret_Hitler_Rules.pdf): elections, legislation, tracker and veto.
- [Maldón’s El Camarero rules](https://maldon.com.ar/wp-content/uploads/2018/09/REGLAMENTO-el-Camarero-2018.pdf): service, returns and ending.
- [Hasbro classic Monopoly rules](https://www.hasbro.com/common/instruct/monins.pdf): rent, mortgages, houses and hotels. Printed editions may change monetary amounts and auction conventions.
- [FIDE Laws of Chess](https://handbook.fide.com/chapter/E012023): movement, castling and endings.
- [Al Burako](https://alburako.com/es/ayuda): the specifically selected regional variant; it must not be silently mixed with Rummy rules.
- [Pagat’s Uruguayan Truco](https://www.pagat.com/put/truco_ur.html) and [Quiero Truco’s stated convention](https://quierotruco.com/reglas-del-truco-uruguayo): muestra, piece values and side bets. Local raise conventions remain explicitly table-agreed.

## Verification and limits

`npm test` passed 1,405 checks locally using headless Google Chrome. Both builders produce byte-identical exports; all twelve games render in both entry points across the responsive matrix. The suite also exercises new scenarios and the original helpers. Mobile and desktop screenshots were inspected. `git diff --check` passed.

The added GitHub Actions workflow runs the suite on pushes and pull requests. No physical phone, Safari or screen-reader test was performed. Rule review and scenario tests cover the stated editions and corrected cases; they are not a proof of every regional variant. The offline file is about 38.3 MiB because it embeds the new artwork.
