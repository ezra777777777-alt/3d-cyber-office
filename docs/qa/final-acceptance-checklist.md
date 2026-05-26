# Final Acceptance Checklist

## Product Fit

- [ ] First screen reads as a 3D AI office, not a plain dashboard.
- [ ] Lobster Commander is clearly the command center.
- [ ] A Chinese user can understand the primary workflow without reading source code.
- [ ] Complete Guided Demo tells the full story from goal to artifact to review.

## Functional Loop

- [ ] User can start Standard Demo.
- [ ] User can start Commander Demo.
- [ ] User can start Approved Delivery.
- [ ] User can start Complete Guided Demo.
- [ ] Commander mission graph appears.
- [ ] Worker roster shows roles and desks.
- [ ] Approval Inbox shows pending risk.
- [ ] Artifact Rail shows delivered outputs.
- [ ] Files view shows artifacts.
- [ ] Review view summarizes completion.

## Runtime and Safety

- [ ] Mock Runtime creates normalized events.
- [ ] Connected placeholder remains guarded.
- [ ] Real AI adapter placeholder never asks for credentials.
- [ ] Migration bundle excludes credentials.
- [ ] Secret scan passes.
- [ ] `docs/runtime/runtime-integration-options.md` exists with 6 candidate comparison.
- [ ] `docs/runtime/runtime-integration-decision.md` ADR exists with recommended path.
- [ ] `docs/runtime/runtime-security-checklist.md` covers credentials/files/commands/network/events.
- [ ] `docs/runtime/local-runtime-protocol-sketch.md` defines message format.
- [ ] Existing guarded placeholder remains valid.
- [ ] No credentials introduced.

## Migration

- [ ] Export JSON works.
- [ ] Import preview works.
- [ ] Invalid JSON is rejected.
- [ ] Secret-like values are blocked.
- [ ] Imported state restores UI, Office, Dashboard, Commander data.
- [ ] Migration health panel shows coverage and warnings.
- [ ] User understands credentials must be recreated manually.
- [ ] Windows -> Windows migration has been tested from source checkout plus migration JSON.
- [ ] Windows -> mac migration steps are documented and do not rely on copying `node_modules/`.
- [ ] New-machine setup clearly says to run `npm install` before `npm run dev`.
- [ ] Runtime/API credentials are reconfigured outside the browser after migration.
- [ ] `windows-to-windows.md` guide exists.
- [ ] `windows-to-mac.md` guide exists.
- [ ] `troubleshooting.md` exists.
- [ ] `restore-drill-report.md` template exists.
- [ ] Migration README links all guides.

## Engineering

- [ ] `npm.cmd run test` passes.
- [ ] `npm.cmd run build` succeeds.
- [ ] Bundle is split or warning is documented.
- [ ] Browser QA checklist is complete.
- [ ] Remaining optimization items are tracked in `docs/qa/remaining-optimization-backlog.md`.

## Plan 17 First-Screen Video Fidelity

- [ ] Plan 17 first-screen screenshot shows a visible bright 3D office.
- [ ] Plan 17 mobile screenshot keeps 3D scene visible at 390x844.
- [ ] Complete Guided Demo uses video-replica staged timeline.
- [ ] Commander-to-Worker visual links are visible during active work.

## Plan 12 QA Gate

- [ ] `docs/qa/browser-qa-results.md` created with automated + manual QA results.
- [ ] `docs/qa/browser-qa-checklist.md` updated with Result/Notes columns.
- [ ] `docs/qa/release-readiness-checklist.md` created.
- [ ] `docs/qa/release-hardening-report.md` created.
- [ ] Desktop 1366x768 QA passed (11/11).
- [ ] Mobile 390x844 QA passed (7/7).
- [ ] Console check passed (3/3).
- [ ] Automated verification passed (tsc, vitest, build).

## Plan 18 Art Direction and Layout Reset

- [x] Default desktop screenshot reads as a clean 3D AI command office. (near_black 0.0, avg_rgb 188,203,217)
- [x] Lobster Commander is visible as the focal point without interaction. (centered at [0,0,-4.25])
- [x] At least three Worker pods are visible around the Commander. (worker arc: left/center/right)
- [x] Characters no longer use odd humanoid proportions. (AI assistant pods, no human limbs/eyes)
- [x] Normal visual mode does not contain excessive small desk props. (1 prop per desk, 5 decor)
- [x] Mobile screenshot keeps 3D office visible beneath compact controls. (near_black 0.0, avg_rgb 108,117,130)
- [x] No Drei Text / troika text rendering is used in scene components. (grep: no matches in src/)
- [x] 132 tests pass across 26 test files.
- [x] Build successful, no bundle regression.
- [ ] Plan 24 Local Runtime MVP: `npm run runtime` starts, browser connects via SSE, Commander submits mission, tasks/approval/artifact events project into office UI.
- [ ] Plan 25 Real Model Planner: mock provider works, missing-key provider fails closed, configured provider returns a validated plan, and no secret appears in UI or logs.
- [ ] Plan 26 Safe Tool Execution: low-risk tools work, high-risk tools request approval, approved writes are scoped, non-allowlisted commands are rejected.
- [ ] Plan 27 Multi-Agent Closed Loop: mission engine runs tasks in dependency order, workers produce artifacts, approval pauses high-risk actions, completed missions emit summary.
- [ ] Plan 28 Runtime Usability and Closed-Loop Hardening: /health includes identity fields, stale runtime detection works in Gateway, default approval gate fires for builder+high-risk, mission_completed event maps correctly, ApprovalInbox shows loading/error states, dead code removed, .local-runtime/ gitignored, `npm run runtime:e2e` passes.
- [ ] Plan 29 Startup and Migration Experience: `doctor` diagnoses project root/deps/ports/runtime, `check:ports` reports port status, `dev:all` starts both services, migration docs are clean Chinese with correct commands.

## Release Candidate Gate

- [x] Startup works through `npm.cmd run dev:all`.
- [x] Runtime E2E passes.
- [x] Production preview smoke passes.
- [x] Release package excludes secrets and generated state.
- [x] Migration docs distinguish browser state from runtime history/artifacts.
- [x] Branch is committed and pushed.
