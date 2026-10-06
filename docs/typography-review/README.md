# Typography and reading layout review

Shared styles in `src/components/web.css` keep the existing system/body fonts and each game's display fonts, colors, artwork, and tool grids. Body explanations use 16px text with 1.7 line height; notes use 15px, captions and metadata 14px. Rem-based tokens follow the reader's default text size. Full rules and lesson explanations stop at 65ch on wide screens.

Phone card lessons put the artwork above the explanation. Related information shares one lesson surface, with a clear Next footer. Rule previews use their full available reading width. Rule sharing follows the explanation, duplicate collection labels and the generic game-tool title are visually removed, and long filter labels have full-width fields on phones. The tool-title focus target remains available for keyboard jumps. Card artwork reserves a visible frame so lazy-loaded images can load reliably.

The collection, simplified learning sequence, rules, navigation, tool behavior, and animation are preserved. The collection introduction changes only capitalization. No fonts or external requests were added.

## Before / after screenshots

Spanish production pages, fresh storage, 1000px viewport height, reduced motion. **Before** images were captured from the existing build before the style edits. **After** uses the final production build. The card baseline exposes the previously blank lazy-image frame; the final card shows the published artwork.

Open [the side-by-side gallery](index.html) or use the individual PNG links below.

| Screen | Theme | 390px before | 390px after | 1440px before | 1440px after |
| --- | --- | --- | --- | --- | --- |
| Collection | Light | [Before](before/collection-light-390.png) | [After](after/collection-light-390.png) | [Before](before/collection-light-1440.png) | [After](after/collection-light-1440.png) |
| Collection | Dark | [Before](before/collection-dark-390.png) | [After](after/collection-dark-390.png) | [Before](before/collection-dark-1440.png) | [After](after/collection-dark-1440.png) |
| Coup · Duke lesson | Light | [Before](before/card-lesson-light-390.png) | [After](after/card-lesson-light-390.png) | [Before](before/card-lesson-light-1440.png) | [After](after/card-lesson-light-1440.png) |
| Coup · Duke lesson | Dark | [Before](before/card-lesson-dark-390.png) | [After](after/card-lesson-dark-390.png) | [Before](before/card-lesson-dark-1440.png) | [After](after/card-lesson-dark-1440.png) |
| Burako · Full rules | Light | [Before](before/full-rules-light-390.png) | [After](after/full-rules-light-390.png) | [Before](before/full-rules-light-1440.png) | [After](after/full-rules-light-1440.png) |
| Burako · Full rules | Dark | [Before](before/full-rules-dark-390.png) | [After](after/full-rules-dark-390.png) | [Before](before/full-rules-dark-1440.png) | [After](after/full-rules-dark-1440.png) |
| Chess · Running clock | Light | [Before](before/active-tool-light-390.png) | [After](after/active-tool-light-390.png) | [Before](before/active-tool-light-1440.png) | [After](after/active-tool-light-1440.png) |
| Chess · Running clock | Dark | [Before](before/active-tool-dark-390.png) | [After](after/active-tool-dark-390.png) | [Before](before/active-tool-dark-1440.png) | [After](after/active-tool-dark-1440.png) |
| Coup · Rule preview | Light | [Before](before/rule-preview-light-390.png) | [After](after/rule-preview-light-390.png) | [Before](before/rule-preview-light-1440.png) | [After](after/rule-preview-light-1440.png) |
| Coup · Rule preview | Dark | [Before](before/rule-preview-dark-390.png) | [After](after/rule-preview-dark-390.png) | [Before](before/rule-preview-dark-1440.png) | [After](after/rule-preview-dark-1440.png) |

## Complete lesson and reading details

These extra captures show the entire lesson including its Next action, and an uncropped rule section.

| Theme | Phone lesson | Desktop lesson | Rule before | Rule after |
| --- | --- | --- | --- | --- |
| Light | [390px](after/lesson-detail-light-390.png) | [1440px](after/lesson-detail-light-1440.png) | [1440px](before/reading-detail-light-1440.png) | [1440px](after/reading-detail-light-1440.png) |
| Dark | [390px](after/lesson-detail-dark-390.png) | [1440px](after/lesson-detail-dark-1440.png) | [1440px](before/reading-detail-dark-1440.png) | [1440px](after/reading-detail-dark-1440.png) |

## Narrow, tablet, and enlarged text

Enlarged detail captures omit pinned page chrome to show the complete reading surface. Responsive tests use the unmodified page, including navigation. At enlarged text sizes, tabs wrap into additional rows so their labels remain whole.

| Screen | 320px light | 320px dark | 768px light | 768px dark | 200% text · light | 200% text · dark |
| --- | --- | --- | --- | --- | --- | --- |
| Card lesson | [320px](after/card-lesson-light-320.png) | [320px](after/card-lesson-dark-320.png) | [768px](after/card-lesson-light-768.png) | [768px](after/card-lesson-dark-768.png) | [320px](after/enlarged-card-lesson-light-320.png) | [320px](after/enlarged-card-lesson-dark-320.png) |
| Full rules | [320px](after/full-rules-light-320.png) | [320px](after/full-rules-dark-320.png) | [768px](after/full-rules-light-768.png) | [768px](after/full-rules-dark-768.png) | [320px](after/enlarged-full-rules-light-320.png) | [320px](after/enlarged-full-rules-dark-320.png) |
| Running clock | [320px](after/active-tool-light-320.png) | [320px](after/active-tool-dark-320.png) | [768px](after/active-tool-light-768.png) | [768px](after/active-tool-dark-768.png) | [320px](after/enlarged-active-tool-light-320.png) | [320px](after/enlarged-active-tool-dark-320.png) |
| Rule preview | [320px](after/rule-preview-light-320.png) | [320px](after/rule-preview-dark-320.png) | [768px](after/rule-preview-light-768.png) | [768px](after/rule-preview-dark-768.png) | [320px](after/enlarged-rule-preview-light-320.png) | [320px](after/enlarged-rule-preview-dark-320.png) |

## Verification

- `npm run build` — production build and static export passed.
- `npm run test:typography` — 816 checks: all 15 games × three views × two languages × two themes × four widths, plus 200% default text for the collection, card lesson, long rules, every game tool, and rule previews.
- `npm run test:web` — 1,361 checks of hosted routes, learning, controls, saved progress, all six game tools, and mobile reflow.
- `npm run test:learning` — learning sequence, semantic bookmarks, setup recovery, keyboard and image-viewer focus, and responsive layouts passed.
- `npm run test:rule-preview` — 93 in-place lookup checks passed.
- `npm run test:lesson-cards` — card layouts, variants, rule links, and image-viewer behavior passed.

`checks.json` records the typography run. Refresh the final captures after building with `node docs/typography-review/capture.cjs after`. Capture `before` only against an unchanged baseline export, or set `TABLEFOLK_EXPORT_DIR` to a preserved baseline.
