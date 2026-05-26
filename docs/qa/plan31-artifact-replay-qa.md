# Plan 31 Artifact Replay QA

Date: 2026-05-26

| Check | Desktop Result | Mobile Result | Notes |
| --- | --- | --- | --- |
| Start runtime mission | Passed | Not separately verified | `npm.cmd run runtime:e2e` starts a local runtime mission; browser QA used the persisted completed mission. |
| Approve builder request | Passed | Not separately verified | E2E asserts `runtime.approval_requested` and `runtime.approval_resolved`. |
| Mission completes | Passed | Not separately verified | E2E waits for `runtime.mission_completed`; browser saw the completed mission in History. |
| History lists mission | Passed | Passed | Real Chrome/CDP verified mission cards in History. |
| Replay timeline ordered | Passed | Passed | Real Chrome/CDP verified replay contains approval, tool, artifact, and completion rows. |
| Artifact preview opens | Passed | Passed | Real Chrome/CDP opened a previewable artifact and found non-empty markdown. |
| Files deep link works | Passed | Not separately verified | `打开文件中心` switched to Files and preserved `.local-runtime/artifacts/...` metadata. |
| Refresh keeps history | Passed | Passed | Browser reload kept completed mission history visible. |
| Runtime stopped state is graceful | Passed | Not separately verified | Vite-only run with Runtime stopped showed `Runtime history unavailable...` and a retry button, not a blank screen. |
| 390 px layout has no horizontal overflow | Passed | Passed | CDP measured `scrollWidth=390`, `clientWidth=390`. |

## Browser QA Evidence

Environment:

- Frontend URL: `http://127.0.0.1:5173`
- Runtime endpoint: `http://127.0.0.1:8765`
- Browser plugin: not available
- Playwright: not installed
- Fallback used: real Chrome with CDP in headed mode, because headless Chromium in the sandbox failed before page load with `GPU process isn't usable`

Evidence:

- Desktop History screenshot: `C:\Users\A413\AppData\Local\Temp\codex-plan31-browser-1779766195328\desktop-history.png`
- Artifact preview screenshot: `C:\Users\A413\AppData\Local\Temp\codex-plan31-browser-1779766195328\artifact-preview.png`
- Files deep link screenshot: `C:\Users\A413\AppData\Local\Temp\codex-plan31-browser-1779766195328\files-deep-link.png`
- Mobile History screenshot: `C:\Users\A413\AppData\Local\Temp\codex-plan31-browser-1779766195328\mobile-history.png`
- Runtime stopped screenshot: `C:\Users\A413\AppData\Local\Temp\codex-plan31-browser-1779766195328\runtime-stopped.png`

Observed non-blocking console noise:

- One `404 Not Found` resource entry, consistent with a missing browser-requested asset such as favicon; no React hook errors, framework overlays, unhandled promise rejections, or token/secret strings were observed in the captured app flow.
