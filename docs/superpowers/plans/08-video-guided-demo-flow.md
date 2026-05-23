# Video Guided Demo Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a one-click video-style guided demo that tells the full 3D Cyber Office story with staged narration, camera cues, Commander mission events, workbench transitions, pause/resume support, and reset-safe state.

**Architecture:** Extend the existing demo engine with a guided timeline layer instead of replacing it. Keep OfficeEvent dispatch as the source of truth for task state, add separate non-domain demo cues for camera movement, active module changes, selected task/agent focus, and on-screen narration. The camera controller consumes guided camera cues from UI state and interpolates position/target without moving reset controls back into Canvas.

**Tech Stack:** React 18, TypeScript, Vite, React Three Fiber, Drei, Three.js, Zustand, Vitest, localStorage.

---

## Prerequisites

Execute after:

1. `docs/superpowers/plans/06-chinese-ui-and-bright-office.md`
2. `docs/superpowers/plans/07-lobster-commander-visual-center.md`

Plan 08 assumes:

- The app is Chinese-first.
- The office scene is bright enough to read.
- Lobster Commander has a strong visual center.
- Commander mission visual state is already available or planned through Plan 07.

If Plan 07 has not been implemented yet, this plan can still be written, but implementation should wait until Plan 07 is complete so camera cues have a meaningful Commander focal point.

## Source Requirement

Use this spec as the product source:

`docs/superpowers/specs/2026-05-23-video-replication-optimization-requirements.md`

This plan covers:

- Section 9: 视频式演示需求
- Section 7: 龙虾 Commander 复刻需求, guided presentation layer
- Section 8: 多 Agent 工作复刻需求, guided visible flow
- Section 10: 3D 办公室布局优化需求, guided focus only
- Section 12: Workbench 细化需求, demo transitions only
- Section 16: 可访问性和响应式需求
- Section 18.1: P0 完整演示验收

This plan does not cover:

- Real AI execution.
- New Worker Adapter.
- Deep Workbench redesign.
- Bundle splitting.
- Pixel-level video recreation.

## Existing Demo Constraints

The current project already has:

- `startDemoEngine()` and `stopDemoEngine()` in `src/demo/demoEngine.ts`.
- Standard scenario in `src/demo/scenarios.ts`.
- Commander scenarios in `src/demo/commanderScenario.ts`.
- Demo buttons in `src/ui/DemoControls.tsx`.
- Camera reset outside Canvas through `ResetCameraBtn` and `ExternalResetCamera`.
- `cameraFocus` in `uiStore`, but it only lerps OrbitControls target, not camera position.

Known constraints to preserve:

- AppShell must not auto-start or override scenarios.
- DemoControls must remain outside Canvas hit-testing issues.
- Reset View must remain in AppShell overlay, not Drei `<Html>`.
- Pause/Resume must freeze the event timeline.
- Reset must clear event feed, office state, Commander state, guided camera cue, and narration.

## File Structure

### Files to create

| File | Responsibility |
| --- | --- |
| `src/demo/guidedDemoTypes.ts` | Types for guided demo cues, camera shots, narration, module focus, and combined timeline steps. |
| `src/demo/guidedDemoTimeline.ts` | Builds the full video-style guided demo timeline from Commander scenario events plus camera/module/narration cues. |
| `src/demo/guidedDemoTesting.ts` | Pure helpers to validate cue ordering, pause-safe timeline duration, required story beats, and camera shot coverage. |
| `src/demo/guidedDemoTimeline.test.ts` | Tests for complete guided story coverage, cue order, camera targets, and workbench transitions. |
| `src/ui/GuidedDemoHud.tsx` | Lightweight overlay showing current demo stage, narration, progress, and mode. |

### Files to modify

| File | Responsibility of change |
| --- | --- |
| `src/store/uiStore.ts` | Add guided demo state: current cue, camera shot, narration, progress, and actions to set/clear them. |
| `src/demo/demoEngine.ts` | Accept guided timeline cues, dispatch events and UI cues through the same pause-aware RAF loop. Fix progress timing to use `performance.now()`. |
| `src/ui/DemoControls.tsx` | Add one-click `完整导览` button, reset guided state, and start guided timeline. |
| `src/i18n/zh.ts` | Add `startGuidedDemo`, `guidedDemo`, and stage labels. |
| `src/scene/CameraController.tsx` | Interpolate both camera position and OrbitControls target from guided camera shots. |
| `src/ui/AppShell.tsx` | Render `GuidedDemoHud` in the same overlay layer as DemoControls, without intercepting unrelated clicks. |
| `src/ui/ResetCameraBtn.tsx` | Keep reset behavior, also clear guided camera shot so manual reset wins. |
| `src/demo/commanderScenario.ts` | Export or reuse stable timing constants if needed; keep event payloads unchanged. |
| `src/index.css` | Add HUD styling and mobile-safe guided demo layout. |
| `docs/superpowers/specs/2026-05-23-video-replication-optimization-requirements.md` | Add Plan 08 implementation status after execution. |

