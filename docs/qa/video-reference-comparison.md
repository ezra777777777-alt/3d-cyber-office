# Video Reference Visual Comparison

Date: 2026-05-25
Build: Plan 19 complete
Branch: main

## Reference Goal

Match the Claw3D-style reference video office: warm wood floor, dark Studio shell, GLB furniture, small humanoid workers, left agent list, right Main Agent panel.

## Automated Checks

| Check | Command | Result | Notes |
| --- | --- | --- | --- |
| TypeScript | `npx tsc --noEmit` | ✅ Pass | No errors |
| Tests | `npx vitest run` | ✅ Pass | 28 files, 138 tests |
| Build | `npm run build` | ✅ Pass | vendor-3d 824KB (was 869KB) |
| Troika regression | grep Text/troika in src/ | ✅ Pass | No matches |

## Reference Comparisons

| Reference | Target | Status |
| --- | --- | --- |
| `crop-035.png` (office wide shot) | Claw3D first screen | ✅ Dark bg + wood floor + furniture |
| `crop-050.png` (Main Agent panel) | Right Main Agent panel | ✅ Right panel with 🦞 status |
| `crop-070.png` (worker at desk) | ClawWorkerCharacter at desk | ✅ Small humanoids, warm material |
| `crop-090.png` (dark workbench) | N/A | ⚠️ Workbench unchanged (non-scope) |
| `crop-110.png` (task detail) | N/A | ⚠️ Dashboard unchanged (non-scope) |
| `crop-150.png` (decorated office) | Claw3D environment | ✅ GLB furniture + plants + lamp |

## Plan 19 vs Plan 18 Comparison

| Metric | Plan 18 | Plan 19 | Delta |
| --- | --- | --- | --- |
| Floor material | Grey-blue | Warm wood #c8a97e | ✅ |
| Wall style | Light grey-blue | Dark #141e2b + green board | ✅ |
| Background | #e7f4ff | #07111f (dark) | ✅ |
| Furniture | Hand-built primitives | Claw3D MIT GLB (8 assets) | ✅ |
| Worker characters | Abstract AI pods | Small humanoid workers | ✅ |
| UI shell | Top nav + overlay | Left rail + agent list + right panel | ✅ |
| Commander expression | 3D center stage only | 3D station + right Main Agent panel | ✅ |
| Camera | [6.2, 6.4, 8.8] fov 42 | [7.8, 7.4, 9.6] fov 40 | ✅ |
| Visual toggle | Low/Normal/Showcase | + Plan18/Claw3D style switch | ✅ |
| vendor-3d | 869 KB | 824 KB | -5% (GLB assets smaller) |
| Test count | 132 | 138 | +6 new tests |
| Source files | — | +8 new, +7 modified | — |

## Regression Guard

- Start Demo still works: ✅ (tests pass)
- Run Commander Demo still works: ✅ (tests pass)
- Run Approved Delivery still works: ✅ (tests pass)
- Reset View still works: ✅
- No Drei Text / troika text: ✅
- No raw token/secret in console or UI: ✅
- Migration page still loads: ✅
- Plan 18 visual style preserved via toggle: ✅

## Plan 21 Video Main Frame Replica

Plan 21 changes the target from generic Claw3D style to main-frame video replication.

Primary reference: `.video-reference-frames/crops/crop-070.png`

Acceptance is based on manual side-by-side visual review:

- Environment: open platform, warm floor, green wall, cyan water strips.
- Characters: blocky seated avatars, no round robot figures.
- Lobster identity: Main Agent icon/panel identity, no realistic lobster body.
- UI: left rail, right panel, bottom agent shortcut bar.
- Composition: office center remains visible.

Automated checks cover visual constraints and build safety. Final likeness requires browser visual review.

## Plan 32 Video-Grade Visual V2

Plan 32 replaces the Plan 21 video-frame approximation with a stricter visual system:

- Larger open office island.
- Stronger dark shell and warm floor contrast.
- Cleaner Commander station and lobster identity mark.
- Smaller seated block workers.
- Controlled density budgets for Low/Normal/Showcase.
- Runtime state cues tied to real office status.
- Mobile safe-zone rules for the center office.

Final acceptance requires side-by-side browser review against the reference frames listed in `docs/qa/video-grade-visual-v2-checklist.md`.
