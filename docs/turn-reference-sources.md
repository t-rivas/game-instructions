# Turn references and optional tools (item 06)

The hosted and portable guides render explicit recurring phases for all 15 games.
Setup links, round/hand transitions, and game-end reminders sit outside the ordered
turn steps. Quick rules come before scoreboard or clock setup. Duplicate abbreviated
flows were removed from Coup, Avalon, Moth and Dixit; Poker retains its compact
street diagram as a reference alongside the complete betting sequence.

## Rule verification

The summaries follow the editions and variants already named in `data.js`,
`dixit.js`, `new-games.js` and `more-games.js`. The following sections were checked
against repository rule text and named source material. Existing full exceptions,
variant switches, player-count selectors and source credits remain available.

| Game | Source sections and behavior checked |
| --- | --- |
| Coup | [Rulebook](https://officialgamerules.org/wp-content/uploads/2025/02/Coup-Rulebook.pdf), Game Play, Actions, Counteractions and Challenges (PDF pp. 2–5); local `turn` / `challenges`. One affordable action, mandatory Coup at 10+, action challenge before block, then block challenge, clockwise surviving player. Inquisitor/Reformation details remain in the selected guide. See `coup-lesson-sources.md` for their verified exceptions. |
| Avalon | Publisher-authored rulebook at `assets/official/sources/avalon.pdf`, Team Building, Quest and Game End; local `teams` / `quests` / `ending`. Everyone votes together, only team members submit quest cards, then resolve before moving leadership. See `avalon-lesson-sources.md` for fourth-quest and assassination exceptions. |
| Poker | [PokerStars Hold’em](https://www.pokerstars.com/poker/games/texas-holdem/), The Blinds, Pre-Flop, Flop/Turn/River and Showdown; local `setup` / `betting` / `streets` / `showdown`. Betting ends only after everyone eligible acts and matches; all-ins and uncontested pots are distinct. Heads-up button/small-blind order and separate session endings retain the existing guide rules. |
| Moth | [Schmidt/Drei Magier rulebook](https://www.schmidtspiele.de/files/Produkte/4/40862%20-%20Mogel%20Motte/40862_Mogelmotte_DE_GB_FR_IT.pdf), English How to Play, Guard Bug, Action Cards, End of Round and End of Game; local `setup` / `insects` / `scoring`. Legal adjacent numbers, guard-only moth play, draw-and-stop, then effects and next clockwise player; penalties belong to round end. |
| Dixit | [2021 refresh rules](https://cdn.svc.asmodee.net/production-asmodeeca/uploads/2023/07/DIXIT_REFRESH_RULES_US-UK-AU_BD.pdf), How to Play, End of Turn and Playing with 3 Players; local `clue` / `vote` / `ending`. Storyteller does not vote; everyone else votes once and never for their own card. Three-player submission/refill quantities are explicit. |
| Catan | [2020 Rules & Almanac](https://www.catan.com/sites/default/files/2021-06/catan_base_rules_2020_200707.pdf), Turn Overview, Development Cards, Combined Trade/Build Phase and Ending the Game; local `turn` / `building` / `development` / `robber`. Production applies to everyone; domestic trades involve the active player. Ten points wins immediately on your own turn, including before rolling. |
| Secret Hitler | [Official rules](https://www.secrethitler.com/assets/Secret_Hitler_Rules.pdf), Election, Legislative Session, Executive Action and Veto Power; local `election` / `legislation` / `powers` / `victory`. Simultaneous vote, third failed election without a power, immediate Hitler check, and special-election return order remain explicit. |
| El Camarero | [Maldón rules](https://maldon.com.ar/wp-content/uploads/2018/09/REGLAMENTO-el-Camarero-2018.pdf), Servir/Devolver, error correction and game end; local `orders` / `service` / `bell` / `scoring`. One service or the required return count, complete bell correction, refill and next player to the right. Game end now states the actual stopping condition. |
| Monopoly | [Hasbro classic rules](https://www.hasbro.com/common/instruct/monins.pdf), Play, Buying Property, Auctions, Doubles and Jail; local `movement` / `property` / `jail`. Resolve landing before continuing; extra turns respect doubles/jail exceptions. Auction details link to `movement`, where the guide explains them. |
| Chess | [FIDE Laws effective 2023](https://handbook.fide.com/chapter/E012023), Articles 1, 3 and 5; local `pieces` / `special` / `check` / `draws`. White begins, legal movement must remove check, endings are checked before the other color acts. |
| Burako | [Alburako rules](https://alburako.com/es/ayuda), Turno, Pozo, Muertos and Fin de mano; local `turn` / `dead-pile` / `scoring`. Draw/meld/discard, with the guide’s five-tile discard-pile threshold and distinction between immediate dead-pile pickup after melding and delayed play after discarding. Stock exhaustion and closing are separate hand-end triggers. |
| Truco | [Uruguayan reference](https://www.pagat.com/put/truco_ur.html), deal/muestra and direction; local `setup` / `side-bets` / `tricks` / `bidding`. Mano leads, play/deal pass right, calls require answers before continuing, trick winner leads next, and flor/envido stays separate from the Truco stake. The existing agreed calling-window/tie conventions remain authoritative. |
| Skull King | [Named base rulebook](https://circlejgames.com/wp-content/uploads/2023/10/sk_rulebook_optimized.pdf), Key Terms, Dealing/Bidding, On Your Turn and advanced cards/powers; local `setup` / `tricks` / `hierarchy` / `scoring`. Clockwise cards, conditional winner and next leader; bidding and scoring sit outside trick steps. Optional monsters/powers can change the normal result. See `skull-trick-sources.md` for verified examples and Expansion Pack exceptions. |
| Sushi Go | [Original Gamewright rules](https://gamewright.com/pdfs/Rules/SushiGoTM-RULES.pdf), How to Play, Using Chopsticks, Ending a Round and Ending the Game; local `draft` / `round-scoring` / `dessert`. Choose/reveal/pass together, original Chopsticks timing before reveal, last-card automatic play; score only after hands empty. |
| Sushi Go Party | [Gamewright Party rules](https://gamewright.com/pdfs/Rules/SushiGoPartyTM-RULES.pdf), Playing a Turn, Special Card Actions and Ending a Round; local `deal` / `specials` / `dessert`. Simultaneous selection/reveal, immediate and numbered bonus effects before passing; preserve desserts and reshuffle non-desserts between rounds. |

Catan's named source introduces separate trade/build phases and labels their
combination as an advanced variant. The reference therefore follows the current
guide's edition-dependent order rather than imposing an unqualified combined
phase. Burako and Truco have local variations; this task preserves the repository's
named conventions instead of replacing them with another edition. No new house
rule or general game engine was introduced.

## Navigation and state

The existing per-game cached runtime remains the owner of every score, unconfirmed
entry, clock and deadline. Reference/tool buttons move focus and scroll without
recreating the tool. In full-screen play, Back to turn reference reveals quick rules;
Open game tool hides the reference again. Clock callbacks continue while reading.
A stale full-screen preference without an active session cannot hide a fresh visit's
reference. Active sessions and explicit tool bookmarks recover that preference.
Resume cards retain `#active-table-tool` and now focus the tool after recovery.

Phase links point directly to the Coup, Avalon and Skull King examples, or the
Sushi card catalog. Opening a catalog also opens its disclosure. Shared links carry
the temporary edition through these links without changing the local configuration.

## Validation

Completion review, 2026-10-05:

- `npm run build`: pass, including TypeScript and all 95 static pages.
- `test:turn-reference`: 946 checks pass in Chrome and WebKit. Covers all 15
  games at 320, 390, 768 and 1440px in both languages and themes, script-free
  references/rule targets, keyboard navigation, live scores/result/setup drafts,
  running/paused deadlines, fresh visits with stale preferences, cached Resume,
  full-screen Resume focus, temporary shared editions, direct card examples,
  catalog opening, image enlargement/focus return, reduced motion and offline use.
- Required suites: `test:flows` (146), `test:web` (1,360), `test:experience` (596),
  and `test:rules-table` (266) pass in Chrome.
- Affected tools: `test:chess` (170), `test:poker` (177), and `test:coup` (245) pass.
  Runtime parity: `test:runtimes` passes 808 checks. `npm test` passes 1,791 checks,
  including byte-identical Node/Python portable builds and all four layout widths.
- Before screenshot: `/tmp/tablefolk-turn-before.png`. Final captures:
  `/tmp/tablefolk-turn-reference-chromium` and
  `/tmp/tablefolk-turn-reference-webkit`. Full-page captures cover Coup, Chess and
  Party at each width/language/theme combination. Reviewed representative final
  reference viewports at all four widths, enlarged Spanish text and both clock
  tools in full-screen. Viewport review files use the `review-` prefix. Element
  screenshots can include the sticky navigation; use full-page or viewport
  captures to assess the complete headings.

No physical-device or dedicated screen-reader usability session was performed.
