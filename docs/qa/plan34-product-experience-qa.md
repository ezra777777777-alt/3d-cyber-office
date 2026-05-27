# Plan 34 First-Run Product Experience QA

## Environment

- Date: 2026-05-26
- Frontend URL: `http://127.0.0.1:6201`
- Runtime endpoint: `http://127.0.0.1:8765`
- Runtime state during browser QA: Runtime not running; disconnected/connection-refused state expected.
- Browser: bundled Playwright with system Chrome headless.

## Automated Verification

| Check | Command | Result | Notes |
| --- | --- | --- | --- |
| Focused Plan 34 tests | `npm.cmd run test -- src/i18n/i18nTesting.test.ts src/i18n/textIntegrity.test.ts src/i18n/productCopy.test.ts src/commander/missionTemplates.test.ts src/product/launchpadReadiness.test.ts src/ui/commander/completionHandoffTesting.test.ts` | Pass | 6 files / 22 tests. |
| App tests | `npm.cmd run test` | Pass | 46 files / 207 tests. |
| Runtime tests | `npm.cmd run runtime:test` | Pass | 66/66. |
| Runtime E2E | `npm.cmd run runtime:e2e` | Pass | Approval requested/resolved, tool_called, mission_completed, history API verified. |
| Release tests | `npm.cmd run release:test` | Pass | 15/15. |
| Build | `npm.cmd run build` | Pass | Existing Vite `vendor-3d` chunk warning remains. |

## Browser QA

| Flow | Desktop 1366x768 | Mobile 390x844 | Notes |
| --- | --- | --- | --- |
| Launchpad opens and explains first-run path | Pass | Pass | Navigation has `开始`; Launchpad title and first-run steps render in readable Chinese. |
| Runtime disconnected state gives exact command | Pass | Pass | `npm.cmd run runtime` is visible and copy action is present. |
| Runtime connected action points user toward Commander/Gateway | Pass | Not repeated | Clicking `切到本地 Runtime` enters expected disconnected health state when Runtime is not running. |
| Mission template fills Commander draft | Pass | Not repeated | `项目体检` fills Commander goal, material note, and constraints; CommanderDock is available in video-grade office. |
| Launchpad mobile has no horizontal overflow | Not applicable | Pass | `documentElement.scrollWidth <= clientWidth + 2`. |
| Workbench overlays do not hide Launchpad primary content | Pass | Pass | Demo controls are limited to Office module and no longer cover Launchpad content. |

## Screenshot Evidence

| Viewport / Flow | Screenshot Path | Result |
| --- | --- | --- |
| Desktop Launchpad | `qa-artifacts/plan34-first-run/desktop-launchpad.png` | Pass |
| Desktop template-to-Commander | `qa-artifacts/plan34-first-run/desktop-template-commander.png` | Pass |
| Mobile Launchpad 390x844 | `qa-artifacts/plan34-first-run/mobile-launchpad-390x844.png` | Pass |

## Console Notes

- Expected during disconnected Runtime QA: `ERR_CONNECTION_REFUSED` after clicking `切到本地 Runtime`.
- Expected in this restricted headless environment: `ERR_NETWORK_ACCESS_DENIED`.
- One 404 resource warning was observed and treated as non-blocking because the tested UI flows rendered and interacted correctly.
- No unexpected console errors remained after filtering those environment/runtime-unavailable signals.

## Product Reviewer Notes

- P0 corrupted central Chinese labels are covered by `src/i18n/textIntegrity.test.ts`.
- First-run path is now product-facing instead of terminal-first: Launchpad shows state, command, next action, and templates.
- Commander templates give a first-time user concrete missions instead of a blank prompt.
- Completed mission handoff now provides Files, History, and next-round actions.
- Release completion is still blocked by the existing Git/GitHub closure issue from Plan 33.1; this QA does not mark release complete.