## Scope Guard

This plan owns:

- Guided demo timeline.
- Camera shot cues.
- Narration and progress HUD.
- Module transitions during demo.
- Pause/resume/reset behavior for guided cues.
- Tests that guarantee the demo tells the complete story.

This plan does not own:

- Rewriting mission logic.
- New event types in `OfficeEvent`.
- Real external runtime execution.
- Persistent guided demo history.
- Replacing OrbitControls.
- Moving buttons into Canvas.

## Guided Story Beats

The full guided demo must include these beats in order:

1. Office overview: show bright 3D office.
2. Commander focus: camera moves to Lobster Commander.
3. Goal intake: Commander receives a goal.
4. Mission graph: tasks appear.
5. Research worker: research task starts and completes.
6. Build worker: build task starts.
7. Approval gate: approval is requested and highlighted.
8. Delivery: approval resolves and artifact is created.
9. Review worker: review task starts and completes.
10. Files/logs/workbench: user sees supporting modules update.
11. Gateway/runtime: mock runtime diagnostics are shown if mock is active, otherwise demo runtime note is shown.
12. Final summary: Commander returns to overview with completed mission.

The demo must remain useful even if real Runtime is not connected.

## Guided Cue Model

Guided cues are not domain events. They control presentation.

```ts
export type GuidedCueKind =
  | 'camera'
  | 'narration'
  | 'module'
  | 'select_task'
  | 'select_agent'
  | 'commander_open'
  | 'progress';

export interface GuidedCameraShot {
  id: string;
  label: string;
  position: [number, number, number];
  target: [number, number, number];
  durationMs: number;
}

export interface GuidedDemoCue {
  delayMs: number;
  kind: GuidedCueKind;
  payload: Record<string, unknown>;
}

export interface GuidedDemoStep {
  delayMs: number;
  event?: OfficeEvent;
  cue?: GuidedDemoCue;
}
```

The demo engine should process both:

- `event`: dispatch through `dispatch(event)`.
- `cue`: update UI state through `useUIStore.getState()`.

## Task 1: Add Guided Demo Types and Tests

**Files:**
- Create: `src/demo/guidedDemoTypes.ts`
- Create: `src/demo/guidedDemoTesting.ts`
- Create: `src/demo/guidedDemoTimeline.test.ts`

- [ ] **Step 1: Write failing guided timeline tests**

Create `src/demo/guidedDemoTimeline.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { buildGuidedDemoTimeline, guidedCameraShots } from './guidedDemoTimeline';
import {
  getCueKinds,
  getGuidedStoryBeats,
  getTimelineDuration,
  hasOrderedStoryBeats,
  validateCameraShotCoverage,
} from './guidedDemoTesting';

describe('video guided demo timeline', () => {
  it('contains all required video-style story beats in order', () => {
    const timeline = buildGuidedDemoTimeline();
    expect(hasOrderedStoryBeats(getGuidedStoryBeats(timeline))).toBe(true);
  });

  it('contains camera, narration, module, selection, and Commander cues', () => {
    const cueKinds = getCueKinds(buildGuidedDemoTimeline());
    expect(cueKinds).toContain('camera');
    expect(cueKinds).toContain('narration');
    expect(cueKinds).toContain('module');
    expect(cueKinds).toContain('select_task');
    expect(cueKinds).toContain('commander_open');
  });

  it('has camera shots for overview, Commander, workers, approval, delivery, and review', () => {
    expect(validateCameraShotCoverage(guidedCameraShots)).toEqual([]);
  });

  it('runs long enough to feel like a guided video but short enough for QA', () => {
    const duration = getTimelineDuration(buildGuidedDemoTimeline());
    expect(duration).toBeGreaterThanOrEqual(18_000);
    expect(duration).toBeLessThanOrEqual(45_000);
  });

  it('includes Commander mission events and final summary', () => {
    const eventTypes = buildGuidedDemoTimeline()
      .map((step) => step.event?.type)
      .filter(Boolean);
    expect(eventTypes).toContain('approval.requested');
    expect(eventTypes).toContain('approval.resolved');
    expect(eventTypes).toContain('artifact.created');
    expect(eventTypes).toContain('commander.summary_ready');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```powershell
npm.cmd run test -- src/demo/guidedDemoTimeline.test.ts
```

Expected: FAIL because guided demo files do not exist.

- [ ] **Step 3: Add guided demo types**

Create `src/demo/guidedDemoTypes.ts`:

```ts
import type { OfficeEvent } from '@/core/types';

export type GuidedCueKind =
  | 'camera'
  | 'narration'
  | 'module'
  | 'select_task'
  | 'select_agent'
  | 'commander_open'
  | 'progress';

