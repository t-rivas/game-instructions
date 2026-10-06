# Navigation, favorites, focus and loading review

Implemented the six improvements identified in the 2026-10-05 review. Concurrent card-learning work in the shared workspace is preserved; the runtime generator also scopes its new card and Skull King teaching metadata to the selected game. Both offline builders embed the same new teaching script.

Favorites refresh on storage events, read the current stored selection before saving, and serialize edits with Web Locks where supported. Button state and unavailable-storage feedback update during the user's action. Browsers without Web Locks use the latest stored selection. The storage availability probe uses a temporary unique key and never writes a game snapshot or preference.

Collection typing creates one history entry until focus leaves the search field. Discrete filter changes and Clear remain separate entries; Back/Forward recover the complete query. Entry-language redirects and legacy guide redirects retain query parameters and fragments before normal validation.

Ctrl/Cmd+K respects an already open sharing or artwork dialog and keeps a single search dialog. Selecting a rule focuses its opened native summary, including selections within the same route, already-open rules, and selections that change guide view. Closing search without a selection still restores its opener.

Linux WebKit's offline emulation rejects `file:` navigation before any guide assertions execute. Its file-based flow tests now deny all HTTP/HTTPS requests explicitly. A harness assertion verifies that the deliberate probe request was intercepted. Chromium still uses offline emulation and verifies its offline status. The same setup, scoring, draft, language, layout and recovery assertions remain in place.

Build preparation now generates 15 independent client runtimes from the existing shared game sources. It specializes the fixed game identity and static catalog, then retains reachable declarations. Game models, scoring, validation, snapshot keys and timer code remain in their original source files. Each runtime is cached across client navigation, retaining running deadlines and unconfirmed entries. The homepage loads only runtimes for stored sessions. Global image input belongs to the current guide; background clock visibility/interval callbacks stay active. Each edition only persists its own preference fields.

The server renderer retains the complete adapter. Runtime parity checks compare exact shared markup and lessons in every language/view, Coup and Skull King choices, Avalon 5–10 player setups, per-game card metadata and paused-clock recovery. Game-specific clock/score styles are fingerprinted build assets and appear in the static HTML only for the selected game. React stylesheet precedence keeps hosted overrides after those styles, including client navigation and JavaScript-disabled pages.

## Loading measurements

Resource Timing `encodedBodySize` totals for scripts and CSS on the local production static export, without server compression. These measure loaded resource bodies, not production CDN transfer sizes. The baseline is commit `78be231`; the after build includes concurrent card-learning changes. Chrome phone and desktop values are checked in fresh contexts at 390 and 1440px. Linux WebKit independently checks both widths and the loading boundaries. The browser regression writes a complete measurement JSON alongside screenshots.

| Chess play resource | Before bytes | After bytes | Reduction |
| --- | ---: | ---: | ---: |
| JavaScript | 996,110 | 655,337 | 34.2% |
| CSS | 114,892 | 111,412 | 3.0% |

The checks ensure only the selected runtime is fetched, no other game's tool stylesheet is fetched, CSS stays below the previous loaded size, and Chess JavaScript stays below 700,000 bytes. Original artwork, responsive previews and the standalone offline guide remain available.

## Verification

Production build and static export succeed for all 95 pages. Generated-runtime parity passes 748 checks, responsive-image asset validation passes 488 checks, and the portable-guide verification passes 1,791 checks.

Chrome passes the 181 new improvement checks, 1,276 hosted-app checks, 596 returning-player/collection/Avalon experience checks, 266 rule-search/sharing/table checks and 146 portable offline flow checks. The concurrent lesson-card and Skull King trick suites also pass in Chrome, covering both languages/themes, mobile/desktop, editions, image dialogs, legal hands, authored scenarios, no score writes and offline output. Responsive image transfer checks confirm phones omit the desktop hero photos.

Linux WebKit passes the 181 new improvement checks, 1,276 hosted-app checks, 596 experience checks, 266 rule-search/sharing/table checks and 146 offline flow checks. The final production export is frozen for browser runs so concurrent workspace builds cannot change their inputs. Navigation waits include completion of collection scroll restoration; concurrent favorites use paired native activations, with individual pointer actions also checked. Failure diagnostics retain the URL, tool readiness and favorites state. Every original assertion remains.

CI includes runtime parity, the new improvement suite for Chromium and Linux WebKit, and the preserved lesson-card and Skull King trick regressions. No assertions were removed or weakened. The six scoring/timer source files and Vercel configuration have no changes from the review baseline.

## Limits

Measurements use the local export; CDN compression and physical-device performance were not measured. Web Locks support determines whether overlapping cross-tab edits can be serialized; the fallback refreshes and merges current selections. GitHub CI will exercise the updated workflow when the changes are pushed. Vercel's output directory remains `.next`; no dashboard settings or manual deployments are changed.

The build-only syntax tools follow the [Acorn parser](https://github.com/acornjs/acorn) and [Astring generator](https://github.com/davidbonnet/astring) APIs. Installed Next.js lazy-loading, CSS, static-export, Link and accessibility guides were read before implementation.
