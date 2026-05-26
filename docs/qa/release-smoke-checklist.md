# Release Smoke Checklist

## Command Results

| Check | Command | Result | Notes |
| --- | --- | --- | --- |
| Release tests | `npm.cmd run release:test` | Pass | 15/15 Node tests, including deterministic metrics coverage. |
| Dev scripts | `node --test scripts/dev/*.test.mjs` | Pass | 14/14, including `dev:all` SIGINT cleanup for Runtime and Vite. |
| Doctor | `npm.cmd run doctor` | Pass | Expected WARN: runtime port free because runtime was intentionally stopped. |
| Ports | `npm.cmd run check:ports` | Pass | 5173 and 8765 free after smoke/dev tests. |
| Runtime tests | `npm.cmd run runtime:test` | Pass | 66/66. |
| Runtime E2E | `npm.cmd run runtime:e2e` | Pass | Approval requested/resolved, tool_called, mission_completed, and History API verified. |
| App tests | `npm.cmd run test` | Pass | 41 files / 190 tests. Vite React plugin deprecation warnings are existing test-run noise. |
| Build | `npm.cmd run build` | Pass | Only accepted Vite chunk-size warning remains. |
| Build metrics | `npm.cmd run build:metrics` | Pass | `docs/qa/build-metrics.json` generated without timestamp; Vite hashes normalized to `[hash]`. |
| Build metrics rerun | `npm.cmd run build:metrics` twice | Pass | SHA256 stayed `C79A10077AEAA3B59F51E701ACCD108B36B086CE567BF2FB7D0ED14C95284BF2`; no metrics diff after rerun. |
| Clean clone install | `npm.cmd install` before clone tests | Documented | Required before `npm.cmd run test`; see `docs/release/local-release-guide.md`. |
| Clean clone metrics stability | `npm.cmd run build:metrics` then `git status --short` | Documented | `build-metrics.json` should stay clean when committed metrics match the build. |
| Preview smoke | `npm.cmd run release:smoke` | Pass | Production preview loaded at `http://127.0.0.1:4173`; runtime health skipped because runtime was stopped. |
| Package dry run | `npm.cmd run release:package -- --dry-run` | Pass | 346 files included, 24 entries excluded. |
| Package | `npm.cmd run release:package` | Pass | Creates `.release/3d-cyber-office-local-<timestamp>`. |
| Package forbidden-path scan | `Get-ChildItem -Path ".release/3d-cyber-office-local-<timestamp>" -Recurse -Force ...` | Pass | No forbidden paths found in the generated package. `.env.example` is allowed. |

## Browser Checks

Browser plugin tooling was not exposed in this session, so browser QA used the existing Playwright fallback script:

```powershell
$env:PLAN32_OUTPUT_DIR='qa-artifacts\plan33-release-browser'
node scripts\visual-qa\capture-plan32-playwright.mjs
```

| Check | Result | Notes |
| --- | --- | --- |
| Production preview opens | Pass | `release:smoke` confirmed `vite preview` serves the app shell. |
| Frontend opens from dev server | Pass | Playwright fallback loaded the Vite app and captured screenshots. |
| Runtime health visible in Gateway | Covered | Runtime health and stale identity are covered by `doctor`, `runtime:e2e`, and runtime health tests. |
| Commander mission can be started | Covered | `runtime:e2e` created a mission and completed the approval/tool/artifact loop. |
| Approval appears and can be resolved | Pass | `runtime:e2e` received `runtime.approval_requested` and `runtime.approval_resolved`. |
| History shows completed mission | Pass | `runtime:e2e` verified History API after mission completion. |
| Files can open generated artifact metadata/preview | Covered | Runtime E2E generated artifacts; Plan 31 browser QA already covered Files/History projection. |
| Video-grade office first screen still renders | Pass | Desktop and mobile screenshots are nonblank and visually inspected. |
| Mobile 390px layout has no horizontal overflow | Pass | 390x844 screenshot shows role bar and demo controls separated with no horizontal clipping. |

Screenshot evidence:

- `qa-artifacts/plan33-release-browser/desktop-1366x768-low.png`
- `qa-artifacts/plan33-release-browser/desktop-1366x768-normal.png`
- `qa-artifacts/plan33-release-browser/desktop-1366x768-showcase.png`
- `qa-artifacts/plan33-release-browser/mobile-390x844-normal.png`

Screenshot measurements used Codex bundled Python because the system Python launcher could not access `AppData\Local\Python`:

| Screenshot | Size | Near-black ratio | Average RGB |
| --- | --- | ---: | --- |
| Desktop normal | 1366x768 | 0.0733 | 58, 58, 55 |
| Mobile normal | 390x844 | 0.1101 | 53, 48, 43 |

## Accepted Warnings

| Warning | Accepted? | Reason |
| --- | --- | --- |
| Vite chunk size warning | Yes | `vendor-3d` is 805.50 KB, below the 900 KB Plan 33 budget. |
| Vite circular/dynamic import warning | No longer present | Removed the dynamic import of `demoCommander.ts` from `CommanderComposer`. |
| Screenshot 404 resource noise | Yes | Only appeared in Playwright visual QA; production preview smoke passed. |
| Browser `ERR_NETWORK_ACCESS_DENIED` noise | Yes | Existing screenshot harness noise; screenshots rendered correctly. |
| Vitest React plugin deprecation warning | Yes | Existing Vite React plugin warning during tests, outside Plan 33 release code. |

## Release Package

| Item | Result | Notes |
| --- | --- | --- |
| `.release/` package created | Pass | `.release/3d-cyber-office-local-<timestamp>`. |
| Package contains `src/` | Pass | Manifest includes app source. |
| Package contains `scripts/` | Pass | Manifest includes dev/runtime/release scripts. |
| Package contains `docs/` | Pass | Manifest includes QA, runtime, migration, and release docs. |
| Package excludes `.env` | Pass | `.env.example` only. |
| Package excludes `.local-runtime` | Pass | Forbidden-path scan clean. |
| Package excludes `node_modules` | Pass | Forbidden-path scan clean. |
| Package excludes `dist` | Pass | Forbidden-path scan clean. |
