# First-Screen Video Fidelity and QA Gate Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the first screen feel like the reference video: a visible bright 3D AI office where the Lobster Commander clearly directs Worker desks, with a repeatable QA gate so future visual changes do not regress.

**Architecture:** Build a verification baseline before changing visuals, then adjust the first-screen layout, camera, lighting, and cinematic demo as small independent layers. Keep Demo, Mock, Connected, migration, and runtime safety boundaries unchanged; this plan only changes presentation, guided flow orchestration, and QA documentation.

**Tech Stack:** React 18, TypeScript, Zustand, React Three Fiber, Drei, Three.js, Vitest, Vite, headless Chrome screenshot checks, existing demo engine, existing Commander store.

---

## 中文执行摘要

本计划是下一轮“更像视频”的核心优化，不碰真实 AI 凭据和 Runtime 安全边界，专门解决用户第一眼看到的问题：

1. 右侧 3D 办公室不能再黑成一片，首屏必须能看见明亮办公室。
2. 龙虾 Commander 必须一眼可见，不能被左侧表单感盖过去。
3. Worker 工位必须能看见，并且和 Commander 的指挥动作有连线、脉冲、状态屏等因果反馈。
4. `完整导览` 必须像视频一样讲故事：办公室总览 -> 下达目标 -> 分配 Worker -> 审批 -> 产物 -> 复盘。
5. 桌面 1366x768 和移动端 390x844 必须都有截图证据，不能只靠 `npm run build` 说通过。

为了避免返工，本计划先建 QA 尺子，再改视觉。任何任务如果导致截图仍然大面积黑屏，要停下来修首屏，不继续堆演示动效。

## Why This Plan Exists

The project now has most functional pieces: Commander, Worker roster, approval, artifact rail, review, migration, runtime placeholder, and documentation. The remaining gap is user perception.

The latest user-perspective QA found:

- Desktop first screen still reads as a UI control panel plus a dark/blank 3D area.
- The 3D office is not the first visual signal.
- Lobster Commander exists, but the scene does not immediately communicate "Commander is directing a group of AI workers."
- Mobile layout is crowded and the 3D office is nearly absent.
- Browser-plugin localhost access can be blocked, so QA must have a reliable fallback path.

This plan is deliberately ordered to avoid rework:

1. Create a visual QA baseline first.
2. Fix first-screen visibility and scene framing second.
3. Reduce UI obstruction third.
4. Add cinematic guided flow fourth.
5. Strengthen Commander-to-Worker visual causality fifth.
6. Only then update acceptance docs and screenshots.

## Non-Goals

- Do not connect real AI runtime in this plan.
- Do not add external model credentials.
- Do not replace React Three Fiber or the existing scene architecture.
- Do not rewrite all Workbench modules.
- Do not chase pixel-perfect copying of private video assets.
- Do not commit generated screenshots unless the user explicitly asks for committed QA artifacts.

## Current Evidence To Preserve

Use these as the baseline that this plan must improve:

- Desktop screenshot: `C:\tmp\cyber-office-desktop-webgl.png`
- Mobile screenshot: `C:\tmp\cyber-office-mobile.png`
- Desktop 3D scene sample from the latest screenshot: near-black ratio `0.9969`, average RGB `(0, 0, 0)`.
- Mobile 3D scene sample from the latest screenshot: near-black ratio `0.8389`, average RGB `(2, 2, 6)`.

The final implementation must replace these with new screenshot evidence where the 3D office is visible.

## Files

### Create

| File | Responsibility |
| --- | --- |
| `src/scene/firstScreenFidelity.ts` | Pure configuration for first-screen camera, safe zones, brightness targets, and visual acceptance thresholds. |
| `src/scene/firstScreenFidelity.test.ts` | Tests for first-screen camera, brightness thresholds, and non-overlap layout constraints. |
| `src/scene/cinematicCameraPresets.ts` | Named camera shots for video-style guided demo flow. |
| `src/scene/cinematicCameraPresets.test.ts` | Tests ensuring each guided shot has valid position, target, duration, and stage mapping. |
| `src/ui/office/OfficePresentationLayer.tsx` | Scene-first overlay layer for Commander entry, reset view, SidePanel, and event feed without hiding the office. |
| `src/demo/videoReplicaGuidedTimeline.ts` | Purpose-built guided timeline that tells the video story from Commander goal to review. |
| `src/demo/videoReplicaGuidedTimeline.test.ts` | Tests for timeline ordering, camera shot coverage, task lifecycle, approval, artifact, and review events. |
| `scripts/visual-qa/capture-office.ps1` | Repeatable Windows screenshot capture using local Vite + Chrome headless fallback. |
| `scripts/visual-qa/measure-screenshot.py` | Pixel-level screenshot measurement helper for black-scene regression checks. |
| `docs/qa/video-fidelity-qa.md` | Human-readable QA report template and final results for Plan 17. |

### Modify

