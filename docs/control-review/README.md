# Tablefolk controls review

The existing typography, game palettes, spacing, and surface tokens now cover buttons, fields, disclosures, navigation, and the three native dialogs. Primary actions have solid accent fills; secondary actions have visible outlines; quiet actions have lighter framing. Persistent selections use a tinted surface, accent border, and inset indicator. Inputs and selects share a 48px minimum target; icon and language controls retain at least 44px.

Dialog headings and explicit Close/Cerrar actions stay visible while scrolling. Search retains its in-place previews and Back actions. Sharing includes pending-copy feedback, an announced copy result, and a selected-link fallback. Keyboard focus wraps in the active dialog, and nested image/sharing closures return to their trigger in the preview.

## Screenshots

Screenshots in `after/` include Spanish at 320px and desktop at 1440px, in light and dark themes, captured with Chromium and WebKit. The image captures wait for the original artwork to decode.

| Example | Screenshot |
| --- | --- |
| Actions, selected tabs, disabled action, and keyboard focus | [Navigation](after/navigation-light-320-chromium.png) |
| Selected switches and fields | [Switches](after/switches-light-320-chromium.png) |
| Selects, checkbox group, and expandable sections | [Setup controls](after/fields-checklist-light-320-chromium.png) |
| Mobile table controls | [Table controls](after/table-controls-320-chromium.png) |
| Field errors | [Validation](after/field-errors-320-chromium.png) |
| Rule search | [Search dialog](after/search-dialog-light-320-chromium.png) |
| Sharing | [Share dialog](after/share-dialog-light-320-chromium.png) |
| Pending copy | [Loading](after/share-loading-320-chromium.png) |
| Copied link | [Copy feedback](after/share-copied-320-chromium.png) |
| Image enlargement | [Image dialog](after/image-dialog-dark-320-chromium.png) |

## Validation

The production build and listed checks passed. The controls suite passed 431 checks in each of Chromium and WebKit. The final search/sharing suites passed 266 checks per browser, and in-place previews passed 93 checks per browser.

- Production build and base offline verification: `npm run build`, `npm test`.
- Controls, Spanish/English mobile layouts, selection distinction, Tab/Shift+Tab wrapping, nested focus return, copy loading/success/fallback: `npm run test:controls`, `BROWSER=webkit npm run test:controls`.
- Search, sharing, QR decoding, in-place previews, URL behavior, and paused/running timer preservation: `test:rules-table` and `test:rule-preview` in Chromium and WebKit.
- Hosted navigation and direct routes: `test:web`.
- Learning state, cards, practice, examples, and comparisons: `test:learning`, `test:lesson-cards`, `test:practice`, `test:watch-turn`, `test:comparisons`, `test:avalon`, `test:coup-lessons`, `test:skull-tricks`, `test:scoring-examples`.
- Scores, drafts, and timers: `test:chess`, `test:poker`, `test:coup`, `test:skull`, `test:truco`, `test:moth`, `test:scoreboard-ux`, `test:runtimes`.
- Design and image checks: `test:mobile`, `test:surfaces`, `test:typography`, `tests/image-transfer.cjs`.

The scoreboard usability check now verifies the established quick-reference-first order and its keyboard jump. The Python offline builder and CRLF test fixture include the existing lesson-comparison assets, so Python/Node output parity remains checked.
