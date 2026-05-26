# Release Readiness Checklist

## Required Commands

- [x] `npm.cmd run release:test` passes.
- [x] `node --test scripts/dev/*.test.mjs` passes.
- [x] `npm.cmd run doctor` passes with only expected WARN items.
- [x] `npm.cmd run check:ports` reports frontend/runtime ports are free after smoke scripts exit.
- [x] `npm.cmd run runtime:test` passes.
- [x] `npm.cmd run runtime:e2e` passes.
- [x] `npm.cmd run test` passes.
- [x] `npm.cmd run build` succeeds.
- [x] `npm.cmd run build:metrics` writes `docs/qa/build-metrics.json`.
- [x] `npm.cmd run release:smoke` passes.
- [x] `npm.cmd run release:package -- --dry-run` excludes secrets and generated state.
- [x] `npm.cmd run release:package` creates `.release/3d-cyber-office-local-*`.

## Source Control

- [x] Plan 32 branch changes are committed and pushed.
- [ ] Plan 33 release packaging changes are committed and pushed.
- [x] No `.env` or `.env.*` file is staged.
- [x] No `.local-runtime/`, `node_modules/`, `dist/`, or `.release/` generated state is staged.
- [x] GitHub handoff documents branch, commit, push, verification, known warnings, and package path.

## Product Checks

- [x] First screen still reads as a video-grade 3D AI office.
- [x] Lobster Commander remains the command focal point.
- [x] Commander mission can still run through approval and completion.
- [x] History and artifact replay are still accessible.
- [x] Files artifact flow is covered by runtime E2E and Plan 31 UI QA.
- [x] Mobile 390px layout has no horizontal overflow or control overlap.
- [x] Runtime Gateway health/stale/offline states are covered by runtime health tests and `doctor`.

## Release Docs

- [x] `docs/release/local-release-guide.md` has Windows and macOS commands.
- [x] `docs/release/github-handoff.md` has branch/commit/push checklist.
- [x] `docs/qa/release-smoke-checklist.md` is filled with actual results.
- [x] `docs/qa/performance-notes.md` records current chunk strategy and build metrics policy.
- [x] `docs/qa/final-acceptance-checklist.md` includes the release candidate gate.

## Plan Progress

- [x] Plan 28 Runtime Usability and Closed-Loop Hardening accepted.
- [x] Plan 29 Startup and Migration Experience accepted.
- [x] Plan 30 Real AI Worker Capability accepted.
- [x] Plan 31 Artifact Center and Mission Replay accepted.
- [x] Plan 32 Video-Grade Visual V2 accepted.
- [ ] Plan 33 Performance and Release Packaging accepted.