| File | Change |
| --- | --- |
| `src/scene/OfficeScene.tsx` | Apply first-screen fidelity config, optional visual probe markers, and scene-first defaults. |
| `src/scene/CameraController.tsx` | Replace current default camera with first-screen showcase camera and named cinematic shots. |
| `src/scene/Lighting.tsx` | Ensure first screen remains bright and readable even before demo events run. |
| `src/scene/sceneVisualTheme.ts` | Add explicit first-screen brightness tokens and avoid hidden dark fallbacks. |
| `src/scene/CommanderVisualLayer.tsx` | Strengthen Commander-to-Worker links during guided flow without adding business logic. |
| `src/ui/AppShell.tsx` | Replace office overlay layout with `OfficePresentationLayer`; keep SidePanel and Reset View layering stable. |
| `src/ui/DemoControls.tsx` | Make `完整导览` the primary video-replica action and route it to the new timeline. |
| `src/ui/GuidedDemoHud.tsx` | Add stronger stage titles, current actor, current output, and next action copy. |
| `docs/qa/browser-qa-results.md` | Record desktop/mobile Plan 17 results. |
| `docs/qa/final-acceptance-checklist.md` | Add Plan 17 first-screen/video-fidelity acceptance items. |
| `docs/qa/release-hardening-report.md` | Update remaining risk and next steps after Plan 17. |

## Design Principles

1. **Scene first.** The first viewport must be a 3D office with controls overlaid around it, not a control panel with a scene behind it.
2. **Commander visible immediately.** The Lobster Commander station must be visible without clicking.
3. **Worker causality.** When the Commander assigns work, the user should see which Worker is active and why.
4. **Readable Chinese.** Stage copy and button labels must stay short enough for desktop and 390px mobile.
5. **No hidden safety changes.** Runtime credentials, guarded placeholder, and migration rules remain untouched.
6. **Evidence before acceptance.** A plan task is not complete until tests/build pass and screenshots show the expected state.

## Task 1: Establish First-Screen Fidelity Baseline

**Files:**
- Create: `src/scene/firstScreenFidelity.ts`
- Create: `src/scene/firstScreenFidelity.test.ts`
- Create: `docs/qa/video-fidelity-qa.md`
- Create: `scripts/visual-qa/capture-office.ps1`

- [ ] **Step 1: Write first-screen config tests**

Create `src/scene/firstScreenFidelity.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  FIRST_SCREEN_CAMERA,
  FIRST_SCREEN_SAFE_ZONES,
  FIRST_SCREEN_VISUAL_THRESHOLDS,
  isCameraPresetValid,
  isSafeZoneReasonable,
} from './firstScreenFidelity';

describe('first-screen fidelity config', () => {
  it('uses a valid camera that can see commander and worker areas', () => {
    expect(isCameraPresetValid(FIRST_SCREEN_CAMERA)).toBe(true);
    expect(FIRST_SCREEN_CAMERA.position[1]).toBeGreaterThanOrEqual(5);
    expect(FIRST_SCREEN_CAMERA.position[2]).toBeGreaterThanOrEqual(7);
  });

  it('keeps office overlays from claiming the whole viewport', () => {
    expect(isSafeZoneReasonable(FIRST_SCREEN_SAFE_ZONES.desktop)).toBe(true);
    expect(FIRST_SCREEN_SAFE_ZONES.desktop.sceneMinWidthRatio).toBeGreaterThanOrEqual(0.62);
    expect(FIRST_SCREEN_SAFE_ZONES.mobile.sceneMinHeight).toBeGreaterThanOrEqual(280);
  });

  it('requires a visibly non-black 3D area in screenshot QA', () => {
    expect(FIRST_SCREEN_VISUAL_THRESHOLDS.maxNearBlackRatio).toBeLessThanOrEqual(0.35);
    expect(FIRST_SCREEN_VISUAL_THRESHOLDS.minAverageRgb).toBeGreaterThanOrEqual(32);
  });
});
```

- [ ] **Step 2: Implement first-screen config**

Create `src/scene/firstScreenFidelity.ts`:

```ts
export interface CameraPreset {
  id: string;
  position: [number, number, number];
  target: [number, number, number];
  durationMs: number;
}

export const FIRST_SCREEN_CAMERA: CameraPreset = {
  id: 'first-screen-office-showcase',
  position: [7.5, 7.2, 10.5],
  target: [0, 0.8, -0.6],
  durationMs: 900,
};

export const FIRST_SCREEN_SAFE_ZONES = {
  desktop: {
    sceneMinWidthRatio: 0.62,
    commanderPanelMaxWidth: 320,
    bottomHudMaxHeight: 92,
  },
  mobile: {
    sceneMinHeight: 280,
    commanderPanelMaxHeightRatio: 0.52,
    bottomHudMaxHeight: 96,
  },
} as const;

export const FIRST_SCREEN_VISUAL_THRESHOLDS = {
  maxNearBlackRatio: 0.35,
  minAverageRgb: 32,
  minVisibleScenePixelsDesktop: 260_000,
  minVisibleScenePixelsMobile: 80_000,
} as const;

export function isCameraPresetValid(preset: CameraPreset): boolean {
  return (
    preset.position.length === 3 &&
    preset.target.length === 3 &&
    preset.position.every(Number.isFinite) &&
    preset.target.every(Number.isFinite) &&
    preset.durationMs > 0
  );
}

export function isSafeZoneReasonable(zone: {
  sceneMinWidthRatio?: number;
  sceneMinHeight?: number;
  commanderPanelMaxWidth?: number;
  commanderPanelMaxHeightRatio?: number;
  bottomHudMaxHeight: number;
}): boolean {
  if (zone.sceneMinWidthRatio !== undefined && zone.sceneMinWidthRatio < 0.55) return false;
  if (zone.sceneMinHeight !== undefined && zone.sceneMinHeight < 240) return false;
  if (zone.commanderPanelMaxWidth !== undefined && zone.commanderPanelMaxWidth > 360) return false;
  if (zone.commanderPanelMaxHeightRatio !== undefined && zone.commanderPanelMaxHeightRatio > 0.62) return false;
  return zone.bottomHudMaxHeight <= 120;
}
```

