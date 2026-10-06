# Tablefolk: understand the cards, rules, and how to play

Reviewed 2026-10-05 against commit `78be231`. This plan prioritizes learning and rule comprehension, especially **actual card examples in Skull King, Coup, and Avalon**. It contains proposed improvements and implementation prompts. Implementation status updates are recorded under the corresponding items.

Other uncommitted application work appeared during the audit, including per-game runtime loading and navigation fixes. The measurements describe the local export captured during this review. Reproduce each issue on the latest working tree before implementation and preserve that ongoing work. This task added only this planning document.

The design direction is: **show the relevant card → show what happens → explain why → let the player try**. Card images belong beside the rules they teach. Keep the complete catalog as a reference, and make examples part of the main learning experience.

## Findings from the app

The review used source inspection, a fresh successful production build, screenshots of 11 representative page/layout combinations, and browser interactions at 320, 390, and 1440px in English and Spanish. Measurements are local CSS pixels, not usability-study results. No new factual game-rule audit was performed; the prompts require checking changed explanations against the specified edition's sources.

- **Card examples are underemphasized.** Learn puts “Card photos & practice” in a collapsed section after setup and the lesson. Skull King's table card catalog and Avalon's character reminders are also collapsed. Coup already has small images in action rows; improve those rather than treating them as missing.
- **Cards are often thumbnails.** Mobile quick-reference artwork is about 40×54px; catalog image containers are about 76px wide. Some originals are small: Merlin is 100×154px and the Pirate image is 164×220px. Increasing display size alone cannot recover detail. Some Coup assets are portraits/crops, not complete card faces.
- **Lessons can be dense and distant.** Catan's first lesson starts around y=1,194 on a 390px phone; Coup's starts around y=1,368. A lesson usually renders a title and one paragraph, with examples elsewhere. Chess's main lesson describes moving a piece before explicitly teaching each piece's movement there.
- **Some “turn” diagrams show lesson headings.** `genericSheet()` builds its flow from `lessonTitles`. For Catan that includes setup and reaching 10 points; for Chess it includes setting the board and special endings. Those headings do not describe a recurring turn.
- **Useful teaching tools already exist.** Reuse the card catalogs, decision exercises, Poker hand reveal, Coup coin helper, Avalon quest helper, Moth discard practice, and Dixit scoring examples. Their placement and connections to lessons need improvement.
- **Rule questions interrupt play.** Opening a “castling” search result from table mode navigates to Full rules. Its excerpt ends before the complete conditions, requiring the player to leave their place.
- **UI competes with learning.** Fresh Coup quick rules start around y=1,420 because optional scoreboard setup comes first. Spanish guide tabs clip at 390px while Share occupies about 138px. These UI fixes matter because they make the teaching content easier to reach.

These are observed structures and behaviors. The predicted comprehension benefits of the proposed changes should be checked with first-time players.

## Recommended models and order

Use **GPT-6.1 Sol** for most implementation prompts and **GPT-6 Astra** for the larger game-specific teaching flows and lesson redesign. The assignments below are my judgment for this repository, not comparative benchmarks.