export type GuidedStoryBeat =
  | 'overview'
  | 'commander'
  | 'goal'
  | 'mission_graph'
  | 'research'
  | 'build'
  | 'approval'
  | 'delivery'
  | 'review'
  | 'workbench'
  | 'gateway'
  | 'summary';

export interface GuidedCameraShot {
  id: string;
  label: string;
  position: [number, number, number];
  target: [number, number, number];
  durationMs: number;
}

export interface GuidedDemoCue {
  delayMs: number;
  kind: GuidedCueKind;
  beat?: GuidedStoryBeat;
  payload: Record<string, unknown>;
}

export interface GuidedDemoStep {
  delayMs: number;
  event?: OfficeEvent;
  cue?: GuidedDemoCue;
}
```

- [ ] **Step 4: Add guided demo testing helpers**

Create `src/demo/guidedDemoTesting.ts`:

```ts
import type { GuidedCameraShot, GuidedCueKind, GuidedDemoStep, GuidedStoryBeat } from './guidedDemoTypes';

const REQUIRED_BEATS: GuidedStoryBeat[] = [
  'overview',
  'commander',
  'goal',
  'mission_graph',
  'research',
  'build',
  'approval',
  'delivery',
  'review',
  'workbench',
  'gateway',
  'summary',
];

const REQUIRED_CAMERA_SHOTS = ['overview', 'commander', 'workers', 'approval', 'delivery', 'review'];

export function getTimelineDuration(timeline: GuidedDemoStep[]): number {
  return timeline.reduce((max, step) => Math.max(max, step.delayMs), 0);
}

export function getCueKinds(timeline: GuidedDemoStep[]): GuidedCueKind[] {
  return Array.from(
    new Set(
      timeline
        .map((step) => step.cue?.kind)
        .filter((kind): kind is GuidedCueKind => Boolean(kind)),
    ),
  );
}

export function getGuidedStoryBeats(timeline: GuidedDemoStep[]): GuidedStoryBeat[] {
  return timeline
    .map((step) => step.cue?.beat)
    .filter((beat): beat is GuidedStoryBeat => Boolean(beat));
}

export function hasOrderedStoryBeats(beats: GuidedStoryBeat[]): boolean {
  let searchIndex = 0;
  for (const beat of REQUIRED_BEATS) {
    const foundIndex = beats.indexOf(beat, searchIndex);
    if (foundIndex === -1) return false;
    searchIndex = foundIndex + 1;
  }
  return true;
}

export function validateCameraShotCoverage(shots: GuidedCameraShot[]): string[] {
  const ids = new Set(shots.map((shot) => shot.id));
  return REQUIRED_CAMERA_SHOTS.filter((id) => !ids.has(id));
}
```

- [ ] **Step 5: Run test to confirm helper imports still fail only on missing timeline**

Run:

```powershell
npm.cmd run test -- src/demo/guidedDemoTimeline.test.ts
```

Expected: FAIL because `src/demo/guidedDemoTimeline.ts` does not exist.

- [ ] **Step 6: Commit**

Run:

```powershell
git add src/demo/guidedDemoTypes.ts src/demo/guidedDemoTesting.ts src/demo/guidedDemoTimeline.test.ts
git commit -m "test: define guided demo timeline expectations"
```

## Task 2: Build Guided Demo Timeline

**Files:**
- Create: `src/demo/guidedDemoTimeline.ts`
- Modify: `src/i18n/zh.ts`
- Test: `src/demo/guidedDemoTimeline.test.ts`

- [ ] **Step 1: Add guided demo action labels**

Modify `src/i18n/zh.ts` and add these to `actionLabels`:

```ts
startGuidedDemo: '完整导览',
guidedDemo: '导览',
```

If `actionLabels` is typed as `as const`, keep it as `as const`.

- [ ] **Step 2: Add guided camera shots and cue builder**

Create `src/demo/guidedDemoTimeline.ts`:

```ts
import { commanderApprovedDeliveryScenario } from './commanderScenario';
import type { GuidedCameraShot, GuidedDemoCue, GuidedDemoStep, GuidedStoryBeat } from './guidedDemoTypes';

export const guidedCameraShots: GuidedCameraShot[] = [
  { id: 'overview', label: '办公室总览', position: [5, 9, 11], target: [0, 0, -1], durationMs: 1400 },
  { id: 'commander', label: '龙虾 Commander', position: [-3.8, 4.2, 2.6], target: [-6.2, 1.0, -3.8], durationMs: 1300 },
  { id: 'workers', label: 'Worker 工位', position: [2.5, 4.8, 2.8], target: [2.1, 0.9, -4], durationMs: 1300 },
  { id: 'approval', label: '审批闸门', position: [-1.8, 5.2, 5.6], target: [-1.8, 0.9, -3.9], durationMs: 1200 },
  { id: 'delivery', label: '交付产物', position: [7.2, 4.4, 7.0], target: [5.8, 0.8, 4.1], durationMs: 1200 },
  { id: 'review', label: '复盘与审阅', position: [1.8, 5.0, 6.8], target: [0, 0.8, 1.5], durationMs: 1200 },
];