- [ ] **Step 3: Create QA report template**

Create `docs/qa/video-fidelity-qa.md`:

```md
# Video Fidelity QA

Date:
Build:
Branch:

## Reference Goal

The first screen should read as a bright 3D AI office with Lobster Commander visibly directing Worker desks.

## Baseline Before Plan 17

| Viewport | Evidence | Result |
| --- | --- | --- |
| Desktop 1366x768 | `C:\tmp\cyber-office-desktop-webgl.png` | 3D area near-black ratio 0.9969 |
| Mobile 390x844 | `C:\tmp\cyber-office-mobile.png` | 3D area near-black ratio 0.8389 |

## Acceptance After Plan 17

| Check | Desktop | Mobile | Notes |
| --- | --- | --- | --- |
| 3D office visible on first screen |  |  |  |
| Lobster Commander visible |  |  |  |
| Worker desks visible |  |  |  |
| Main controls do not cover scene |  |  |  |
| Complete guided demo starts |  |  |  |
| Approval appears and can be approved |  |  |  |
| Artifact appears in Commander and Files |  |  |  |
| Review summarizes result |  |  |  |
| No console errors |  |  |  |

## Screenshot Paths

- Desktop:
- Mobile:
- Guided demo:
- Approval:
- Review:
```

- [ ] **Step 4: Create repeatable Windows capture script**

Create `scripts/visual-qa/capture-office.ps1`:

```powershell
param(
  [int]$Port = 5194,
  [string]$Root = "C:\Users\A413\Documents\3D赛博办公室",
  [string]$Chrome = "C:\Program Files\Google\Chrome\Application\chrome.exe",
  [string]$OutputDir = "C:\tmp\cyber-office-visual-qa"
)

$ErrorActionPreference = "Stop"
New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null

$desktop = Join-Path $OutputDir "desktop-1366x768.png"
$mobile = Join-Path $OutputDir "mobile-390x844.png"
Remove-Item -LiteralPath $desktop, $mobile -Force -ErrorAction SilentlyContinue

$proc = Start-Process -FilePath npm.cmd `
  -ArgumentList @("run", "dev", "--", "--host", "127.0.0.1", "--port", "$Port") `
  -WorkingDirectory $Root `
  -WindowStyle Hidden `
  -PassThru

try {
  $ok = $false
  for ($i = 0; $i -lt 40; $i++) {
    try {
      $response = Invoke-WebRequest -Uri "http://127.0.0.1:$Port/" -UseBasicParsing -TimeoutSec 2
      if ($response.StatusCode -eq 200) { $ok = $true; break }
    } catch {}
    Start-Sleep -Milliseconds 500
  }
  if (-not $ok) { throw "Vite did not respond on port $Port." }

  & $Chrome @(
    "--headless=new",
    "--enable-webgl",
    "--ignore-gpu-blocklist",
    "--use-angle=swiftshader",
    "--disable-gpu",
    "--no-first-run",
    "--no-default-browser-check",
    "--user-data-dir=$OutputDir\chrome-desktop",
    "--window-size=1366,768",
    "--virtual-time-budget=10000",
    "--screenshot=$desktop",
    "http://127.0.0.1:$Port/"
  ) | Out-Null

  & $Chrome @(
    "--headless=new",
    "--enable-webgl",
    "--ignore-gpu-blocklist",
    "--use-angle=swiftshader",
    "--disable-gpu",
    "--no-first-run",
    "--no-default-browser-check",
    "--user-data-dir=$OutputDir\chrome-mobile",
    "--window-size=390,844",
    "--virtual-time-budget=10000",
    "--screenshot=$mobile",
    "http://127.0.0.1:$Port/"
  ) | Out-Null

  Get-Item -LiteralPath $desktop, $mobile | Select-Object FullName, Length, LastWriteTime
}
finally {
  Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
}
```

- [ ] **Step 5: Run config test**

Run:

```powershell
npm.cmd run test -- src/scene/firstScreenFidelity.test.ts
```

Expected:

```text
1 file passed
3 tests passed
```

## Task 2: Make the First Screen Scene-First

**Files:**
- Modify: `src/scene/CameraController.tsx`
- Modify: `src/scene/OfficeScene.tsx`
- Modify: `src/scene/Lighting.tsx`
- Modify: `src/scene/sceneVisualTheme.ts`

- [ ] **Step 1: Replace default camera constants**

In `src/scene/CameraController.tsx`, import `FIRST_SCREEN_CAMERA`:

