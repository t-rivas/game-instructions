# What changes the result? — lesson comparisons

The optional pairs live in the existing Skull King trick, Coup challenge and
Avalon quest lessons. `lesson-comparisons.js` derives them from the same finite
teaching examples used by the hosted and portable guides. `LessonComparison.tsx`
renders the reusable hosted panel. Neither surface reads or writes game snapshots.
Hosted open/reveal choices use a separate learning key for each comparison;
temporary shared routes use a separate namespace. Portable reveal choices stay in
memory. Replay hides both outcomes and returns keyboard focus to Reveal.

## Verified rulebook sections

- [Skull King rulebook](https://circlejgames.com/wp-content/uploads/2023/10/sk_rulebook_optimized.pdf),
  Special Cards, printed pp. 10–11: Pirate beats Mermaid and numbered cards;
  Mermaid wins when Pirate, Skull King and Mermaid are all present, regardless
  of play order. Leading with Special Cards, p. 12: a character lead removes the
  suit-following requirement. On Your Turn, p. 13: the winner leads next.
  Independently rechecked the publisher-authored PDF for this change.
- [Coup rulebook](https://officialgamerules.org/wp-content/uploads/2025/02/Coup-Rulebook.pdf),
  Influence, p. 2; Duke / Tax, p. 3; Challenges, p. 5: the challenge loser reveals
  one lost influence permanently. Proof returns to the shuffled Court deck and
  receives a random hidden replacement before the action resolves. A successful
  challenge cancels the action. Tax has no block. Independently rechecked the
  publisher-authored PDF, also saved at `assets/official/sources/coup.pdf`.
- [Classic Avalon rulebook](https://avalon.fun/pdfs/rules.pdf), Setup, p. 2;
  Team Building, p. 3; Quest Phase notes, p. 5. Quest four needs 3 team members
  at six players and 4 at seven. Only quest four with 7–10 players needs two
  Fails. Uses the existing verified `AVALON_SETUPS` and pure roster/team/quest
  helpers; the Quest Phase exception was also rechecked in the repository's
  saved rules transcription. Original PDF verification is recorded in
  [Avalon lesson sources](avalon-lesson-sources.md).

## Independently expected pairs

`tests/lesson-comparisons.cjs` specifies these six expected outcomes literally,
without asking the model helpers to calculate expected values.

| Pair | Situation A | Situation B | Deciding fact |
| --- | --- | --- | --- |
| Skull King | Ana: Mermaid; Bruno: black 14; Cami: Pirate. Cami wins and leads next. | Ana: Mermaid; Bruno: Skull King; Cami: Pirate. Ana wins and leads next. | Skull King is present alongside Pirate and Mermaid. |
| Coup | Ana proves Duke. Ana: 5 coins / 2 influence; Bruno: 2 / 1, Captain lost. | Ana cannot prove Duke. Ana: 2 coins / 1 influence, Captain lost; Bruno: 2 / 2. | Whether Ana proves the same challenged Duke claim. |
| Avalon | 6 players, 4 Good / 2 Evil, quest 4, team of 3; 2 Success + 1 Fail; quest fails. | 7 players, 4 Good / 3 Evil, quest 4, team of 4; 3 Success + 1 Fail; quest succeeds. | Player count changes quest four's failure threshold from 1 to 2. |

Only one new outcome fixture is required: Mermaid / Skull King / Pirate in the
same play order as the existing `pirate-mermaid` example. It applies the verified
three-character exception already taught by `three-characters`. The source
`pirate-mermaid` snapshot is reused unchanged. Coup reuses `tax-true` and
`tax-caught`, including their actual named lost cards, coins and influence.
Cami stays at 2 coins / 2 influence; Bruno plays next in both branches. The
replacement's identity is never disclosed. Avalon's fictional roster and team
are regenerated at each fixed count. Anonymous submissions carry no seat labels.

Names, quantities, changed-fact markers and explanations are outside the images.
Dashed and double borders, the ◆ marker, A/B labels and text supplement color.
The static pairs are readable with animation disabled. Both situations appear
side by side on desktop and stacked on phones. Each panel retains a complete-rule
link, the source sections and relevant exceptions.

## Review artifacts and checks

Run `npm run test:comparisons` after `npm run build`. The suite covers the six
independent outcomes, identities, roster/team/submission consistency, keyboard
reveal/replay, reduced motion, language/view recovery, temporary learning
isolation, unchanged game/preferences/other practice state, offline operation,
failed images with 24px Spanish text at 320px, and both themes/languages at
390px and 1440px. Screenshots go to [comparison-review](comparison-review/README.md)
or `COMPARISON_SCREENSHOTS` when specified. Browser checks do not establish novice
comprehension or replace a screen-reader session.

Completed validation: production build (95 static pages), `test:comparisons`
(6 independent outcomes), `test:skull-tricks`, `test:coup-lessons`, `test:avalon`,
`test:practice`, `test:learning`, `test:lesson-cards`, `test:watch-turn`,
`test:runtimes` (838 checks), `test:web` (1,361 checks), and `git diff --check`.
The learning suite's initial Contents-click timeout passed on its independent
rerun. macOS browser checks ran with the launch permission required by Chromium.
The final build and comparison/runtime checks were repeated after the layout and
accessible team-label changes. The review includes 24 language/theme/size captures
and 3 enlarged-text/image-failure captures.
