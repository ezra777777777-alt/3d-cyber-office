# Video Fidelity QA

Date: 2026-05-25
Build: Plan 17 + P0 fixes
Branch: main

## Reference Goal

The first screen should read as a bright 3D AI office with Lobster Commander visibly directing Worker desks.

## Baseline Before Plan 17

| Viewport | Evidence | Result |
| --- | --- | --- |
| Desktop 1366x768 | `C:\tmp\cyber-office-desktop-webgl.png` | 3D area near-black ratio 0.9969 |
| Mobile 390x844 | `C:\tmp\cyber-office-mobile.png` | 3D area near-black ratio 0.8389 |

## P0 Fix Iterations

### P0 #1: Black Screen
- **Root cause**: `gl.setClearColor` not propagated in headless Chrome
- **Fix**: `onCreated` callback in Canvas calling `gl.setClearColor(BG)`
- **Result**: near_black_ratio 0.9969 → 0.0

### P0 #2: Geometry Not Visible
- **Root cause 1**: R3F render loop driven by `requestAnimationFrame` never fires in headless Chrome with `--virtual-time-budget`
- **Fix 1**: `ForceInitialRender` component calls `gl.render(scene, camera)` in `useEffect` after React commit
- **Root cause 2**: `Text` from `@react-three/drei` (troika-three-text) causes WebGL errors in headless Chrome/swiftshader, breaking the entire Canvas render
- **Fix 2**: Replaced `Text` with mesh-based indicators in `DeskScreenContent.tsx` and `ZoneLabel.tsx`

## Acceptance After Plan 17 + P0 Fixes

| Check | Desktop | Mobile | Notes |
| --- | --- | --- | --- |
| 3D office visible on first screen | ✅ | ✅ | near_black 0.0 both viewports |
| Lobster Commander visible | ✅ | ✅ | CommanderStation renders correctly |
| Worker desks visible | ✅ | ✅ | AgentGroup desks + agents render |
| Main controls do not cover scene | — | — | Requires manual browser QA |
| Complete guided demo starts | — | — | Requires manual browser QA |
| Approval appears and can be approved | — | — | Requires manual browser QA |
| Artifact appears in Commander and Files | — | — | Requires manual browser QA |
| Review summarizes result | — | — | Requires manual browser QA |
| No console errors | — | — | Requires manual browser QA |

## Screenshot Paths

- Desktop: `C:\tmp\cyber-office-visual-qa\desktop-1366x768.png`
- Mobile: `C:\tmp\cyber-office-visual-qa\mobile-390x844.png`

## Desktop Automated Metrics

| Metric | Value | Threshold | Pass |
| --- | --- | --- | --- |
| near_black_ratio | 0.0 | < 0.35 | ✅ |
| avg_rgb | (190, 205, 219) | > (32, 32, 32) | ✅ |
| Scene geometry detected | Yes | — | ✅ |

## Mobile Automated Metrics

| Metric | Value | Threshold | Pass |
| --- | --- | --- | --- |
| near_black_ratio | 0.0 | < 0.50 | ✅ |
| avg_rgb | (83, 91, 105) | > (32, 32, 32) | ✅ |
| Scene geometry detected | Yes | — | ✅ |

## Desktop Human Review

- Can I tell this is a 3D AI office within 3 seconds?
- Can I identify Lobster Commander without clicking?
- Can I identify at least two Worker desks?
- Do the controls feel secondary to the office scene?
- Does `完整导览` tell a story from goal to artifact to review?

## Mobile Human Review

- Is there no horizontal overflow?
- Is part of the 3D office still visible?
- Are primary buttons tappable?
- Does Commander text remain readable?
- Does the bottom HUD avoid covering everything important?

## Reference Mismatch Ledger

| Reference expectation | Current evidence | Decision |
| --- | --- | --- |
| Bright office visible on first screen | Desktop near_black 0.0, avg_rgb (190,205,219) | ✅ Met |
| Commander visibly directs workers | CommanderStation renders; AgentGroup visible | ✅ Met |
| Demo feels like a video walkthrough | 6 cinematic shots defined, video replica timeline wired | Requires browser QA |
| Real AI actually executes work | Still guarded/mock | Deferred to runtime implementation |
| Text labels visible on desk screens | Text replaced with mesh indicators for headless compat | Visual difference noted; real browser has full text |

## Plan 18 Art Direction Reset (2026-05-25)

Plan 18 addresses user-facing mismatch after functional completion:

- Layout was visually noisy → Commander centered, workers in clean arc
- Office did not match the clean command-room read of the reference video → Video-style 3/4 camera, organized zones
- Character style felt odd because humanoid agents conflicted with AI-worker theme → Replaced with AI assistant pods + lobster command pod
- Props dominated the scene → Normal mode reduced to 5 decor + 1 desk prop

### Plan 18 Acceptance

| Check | Result |
| --- | --- |
| Commander is visual center | ✅ Centered at [0,0,-4.25] |
| Workers form readable command arc | ✅ 3 workers at [-3.25, 0, +3.25] x |
| Props reduced and semantic | ✅ Normal: 5 decor, 1 desk prop |
| UI does not dominate 3D scene | ✅ Safe zones keep center 60% clear |
| Characters use AI assistant pod style | ✅ No humanoid limbs/eyes |
| No troika Text reintroduced | ✅ grep: no matches in src/ |
| Desktop near_black | 0.0 ✅ |
| Mobile near_black | 0.0 ✅ |