```ts
import { FIRST_SCREEN_CAMERA } from './firstScreenFidelity';
```

Replace `OFFICE_OVERVIEW_CAMERA` with:

```ts
export const OFFICE_OVERVIEW_CAMERA = {
  position: FIRST_SCREEN_CAMERA.position,
  target: FIRST_SCREEN_CAMERA.target,
};
```

Acceptance:

- Reset View returns to a view where Commander station and Worker desks are both visible.
- The camera target is not aimed at an empty floor.

- [ ] **Step 2: Add first-screen brightness tokens**

In `src/scene/sceneVisualTheme.ts`, add explicit tokens:

```ts
firstScreenAmbientBoost: 1.25,
firstScreenKeyLightBoost: 1.18,
firstScreenBackground: '#e7f4ff',
firstScreenFloor: '#8ea4b8',
firstScreenWall: '#bfd0df',
```

Keep existing token names for backwards compatibility. Do not remove current properties in this task.

- [ ] **Step 3: Apply scene background explicitly**

In `src/scene/OfficeScene.tsx`, keep `<color attach="background">`, but use the new first-screen background token:

```tsx
<color attach="background" args={[brightOfficeTheme.firstScreenBackground]} />
<fog attach="fog" args={[brightOfficeTheme.firstScreenBackground, brightOfficeTheme.fogNear, brightOfficeTheme.fogFar]} />
```

Acceptance:

- If WebGL renders, the Canvas background cannot appear pure black before meshes load.

- [ ] **Step 4: Strengthen base lighting without washing out cyber accents**

In `src/scene/Lighting.tsx`, update intensities to use the new boost values:

```tsx
<ambientLight
  color={brightOfficeTheme.ambient}
  intensity={brightOfficeTheme.ambientIntensity * brightOfficeTheme.firstScreenAmbientBoost}
/>
```

For the key light:

```tsx
<directionalLight
  color={brightOfficeTheme.keyLight}
  intensity={brightOfficeTheme.keyLightIntensity * brightOfficeTheme.firstScreenKeyLightBoost}
  ...
/>
```

Acceptance:

- Worker desks and Commander desk are visible on first screen.
- Existing neon accents remain visible and do not become pastel mud.

- [ ] **Step 5: Run visual theme tests**

Run:

```powershell
npm.cmd run test -- src/scene/sceneVisualTesting.test.ts src/scene/firstScreenFidelity.test.ts
```

Expected:

```text
2 files passed
```

## Task 3: Reduce First-Screen UI Obstruction

**Files:**
- Create: `src/ui/office/OfficePresentationLayer.tsx`
- Modify: `src/ui/AppShell.tsx`
- Modify: `src/index.css`
- Modify: `src/store/uiStore.ts` only if a persisted panel mode is needed.

- [ ] **Step 1: Create presentation layer**

Create `src/ui/office/OfficePresentationLayer.tsx`.

Important: do not render `DemoControls` inside this component. `DemoControls` already exists as a global AppShell overlay and must stay single-instance to avoid duplicate Start/Reset buttons.

```tsx
import { CommanderDock } from '@/ui/commander/CommanderDock';
import { EventFeed } from '@/ui/EventFeed';
import { ResetCameraBtn } from '@/ui/ResetCameraBtn';
import { SidePanel } from '@/ui/SidePanel';

export function OfficePresentationLayer() {
  return (
    <>
      <div className="office-layer office-layer-commander pointer-events-auto">
        <CommanderDock />
      </div>

      <div className="office-layer office-layer-reset pointer-events-auto">
        <ResetCameraBtn />
      </div>

      <div className="office-layer office-layer-side pointer-events-auto">
        <SidePanel />
      </div>

      <div className="office-layer office-layer-feed pointer-events-auto">
        <EventFeed />
      </div>
    </>
  );
}
```

- [ ] **Step 2: Replace office overlay markup in AppShell**

In `src/ui/AppShell.tsx`, import:

```ts
import { OfficePresentationLayer } from './office/OfficePresentationLayer';
```

Replace the office branch overlay children with:

```tsx
<div className="flex-1 relative office-stage">
  <OfficeScene />
  <OfficePresentationLayer />
</div>
```

Remove duplicate direct office rendering of:

- `CommanderDock`
- `ResetCameraBtn`
- office `SidePanel`
- office `EventFeed`

Keep the existing global `DemoControls` wrapper outside the office/workbench branch. There must be exactly one `DemoControls` instance in `AppShell`.

- [ ] **Step 3: Add desktop safe-zone CSS**

In `src/index.css`, add:

