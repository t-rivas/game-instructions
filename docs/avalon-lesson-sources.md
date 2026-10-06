# Avalon lesson verification — item 04

Implemented for **The Resistance: Avalon**, the classic edition used by this repository. It retains the guide's Merlin + Assassin convention and existing 5–10-player capacity controls. No Big Box characters, live secret-role entry, or session scoring were added.

## Sources checked

The primary source is the publisher-authored eight-page rulebook already saved at `assets/official/sources/avalon.pdf`, linked by the guide as [Avalon rules](https://avalon.fun/pdfs/rules.pdf). The PDF is scanned: pages 2–7 were rendered and visually inspected. `assets/official/sources/avalon-rules.html` was also checked for team voting, quests and game end. Existing source credits remain in the image viewer.

| New lesson content | Source section / PDF page |
| --- | --- |
| Player counts, side capacities and quest team sizes | Setup, p. 2; Team Building, p. 3; existing `AVALON_SETUPS` reused |
| Merlin's opening recognition; ordinary Evil recognition | Evil Reveals Itself and Merlin Looks, p. 2 |
| Everyone votes; simultaneous public reveal; strict majority, ties, clockwise leadership and five rejections | Team Vote, p. 4 |
| Only team members submit; Good must choose Success; Evil may choose either; shuffle submitted and unused cards separately | Quest Phase, p. 5 |
| Quest four needs two Fails only at 7–10 players; quest five still needs one | Quest Phase notes, p. 5 |
| Three failures; three successes followed by one assassination guess; no role reveal before the guess | Game End / Assassinate Merlin, p. 6 |
| Percival/Morgana ambiguity, Mordred hidden from Merlin, Oberon outside Evil recognition | Optional Character Cards and opening script, p. 7 |
| Five-player Percival balance advice | Optional Character Cards, p. 7 |

The optional script's shorthand “Minions of Mordred, not Mordred himself” must be read with the character definitions: Merlin knows Evil except Mordred, including Oberon. The existing adaptive script and the new diagram retain that interpretation. Opening recognition identifies people and loyalties/candidates, not exact Evil character cards. The guide continues to include Merlin and Assassin; the source permits playing without Merlin, outside the guide's chosen setup convention.

## Independently specified example outcomes

- Quest 4 sends 3 / 3 / 4 / 5 / 5 / 5 people at 5 / 6 / 7 / 8 / 9 / 10 players.
- At 5–6 players: zero Fails succeeds, one or two fails.
- At 7–10 players on quest 4: zero or one Fail succeeds; two fails.
- On quests 1 and 5 at every count: zero Fails succeeds; one or two fails.
- The proposed fictional team contains two Evil seats, allowing all three demonstrated Fail totals without implying Good may play Fail. Submitted cards remain anonymous and are never mapped back to a seat.
- Votes: 3 / 4 / 4 / 5 / 5 / 6 approvals are a strict majority at 5–10 players. Votes are shown individually only after their reveal.
- Rejected examples: 2 / 3 / 3 / 4 / 4 / 5 approvals at 5–10 players. The even-count examples are ties. A rejected proposal submits no quest cards; leadership passes clockwise and the quest number stays unchanged. These compare individual proposals, not a live rejection counter. The fifth-consecutive-rejection rule is explained separately.
- All four optional roles at 10 players: Merlin sees Assassin, Morgana and Oberon; Percival sees Merlin and Morgana as indistinguishable candidates; Assassin, Morgana and Mordred see one another; Oberon sees nobody. Ordinary Good sees nobody. Without Morgana, Percival sees only Merlin.
- The separate endgame example explicitly assumes three completed successful quests. A correct Merlin guess wins for Evil; an incorrect guess wins for Good.

## Assets and implementation

Inspected `avalon-team.jpg` (250×161 paired Approve/Reject tokens), `avalon-mission.jpg` (250×180 paired Success/Fail cards), and the small role portraits (Merlin 100×154). Photos retain their aspect ratios and are labeled as paired components or portraits. Generic Servant/Minion roles use text tiles. No invented or altered official artwork.

`avalon-lessons.js` owns shared copy and pure fictional-roster/quest models. `prepare-web.mjs` generates the hosted model module and serialized catalog; `AvalonLesson.tsx` owns hosted interactions. The same model and copy drive portable rendering. The opening script is reused from the existing runtime. Setup changes reset only the practice sequence; no practice data is persisted, and scores/timers/secret assignments are never read or written.

## Completion of the inherited implementation

The inherited suite stopped at its replay focus assertion before reaching the
remaining browser checks. Inspection also found that the portable version omitted
the individual anonymous result cards and replaced its feedback regions on each
interaction. Its assassination controls lacked the hosted pressed-state semantics.

Both surfaces now show public team membership, all-player votes, the approved
team's hidden submissions, and anonymous result cards in separate stages. A rejected
vote cannot advance to quest submission. Both surfaces preserve the live feedback
region, opening-script disclosure, image controls and keyboard focus. React focuses
the new heading after the DOM update. Tests wait for the resulting focus state.
The paired component photos have explicit left/right labels outside their images.
The source rulebook is linked directly from the lesson.

The completion reused the existing role/capacity data, opening script, artwork and
runtime generation. It added pure team/vote helpers, not a game simulator. Replay
resets the example's choices and leader; it retains the selected example quest.

`tests/avalon-lessons.cjs` covers independently authored knowledge fixtures, valid capacities, 54 quest outcomes on each surface, setup shrinkage, opening script agreement, voting/quest stage separation, assassination branches, replay, image enlargement/focus return, state isolation and offline execution. Responsive screenshots cover 320, 390, 768 and 1440px in English/Spanish and dark/light themes; enlarged text and reduced motion are also checked.

Completion checks additionally cover 12 independently expected vote totals,
rejection/tie handling, the unchanged quest and next leader, anonymous card counts,
stable live regions, pressed states, image failure, touch targets, internal clipping,
and preservation of an existing live Coup session. Runtime parity checks that Avalon
teaching data stays in Avalon's runtime.

Before screenshots: `/tmp/tablefolk-avalon-item4-before`.

## Completed validation

The final production build passed, including TypeScript and all 95 static pages.
All checks below passed in Chrome against the rebuilt output:

- `test:avalon`: role knowledge and valid capacities; 54 quest outcomes on each
  surface; approved/rejected vote examples for all six player counts; hosted and
  offline parity; keyboard/focus, enlargement, image failure and saved-state checks.
- `test:experience`: 596 checks.
- `test:flows`: 146 checks.
- `test:rules-table`: 266 checks.
- `test:web`: 1,276 checks.
- `test:runtimes`: 808 checks, including Avalon/Coup data isolation.
- `git diff --check`: passed.

Final screenshots: `/var/folders/6n/3dlk445524vfg6082fr5z8nh0000gp/T/tablefolk-avalon-Vf2orf`.
They cover 320/390/768/1440px in English/Spanish and dark/light themes, each phase
in Spanish at 390px, and enlarged rejection examples at 320px on both surfaces.
The visual review checked the public team, vote tokens, hidden submissions,
anonymous result cards and separate assassination stage. Fixed page chrome is
hidden only while capturing cropped lesson screenshots.

Physical devices, a screen reader and novice comprehension sessions remain manual follow-ups. This is a finite teaching example, not a game simulator.