function cameraCue(delayMs: number, beat: GuidedStoryBeat, shotId: string): GuidedDemoStep {
  const shot = guidedCameraShots.find((item) => item.id === shotId);
  if (!shot) throw new Error(`Missing guided camera shot: ${shotId}`);
  return {
    delayMs,
    cue: { delayMs, kind: 'camera', beat, payload: { shot } },
  };
}

function narrationCue(delayMs: number, beat: GuidedStoryBeat, title: string, body: string): GuidedDemoStep {
  return {
    delayMs,
    cue: { delayMs, kind: 'narration', beat, payload: { title, body } },
  };
}

function moduleCue(delayMs: number, beat: GuidedStoryBeat, module: string): GuidedDemoStep {
  return {
    delayMs,
    cue: { delayMs, kind: 'module', beat, payload: { module } },
  };
}

function taskCue(delayMs: number, beat: GuidedStoryBeat, taskId: string): GuidedDemoStep {
  return {
    delayMs,
    cue: { delayMs, kind: 'select_task', beat, payload: { taskId } },
  };
}

function commanderOpenCue(delayMs: number, beat: GuidedStoryBeat, open: boolean): GuidedDemoStep {
  return {
    delayMs,
    cue: { delayMs, kind: 'commander_open', beat, payload: { open } },
  };
}

function progressCue(delayMs: number, beat: GuidedStoryBeat, progress: number): GuidedDemoStep {
  return {
    delayMs,
    cue: { delayMs, kind: 'progress', beat, payload: { progress } },
  };
}

export function buildGuidedDemoTimeline(): GuidedDemoStep[] {
  const eventSteps = commanderApprovedDeliveryScenario().map((step) => ({
    delayMs: step.delayMs + 4_200,
    event: step.event,
  }));

  const cueSteps: GuidedDemoStep[] = [
    cameraCue(0, 'overview', 'overview'),
    narrationCue(0, 'overview', '办公室总览', '这是一个把 AI 团队工作过程空间化的 3D 办公室。'),
    moduleCue(0, 'overview', 'office'),
    progressCue(0, 'overview', 0.02),

    cameraCue(1_800, 'commander', 'commander'),
    commanderOpenCue(1_900, 'commander', true),
    narrationCue(2_000, 'commander', '龙虾 Commander', '用户把目标交给 Commander，它负责拆解、分配、审批和汇总。'),
    progressCue(2_000, 'commander', 0.12),

    narrationCue(3_200, 'goal', '目标进入系统', '导览会用一条完整任务链展示 Research、Build、Review 和交付。'),
    progressCue(3_200, 'goal', 0.18),

    narrationCue(4_200, 'mission_graph', '任务图生成', 'Commander 创建任务图，并把不同节点分给 Worker。'),
    taskCue(4_300, 'mission_graph', 'task-commander-build'),
    progressCue(4_400, 'mission_graph', 0.26),

    cameraCue(6_100, 'research', 'workers'),
    narrationCue(6_200, 'research', '调研 Worker', '调研任务先完成，为后续构建提供上下文。'),
    taskCue(6_300, 'research', 'task-commander-research'),
    progressCue(6_400, 'research', 0.36),

    narrationCue(8_500, 'build', '构建 Worker', '构建 Worker 开始执行已经通过审批的实现任务。'),
    taskCue(8_600, 'build', 'task-commander-build'),
    progressCue(8_700, 'build', 0.48),

    cameraCue(10_800, 'approval', 'approval'),
    narrationCue(10_900, 'approval', '审批闸门', '涉及写入和高风险动作时，系统会把审批显式交还给用户。'),
    progressCue(11_000, 'approval', 0.58),

    cameraCue(14_200, 'delivery', 'delivery'),
    narrationCue(14_300, 'delivery', '产物交付', '审批通过后，构建产物会进入文件和 Artifact 视图。'),
    moduleCue(14_600, 'delivery', 'files'),
    progressCue(14_600, 'delivery', 0.7),

    cameraCue(17_200, 'review', 'review'),
    narrationCue(17_300, 'review', '审阅 Worker', '审阅 Worker 检查交付物，并把结果回流到总结。'),
    taskCue(17_400, 'review', 'task-commander-review'),
    progressCue(17_500, 'review', 0.8),

    moduleCue(20_200, 'workbench', 'review'),
    narrationCue(20_300, 'workbench', '工作台联动', '日程、任务、文件、日志和复盘都围绕同一条任务链更新。'),
    progressCue(20_300, 'workbench', 0.88),

    moduleCue(22_200, 'gateway', 'gateway'),
    narrationCue(22_300, 'gateway', '运行时边界', '真实 Runtime 和 Mock Runtime 通过同一事件边界进入办公室。'),
    progressCue(22_300, 'gateway', 0.94),

    moduleCue(24_500, 'summary', 'office'),
    cameraCue(24_600, 'summary', 'overview'),
    narrationCue(24_700, 'summary', '导览完成', 'Commander 汇总结果，办公室回到总览视角。'),
    progressCue(24_700, 'summary', 1),
  ];

  return [...cueSteps, ...eventSteps].sort((a, b) => a.delayMs - b.delayMs);
}
```

- [ ] **Step 3: Run guided timeline tests**

Run:

```powershell
npm.cmd run test -- src/demo/guidedDemoTimeline.test.ts
```

Expected: PASS, 5 tests.

- [ ] **Step 4: Commit**

Run:

```powershell
git add src/demo/guidedDemoTimeline.ts src/i18n/zh.ts
git commit -m "feat: add guided demo timeline"
```

## Task 3: Extend UI Store for Guided Demo State

**Files:**
- Modify: `src/store/uiStore.ts`
- Test: TypeScript build

- [ ] **Step 1: Add guided state types**

Modify `src/store/uiStore.ts`:

```ts
import type { GuidedCameraShot } from '@/demo/guidedDemoTypes';
```

Add to `UIState`:

```ts
guidedDemoTitle: string | null;
guidedDemoBody: string | null;
guidedDemoProgress: number;
guidedCameraShot: GuidedCameraShot | null;
setGuidedNarration: (title: string | null, body: string | null) => void;
setGuidedProgress: (progress: number) => void;
setGuidedCameraShot: (shot: GuidedCameraShot | null) => void;
clearGuidedDemo: () => void;
```

- [ ] **Step 2: Add default values and actions**

Inside the store initializer add:

```ts
guidedDemoTitle: null,
guidedDemoBody: null,
guidedDemoProgress: 0,
guidedCameraShot: null,
setGuidedNarration: (guidedDemoTitle, guidedDemoBody) => set({ guidedDemoTitle, guidedDemoBody }),
setGuidedProgress: (guidedDemoProgress) => set({ guidedDemoProgress }),
setGuidedCameraShot: (guidedCameraShot) => set({ guidedCameraShot }),
clearGuidedDemo: () =>
  set({
    guidedDemoTitle: null,
    guidedDemoBody: null,
    guidedDemoProgress: 0,
    guidedCameraShot: null,
  }),
