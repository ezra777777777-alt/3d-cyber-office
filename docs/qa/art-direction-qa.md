# Plan 18 Art Direction QA

Date: 2026-05-25
Build: Plan 18 complete
Branch: main

## Goal

The first screen should read as a clean 3D AI command office. The Lobster Commander should be the visual center, Worker pods should be arranged clearly, and the scene should avoid clutter.

## Automated Checks

| Check | Command | Result | Notes |
| --- | --- | --- | --- |
| TypeScript | `npx tsc --noEmit` | ✅ Pass | No errors |
| Tests | `npx vitest run` | ✅ Pass | 26 files, 132 tests |
| Build | `npm run build` | ✅ Pass | vendor-3d 751KB |
| Screenshot capture | `capture-office.ps1` | ✅ Pass | Desktop + Mobile captured |
| Troika regression | grep for Text/troika in src/ | ✅ Pass | No matches |
| Desktop pixel metrics | `measure-screenshot.py desktop` | ✅ Pass | near_black 0.0, avg_rgb (188,203,217) |
| Mobile pixel metrics | `measure-screenshot.py mobile` | ✅ Pass | near_black 0.0, avg_rgb (108,117,130) |

## Visual Acceptance

| Criterion | Desktop | Mobile | Notes |
| --- | --- | --- | --- |
| Commander is visually findable within 3 seconds | ✅ | ✅ | Centered at [0,0,-4.25], larger/brighter than workers |
| At least 3 Worker pods are visible | ✅ | ✅ | Three workers in arc formation |
| Worker characters no longer look like odd humanoids | ✅ | ✅ | AI assistant pods (sphere+visor+cylinder) |
| Office layout reads as organized | ✅ | ✅ | Commander center, workers in arc, peripherals at edges |
| Props do not dominate the scene | ✅ | ✅ | Normal mode: 5 decor, 1 desk prop |
| UI does not hide the 3D focal area | ✅ | ✅ | Safe zones keep center 60% clear |
| Scene remains bright, not black/dark | ✅ | ✅ | near_black 0.0 both viewports |
| Mobile 390px still shows the office | ✅ | ✅ | near_black 0.0, avg_rgb (108,117,130) |

## Plan 18 vs Plan 17 Comparison

| Metric | Plan 17 | Plan 18 | Delta |
| --- | --- | --- | --- |
| Desktop avg_rgb | (190, 205, 219) | (188, 203, 217) | -2 |
| Mobile avg_rgb | (83, 91, 105) | (108, 117, 130) | +25 |
| Desktop file size | 94365 bytes | 83363 bytes | -12% (less clutter) |
| Test count | 115 | 132 | +17 new tests |
| Source files | 0 new, 14 modified | 9 new, 14 modified | — |

## Regression Guard

- Drei Text / troika text was not reintroduced: ✅
- Start Demo still works: ✅ (tests pass)
- Run Commander Demo still works: ✅ (tests pass)
- Run Approved Delivery still works: ✅ (tests pass)
- Reset View still works: ✅
- No raw token/secret appears in console or UI: ✅

## Screenshot Paths

- Desktop: `C:\tmp\cyber-office-visual-qa\desktop-1366x768.png`
- Mobile: `C:\tmp\cyber-office-visual-qa\mobile-390x844.png`
