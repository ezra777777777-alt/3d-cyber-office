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

## Engineering

- [ ] `npm.cmd run test` passes.
- [ ] `npm.cmd run build` succeeds.
- [ ] Bundle is split or warning is documented.
- [ ] Browser QA checklist is complete.
- [ ] Remaining optimization items are tracked in `docs/qa/remaining-optimization-backlog.md`.