Official OpenAI documentation describes Sol as the balanced option for complex work and Astra for demanding work; its coding guidance recommends current general-purpose models such as Sol. See [OpenAI model selection](https://developers.openai.com/api/docs/guides/model-selection) and [OpenAI code generation guidance](https://developers.openai.com/api/docs/guides/code-generation). Availability depends on your coding tool's model picker.

**One model for everything: GPT-6.1 Sol, high reasoning.** Astra is the quality-oriented upgrade for the larger items. Select the model before submitting the prompt; writing its name in a prompt does not switch the running model.

| ID | Priority | Improvement | Model / reasoning | Depends on |
| --- | --- | --- | --- | --- |
| 01 | P1 | Put relevant card examples at the center of learning | GPT-6.1 Sol / high | — |
| 02 | P1 | Skull King: visually teach which card wins and why | GPT-6 Astra / high | 01 |
| 03 | P1 | Coup: teach actions, blocks, and challenges with cards | GPT-6 Astra / high | 01 |
| 04 | P1 | Avalon: teach roles, recognition, votes, and quest cards | GPT-6 Astra / high | 01 |
| 05 | P1 | Give Learn a clear, manageable teaching sequence | GPT-6 Astra / high | 01; integrate 02–04 |
| 06 | P1 | Show a real turn reference before optional game tools | GPT-6.1 Sol / high | — |
| 07 | P2 | Explain physical setup with labeled diagrams | GPT-6.1 Sol / high | 01, 05 |
| 08 | P2 | Explain unfamiliar terms in context | GPT-6.1 Sol / medium | — |
| 09 | P2 | Explain scoring with visible cards and worked totals | GPT-6.1 Sol / high | 01, 02 |
| 10 | P2 | Show rules for the selected player count and edition | GPT-6.1 Sol / high | 02–05 |
| 11 | P2 | Put practice beside the concept being learned | GPT-6.1 Sol / high | 02–05 |
| 12 | P2 | Answer common questions in place, with relevant cards | GPT-6.1 Sol / high | 01, 06 |

P1 means the core teaching experience; P2 builds on it. Suggested sequence: **01 → 02 → 03 → 04 → 05 → 06 → 08 → 07 → 09 → 10 → 11 → 12**. Implement and review one item at a time. Several tasks share components; merge each result before starting dependent work.

**Start with the first four items.** They directly address the requested emphasis on cards and establish a pattern for the other games. Collection decoration, download promotion, and scoreboard polish are outside this learning-focused backlog.

## Shared instructions

Prepend this block to an individual prompt. Alternatively, submit: **“Read docs/ui-ux-improvement-plan.md and implement item XX using its shared instructions and acceptance criteria. Complete only that item.”**

```text
Work in the Tablefolk repository. Read AGENTS.md and the relevant installed guides
in node_modules/next/dist/docs/ before writing code. Inspect current behavior first;
earlier plan items may already have changed the screen.

Optimize for a novice answering: What is this card/component? What can I do? What
happens next? Why? How do we win? Preserve the visual identity. Use plain English
and clear Spanish suitable for Uruguay, equivalent in meaning.

Reuse published card/component assets, responsive images, credits, the image viewer,
rule text, and teaching helpers. Inspect image quality. Some assets are portraits
or multi-card photos rather than full card faces: present them accurately. Do not
invent official artwork, crop away meaningful symbols, or rely on tiny printed
card text for explanations. Use semantic HTML/SVG for arrows, positions, counters,
and relationships. Supply text equivalents; color/animation cannot carry meaning alone.

Check every new or rewritten rule/example against the repository's named edition,
source notes, local rulebooks, and publisher/official sources as needed. Record the
source section for new examples and verify outcomes independently of the UI.
Resolve source conflicts explicitly. Label house rules and optional variants.
Preserve full exceptions while simplifying the main teaching sequence.

React owns the hosted interface in src/. Root JavaScript holds shared content and
tools, adapted by scripts/prepare-web.mjs and its current runtime-generation helpers.
Inspect per-game runtime loading before changing adapters. Edit source files, not generated files,
build copies, or game-night.html by hand. Regenerate with existing commands.
Preserve static export, portable offline support, existing storage keys, scores,
drafts, timer deadlines, and shared-link isolation. Examples must never alter a
live game session or record/expose real secret-role assignments.

Complete only the selected item. Finite examples with verified outcomes are enough;
do not build a complete game engine, runtime AI answer service, framework migration,
or deployment. Keep meaningful server-rendered text before scripts load.

Inspect before/after at 320, 390, 768, and 1440px in both languages/themes. Check
enlarged text, internal clipping, touch targets, keyboard focus, reduced motion,
image enlargement, and access to every example control. Run npm run build and the
item's relevant suites. Add outcome-based regression coverage for changed behavior;
keep checks proportional for visual/copy edits. Rebuild before exported-site tests.
Report changes, source verification, screenshots, checks run, and remaining limits.
```

## 01 — Put relevant card examples at the center of learning

**Problem:** The main lesson is text-first even when recognizing a card is essential. Users often need to discover an optional gallery after reading its explanation.

**Plan:** Create a reusable card-teaching block. Show the relevant artwork, localized name, effect/role, when it applies, and a link to an example or full rule. Use it directly in Skull King, Coup, and Avalon lessons. Keep only relevant cards in each lesson and the full catalog separately. Audit source quality before enlarging images.

**Files:** `GameGuide.tsx`, `src/lib/types.ts`, `official.js`, `official.css`, `card-guides.js`, `ResponsiveImage.tsx`, `scripts/prepare-web.mjs`.

**Prompt — GPT-6.1 Sol, high:**

```text
Make card examples a primary teaching element, starting with Skull King, Coup, and
Avalon. Add a reusable lesson card block keyed to stable card IDs. Show existing
factual artwork, localized name, a short plain-language effect/role, when it matters,
and an explicit example/rule link. Place relevant cards beside lesson text without
requiring “Card photos & practice” to be opened. Keep the complete catalog available.

Use a readable featured card and explanation on phones, and side-by-side examples
where space permits. Preserve artwork/aspect ratio. Make zoom easy with focus return.
Identify small portraits/crops honestly and keep explanations outside the image;
seek a credited higher-resolution original only when needed and available. Connect
repeated facts to existing content sources. Respect selected roles and variants.

Acceptance: relevant cards appear in the main lesson without opening a gallery.
At 390px, identity and explanation are understandable without zoom. Every card is
keyboard-accessible; essential cards are not discoverable only by swiping a hidden
carousel. Check the three games, both languages/themes, variants, and image failures.
Run test:cards, test:images, test:experience, and test:web.
```

## 02 — Skull King: visually teach which card wins and why

**Problem:** Following suit and winning a trick are mostly explained in text. A linear hierarchy is difficult to interpret when the result depends on special-card combinations and play order. The catalog already contains richer conditional explanations.

**Plan:** Show a small example hand, the led suit, legal choices, the played cards in order, and the winner. Let the learner predict before revealing the explanation. Teach a few verified situations, with special cases introduced after ordinary numbered cards.

**Files:** `card-guides.js`, `more-games.js`, `practice.js`, `table-guide.js`, a dedicated teaching module/component, shared card UI from 01.

**Prompt — GPT-6 Astra, high:**

```text
Create a Skull King visual trick lesson using item 01's card block. Use finite,
source-verified scenarios rather than a general simulator. Show the lead card/suit,
a sample hand, legal choices, played cards in order, winner, and why other cards
lose. Let the learner choose a card or predict the winner before revealing it.

Cover numbered cards/following suit, black trump, Escape, Pirates, Mermaid, Skull
King, and Tigress's declared choice. Include a verified Pirate + Skull King + Mermaid
example; do not imply a universal strongest-to-weakest list. Define trick/baza
visually first. Separate optional base-box cards, pirate powers, and Expansion Pack
examples, respecting selected choices. Artwork must match stated ranks/suits; where
a matching face is unavailable, use an explicitly schematic labeled card without
altering published artwork.

Acceptance: learners can identify who led, legal plays, the winner, why, and who
leads next. The Mermaid/Pirate/King exception is explicit. Provide text equivalents,
back/replay controls, and non-color cues. Examples never write to the scoreboard.
Add independently expected outcomes and run test:cards, test:flows,
test:rules-table, and test:web.
```

## 03 — Coup: teach actions, blocks, and challenges with cards

**Problem:** Novices must connect character, action, cost, block, challenge, and influence loss across several explanations. They also need to understand the difference between claiming and holding a character.

**Plan:** Present character teaching cards and two short branching examples: a challenged character claim and a blocked action. Show public claims, appropriate reveals, coins, and influence changes. Contrast truthful claims with bluffs.

**Files:** `data.js`, `enhancements.js`, `official.js`, `table-guide.js`, `GameGuide.tsx`, shared card UI.

**Prompt — GPT-6 Astra, high:**

```text
Teach Coup with visible character examples. Reuse Duke, Assassin, Captain, Contessa,
and the selected Ambassador/Inquisitor artwork. Explain action, cost/result, block,
and who may block. Distinguish actions requiring no character. Define claim and
influence at first use.

Build two finite examples: a tax claim with truthful/bluff challenge branches, and
an assassination with block/challenge branches. Show announcement, eligible responses,
reveals/replacement, coins, influence, and next player. Verify cost timing, challenge
order, and double-loss conditions before encoding outcomes. Teach that a character
action/block may be claimed without holding its card; the UI must not imply ownership
is required. Use fictional players, initially face-down hands, and timed explanatory
reveals. Support the selected exchange character; keep Reformation separately labeled.

Acceptance: learners can explain block versus challenge and the consequence of a
lost challenge. Every branch ends with explicit cards/coins and a reason. Replay
is deterministic and cannot affect the session scoreboard. Check both exchange
choices, languages, and keyboard interactions. Run test:flows, test:coup,
test:rules-table, and test:web with new scenario checks.
```

## 04 — Avalon: teach roles, recognition, votes, and quest cards

**Problem:** Role recognition is central but table character reminders are folded away. Learners must distinguish secret roles, Approve/Reject votes, and Success/Fail quest cards. Existing assets and the adaptive opening script provide the foundation.

**Plan:** Give selected roles visible teaching cards and a knowledge diagram. Then demonstrate team selection, voting, and a quest with the actual component images. Make fictional example knowledge distinct from information public during a real game.

**Files:** `data.js` (`AVALON_ROLES`, setups), `enhancements.js`, `official.js`, `table-guide.js`, `GameGuide.tsx` (`AvalonSetup`).

**Prompt — GPT-6 Astra, high:**

```text
Make Avalon's selected roles/card types central to learning. Show each selected
role's existing image, team, objective, what it knows, and what it does not know.
Add an accessible knowledge diagram for a fictional roster using the selected setup.
Recognition knowledge belongs to a role; it is not public knowledge for every player.

Reuse the player-count/capacity model and opening script. Verify Merlin,
Percival/Morgana, Mordred, and Oberon exceptions against the named edition. Where
generic role art is missing, use a labeled role tile, not invented official artwork.
Never request or show actual players' secret assignments.

Show Approve/Reject and Success/Fail artwork in distinct stages: choose team →
everyone votes → team members submit quest cards → resolve. Include the verified
quest-four player-count exception and endgame assassination. Do not merge voting
and quest resolution into the same interaction.

Acceptance: changing setup updates roles, diagram, and script consistently for
5–10 players; invalid rosters remain prevented. Learners can identify who votes,
who submits quest cards, and what each action reveals. Provide keyboard/text
equivalents. Run test:experience, test:flows, test:rules-table, and test:web.
```

## 05 — Give Learn a clear, manageable teaching sequence

Implementation status (2026-10-05): completed in the hosted guide. See
[implementation and validation notes](learning-sequence-sources.md).

**Problem:** Setup pushes lessons far down the page; one paragraph often contains several unfamiliar ideas. The checklist's “Ready to play” action can leave Learn before the actual lesson.

**Plan:** Use Objective → Recognize components → Setup → Normal turn → End/win, adapting it to each game. Teach one main idea with a relevant visual/example per step. Give experienced players a setup shortcut and preserve full-rule access.

**Files:** `GameGuide.tsx` (`Lesson`, `AvalonSetup`), `SetupChecklist.tsx`, `src/lib/types.ts`, shared lesson content, `web.css`.

**Prompt — GPT-6 Astra, high:**

```text
Restructure Learn around objective, component recognition, setup, normal turn, and
end/win. Adapt stages to each game instead of forcing four paragraphs. Use one main
concept per lesson, short action-oriented copy, relevant cards/components, and a
clear next action. Integrate items 01–04 rather than duplicating their examples.

Provide meaningful stage labels, current progress, “Already set up?”, and direct
navigation without mandatory checklist/quiz gates. Setup's primary next action
continues learning; retain a separately labeled shortcut to the table. Completed
setup can become a reopenable summary. Teach individual Chess piece movements
before expecting legal-move decisions. Keep essential legal constraints available;
optional variants and rare cases may expand in context.

Acceptance: from the top, a prepared player reaches a relevant lesson in one action
and a novice understands the next step. Preserve progress across language/view
changes, using stable IDs or migration so reordered lessons do not misread old
numeric progress. Preserve setup invalidation and temporary shared configurations.
Ensure stage and guide-tab labels fit phones; move Share if it crowds navigation.
Run test:experience, test:flows, test:rules-table, and test:web. Review sequence
and content coverage across all games.
```

## 06 — Show a real turn reference before optional game tools

Implementation status (2026-10-05): completed in the hosted and portable guides.
See [rule sources, state behavior and validation notes](turn-reference-sources.md).

**Problem:** `genericSheet()` reuses lesson headings, presenting setup or victory as recurring turn steps. Scoreboard setup precedes quick rules even for readers who only need a reminder.

**Plan:** Give every game explicit turn/round phases: who acts, what they do, resolution, and the next actor. Link relevant cards and put the reference first on fresh visits. Resume links should still open active tools directly.

**Files:** `table-guide.js`, shared game data, `GameGuide.tsx`, `SavedGames.tsx`, tool adapter/types.

**Prompt — GPT-6.1 Sol, high:**

```text
Replace genericSheet's use of lessonTitles with explicit, source-verified turn/round
phases per game: who acts, permitted/required action, resolution, and next actor.
Distinguish setup, recurring turns, round-end scoring, and game end. Link phases to
relevant card examples and precise rules. Handle simultaneous-selection games
explicitly rather than implying sequential turns.

On fresh /play/ visits show quick rules before optional scoreboard/clock setup.
Provide clear tool access and return to reference; Resume links still open active
tools. Preserve the cached runtime instance for each game, scores, drafts, deadlines, full-screen
controls, and shared-link state.

Acceptance: Catan/Chess no longer show board setup as a normal-turn step; Coup
actions are reachable without passing session setup; Sushi Go clearly explains
simultaneous choose/reveal/pass. Switching reference/tool cannot reset scores or
implicitly restart/pause clocks. Run test:flows, test:web, test:experience,
test:rules-table, and affected tool suites if runtime boundaries change.
```

## 07 — Explain physical setup with labeled diagrams

Implementation status (2026-10-06): completed in the hosted and portable guides.
See [rule sources, diagrams and validation notes](setup-diagram-sources.md).

**Problem:** Text checklists assume recognition of components and understanding of physical placement. Checking a sentence does not establish that the table is set up correctly.

**Plan:** Pair setup steps with labeled factual diagrams. Start with Chess orientation/pieces, Catan initial placement/order, and Sushi Go Party menu/deal. Reuse earlier Coup/Avalon visuals.

**Files:** `src/lib/setup-steps.ts`, `SetupChecklist.tsx`, shared content, `official.js`, existing assets, a semantic diagram component.

**Prompt — GPT-6.1 Sol, high:**

```text
Add visual setup explanations for Chess, Catan, and Sushi Go Party within Learn.
Pair each diagram with a short checklist action and component names. Reuse credited
photos for recognition and semantic SVG/HTML for placement, arrows, counts, and
labels. Decorative hero illustrations are not factual setup references.

Show Chess orientation and starting pieces; a source-verified Catan example of
intersection/road spacing and forward/reverse setup order; and Sushi Go Party menu
categories, card types, deal, and dessert preparation for a chosen count. Label
partial illustrative boards as examples. Keep contextual quantities consistent.

Acceptance: a learner can match a named component to an image and explain where it
goes. All diagrams have equivalent readable instructions. Labels fit small screens
and do not depend on color. Avoid mandatory drag/drop or precision gestures.
Verify both locales/themes, setup recovery, static/offline output. Run
test:experience, test:cards, test:images, and test:web.
```

## 08 — Explain unfamiliar terms in context

**Problem:** Terms such as trick/baza, trump/triunfo, influence, muestra, and mano can assume prior knowledge. Spanish Catan setup also says “Gran Ruta Comercial” while other passages use “Camino más largo” for the same award.

**Plan:** Define important terms at first use and offer tap/keyboard definitions later. Maintain canonical bilingual labels with useful edition aliases. Include a tiny card/example when it clarifies the definition.

**Files:** shared content, `src/lib/setup-steps.ts`, `src/lib/types.ts`, `GameGuide.tsx`, `RuleSearch.tsx`, a focused glossary module.

**Prompt — GPT-6.1 Sol, medium:**

```text
Add a contextual bilingual glossary, starting with Skull King, Coup, Avalon, Truco,
and Catan. Give essential terms stable IDs, plain definitions, canonical EN/ES
labels, useful edition aliases, and optional existing card/example references.
Explain a new term at first use in Learn; later occurrences can use accessible
tap/keyboard disclosures. Hover cannot be the only access.

Normalize inconsistent labels such as Catan's Spanish road award while preserving
aliases for recognition/search. Scope different meanings to their game. Use safe
structured annotations rather than global HTML replacements. Avoid making nearly
every word interactive or creating excessive keyboard stops.

Acceptance: users can understand “baza” and “influencia” without leaving the lesson;
closing restores focus/context. Labels agree across setup, lesson, cards, and
reference. Verify both languages and printed/static text. Run test:flows,
test:rules-table, and test:web.
```

## 09 — Explain scoring with visible cards and worked totals

**Problem:** A formula or functioning scoreboard does not demonstrate how the visible outcome becomes points. Existing card-scoring text and Dixit examples are a foundation, but their relationship to the lesson needs strengthening.

**Plan:** Show contributing cards/outcomes alongside conditions, arithmetic, and total. Start with Skull King, Sushi Go/Sushi Go Party, and Dixit. Let the learner change one controlled fact and see why the result changes.

**Files:** `card-guides.js`, `more-games.js`, `dixit.js`, `table-guide.js`, teaching helpers; consult existing score models without mutating sessions.

**Prompt — GPT-6.1 Sol, high:**

```text
Teach scoring through visible examples for Skull King, Sushi Go, Sushi Go Party,
and the existing Dixit helper. Show contributing cards/outcome, applicable condition,
each arithmetic term, and final total. Let users change one controlled fact and
explain the resulting difference in words.

Skull King: correct positive bids, missed bids, correct/failed zero bids, and bonus
eligibility using actual cards dealt. Sushi: complete/incomplete sets and a verified
combination, keeping original/Party majority and tie rules distinct. Dixit: votes,
storyteller outcome, and votes earned by other cards. Preserve variant limits.
Check source rules and independently expected results; do not let a model validate
itself. Keep examples isolated from real scores.

Acceptance: learners can trace each number to cards/outcomes and explain excluded
bonuses. Show zero/negative totals and round-end versus game-end scoring clearly.
Support replay, both languages, and keyboard access. Run test:cards, test:skull,
test:flows, and test:web with independently specified expected totals.
```

## 10 — Show rules for the selected player count and edition

Implementation status (2026-10-06): completed in the hosted and portable guides.
See [source, state and validation notes](setup-context-sources.md).

**Problem:** Some paragraphs combine several counts/variants: Coup lists three deck sizes; Sushi Go Party lists multiple deals and dessert schedules. Fresh Coup visitors also start with Inquisitor selected. Avalon already demonstrates useful adaptive instructions.

**Plan:** Extend existing setup context. Show the applicable values first and alternatives in a disclosure. Carry choices through cards, examples, lessons, and references, keeping saved/shared configurations consistent.

**Files:** `GameGuide.tsx`, `src/lib/setup-steps.ts`, `src/lib/guide-link.ts`, shared content, `scripts/prepare-web.mjs`, setup helpers.

**Prompt — GPT-6.1 Sol, high:**

```text
Make lessons reflect the chosen setup. Reuse Avalon's model; add only the context
needed for Coup deck size, Skull King optional/expansion content, and Sushi Go Party
deal/dessert/menu rules. Show applicable quantities first with “Other player counts/
variants” available. If choices are absent, show general guidance and an optional
selector; do not invent a known table size or require lengthy onboarding.

For fresh Coup preferences, default to base Ambassador; preserve explicit saved
Inquisitor choices and shared overrides. Keep Reformation independent. Show current
edition/count in lessons and relevant examples. Guide choices must not alter a
running scoreboard's fixed configuration. Extend validated share parameters only
as needed, preserving temporary shared-guide behavior and local snapshots.

Acceptance: four Coup players see one applicable deck-size explanation; changing
count updates all relevant content. Party shows one valid deal/dessert schedule.
Optional cards are labeled and discoverable without contaminating base examples.
Check old/malformed/absent storage, boundaries, shared links, language, and reload.
Run test:experience, test:cards, test:rules-table, test:coup, test:skull, and test:web.
```

## 11 — Put practice beside the concept being learned

Implementation status (2026-10-06): completed in hosted and portable Learn. See
[implementation, sources, screenshots and validation](lesson-practice-sources.md).

**Problem:** Existing exercises include feedback and retry but live in a generic collapsed helper section. Readers may never encounter a decision that checks the concept they just learned.

**Plan:** Associate exercises with lesson concepts, show one optional relevant decision after the explanation, and give feedback specific to the chosen misconception. Reuse earlier visual scenarios and existing helpers.

**Files:** `practice.js`, `enhancements.js`, `GameGuide.tsx`, lesson data/types, shared example modules.

**Prompt — GPT-6.1 Sol, high:**

```text
Map existing practice to stable lesson/concept IDs. Offer one short optional
decision after the relevant explanation, using the same cards/example context.
Reuse items 02–04 and map existing other-game scenarios and Poker/Moth/Dixit
helpers rather than duplicating mechanics.

Explain why a selected wrong option fails, show correct reasoning, and offer Try
again and Revisit example. Keep Skip/Continue available. Practice cannot gate rules.
Preserve answers/progress across language/view changes and use stable IDs when
reordering. Keep learning state separate from real games.

Acceptance: readers can learn, try, understand feedback, and continue without
searching another section. Screen-reader feedback is clear and animations optional.
Do not claim quiz completion proves mastery. Run test:flows, test:cards,
test:experience, and test:web; update practice checks for the new placement.
```

## 12 — Answer common questions in place, with relevant cards

Implementation status (2026-10-06): completed in the hosted guide. See
[source verification, screenshots and validation notes](rule-lookup-sources.md).

**Problem:** Common questions are folded away and search results leave table mode. A card question needs the card, applicable condition, and consequence together.

**Plan:** Surface a few existing common questions and show complete matched sections inside the search dialog. Add related cards/examples from stable metadata, retaining exact rule text and Full rules access.

**Files:** `RuleSearch.tsx`, `src/lib/rule-search.ts`, `GameGuide.tsx`, card/concept metadata, `web.css`.

**Prompt — GPT-6.1 Sol, high:**

```text
Make lookup an in-place learning aid. Show a few useful existing common questions
for an empty query. In the dialog, open results into complete section previews with
related card images/examples where metadata provides them. Include concise authored
answers only when verified content supports them, retaining conditions/exceptions.
Keep Open full rules and Share rule as secondary actions and ordinary links on the
full Rules page.

Use existing localized edition-filtered content and curated matching. Preserve
bilingual/typo search. Do not generate live answers, infer unknown game state, or
pretend an unmatched query was answered. Provide Back to results and Back to table
with query/focus restoration. Keep underlying game/timer state mounted. Link cards
by stable IDs, not guessed titles.

Acceptance: castling can be read completely and dismissed while staying in table
mode. A Skull King character question shows the relevant card and conditional rule.
Long Spanish answers fit 320px and enlarged text. Escape/focus, shared variants,
and background clocks behave correctly. Run test:rules-table, test:chess,
test:poker, test:cards, and test:web.
```

## Validate understanding, not just appearance

After the first four items, ask a few people unfamiliar with each game to use the app and explain their reasoning without coaching. Note help requests and incorrect interpretations:

- **Skull King:** identify the led suit, choose a legal card, predict the winner, and explain an exception using the pictured cards.
- **Coup:** distinguish an action, block, and challenge; explain what remains hidden and what changes after resolution.
- **Avalon:** distinguish role, vote, and quest cards; explain what the example role knows and who acts at each stage.
- **Across games:** find setup, complete an example turn, explain the objective, work through scoring where relevant, and resolve a doubt without losing their place.

Use those observations to adjust wording, visual prominence, and example order. Fewer clicks or larger pictures alone do not establish comprehension. Physical-device, light-theme, and screen-reader experiences were not fully validated in this audit and remain implementation checks.

Existing suites support `CHROME_CHANNEL=chrome` and, where installed, `BROWSER=webkit`. Rebuild before suites inspecting `out/`. When shared content/runtime changes, verify hosted and portable guides. Keep accurate full-rule coverage throughout the simpler teaching sequence.
