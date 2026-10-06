# Guided Learn review

Each lesson has one heading, its explanation and relevant visual, a prominent Next action, and a quieter Previous action. Compact progress and a single Contents panel replace stage buttons, the lesson selector, and the second lesson list. Contents groups every lesson by stage, marks the current lesson, closes on selection, and supports Escape with focus returning to its summary.

The selected setup stays visible. Change reveals variant and player-count controls; Avalon’s Change goes directly to its setup lesson. Its three existing setup steps now use the same Contents and Next flow. Sushi Go Party shows menu preparation and dealing in their respective lessons. All checklist diagrams stay mounted.

Already set up? goes directly to useful learning in one action. Full rules and rule search stay in the guide toolbar; Share and Print are under More. Optional practice starts collapsed, and Next never requires an answer. Glossary definitions remain available through their terms, reducing repeated explanations in the reading flow. The final reminder appears once in its lesson.

Semantic lesson IDs, numeric progress migration, temporary shared progress, bookmarks, and language/view recovery are preserved. The former Avalon setup position migrates into the unified flow. Setup tools, examples, scoring examples, and helper tools stay mounted during lesson navigation.

## Before / after

Fresh Coup visitors, dark theme, 900px viewport height. Each image captures the full page; before images were saved before editing the interface.

| Width | English before | English after | Spanish before | Spanish after |
| --- | --- | --- | --- | --- |
| 320 | [Before](before/en-320.png) | [After](after/en-320.png) | [Before](before/es-320.png) | [After](after/es-320.png) |
| 390 | [Before](before/en-390.png) | [After](after/en-390.png) | [Before](before/es-390.png) | [After](after/es-390.png) |
| 768 | [Before](before/en-768.png) | [After](after/en-768.png) | [Before](before/es-768.png) | [After](after/es-768.png) |
| 1440 | [Before](before/en-1440.png) | [After](after/en-1440.png) | [Before](before/es-1440.png) | [After](after/es-1440.png) |

Additional views: [Contents](after/contents-es-390.png), [setup options](after/options-en-390.png), [single card](after/card-en-390.png), [optional practice](after/practice-en-390.png), [Sushi Go Party deal for eight](after/sushi-setup-es-320.png), [Avalon roles](after/avalon-setup-es-320.png), [chess setup](after/chess-setup-en-768.png), [Catan setup](after/catan-setup-es-1440.png).

Refresh after images with `node docs/learn-review/capture.cjs` after a build. Set `TABLEFOLK_EXPORT_DIR` to a fixed copy of `out` when another task is rebuilding the shared export.

## Validation

Passed `npm run build`, `npm run test:learning`, `npm run test:experience` (596 checks), and `npm run test:web` (1,361 checks). Learning covers all 15 games in English and Spanish, 320/390/768/1440px layouts, direct Contents access, prepared-player shortcuts, semantic and numeric progress recovery, variant restoration, bookmarks, mounted example identity, optional answers, and keyboard/image-viewer focus.

Setup diagrams, glossary, scoring examples, and optional practice suites also pass. Their checks include seven Sushi Go Party deal schedules, 25 worked scoring outcomes, 25 practice outcomes, language/view recovery, and isolation from live game state. The learning paragraph assertion targets `.lesson-explanation`; Inquisitor is explicitly enabled before testing its lesson.
