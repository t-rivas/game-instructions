# Rule search, sharing and tabletop review

The hosted guides now search both English and Spanish copies of the existing rules and display the paired paragraph in the selected language. Exact phrases and exact words rank before approximate results. Typo correction permits a single substitution, insertion, deletion or adjacent transposition per word of at least five letters; numeric and shorter words are not corrected. A curated vocabulary supplies translated matching terms, including auction/subasta, and common card, coin, scoring and round terms. Highlights retain the original spelling and accents and cover the actual matching words.

Common-question shortcuts link directly to existing rule sections and recoverable searches. Their availability is checked against the actual rule text and active choices. Coup's Reformation and Inquisitor rules and Skull King's Expansion Pack matches follow the selected guide edition. Search within a rules page updates browser history without fetching the page again; Back/Forward, section expansion, locale changes, shared query links, Ctrl/Cmd+K and dialog focus remain supported. Avalon step changes focus the heading during the rendering commit, avoiding a delayed animation-frame callback that could steal the next keyboard action. Typing a query no longer repeatedly scrolls back to the current fragment.

Guide and rule-section sharing use one accessible dialog with Copy link, native sharing when available, a selectable manual-copy fallback, and a locally generated QR image. The encoder is a separate 23,759-byte production chunk, fetched only after requesting a QR code. An independent decoder verifies its complete URL. No QR service or external image request is used. The dialog shows the edition, and the QR includes an edition caption.

Shared links explicitly carry `shared=1`, language and view in the route, a validated section fragment, `q` (including an explicit empty query), and relevant guide choices:

| Guide | Choices |
| --- | --- |
| Coup | `exchange=ambassador\|inquisitor`, `reformation=0\|1` |
| Skull King | `expansion=0\|1` |
| Avalon | 5–10 `players`, basic/optional `roles`, allowlisted optional roles constrained by Evil capacity, `lady=0\|1` |

Unknown guide parameters and invalid fragments are removed; invalid choices normalize to safe defaults. Shared choices are temporary and restored to the local configuration when leaving the shared route. Preference and Avalon configuration writes are suppressed for shared guides, and their setup checklists use temporary state. Scores and timing snapshots retain the existing models and keys. Fresh browser contexts with conflicting preferences, a local Avalon setup, checklist progress, saved scores and paused clocks verify that opening, changing views, switching language and reloading a shared guide preserve those stored values.

In full-screen table mode, the opponent's chess clock can rotate 180 degrees without changing player identity, active-player indication, keyboard actions, deadlines or increments. Portrait mode puts the opponent's panel across the top. The orientation uses separate session metadata; it does not alter a clock snapshot. Compact controls keep both panels visible on tested portrait and landscape viewports. Font sizing follows the displayed digit count, preserving large normal clock digits while accommodating 180-minute clocks, 60-second increments and the poker model's maximum safe single-stage duration.

Optional screen wake locking shows off, requesting, held, automatically released, rejected and unsupported states. Disabling the control, leaving table mode or leaving the page releases the held lock; late requests after disabling also release their result. A visible page can reacquire a requested lock after returning from the background. Secondary clock instructions and source references collapse while help remains available. Timer navigation warnings, validation messages and storage notices remain visible.

## Verification

- `npm run build`: 95 production static pages, successful TypeScript compilation and local static export.
- Chrome and Linux WebKit: 266 focused search/sharing/table checks per browser, including exact and bilingual terms, typos, empty results, edition filtering, shortcuts, clipboard success/fallback, native share, lazy QR loading/decoding, URL validation, fresh-context storage preservation, 320px/390px portrait and 844px landscape clocks, timing/increments, reload and search focus, maximum poker duration and wake-lock lifecycle.
- Full hosted suite: 1,276 checks per browser, including all locale/game/view combinations at 320, 390 and 1,440px, all six play tools, blocked storage, print and paused-clock recovery.
- Experience suite: 596 checks per browser, including Avalon 5–10 player setup, basic/optional roles, Lady of the Lake, both languages/themes, checklist recovery, Resume cards, filter navigation and image dialogs.
- Portable/offline regression suite: 1,791 checks; game-flow suite: 144 checks; image asset verification: all 488 WebP variants retain dimensions, aspect ratios and transparency.
- Phone QR and opponent-clock screenshots, plus landscape clocks, were inspected. CI runs the new focused suite on Chromium and Linux WebKit.

## Scope and remaining limits

Search uses existing paired rules and curated vocabulary; it does not generate answers or translate arbitrary free-form questions. Typo tolerance is deliberately limited. Saved games remain device-local and are not embedded in share links. Native sharing, clipboard writes and screen wake locking depend on the browser and its permissions; manual copy and explicit unavailable/rejected statuses cover those cases. Wake-lock lifecycle tests inject the platform API, so physical-device screen suspension and battery-policy behavior have not been exercised. QR output was decoded automatically; a physical-camera scan was not performed.

The platform behavior follows the [Screen Wake Lock API](https://developer.mozilla.org/en-US/docs/Web/API/Screen_Wake_Lock_API) and [Navigator.share](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/share) documentation. QR encoding uses [node-qrcode](https://github.com/soldair/node-qrcode), with [jsQR](https://github.com/cozmo/jsQR) used only for independent test decoding. Installed Next.js static-export, query-parameter, Link, router and native-history documentation was read before implementation. Only the small query observer requires a Suspense boundary, retaining the guide's static HTML.

The original game models and portable offline guide remain intact. Vercel `outputDirectory` is still `.next`; no dashboard settings were changed or manual deployments triggered. The image measurements and earlier improvements are documented in [the image and browsing review](ux-optimization-review.md).