```css
.office-stage {
  min-height: 0;
  background: #e7f4ff;
}

.office-layer {
  position: absolute;
  z-index: 20;
}

.office-layer-commander {
  left: 12px;
  top: 12px;
  width: min(320px, calc(100vw - 48px));
  max-height: calc(100% - 126px);
  overflow: auto;
}

.office-layer-reset {
  right: 12px;
  top: 12px;
  z-index: 30;
}

.office-layer-side {
  right: 12px;
  top: 56px;
  max-height: calc(100% - 164px);
  overflow: auto;
  z-index: 28;
}

.office-layer-feed {
  left: 12px;
  right: 360px;
  bottom: 12px;
  max-height: 92px;
  overflow: hidden;
}

Acceptance:

- Desktop scene keeps at least 62% usable width.
- Bottom event feed does not cover the middle of the office.
- Demo buttons do not cover the Commander panel.

- [ ] **Step 4: Add mobile safe-zone CSS**

Add:

```css
@media (max-width: 640px) {
  .office-layer-commander {
    left: 8px;
    right: 8px;
    top: 58px;
    width: auto;
    max-height: 52%;
  }

  .office-layer-feed {
    left: 8px;
    right: 8px;
    bottom: 82px;
    max-height: 84px;
  }

  .office-layer-side {
    right: 8px;
    left: 8px;
    top: 72px;
    max-height: calc(100% - 160px);
  }
}
```

Acceptance:

- 390px width has no horizontal overflow.
- The 3D scene remains visible above or behind the Commander panel.
- Buttons remain tappable.

- [ ] **Step 5: Run build**

Run:

```powershell
npm.cmd run build
```

Expected:

```text
✓ built
```

## Task 4: Add Cinematic Camera Presets

**Files:**
- Create: `src/scene/cinematicCameraPresets.ts`
- Create: `src/scene/cinematicCameraPresets.test.ts`
- Modify: `src/scene/CameraController.tsx`

- [ ] **Step 1: Write cinematic preset tests**

Create `src/scene/cinematicCameraPresets.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  CINEMATIC_CAMERA_SHOTS,
  getCinematicShot,
  getCinematicShotIds,
} from './cinematicCameraPresets';

describe('cinematic camera presets', () => {
  it('defines the full video replica shot list', () => {
    expect(getCinematicShotIds()).toEqual([
      'intro-office',
      'commander-console',
      'worker-assignment',
      'approval-focus',
      'artifact-delivery',
      'review-summary',
    ]);
  });

  it('keeps every shot valid and smooth enough to read', () => {
    for (const shot of CINEMATIC_CAMERA_SHOTS) {
      expect(shot.position).toHaveLength(3);
      expect(shot.target).toHaveLength(3);
      expect(shot.durationMs).toBeGreaterThanOrEqual(900);
      expect(shot.durationMs).toBeLessThanOrEqual(2600);
    }
  });

  it('returns a fallback intro shot for unknown IDs', () => {
    expect(getCinematicShot('missing').id).toBe('intro-office');
  });
});
```

- [ ] **Step 2: Implement camera presets**

Create `src/scene/cinematicCameraPresets.ts`:

```ts
import type { CameraPreset } from './firstScreenFidelity';
import { FIRST_SCREEN_CAMERA } from './firstScreenFidelity';

export type CinematicShotId =
  | 'intro-office'
  | 'commander-console'
  | 'worker-assignment'
  | 'approval-focus'
  | 'artifact-delivery'
  | 'review-summary';

export interface CinematicCameraShot extends CameraPreset {
  id: CinematicShotId;
  label: string;
}

export const CINEMATIC_CAMERA_SHOTS: CinematicCameraShot[] = [
  {
    ...FIRST_SCREEN_CAMERA,
    id: 'intro-office',
    label: '办公室总览',
  },
  {
    id: 'commander-console',
    label: '龙虾 Commander 指挥台',
    position: [4.8, 5.6, 7.4],
    target: [-1.4, 0.9, -1.2],
    durationMs: 1300,
  },
  {
    id: 'worker-assignment',
    label: 'Worker 工位分配',
    position: [6.4, 5.2, 5.8],
    target: [2.2, 0.9, -0.8],
    durationMs: 1500,
  },
  {
    id: 'approval-focus',
    label: '审批请求',
    position: [3.2, 4.2, 5.2],
    target: [0.2, 0.9, -1.6],
    durationMs: 1200,
  },
  {
    id: 'artifact-delivery',
    label: '产物交付',
    position: [5.8, 5.1, 6.8],
    target: [1.8, 0.8, 2.4],
    durationMs: 1400,
  },
  {
    id: 'review-summary',
    label: '复盘总结',
    position: [7.2, 6.2, 9.2],
    target: [0, 0.8, 0.4],
    durationMs: 1600,
  },
];

export function getCinematicShotIds(): CinematicShotId[] {
  return CINEMATIC_CAMERA_SHOTS.map((shot) => shot.id);
}

export function getCinematicShot(id: string): CinematicCameraShot {
  return CINEMATIC_CAMERA_SHOTS.find((shot) => shot.id === id) ?? CINEMATIC_CAMERA_SHOTS[0];
}
```

- [ ] **Step 3: Connect presets to guided camera shots**

Where `setGuidedCameraShot` currently receives ad hoc shot values, update the guided timeline task in Task 5 to reference these presets. Keep `CameraController` interpolation logic unchanged.

- [ ] **Step 4: Run tests**

Run:

```powershell
npm.cmd run test -- src/scene/cinematicCameraPresets.test.ts
```

Expected:

```text
1 file passed
3 tests passed
```

## Task 5: Build Video Replica Guided Timeline

**Files:**
- Create: `src/demo/videoReplicaGuidedTimeline.ts`
- Create: `src/demo/videoReplicaGuidedTimeline.test.ts`
- Modify: `src/ui/DemoControls.tsx`
- Modify: `src/ui/GuidedDemoHud.tsx`

- [ ] **Step 1: Write timeline tests**

Create `src/demo/videoReplicaGuidedTimeline.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { buildVideoReplicaGuidedTimeline } from './videoReplicaGuidedTimeline';