```

Update `clearSelection` so it does not clear guided camera shots:

```ts
clearSelection: () =>
  set({ selectedAgentId: null, selectedTaskId: null, cameraFocus: null }),
```

Keep `partialize` unchanged. Guided demo state should not persist.

- [ ] **Step 3: Run build**

Run:

```powershell
npm.cmd run build
```

Expected: PASS.

- [ ] **Step 4: Commit**

Run:

```powershell
git add src/store/uiStore.ts
git commit -m "feat: add guided demo UI state"
```

## Task 4: Extend Demo Engine to Process Guided Cues

**Files:**
- Modify: `src/demo/demoEngine.ts`
- Test: `src/demo/guidedDemoTimeline.test.ts`, full build

- [ ] **Step 1: Update ScheduledEvent model**

Modify `src/demo/demoEngine.ts`:

```ts
import type { GuidedDemoCue, GuidedDemoStep } from './guidedDemoTypes';
```

Replace the existing scheduled type with:

```ts
interface ScheduledStep {
  delayMs: number;
  event?: OfficeEvent;
  cue?: GuidedDemoCue;
  fired: boolean;
}
```

Update `scheduledEvents` to:

```ts
let scheduledSteps: ScheduledStep[] = [];
```

- [ ] **Step 2: Add cue application function**

Add:

```ts
function applyGuidedCue(cue: GuidedDemoCue): void {
  const ui = useUIStore.getState();
  if (cue.kind === 'camera') {
    ui.setGuidedCameraShot(cue.payload.shot as never);
  }
  if (cue.kind === 'narration') {
    ui.setGuidedNarration(String(cue.payload.title ?? ''), String(cue.payload.body ?? ''));
  }
  if (cue.kind === 'module') {
    ui.setActiveModule(String(cue.payload.module ?? 'office'));
  }
  if (cue.kind === 'select_task') {
    ui.selectTask(String(cue.payload.taskId ?? ''));
  }
  if (cue.kind === 'select_agent') {
    ui.selectAgent(String(cue.payload.agentId ?? ''));
  }
  if (cue.kind === 'commander_open') {
    ui.setCommanderOpen(Boolean(cue.payload.open));
  }
  if (cue.kind === 'progress') {
    const progress = Number(cue.payload.progress ?? 0);
    ui.setGuidedProgress(Math.max(0, Math.min(1, progress)));
  }
}
```

If TypeScript rejects `as never` for `shot`, import `GuidedCameraShot` and cast explicitly:

```ts
ui.setGuidedCameraShot(cue.payload.shot as GuidedCameraShot);
```

- [ ] **Step 3: Update startDemoEngine signature**

Change:

```ts
export function startDemoEngine(scenarioSteps: { delayMs: number; event: OfficeEvent }[]) {
```

to:

```ts
export function startDemoEngine(scenarioSteps: GuidedDemoStep[] | { delayMs: number; event: OfficeEvent }[]) {
```

Inside it:

```ts
scheduledSteps = scenarioSteps.map((s) => ({ ...s, fired: false }));
startTimestamp = performance.now();
```

- [ ] **Step 4: Update stopDemoEngine and getPauseState**

Replace `scheduledEvents` references with `scheduledSteps`.

Fix `getPauseState()` to use `performance.now()`:

```ts
export function getPauseState(): { paused: boolean; progress: number } {
  if (scheduledSteps.length === 0) return { paused: false, progress: 0 };
  const now = pauseStartTime > 0 ? pauseStartTime : performance.now();
  const elapsed = now - startTimestamp - pauseAccumulated;
  const totalMs = Math.max(...scheduledSteps.map((s) => s.delayMs));
  return {
    paused: pauseStartTime > 0,
    progress: Math.min(elapsed / totalMs, 1),
  };
}
```

- [ ] **Step 5: Update tick dispatch loop**

Replace loop body with:

```ts
for (const step of scheduledSteps) {
  if (!step.fired && elapsed >= step.delayMs) {
    step.fired = true;
    if (step.event) dispatch(step.event);
    if (step.cue) applyGuidedCue(step.cue);
  }
}

if (scheduledSteps.every((step) => step.fired)) {
  rafId = null;
  setTimeout(() => {
    const ui = useUIStore.getState();
    ui.setDemoRunning(false);
  }, 0);
  return;
}
```

When `!uiState.demoRunning`, also call:

```ts
useUIStore.getState().clearGuidedDemo();
```

- [ ] **Step 6: Run verification**

Run:

```powershell
npm.cmd run test -- src/demo/guidedDemoTimeline.test.ts src/demo/commanderScenario.test.ts
npm.cmd run build
```

Expected:

- Guided timeline tests PASS.
- Commander scenario tests PASS.
- Build PASS.

- [ ] **Step 7: Commit**

Run:

```powershell
git add src/demo/demoEngine.ts
git commit -m "feat: process guided demo cues"
```

## Task 5: Add Guided Camera Interpolation

**Files:**
- Modify: `src/scene/CameraController.tsx`
- Modify: `src/ui/ResetCameraBtn.tsx`
- Test: `src/scene/cameraTesting.test.ts`, build

- [ ] **Step 1: Read guided camera shot from store**

Modify `src/scene/CameraController.tsx`:

```ts
const guidedCameraShot = useUIStore((s) => s.guidedCameraShot);
```

Add refs:

```ts
const currentShotIdRef = useRef<string | null>(null);
const shotStartRef = useRef(0);
const shotFromPositionRef = useRef(new THREE.Vector3());
const shotFromTargetRef = useRef(new THREE.Vector3());
```

- [ ] **Step 2: Initialize new camera shots**

Inside `useFrame`, before the existing `cameraFocus` handling:

```ts
if (guidedCameraShot && controlsRef.current) {
  const target = controlsRef.current.target as THREE.Vector3;
  if (currentShotIdRef.current !== guidedCameraShot.id) {
    currentShotIdRef.current = guidedCameraShot.id;
    shotStartRef.current = state.clock.elapsedTime * 1000;
    shotFromPositionRef.current.copy(camera.position);
    shotFromTargetRef.current.copy(target);
  }

  const elapsedMs = state.clock.elapsedTime * 1000 - shotStartRef.current;
  const t = Math.min(1, elapsedMs / guidedCameraShot.durationMs);
  const ease = 1 - Math.pow(1 - t, 3);
  const nextPosition = new THREE.Vector3(...guidedCameraShot.position);
  const nextTarget = new THREE.Vector3(...guidedCameraShot.target);
  camera.position.lerpVectors(shotFromPositionRef.current, nextPosition, ease);
  target.lerpVectors(shotFromTargetRef.current, nextTarget, ease);
  camera.lookAt(target);
  controlsRef.current.update();
  return;
}
```

The `useFrame` callback needs the state argument:

```ts
useFrame((state) => {
```

- [ ] **Step 3: Preserve existing cameraFocus behavior**

Keep the existing `cameraFocus` target lerp after guided shot handling:

```ts
if (cameraFocus && controlsRef.current) {
  const target = controlsRef.current.target as THREE.Vector3;
  target.lerp(new THREE.Vector3(...cameraFocus), 0.1);
}
```

- [ ] **Step 4: Clear guided camera on manual reset**

Modify `ExternalResetCamera()`:

```ts
const ui = useUIStore.getState();
ui.setCameraFocus(null);
ui.setGuidedCameraShot(null);
```

Modify `useResetCamera()` similarly.

Modify `src/ui/ResetCameraBtn.tsx` only if needed to keep the same external reset function. Do not move the button into Canvas.

- [ ] **Step 5: Run camera verification**

Run:

```powershell
npm.cmd run test -- src/scene/cameraTesting.test.ts
npm.cmd run build
```

Expected:

- Camera tests PASS.
- Build PASS.

- [ ] **Step 6: Commit**

Run:

```powershell
git add src/scene/CameraController.tsx src/ui/ResetCameraBtn.tsx
git commit -m "feat: add guided demo camera shots"
```

## Task 6: Add Guided Demo HUD

**Files:**
- Create: `src/ui/GuidedDemoHud.tsx`
- Modify: `src/ui/AppShell.tsx`
- Modify: `src/index.css`
- Test: build

- [ ] **Step 1: Create GuidedDemoHud component**

Create `src/ui/GuidedDemoHud.tsx`:

```tsx
import { useUIStore } from '@/store/uiStore';

export function GuidedDemoHud() {
  const demoRunning = useUIStore((state) => state.demoRunning);
  const demoPaused = useUIStore((state) => state.demoPaused);
  const title = useUIStore((state) => state.guidedDemoTitle);
  const body = useUIStore((state) => state.guidedDemoBody);
  const progress = useUIStore((state) => state.guidedDemoProgress);

  if (!demoRunning || !title) return null;

  return (
    <aside className="guided-demo-hud pointer-events-none">
      <div className="guided-demo-kicker">{demoPaused ? '导览已暂停' : '完整导览'}</div>
      <h2>{title}</h2>
      {body && <p>{body}</p>}
      <div className="guided-demo-progress" aria-label="导览进度">
        <span style={{ width: `${Math.round(progress * 100)}%` }} />
      </div>
    </aside>
  );
}
```

- [ ] **Step 2: Render HUD in AppShell**

Modify `src/ui/AppShell.tsx`:

```tsx
import { GuidedDemoHud } from './GuidedDemoHud';
```

In the Office overlay, render it above the bottom HUD and away from ResetCamera:

```tsx
<div className="absolute left-2 top-20 z-20 pointer-events-none max-w-[22rem]">
  <GuidedDemoHud />
</div>
```

Do not put it inside Canvas.

- [ ] **Step 3: Add HUD CSS**

Modify `src/index.css`:

```css
.guided-demo-hud {
  width: min(22rem, calc(100vw - 1rem));
  border: 1px solid rgba(255, 184, 77, 0.32);
  background: rgba(7, 16, 32, 0.86);
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.28);
  padding: 0.85rem;
  color: #eaf7ff;
}

.guided-demo-kicker {
  color: #ffd27a;
  font-size: 0.68rem;
  letter-spacing: 0.08em;
  margin-bottom: 0.25rem;
}

.guided-demo-hud h2 {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
}

.guided-demo-hud p {
  margin-top: 0.35rem;
  color: #bcd8e8;
  font-size: 0.78rem;
  line-height: 1.5;
}

.guided-demo-progress {
  height: 0.28rem;
  margin-top: 0.65rem;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.12);
}

.guided-demo-progress span {
  display: block;
  height: 100%;
  background: linear-gradient(90deg, #ffb84d, #00dff6);
}

@media (max-width: 640px) {
  .guided-demo-hud {
    padding: 0.65rem;
  }

  .guided-demo-hud h2 {
    font-size: 0.88rem;
  }

  .guided-demo-hud p {
    font-size: 0.72rem;
  }
}
```

- [ ] **Step 4: Run build**

Run:

```powershell
npm.cmd run build
```

Expected: PASS.

- [ ] **Step 5: Commit**

Run:

```powershell
git add src/ui/GuidedDemoHud.tsx src/ui/AppShell.tsx src/index.css
git commit -m "feat: add guided demo HUD"
```

## Task 7: Add One-Click Guided Demo Control

**Files:**
- Modify: `src/ui/DemoControls.tsx`
- Test: guided demo tests, build

- [ ] **Step 1: Import guided timeline**

Modify `src/ui/DemoControls.tsx`:

```ts
import { buildGuidedDemoTimeline } from '@/demo/guidedDemoTimeline';
```

Add:

```ts
const clearGuidedDemo = useUIStore((s) => s.clearGuidedDemo);
```

- [ ] **Step 2: Add handleStartGuidedDemo**

Add:

```ts
function handleStartGuidedDemo() {
  try {
    stopDemoEngine();
    clearEvents();
    reset();
    resetCommander();
    clearGuidedDemo();
    createMissionFromDraft();
    setDemoRunning(true);
    setDemoPaused(false);
    startDemoEngine(buildGuidedDemoTimeline());
  } catch (err) {
    console.error('[DemoControls] Guided demo start failed:', err);
  }
}
```

- [ ] **Step 3: Add button**

In the `!demoRunning` button group, add the guided demo button before standard demo:

```tsx
<button className="cyber-btn" onClick={handleStartGuidedDemo} style={{ borderColor: '#ffb84d66', color: '#ffb84d' }}>
  {actionLabels.startGuidedDemo}
</button>
```

- [ ] **Step 4: Clear guided state on reset**

In `handleReset`, after `resetCommander()` add:

```ts
clearGuidedDemo();
```

Keep existing `stopDemoEngine`, `clearEvents`, and office reset order.

- [ ] **Step 5: Run verification**

Run:

```powershell
npm.cmd run test -- src/demo/guidedDemoTimeline.test.ts src/demo/commanderScenario.test.ts
npm.cmd run build
```

Expected:

- Guided demo tests PASS.
- Commander scenario tests PASS.
- Build PASS.

- [ ] **Step 6: Commit**

Run:

```powershell
git add src/ui/DemoControls.tsx
git commit -m "feat: add one-click guided demo control"
```

## Task 8: Browser QA and Status Documentation

**Files:**
- Modify: `docs/superpowers/specs/2026-05-23-video-replication-optimization-requirements.md`

- [ ] **Step 1: Run full automated verification**

Run:

```powershell
npm.cmd run test
npm.cmd run build
```

Expected:

- All tests PASS.
- Build PASS.
- Large chunk warning may remain and belongs to Plan 11.

- [ ] **Step 2: Start dev server**

Run:

```powershell
npm.cmd run dev -- --host 127.0.0.1
```

Expected:

- Vite prints a local URL.
- Use the printed URL for browser QA.

- [ ] **Step 3: Desktop guided demo QA**

Open the app at `1366x768`.

Verify:

- `完整导览` button is visible and clickable.
- Clicking it resets old demo state.
- HUD appears with Chinese title/body.
- Camera starts at overview, moves to Commander, then workers, approval, delivery, review, and final overview.
- Commander panel opens during the Commander beat.
- Mission graph appears during the mission graph beat.
- EventFeed receives Commander events.
- Approval request appears during approval beat.
- Artifact appears during delivery beat.
- Workbench transitions to Files, Review, Gateway, then back Office.
- Pause freezes events, narration progress, and camera motion.
- Resume continues from the same point.
- Reset clears HUD, guided camera shot, events, Commander mission, and office tasks.
- Reset View remains clickable and manual camera reset clears guided camera shot.
- Browser console has no React errors.

- [ ] **Step 4: Mobile guided demo QA**

Set viewport to `390x844`.

Verify:

- `完整导览` button does not overflow.
- HUD text wraps and does not cover Reset View.
- DemoControls remain clickable.
- SidePanel overlay still closes.
- Workbench transitions do not create horizontal overflow.
- Gateway and Migration pages remain within viewport.

- [ ] **Step 5: Update optimization requirement status**

Append under `## Implementation Status` in `docs/superpowers/specs/2026-05-23-video-replication-optimization-requirements.md`:

```md
- Plan 08 `Video Guided Demo Flow`: implemented and verified.
- The app now has a one-click guided demo with staged narration, camera cues, Commander mission events, workbench transitions, pause/resume support, and reset-safe cleanup.
```

- [ ] **Step 6: Commit status update**

Run:

```powershell
git add docs/superpowers/specs/2026-05-23-video-replication-optimization-requirements.md
git commit -m "docs: mark guided demo flow plan status"
```

## Final Verification Checklist

Before declaring Plan 08 complete, run:

```powershell
npm.cmd run test
npm.cmd run build
git status --short
```

Expected:

- Full tests exit 0.
- Production build exits 0.
- `git status --short` shows no modified tracked files.
- Generated folders such as `node_modules/`, `dist/`, logs, and `tsconfig.tsbuildinfo` are not staged.

## Completion Criteria

Plan 08 is complete when:

1. `完整导览` starts a full video-style story.
2. The demo includes all required story beats in order.
3. Camera moves through overview, Commander, workers, approval, delivery, review, and final overview.
4. Narration HUD appears and updates with progress.
5. Commander mission events still drive the existing stores.
6. Workbench transitions are visible but reversible.
7. Pause freezes guided event dispatch and camera movement.
8. Resume continues from the pause point.
9. Reset clears guided state and returns the app to a clean demo baseline.
10. Reset View clears guided camera shot and remains outside Canvas.
11. Desktop browser QA passes.
12. 390px mobile browser QA passes.
13. Full tests and build pass.

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/08-video-guided-demo-flow.md`. Two execution options:

1. **Subagent-Driven (recommended)** - Dispatch a fresh subagent per task, review between tasks, fast iteration.
2. **Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints.

Choose one before implementation begins.
