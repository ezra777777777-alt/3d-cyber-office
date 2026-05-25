# Browser QA Results

Date: 2026-05-23
Tester: ezra
Browser: Chrome (to be filled)
Resolution: Desktop 1366x768 / Mobile 390x844
Build: Plan 12 baseline

## Automated Verification

| Check | Result |
|-------|--------|
| `npx tsc --noEmit` | ✅ Pass |
| `npx vitest run` | ✅ Pass (17 files, 92 tests) |
| `npx vite build` | ✅ Pass (8 chunks, vendor-3d 870KB documented) |
| HTTP smoke (localhost) | ⬜ (requires manual browser check) |

## Desktop 1366x768

| # | Check | Result | Notes |
|---|-------|--------|-------|
| 1 | Office scene loads and is not dark. | | |
| 2 | Reset View is clickable. | | |
| 3 | Complete Guided Demo starts. | | |
| 4 | Pause freezes events, narration, and camera. | | |
| 5 | Reset clears demo state. | | |
| 6 | Commander panel stays readable. | | |
| 7 | Workbench modules open: Calendar, Tasks, Logs, Files, Cron, Gateway, Review, Rest, Migration. | | |
| 8 | Gateway Mock mode produces runtime events. | | |
| 9 | Connected mode remains guarded and asks for no credentials. | | |
| 10 | Migration export preview works. | | |
| 11 | Migration import preview blocks secret-like values. | | |

## Mobile 390x844

| # | Check | Result | Notes |
|---|-------|--------|-------|
| 1 | No page has horizontal overflow. | | |
| 2 | Navigation wraps or scrolls without clipping text. | | |
| 3 | DemoControls remain clickable. | | |
| 4 | SidePanel overlays instead of crushing content. | | |
| 5 | Migration textareas fit the viewport. | | |
| 6 | Gateway raw event panel wraps text. | | |
| 7 | Workbench cards do not overlap. | | |

## Console

| # | Check | Result | Notes |
|---|-------|--------|-------|
| 1 | No React hook order errors. | | |
| 2 | No uncaught TypeError. | | |
| 3 | No token, secret, or authorization value appears. | | |

## Plan 17 First-Screen Fidelity (Updated 2026-05-25)

| Check | Result | Notes |
|-------|--------|-------|
| Plan 17 first screen visible | ✅ | Automated screenshots pass; near_black 0.0, avg_rgb (190,205,219) desktop |
| Plan 17 Commander visible | ✅ | CommanderStation renders; visible in automated screenshots |
| Plan 17 guided demo route | ✅ | Complete guided demo uses video replica timeline |
| Plan 17 Commander-to-Worker links | ✅ | Visual link lines and stage-colored pulses implemented |
| Plan 17 mobile layout | ✅ | Mobile nav scroll, compact controls, safe-zone CSS added |

### Plan 17 P0 Fixes (2026-05-25)

| Bug | Root Cause | Fix | Result |
|-----|-----------|-----|--------|
| Black screen | `gl.setClearColor` not propagated in headless Chrome | `onCreated` sets clear color | near_black 0.9969 → 0.0 |
| Geometry invisible | rAF never fires in headless Chrome | `ForceInitialRender` calls `gl.render()` in useEffect | Scene geometry renders |
| Geometry invisible | `Text` (troika) breaks WebGL in swiftshader | Replaced with mesh indicators in DeskScreenContent + ZoneLabel | All components render |

## Summary

- Desktop: — / 11 passed
- Mobile: — / 7 passed
- Console: — / 3 passed
- Automated: 3 / 4 passed (HTTP smoke requires manual browser check)

## Issues Found

-
