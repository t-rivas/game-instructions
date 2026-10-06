# Item 10 — Rules for the selected setup

The guide has optional player counts for Coup (2–10) and Sushi Go Party! (2–8).
Unknown counts stay unknown. The compact summary shows applicable quantities first;
setup details and other counts/variants are disclosures. The same shared model in
`setup-context.js` feeds hosted and portable lessons, checklists and Party quick
references. Learn also shows the current edition/count beside lesson content.

Fresh Coup uses Ambassador. Only an explicit saved Inquisitor choice enables that
variant; malformed or missing exchange values use Ambassador. Reformation remains
an independent switch. Seven or more players need the expansion's extra character
copies, even if allegiance rules are off. Skull King keeps the existing independent,
labeled base-option/pirate-power practice selectors and Expansion Pack switch;
core examples remain unchanged.

## Verified quantities and sources

Checked 2026-10-06 against the named editions and existing repository rules:

- Coup: `assets/official/sources/coup.pdf`, Setup; three copies of five character
  types, two influence and two coins each, one starting coin with two players.
  `assets/official/sources/reformation.pdf`, p. 2, “More than Six Player Variant”:
  7–8 players use four copies each (20 total); 9–10 use five (25 total).
  “Inquisitor Variant” replaces Ambassador independently of allegiance rules.
  [Online Reformation rulebook](https://www.spelhuis.be/Files/7/112000/112353/Attachments/Product/aD1jf4U81u46a97ia1719S97Nm9925v8.pdf).
- [Sushi Go Party! official rules](https://gamewright.com/pdfs/Rules/SushiGoPartyTM-RULES.pdf),
  PDF p. 3 / printed pp. 4–5: menu categories, unavailable cards at 2 and 7–8
  players, dessert table and deal table. Deals: 2–3 → 10; 4–5 → 9; 6–7 → 8;
  8 → 7. Desserts added in rounds 1/2/3: 2–5 → 5/3/2 (five unused);
  6–8 → 7/5/3. PDF p. 2: flip Maki to the 6–8-player side when applicable.
  Existing Party examples remain explicitly fictional and describe their own
  count/menu; selecting a guide count does not rewrite verified example outcomes.
- Skull King: base rulebook's advanced base-box cards and pirate abilities,
  recorded in `skull-trick-sources.md`; current full sections `base-options`,
  `pirate-powers`, `expansion-setup`. The [publisher rules page](https://www.grandpabecksgames.com/pages/skull-king)
  was checked. No new trick or scoring rules were introduced.

The prior scoring-example notes describe a four-player eight-card Party plate.
The publisher's setup table explicitly deals **nine** at four players; that existing
finite example is a partial illustrative plate, not a setup deal. Item 10 follows
the publisher's deal table and leaves the prior example's arithmetic untouched.
No new art was added or modified; existing credits and zoom stay available.

## Persistence and sharing

`guidePlayers` is separate from Avalon's existing `players` and from live rosters.
Validated optional counts persist under `tablefolk-preferences.guideCounts`, keyed
by game, merging unrelated preferences/counts. Existing storage keys stay intact.
Absent, malformed and out-of-range values resolve to null. Hosted shared links use
`players` only with `shared=1`; canonicalization removes invalid counts. Shared
choices remain temporary, follow language/view navigation and share URLs, and
restore the local snapshot when leaving shared mode. Base Ambassador is the
fallback for old shared links that lack an exchange value. Explicit Inquisitor
links still work. Guide choices never write session score/draft keys.

## Validation

Source inspection established the original general paragraphs and fresh Inquisitor
fallback before changes. No baseline screenshots were retained. Final captures
cover EN/ES, dark/light and 320/390/768/1440px, with expanded disclosures,
keyboard controls, reduced motion and enlarged Spanish text. Details and final
suite results are recorded below once the combined build is complete.

The outcome-based `test:setup-context` independently specifies count boundaries,
deck/deal/dessert quantities and menu exclusions. It covers absent/old/malformed
storage, saved Inquisitor, independent counts, reload, shared overrides and local
snapshot restoration; it also checks a running Coup session and a scored Skull
King round with an unfinished draft. Existing finite examples stay separate from
live sessions. Physical-device and screen-reader testing remain unperformed.

Completed: `npm run build`; `test:setup-context` (316 checks); `test:experience`
(596); `test:cards`; `test:rules-table` (266); `test:coup` (245); `test:skull`
(669); `test:runtimes` (808); `git diff --check`. The original `test:web` run
passed 1,360 checks. Later runs encountered intermittent readiness timeouts, including one after
copying the export. The final rerun passed all 1,360 checks against the immutable
completed export, with diagnostic logging added only to its temporary test copy;
assertions and timeout limits were unchanged. Concurrent builds were present, but
the exact cause of every timeout was not established.

Final screenshot folder: `/var/folders/6n/3dlk445524vfg6082fr5z8nh0000gp/T/tablefolk-setup-context-L2PK0l`.
Includes all three games in EN/ES, dark/light, 320/390/768/1440px, plus enlarged
Spanish at 320px. Reviewed compact count/deal summaries, explicit dessert rounds,
wrapped Spanish disclosures, and both themes visually. The suite verifies internal
clipping, 44px targets, keyboard disclosure access and adaptive diagram quantities.
The existing cards suite also passed enlargement, focus-return and offline checks.

Stable validation export: `/var/folders/6n/3dlk445524vfg6082fr5z8nh0000gp/T/tablefolk-item10-validation-Z9VnJC`.
This copy contains the final build and generated data, insulating longer browser
checks from other tasks' ongoing builds in the shared workspace. No deployment.

Final web rerun: **passed 1,360 checks**. Screenshots:
`/var/folders/6n/3dlk445524vfg6082fr5z8nh0000gp/T/tablefolk-next-DIgYTZ`.
All requested suites passed, as did the new 316-check setup suite.