describe('video replica guided timeline', () => {
  it('starts with office intro and ends with review summary', () => {
    const timeline = buildVideoReplicaGuidedTimeline();
    expect(timeline[0].type).toBe('guided.stage_changed');
    expect(timeline[0].payload.stage).toBe('intro-office');
    expect(timeline.at(-1)?.payload.stage).toBe('review-summary');
  });

  it('covers mission, assignment, approval, artifact, and review', () => {
    const types = buildVideoReplicaGuidedTimeline().map((event) => event.type);
    expect(types).toContain('commander.mission_created');
    expect(types).toContain('task.assigned');
    expect(types).toContain('approval.requested');
    expect(types).toContain('artifact.created');
    expect(types).toContain('review.summary_ready');
  });

  it('has camera cues for every major video stage', () => {
    const stages = buildVideoReplicaGuidedTimeline()
      .filter((event) => event.type === 'guided.camera_cue')
      .map((event) => event.payload.shotId);

    expect(stages).toEqual([
      'intro-office',
      'commander-console',
      'worker-assignment',
      'approval-focus',
      'artifact-delivery',
      'review-summary',
    ]);
  });
});
```

- [ ] **Step 2: Implement timeline builder**

Create `src/demo/videoReplicaGuidedTimeline.ts` with a deterministic event list. Use existing event types and payload shapes from `guidedDemoTimeline.ts`, `commanderScenario.ts`, and `scenarios.ts`.

Minimum stage order:

1. `intro-office`: show office, Commander, Worker desks.
2. `commander-console`: create mission and show goal.
3. `worker-assignment`: assign Research, Build, Review workers.
4. `approval-focus`: request high-risk approval.
5. `artifact-delivery`: resolve approval and create artifact.
6. `review-summary`: complete tasks and summarize result.

Each stage must emit:

- one `guided.stage_changed`
- one `guided.camera_cue`
- at least one business event that changes visible state

- [ ] **Step 3: Route complete guided demo to new timeline**

In `src/ui/DemoControls.tsx`, replace:

```ts
import { buildGuidedDemoTimeline } from '@/demo/guidedDemoTimeline';
```

with:

```ts
import { buildVideoReplicaGuidedTimeline } from '@/demo/videoReplicaGuidedTimeline';
```

Then replace:

```ts
startDemoEngine(buildGuidedDemoTimeline());
```

with:

```ts
startDemoEngine(buildVideoReplicaGuidedTimeline());
```

Acceptance:

- The primary button `完整导览` now tells the video-replica story, not just a generic guided demo.

- [ ] **Step 4: Strengthen GuidedDemoHud copy**

In `src/ui/GuidedDemoHud.tsx`, display:

- current stage title
- actor, for example `龙虾 Commander`
- current action, for example `正在把任务分给 Build Worker`
- current output, for example `产物即将进入 Files`
- next action

Keep the text compact:

```text
龙虾 Commander
正在分配 Worker
下一步：等待审批
```

Acceptance:

- HUD reads like video narration, not debug status.
- Mobile text wraps cleanly.

- [ ] **Step 5: Run demo tests**

Run:

```powershell
npm.cmd run test -- src/demo/videoReplicaGuidedTimeline.test.ts src/demo/commanderScenario.test.ts
```

Expected:

```text
2 files passed
```

## Task 6: Strengthen Commander-to-Worker Visual Causality

**Files:**
- Modify: `src/scene/CommanderVisualLayer.tsx`
- Modify: `src/scene/CommanderActivityPulse.tsx`
- Modify: `src/scene/DeskScreenContent.tsx`
- Modify: `src/scene/AgentCharacter.tsx`
- Modify: `src/commander/commanderVisualState.ts`
- Modify: `src/commander/commanderVisualState.test.ts`

- [ ] **Step 1: Extend visual state test**

In `src/commander/commanderVisualState.test.ts`, add a test:

```ts
it('highlights active workers and linked artifacts during guided delivery', () => {
  const state = buildCommanderVisualState(mission, {}, workers);

  expect(state.linkTargets.length).toBeGreaterThan(0);
  expect(state.linkTargets.every((target) => target.deskId)).toBe(true);
});
```

- [ ] **Step 2: Ensure link targets include visible labels**

In `src/commander/commanderVisualState.ts`, make sure every `CommanderLinkTarget` includes:

```ts
{
  workerId: string;
  deskId: string;
  label: string;
  status: MissionTask['status'];
}
```

Do not infer desk IDs from string matching. Continue using `WorkerProfile.deskId`.

- [ ] **Step 3: Add stage-specific pulse intensity**

In `src/scene/CommanderActivityPulse.tsx`, use stage or tone to vary:

- working: cyan line
- approval: amber pulse
- completed/artifact: green pulse
- blocked: red/rose pulse

Acceptance:

- The user can visually tell whether work is running, waiting for approval, or delivered.

- [ ] **Step 4: Make desk screens reflect guided stage**

In `src/scene/DeskScreenContent.tsx`, ensure each screen shows:

- Worker role shorthand
- Chinese status
- short task title
- tiny progress bar or status strip

Do not add long text inside the 3D screen.

- [ ] **Step 5: Make active Agent movement more obvious**

In `src/scene/AgentCharacter.tsx`, adjust animation by status:

- `working`: stronger subtle bob and screen-facing posture
- `waiting_input` / approval: slower pulse
- `blocked`: red status accent and still posture
- `completed`: green accent and relaxed posture

Acceptance:

- Animation remains lightweight.
- No hooks are conditionally called.

- [ ] **Step 6: Run commander visual tests**

Run:

```powershell
npm.cmd run test -- src/commander/commanderVisualState.test.ts src/commander/commanderExperience.test.ts
```

Expected:

```text
2 files passed
```

## Task 7: Mobile First-Screen Repair

**Files:**
- Modify: `src/index.css`
- Modify: `src/ui/Navigation.tsx`
- Modify: `src/ui/DemoControls.tsx`
- Modify: `src/ui/commander/CommanderDock.tsx`
- Modify: `src/ui/GuidedDemoHud.tsx`

- [ ] **Step 1: Make mobile nav horizontally scrollable instead of crushed**

In `src/index.css`, add:

```css
@media (max-width: 640px) {
  .mobile-nav-scroll {
    overflow-x: auto;
    scrollbar-width: none;
    -webkit-overflow-scrolling: touch;
  }

  .mobile-nav-scroll::-webkit-scrollbar {
    display: none;
  }
}
```

Apply `mobile-nav-scroll` to the navigation button container in `Navigation.tsx`.

- [ ] **Step 2: Compact demo controls on mobile**

In `DemoControls.tsx`, keep all four actions available but allow a compact two-row layout:

```tsx
className="m-2 p-2 grid grid-cols-2 sm:flex sm:items-center gap-2 rounded-lg border border-cyber-border bg-cyber-panel"
```

Acceptance:

- 390px width shows readable buttons.
- No button text is clipped.

- [ ] **Step 3: Collapse Commander content below the fold on mobile**

In `CommanderDock.tsx`, use CSS classes so the header and primary goal remain visible, while detailed roster/artifact sections can scroll inside the panel.

Acceptance:

- User can still see part of the 3D office.
- Commander panel remains usable.

- [ ] **Step 4: Keep guided HUD above demo controls**

In `GuidedDemoHud.tsx` or CSS, ensure mobile HUD does not sit under the bottom controls.

Acceptance:

- At 390x844, HUD, buttons, and Commander panel do not overlap incoherently.

- [ ] **Step 5: Manual mobile QA**

Run the capture script after implementation:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\visual-qa\capture-office.ps1 -Port 5194
```

