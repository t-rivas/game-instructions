# Learn sequence (item 05)

The hosted React guide now groups every game into Objective, Components, Setup,
Play a turn, and End & win. Navigation and practice are optional; setup does not
gate learning. The portable guide retains its existing interface and shared rule
content. No score, clock, draft, or saved setup formats were changed.

## Content and source review

- All 15 objectives, existing lessons, reminders, setup checklists and exception
  disclosures reuse the repository's bilingual content, without changing outcomes.
  `src/lib/learning-sequence.ts` lists the stable mapping for each game. Setup is
  represented by its original lesson explanation, checklist and full setup notes.
  Party keeps its menu/deal distinction: Continue learning visits the dealing
  explanation before the normal turn. Simultaneous games retain their
  simultaneous-choice explanations.
- Components use the existing credited assets and viewer, with original proportions.
  The component lists name existing items; they introduce no new game mechanics.
- Skull King, Coup and Avalon retain the verified examples from items 02–04,
  available directly in the turn stage. See `skull-trick-sources.md`,
  `coup-lesson-sources.md` and `avalon-lesson-sources.md` for scenario verification.
  Their state stays mounted while changing stages.
- Chess adds six focused movement explanations before the move/capture lesson.
  Checked against `new-games.js` → chess → `pieces`, `special`, `check`, and the
  named [FIDE Laws effective 1 January 2023](https://handbook.fide.com/chapter/E012023):
  Article 3.1 (occupancy/capture), 3.2–3.6 (sliding pieces and knight),
  3.7 (pawn), 3.8–3.9 (king and check). These describe movement patterns, not
  an engine for deciding legal positions. Special moves remain available in an
  adjacent disclosure, including promotion, en passant, and castling conditions.
  Answer check belongs to the normal-turn stage; the piece lessons precede it.
  No source conflicts or new house rules were introduced.

## Persistence and limits

`tablefolk-lesson-{game}` retains its key but now stores semantic IDs. Existing
numeric values migrate using the previous lesson order. Missing/malformed or
currently unavailable steps display the objective; an optional lesson's stored ID
is retained so reenabling it can restore context. Shared-guide progress uses a
separate `tablefolk-shared-lesson-{game}` key. Checklists retain their existing
configuration signatures and shared-mode isolation.

Bookmarks to setup, setup exceptions, the three game examples and scoring now
reveal their containing stage, including on a fresh load. Only examples available
for the current game are accepted. Scoring stays mounted to retain its selections
but appears only in the scoring lesson. Mobile checklist actions use full-width
rows so the Continue learning and table shortcuts remain readable. The lesson
selector has a 44px minimum touch target in both Chromium and WebKit. Reopening a stage retains example state.
These changes reuse existing rules and example outcomes; no rule text was authored
or rewritten during the completion pass.

Validation uses browser regression coverage for every game in both languages,
Chess movement order, old progress migration, language/view persistence, setup
continuation, shared isolation, focus, image enlargement, and 320/390/768/1440px
layouts in both themes. Screenshot locations are listed below.
These checks do not replace first-time-player or screen-reader usability testing.

## Validation results

Completion review, 2026-10-05:

- `npm run build`: pass, including TypeScript and 95 static pages.
- `test:experience`: 596 checks pass. `test:flows`: 146 portable flow checks pass.
- `test:web`: 1,360 checks pass, including static text, routing, storage and mobile
  layouts. `test:rules-table`: 266 checks pass. The previously recorded clock
  layout failure no longer reproduces in the current tree.
- `test:scoring-examples`: all 25 independently expected outcomes pass in hosted
  and portable guides. `test:lesson-cards`: pass, including variants, enlargement,
  focus restoration, image failures and responsive layouts.
- Checked migration of every existing numeric base lesson across all 15 games:
  each resolves to its original content after stage reordering.
- `test:learning`: pass in Chrome and WebKit. Covers all games in both languages, readable lesson content,
  menu/deal continuation, bookmarks, optional-card restoration, example branch
  persistence, malformed progress, shared isolation, keyboard focus, image zoom,
  reduced motion and enlarged text. It now runs in Chromium and WebKit in CI.
- Responsive captures cover 320, 390, 768 and 1440px, both languages and themes,
  including Coup recognition, Chess movement and Party preparation. The original
  screenshots remain in `/tmp/tablefolk-learn-review`; final screenshots use
  `/tmp/tablefolk-learn-review-chromium` and `/tmp/tablefolk-learn-review-webkit`.
  Reviewed representative captures at each width, including enlarged text.

No physical-device or dedicated screen-reader session was performed. Published
artwork is reused at its existing resolution; no artwork was created or retouched.
