# Tablefolk motion review

A restrained motion layer built on the existing typography, spacing, colors, surfaces and native controls. No new dependency.

## Recordings

All clips are approximately 3–8 seconds and recorded as WebM from the production export. The mobile clips use Spanish at 390px; automated reflow checks include 320px.

- [Learning, card recognition, Contents and result feedback](learning-and-results.webm)
- [Mobile rule search, in-place preview, image enlargement, sharing and copy feedback](search-share-image.webm)
- [Collection hover, press, selection and keyboard focus](collection-pointer.webm)
- [Mobile collection touch selection](collection-touch.webm)
- [Reduced motion: learning, search, image and nested sharing](reduced-motion.webm)

Representative control and all three dialog screenshots are in [the control review](../control-review/README.md).

## Motion vocabulary

| Interaction | Treatment |
| --- | --- |
| Hover, press and control state | 120ms color/border feedback; touch hit areas stay still |
| Learning step | 180ms opacity cue; newly shown cards move at most 6px in navigation direction |
| Results and selected choices | 180ms opacity emphasis; reading text stays in place |
| Collection | Fine pointer hover lifts 2px; artwork scales to 1.02 on hover and .985 on press |
| Disclosure | 180ms entry fade and 120ms summary feedback; native close collapses immediately |
| Dialog | 180ms native opacity/transform entry and exit; image dialog title and controls stay still |
| Image | 180ms translation and scale from the original thumbnail to the enlarged image |

The shared easing is `cubic-bezier(.2,.7,.2,1)`. There are no staggered controls, animated heights, background loops or motion-dependent instructions.

## State and focus

Content, controls and focus commit immediately. Learning tools stay mounted. Effects are cancelled on subsequent changes and on a change to reduced motion. Image decode callbacks check that the image still belongs to an open dialog.

Native close releases modal interaction immediately. Closing content is inert and ignores pointer input while CSS finishes its exit paint; the search body is then removed. Queued native close events from handled requests cannot dismiss a reopened dialog or steal focus. Nested image and share dialogs restore focus to their exact preview trigger. Reopening a preview resets to search and focuses its input; Back restores the result and scroll position.

The authored watch-turn and comparison animations, scenario logic, timings and independently verified outcomes are preserved. Live score, draft and timer models are unchanged.

## Reduced motion verification

With `prefers-reduced-motion: reduce`, CSS effects are disabled and scripted effects are skipped. The same content, outcomes, keyboard behavior and final states remain available immediately. Tests also switch the preference during paused step/image effects and verify cancellation.

## Validation

All checks below passed on 2026-10-06.

- `npm run build` — production build, TypeScript, all 95 routes.
- `npm run test:motion` and `BROWSER=webkit npm run test:motion` — 123 checks per browser: real entry transitions, rapid input/reopening, nested focus, immediate inertness, touch, deterministic replay, persistence and reduced motion.
- `npm run test:controls` in Chromium/WebKit — 431 checks per browser, including English/Spanish at 320px and all three dialogs.
- `test:rule-preview` in Chromium/WebKit — 93 checks per browser.
- `test:rules-table` in Chromium/WebKit — 266 checks per browser.
- `test:learning` in Chromium/WebKit — all 15 games, migration, shared isolation, keyboard/image focus and 48 responsive captures per browser.
- `test:collection` in Chromium/WebKit — 248 checks per browser, including enlarged text, artwork geometry and state recovery.
- `test:watch-turn`, `test:comparisons`, `test:practice`, `test:scoring-examples` — authored teaching sequences, six comparison outcomes, 25 practice outcomes and 25 scoring outcomes.
- `test:chess`, `test:poker`, `test:coup`, `test:skull`, `test:truco`, `test:moth` — all six live tools, including clocks, scores and drafts.
- `npm test` — 1,791 portable guide checks at 320, 390, 768 and 1440px.
- `test:runtimes` — 838 portable/hosted runtime parity checks.

Run `MOTION_RECORDINGS=only npm run test:motion` to refresh just the recordings, or `MOTION_RECORDINGS=1 npm run test:motion` to verify and record.