Expected:

- `mobile-390x844.png` exists.
- First screen shows a visible office area.

## Task 8: Visual QA Pixel Check

**Files:**
- Create or modify: `scripts/visual-qa/measure-screenshot.py`
- Modify: `docs/qa/video-fidelity-qa.md`

- [ ] **Step 1: Add screenshot measurement helper**

Create `scripts/visual-qa/measure-screenshot.py`:

```py
from __future__ import annotations

import sys
from pathlib import Path
from PIL import Image


def measure(path: Path, box: tuple[int, int, int, int]) -> dict[str, object]:
    img = Image.open(path).convert("RGB")
    crop = img.crop(box)
    pixels = list(crop.getdata())
    total = len(pixels)
    near_black = sum(1 for r, g, b in pixels if r < 8 and g < 8 and b < 8)
    avg = tuple(sum(px[i] for px in pixels) // total for i in range(3))
    return {
        "path": str(path),
        "size": img.size,
        "box": box,
        "near_black_ratio": round(near_black / total, 4),
        "avg_rgb": avg,
    }


def main() -> int:
    if len(sys.argv) < 2:
        print("Usage: measure-screenshot.py <png>")
        return 2

    path = Path(sys.argv[1])
    img = Image.open(path)
    width, height = img.size
    if width > 800:
        box = (360, 130, width, height - 110)
    else:
        box = (16, 150, width - 16, height - 140)

    print(measure(path, box))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
```

- [ ] **Step 2: Measure desktop and mobile screenshots**

Run:

```powershell
& 'C:\Users\A413\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' scripts\visual-qa\measure-screenshot.py C:\tmp\cyber-office-visual-qa\desktop-1366x768.png
& 'C:\Users\A413\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' scripts\visual-qa\measure-screenshot.py C:\tmp\cyber-office-visual-qa\mobile-390x844.png
```

Expected:

- Desktop near-black ratio below `0.35`.
- Mobile near-black ratio below `0.50`.
- Average RGB for sampled scene area at least `(32, 32, 32)`.

- [ ] **Step 3: Update QA report**

Update `docs/qa/video-fidelity-qa.md` with:

- screenshot paths
- near-black ratio
- average RGB
- pass/fail notes
- any visual mismatch ledger

## Task 9: Full Regression Gate

