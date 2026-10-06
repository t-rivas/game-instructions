# Watch one turn — review

The Next lessons use the existing authored scenarios and outcomes. `WatchTurn` supplies the shared heading and visual vocabulary; game components own their sequences. CSS movement never controls state, locks input, or advances explanations. Reduced motion renders the same state immediately.

- Skull King: six reversible states, clockwise fictional seats, sequential card plays, Cami’s legal choices, winner reasoning, and the next leader. All 15 scenarios and variant filters remain available.
- Coup: existing tax and assassination branches, public coin transfers, proof versus lost influence, hidden replacement cards, and the next active player. Repeated clicks on an obsolete branch are ignored.
- Avalon: proposal seats, named public votes, secret submissions, anonymous result cards, and the separate assassination example. Recognition information remains outside the public table; player counts and optional roles still use the shared model.

Only independent learning-session state is written. Existing artwork retains its enlargement controls and textual labels.

## Validation

Passed `npm run build`, `test:skull-tricks`, `test:coup-lessons`, `test:avalon`, `test:practice`, `test:runtimes`, and `test:web`.

The existing suites verified 15 Skull King scenarios, 10 Coup outcomes / 22 stages, Avalon role configurations and quest outcomes, 25 practice decisions, 838 runtime parity checks, and 1,361 web checks. Web checks ran against a completed export copied to a temporary QA directory because another workspace build was concurrently rewriting `out`.

Added `npm run test:watch-turn` for sequential table states, rapid clicks, backward/forward determinism, replay, hidden identities, local-storage isolation, keyboard operation, image enlargement, reduced motion, language/view persistence, and table widths of 320, 390, 768, and 1440 pixels.

## Visual review

Reviewed 56 mobile captures of the opening table, legal choices, numbered-card and character exceptions, Coup payment/proof/replacement/elimination, and all five Avalon phases. Both English and Spanish were checked in light and dark themes. The existing suites also capture desktop, narrow-screen, enlarged-text, and missing-image cases.

The first review led to shorter visible face-down labels in Coup, with the full identity-hidden description retained for assistive technology. Cards, counts, winner markers, and public/secret distinctions remain readable without relying on color or movement.

| Game | English dark | English light | Spanish dark | Spanish light |
| --- | --- | --- | --- | --- |
| Skull King | [Review](en-dark-skull.png) | [Review](en-light-skull.png) | [Review](es-dark-skull.png) | [Review](es-light-skull.png) |
| Coup | [Review](en-dark-coup.png) | [Review](en-light-coup.png) | [Review](es-dark-coup.png) | [Review](es-light-coup.png) |
| Avalon | [Review](en-dark-avalon.png) | [Review](en-light-avalon.png) | [Review](es-dark-avalon.png) | [Review](es-light-avalon.png) |

To refresh raw captures, run `WATCH_SCREENSHOTS=/tmp/watch-turn-review npm run test:watch-turn` after building.
