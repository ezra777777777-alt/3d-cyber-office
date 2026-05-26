# Plan 32 Video-Grade Visual V2 QA

## Reference Frames

- Main office frame: `.video-reference-frames/crops/crop-070.png`
- Commander panel frame: `.video-reference-frames/crops/crop-050.png`
- Wide office frame: `.video-reference-frames/crops/crop-150.png`
- Environment frame: `.video-reference-frames/crops/crop-035.png`

## Automated Verification

| Check | Command | Result | Notes |
| --- | --- | --- | --- |
| Focused scene tests | `npm.cmd run test -- src/scene/videoFrameReplicaSpec.test.ts src/scene/firstScreenFidelity.test.ts src/scene/videoGradeVisualSpec.test.ts src/scene/videoGradeCompositionTesting.test.ts src/scene/videoGradeStateTesting.test.ts` | Pass | 5 files / 24 tests. Guards compatibility, visual spec, composition, state cues, and camera preset. |
| Runtime tests | `npm.cmd run runtime:test` | Pass | 66/66. |
| Runtime E2E | `npm.cmd run runtime:e2e` | Pass | Approval request/resolution, tool call, mission completed, history API verified. |
| App tests | `npm.cmd run test` | Pass | 41 files / 190 tests. |
| Build | `npm.cmd run build` | Pass on rerun | One final-pass run hit the known intermittent Vite emitted fileName path error; immediate rerun passed. Existing Vite chunk/circular warning remains. |
| Doctor | `npm.cmd run doctor` | Pass with expected WARN | Runtime was not running, so runtime-port WARN is expected. |
| Ports | `npm.cmd run check:ports` | Pass | 5173 and 8765 free. |
| Static visual guard | Scene text-renderer and unsafe-cast guard | Pass | No matches for banned renderer/cast patterns. |

## Browser QA

| Check | Desktop 1366x768 | Mobile 390x844 | Notes |
| --- | --- | --- | --- |
| First screen shows large open office island | Pass | Pass | Desktop and mobile screenshots show the full platform, side water strips, rear wall, and worker/Commander zones. |
| Commander is identifiable without reading labels | Pass | Pass | Red Commander figure, red console mark, command desk, and magenta approval pulse are visible. |
| At least three workers are identifiable | Pass | Pass | Block seated workers are visible across front and mid/rear desks. |
| Characters do not look ghost-like, doll-like, or capsule-like | Pass | Pass | Characters use small block silhouettes, chairs, desk occlusion, and no face/eye disks. |
| Warm floor, green wall, cyan side strips are visible | Pass | Pass | All target visual anchors are visible. |
| UI overlays do not cover the center office | Pass | Pass | Desktop center remains open; mobile Commander chip, role bar, and demo controls avoid worker heads and main Commander station. |
| Runtime working state changes desk/character cues | Pass | Pass | Injected runtime-equivalent office state shows cyan working cues and active worker strip. |
| Approval state creates a visible magenta/amber cue | Pass | Pass | Injected pending approval creates magenta Commander/desk cues. |
| Completed state creates a visible green/artifact cue | Pass | Pass | Injected completed worker creates green status/artifact marker. |
| Low mode remains readable and simpler | Pass | Not applicable | Desktop Low screenshot shows simpler furniture set while preserving roles. |
| Normal mode is detailed but not cluttered | Pass | Pass | Normal screenshots show full composed office without random loose props. |
| Showcase mode adds detail without hiding characters | Pass | Not applicable | Desktop Showcase screenshot adds lounge/lamp detail without hiding characters. |

## Screenshot Evidence

| Viewport | Screenshot Path | Pass/Fail | Notes |
| --- | --- | --- | --- |
| Desktop 1366x768 | `qa-artifacts/plan32-video-grade/desktop-1366x768-normal.png` | Pass | Measurement: near_black_ratio 0.0733, avg_rgb (58, 58, 55). |
| Mobile 390x844 | `qa-artifacts/plan32-video-grade/mobile-390x844-normal.png` | Pass | Measurement: near_black_ratio 0.1101, avg_rgb (53, 48, 43). |
| Low mode | `qa-artifacts/plan32-video-grade/desktop-1366x768-low.png` | Pass | Measurement: near_black_ratio 0.0728, avg_rgb (59, 59, 55). |
| Normal mode | `qa-artifacts/plan32-video-grade/desktop-1366x768-normal.png` | Pass | Runtime-equivalent QA state injected through localStorage. |
| Showcase mode | `qa-artifacts/plan32-video-grade/desktop-1366x768-showcase.png` | Pass | Measurement: near_black_ratio 0.0733, avg_rgb (59, 58, 55). |

## Browser Console Notes

- Screenshot capture used bundled Playwright with system Chrome in headless mode.
- Console showed `ERR_NETWORK_ACCESS_DENIED` during capture and one favicon-like 404 in one desktop pass; screenshots rendered correctly and automated measurement confirms the canvas was not black.

## Must-Fix Visual Failures

- Characters look creepy, ghost-like, doll-like, or like capsule mascots.
- Commander looks like a random toy animal instead of a Main Agent identity.
- Office looks cramped or only contains a few desks.
- Props feel scattered instead of composed.
- Right panel or bottom bar hides the main office.
- Runtime state is not visible in the 3D scene.