**Files:**
- Modify: `docs/qa/browser-qa-results.md`
- Modify: `docs/qa/final-acceptance-checklist.md`
- Modify: `docs/qa/release-hardening-report.md`

- [ ] **Step 1: Run focused tests**

Run:

```powershell
npm.cmd run test -- src/scene/firstScreenFidelity.test.ts src/scene/cinematicCameraPresets.test.ts src/demo/videoReplicaGuidedTimeline.test.ts
```

Expected:

```text
3 files passed
```

- [ ] **Step 2: Run full tests**

Run:

```powershell
npm.cmd run test
```

Expected:

```text
19+ files passed
103+ tests passed
```

The exact count may increase after this plan. Any failed test blocks acceptance.

- [ ] **Step 3: Run production build**

Run:

```powershell
npm.cmd run build
```

Expected:

```text
✓ built
```

Known acceptable warning:

- `vendor-3d` may remain above warning threshold if documented in `docs/qa/performance-notes.md`.

- [ ] **Step 4: Run screenshot capture**

Run:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\visual-qa\capture-office.ps1 -Port 5194
```

Expected:

- Desktop screenshot exists.
- Mobile screenshot exists.
- Both screenshots show a visible 3D office.

- [ ] **Step 5: Update Browser QA results**

Update `docs/qa/browser-qa-results.md`:

```md
| Plan 17 first screen visible | Pass | Desktop and mobile screenshots captured. |
| Plan 17 Commander visible | Pass | Commander is visible without clicking. |
| Plan 17 guided demo route | Pass | Complete guided demo uses video replica timeline. |
```

- [ ] **Step 6: Update final acceptance checklist**

Add under Product Fit in `docs/qa/final-acceptance-checklist.md`:

```md
- [ ] Plan 17 first-screen screenshot shows a visible bright 3D office.
- [ ] Plan 17 mobile screenshot keeps 3D scene visible at 390x844.
- [ ] Complete Guided Demo uses video-replica staged timeline.
- [ ] Commander-to-Worker visual links are visible during active work.
```

- [ ] **Step 7: Update release hardening report**

Update `docs/qa/release-hardening-report.md`:

```md
| Plan 17 | ✅ Done / ⚠️ Pending visual QA | First-screen video fidelity and QA gate |
```

Use `✅ Done` only after screenshots and pixel checks pass.

## Task 10: Human Review Checklist Before Calling It Video-Like

**Files:**
- Modify: `docs/qa/video-fidelity-qa.md`

- [ ] **Step 1: Desktop human review**

Open the app at desktop size and answer:

```md
### Desktop Human Review

- Can I tell this is a 3D AI office within 3 seconds?
- Can I identify Lobster Commander without clicking?
- Can I identify at least two Worker desks?
- Do the controls feel secondary to the office scene?
- Does `完整导览` tell a story from goal to artifact to review?
```

- [ ] **Step 2: Mobile human review**

Open at 390x844 and answer:

```md
### Mobile Human Review

- Is there no horizontal overflow?
- Is part of the 3D office still visible?
- Are primary buttons tappable?
- Does Commander text remain readable?
- Does the bottom HUD avoid covering everything important?
```

- [ ] **Step 3: Reference mismatch ledger**

Add:

```md
## Reference Mismatch Ledger

| Reference expectation | Current evidence | Decision |
| --- | --- | --- |
| Bright office visible on first screen |  |  |
| Commander visibly directs workers |  |  |
| Demo feels like a video walkthrough |  |  |
| Real AI actually executes work | Still guarded/mock | Deferred to runtime implementation |
```

Acceptance:

- The document clearly says what is now close to the video and what remains intentionally deferred.

## Final Acceptance

Plan 17 is complete only when all of the following are true:

1. `npm.cmd run test` passes.
2. `npm.cmd run build` succeeds.
3. Desktop 1366x768 screenshot shows a visible 3D office, not a black scene.
4. Mobile 390x844 screenshot keeps a meaningful part of the 3D office visible.
5. `完整导览` starts the video-replica timeline.
6. The guided timeline visibly covers: office intro, Commander goal, Worker assignment, approval, artifact delivery, review summary.
7. Commander-to-Worker visual links are visible during active work.
8. Bottom HUD and Commander panel do not block the primary 3D scene.
9. `docs/qa/video-fidelity-qa.md` records screenshot evidence and mismatch ledger.
10. `docs/qa/final-acceptance-checklist.md` and `docs/qa/release-hardening-report.md` are updated.

## Execution Order

Do not parallelize visual changes before Task 1 is done. The safe order is:

1. Task 1: QA baseline and thresholds.
2. Task 2: first-screen camera and lighting.
3. Task 3: UI obstruction repair.
4. Task 4: cinematic camera presets.
5. Task 5: video replica guided timeline.
6. Task 6: Commander-to-Worker causality.
7. Task 7: mobile repair.
8. Task 8: screenshot measurement.
9. Task 9: full regression gate.
10. Task 10: human review checklist.

If any screenshot after Task 3 still shows a black or mostly hidden scene, stop and fix scene visibility before continuing to cinematic timeline work. Otherwise the later demo polish will be built on a broken first impression and will cause rework.
