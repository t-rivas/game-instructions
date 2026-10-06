# Tablefolk mobile review

Open [the before/after gallery](index.html) to switch between capture profiles. Each image links to its original PNG. There are 49 before and 49 after captures, covering collection, Learn, an animated turn, its outcome, a comparison, rule search, and an active chess-clock session.

| Profile | Before | After |
| --- | --- | --- |
| English · dark · 390px | [Collection](before/en-dark-390-collection.png) | [Collection](after/en-dark-390-collection.png) |
| Spanish · light · 320px | [Collection](before/es-light-320-collection.png) | [Collection](after/es-light-320-collection.png) |
| English · light · 320px | [Collection](before/en-light-320-collection.png) | [Collection](after/en-light-320-collection.png) |
| Spanish · dark · 390px | [Collection](before/es-dark-390-collection.png) | [Collection](after/es-dark-390-collection.png) |
| Spanish · light · 768px | [Collection](before/es-light-768-collection.png) | [Collection](after/es-light-768-collection.png) |
| English · dark · 1440px | [Collection](before/en-dark-1440-collection.png) | [Collection](after/en-dark-1440-collection.png) |
| Spanish · light · 1440px | [Collection](before/es-light-1440-collection.png) | [Collection](after/es-light-1440-collection.png) |

Representative English phone flows:

| Flow | Before | After |
| --- | --- | --- |
| Learn · Duke | [Before](before/en-dark-390-learn.png) | [After](after/en-dark-390-learn.png) |
| Animated turn | [Before](before/en-dark-390-example.png) | [After](after/en-dark-390-example.png) |
| Winner | [Before](before/en-dark-390-example-outcome.png) | [After](after/en-dark-390-example-outcome.png) |
| Comparison | [Before](before/en-dark-390-comparison.png) | [After](after/en-dark-390-comparison.png) |
| Rule search | [Before](before/en-dark-390-search.png) | [After](after/en-dark-390-search.png) |
| Active clock | [Before](before/en-dark-390-clock.png) | [After](after/en-dark-390-clock.png) |

Collection, Learn, and search captures show the actual viewport. Examples, comparisons and clocks show the complete component at the selected width, allowing long explanations and outcomes to be inspected. The clock session is started and paused to keep before/after timing identical. Captures use reduced motion; the existing animation tests separately exercise normal motion and immediate reduced-motion outcomes.

The phone collection keeps search and game actions in the first viewport. Filters summarize selections in a disclosure; cards place Learn, Play and Favorite in a dedicated action row. At enlarged text sizes, cards and actions reflow based on their available text space.

The guide uses one compact toolbar, with secondary actions in an overflow menu. Contents, Full rules and rule search remain available. Lessons connect the card, explanation and next action. Phone examples emphasize the current card and action while retaining every earlier card, legal choice, explanation and outcome. Comparisons stack with explicit changed-fact markers. Search, sharing and image enlargement use full-screen phone dialogs with visible close controls.

Presentation changes keep tools mounted. Resize, rotation, theme and language changes preserve learning positions, example branches, scores, drafts and timer deadlines. Scroll clearance follows the toolbar's measured height; dialogs follow the visual viewport when its height changes.

Reproduce the review:

```sh
npm run build
npm run review:mobile
npm run test:phone
```

To capture a baseline before editing, run `REVIEW_PHASE=before npm run review:mobile` against the baseline build. The committed before captures were taken before the source changes.

Validation covers the production static export, collection reflow at 16px and 32px root text, touch targets, nested dialog focus, authored comparison results, all Skull King scenarios, example state and motion, bilingual learning, saved game recovery, shared configurations, offline behavior and full-screen tools. The new phone check also exercises a 320×360 reduced viewport with the search field focused, landscape deadlines, and unfinished score drafts. This is a keyboard-geometry simulation; a physical phone keyboard was not exercised.

The initial build and 431 existing control checks passed before edits. During implementation, new layout issues found by tests were corrected, including returning to the same scroll position in a filtered collection. The collection remembers whether its filter panel was open for that session. Tests that accessed secondary controls directly now open their visible disclosures first, retaining their original rule, outcome, storage, focus and timing assertions. No test failures remain.

| Validation command | Result |
| --- | --- |
| `npm run build` | Passed; 95 static pages generated, including TypeScript checking |
| `npm test` | 1,791 checks passed; both offline entries at 320, 390, 768 and 1440px |
| `npm run test:web` | 1,361 hosted navigation, route, save/recovery and tool checks passed |
| `npm run test:collection` | 248 composition, enlarged-text, Resume and image-stability checks passed |
| `npm run test:experience` | 596 filter-history, scroll-restoration, setup, Resume, image and recovery checks passed |
| `npm run test:controls` | 431 mobile target and nested-focus checks passed |
| `npm run test:rules-table` | 266 search, sharing, QR and table checks passed |
| `npm run test:learning` | All 15 games, preserved examples, keyboard navigation and bilingual responsive captures passed |
| `npm run test:comparisons` | Authored outcomes, changed facts, stacking, image fallback and enlarged text passed |
| `npm run test:skull-tricks` | All 15 scenarios, legal choices, outcomes, predictions and isolation passed |
| `npm run test:watch-turn` | Rapid input, deterministic replay, privacy, motion, language and resize checks passed |
| `npm run test:phone` | Passed in Chromium and WebKit |
| `npm run review:mobile` | 49 final captures generated without browser errors or page overflow |
