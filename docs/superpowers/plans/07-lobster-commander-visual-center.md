# Lobster Commander Visual Center Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Lobster Commander unmistakably read as the command center of the 3D office, with a stronger 3D station, mission-status beacon, task-to-worker visual links, and a matching Commander UI hierarchy.

**Architecture:** Build this as a visual layer on top of the existing Commander workflow rather than changing mission semantics. Add pure helpers that derive Commander visual state from the existing `commanderStore`, `officeStore`, and `defaultLayout`, then render that state through focused R3F components and Commander panel styling. Keep IDs, mission task statuses, event flow, approvals, artifacts, and demo scenarios stable.

**Tech Stack:** React 18, TypeScript, Vite, React Three Fiber, Drei, Three.js, Zustand, Vitest.

---

## Prerequisites

Execute after:

1. `docs/superpowers/plans/06-chinese-ui-and-bright-office.md`

Plan 07 assumes Plan 06 created:

- `src/i18n/zh.ts`
- `src/scene/sceneVisualTheme.ts`
- Chinese-first primary labels.
- Brighter base scene lighting.

If Plan 06 has not been executed yet, execute it first. Do not implement this plan against the old dark English baseline.

## Source Requirement

Use this spec as the product source:

`docs/superpowers/specs/2026-05-23-video-replication-optimization-requirements.md`

This plan covers:

- Section 7: 龙虾 Commander 复刻需求
- Section 8: 多 Agent 工作复刻需求, visual state only
- Section 10: 3D 办公室布局优化需求, Commander focal layer only
- Section 11: 工位和屏幕需求, Commander and worker status cues only
- Section 18.1: P0 Commander 主视觉验收

This plan does not cover:

- Automatic guided camera flow. That belongs to Plan 08.
- Deep Workbench redesign. That belongs to Plan 09.
- Real AI Adapter and tool execution. That belongs to Plan 10.
- Performance and bundle splitting. That belongs to Plan 11.

## File Structure

### Files to create

| File | Responsibility |
| --- | --- |
| `src/commander/commanderVisualState.ts` | Pure helpers that derive visual mission state, task counts, worker links, and Commander focus state. |
| `src/commander/commanderVisualState.test.ts` | Tests for visual state derivation, task counts, approval emphasis, artifact emphasis, and worker link generation. |
| `src/scene/CommanderCommandRing.tsx` | 3D glowing ring, platform, status pulse, and label anchor around the Commander station. |
| `src/scene/MissionLinkLines.tsx` | Renders visual lines from Commander station to worker desks for active mission tasks. |
| `src/scene/CommanderStatusBoard.tsx` | 3D status board that summarizes mission state, pending approvals, and artifact count through simple meshes. |
| `src/scene/CommanderVisualLayer.tsx` | Scene-level orchestrator that reads stores, derives visual state, and renders Commander visual components. |
| `src/scene/commanderVisualTesting.ts` | Pure scene/layout assertions for Commander focal position, link targets, and visual landmark counts. |
| `src/scene/commanderVisualTesting.test.ts` | Tests proving Commander visual layer has a focal desk, enough worker links, and warm emphasis. |

### Files to modify

| File | Responsibility of change |
| --- | --- |
| `src/scene/CommanderStation.tsx` | Convert existing simple station into a richer base station, or keep it as base geometry used under the new visual layer. |
| `src/scene/OfficeScene.tsx` | Render `CommanderVisualLayer` near `CommanderStation` and before general workstations so the focal layer is visible. |
| `src/scene/Desk.tsx` | Add Commander-specific monitor/status affordances while keeping ordinary worker desks unchanged. |
| `src/scene/AgentCharacter.tsx` | Add a subtle Commander scale/accent difference using existing `isCommander` or role signals. |
| `src/scene/sceneTesting.ts` | Add Commander visual landmark helpers if not kept under `commanderVisualTesting.ts`. |
| `src/ui/commander/CommanderDock.tsx` | Add a visual header state that mirrors the 3D Commander state. |
| `src/ui/commander/CommanderComposer.tsx` | Make the intake area look like the primary command console, not a generic form. |
| `src/ui/commander/MissionGraph.tsx` | Add selected/active visual state and connection copy that matches the 3D mission links. |
| `src/ui/commander/WorkerRoster.tsx` | Show worker desk, active task, and visual state labels used by mission links. |
| `src/ui/commander/ApprovalInbox.tsx` | Make pending approvals visually dominant and aligned with yellow Commander beacon state. |
| `src/ui/commander/ArtifactRail.tsx` | Make artifacts read as delivered outputs flowing back to Commander. |
| `src/index.css` | Add Commander visual hierarchy classes for the dock, intake, mission graph, worker roster, approvals, and artifacts. |
| `docs/superpowers/specs/2026-05-23-video-replication-optimization-requirements.md` | Add Plan 07 implementation status after execution. |

## Scope Guard

This plan owns:

- Commander focal visual hierarchy.
- Commander 3D ring, beacon, board, and worker task links.
- Visual state derivation from existing mission data.
- Commander dock styling that matches the 3D focal state.
- Tests that protect Commander focal logic.

This plan does not own:

- New mission statuses.
- New event types.
- Real AI execution.
- New file-writing behavior.
- Camera choreography.
- Replacing the current Commander workflow.
- Deep re-layout of all desks.

## Visual Design Rules

The Lobster Commander should be visually different from normal worker desks:

- Warmer accent color.
- Larger focal platform.
- Mission-status ring.
- Stronger glow when mission is active.
- Yellow pulse when approval is pending.
- Green completion state when mission is completed.
- Red diagnostic state when any mission task is blocked or failed.
- Lines from Commander to active Worker desks when a mission exists.
- A small 3D status board showing task, approval, and artifact counts through simple bars or indicators.

The UI Commander dock should mirror this:

- Top header reads as command console.
- Current mission status appears immediately under the title.
- Pending approvals are visually prominent.
- Worker roster shows desk and active task state.
- Artifact rail reads as delivered outputs, not generic cards.

## Visual State Contract

Use this derived visual model:

```ts
export type CommanderVisualTone =
  | 'idle'
  | 'planning'
  | 'running'
  | 'approval'
  | 'blocked'
  | 'completed';

export interface CommanderVisualState {
  tone: CommanderVisualTone;
  missionId: string | null;
  missionTitle: string;
  totalTasks: number;
  activeTasks: number;
  blockedTasks: number;
  completedTasks: number;
  pendingApprovals: number;
  artifactCount: number;
  linkTargets: CommanderLinkTarget[];
}

export interface CommanderLinkTarget {
  missionTaskId: string;
  workerId: string;
  deskId: string;
  status: MissionTaskStatus;
}
```

Tone rules:

1. No mission: `idle`.
2. Pending approval exists: `approval`.
3. Any mission task is `blocked` or `failed`: `blocked`.
4. Mission status is `completed`: `completed`.
5. Any task is `running`, `assigned`, or `waiting_input`: `running`.
6. Mission exists but no active task: `planning`.

## Task 1: Add Commander Visual State Helpers

**Files:**
- Create: `src/commander/commanderVisualState.ts`
- Create: `src/commander/commanderVisualState.test.ts`

- [ ] **Step 1: Write failing visual state tests**

Create `src/commander/commanderVisualState.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import type { ApprovalRequest, CommanderMission, WorkerProfile } from '@/core/types';
import {
  buildCommanderVisualState,
  countMissionArtifacts,
  getCommanderTone,
  getMissionWorkerLinks,
} from './commanderVisualState';

const workers: WorkerProfile[] = [
  {
    id: 'worker-research',
    name: '调研 Worker',
    role: 'researcher',
    capabilities: ['research'],
    tools: ['browser'],
    workspace: 'Research Bay',
    deskId: 'desk-a2',
    runtimeRef: null,
    status: 'idle',
    lastSeenAt: '2026-05-23T00:00:00.000Z',
  },
  {
    id: 'worker-builder',
    name: '构建 Worker',
    role: 'builder',
    capabilities: ['code'],
    tools: ['filesystem'],
    workspace: 'Build Bay',
    deskId: 'desk-b1',
    runtimeRef: null,
    status: 'idle',
    lastSeenAt: '2026-05-23T00:00:00.000Z',
  },
  {
    id: 'worker-review',
    name: '审阅 Worker',
    role: 'reviewer',
    capabilities: ['review'],
    tools: ['tests'],
    workspace: 'Review Bay',
    deskId: 'desk-b2',
    runtimeRef: null,
    status: 'idle',
    lastSeenAt: '2026-05-23T00:00:00.000Z',
  },
];

const mission: CommanderMission = {
  id: 'mission-001',
  title: '复刻 Commander 工作流',
  originalGoal: '完整复刻视频里的龙虾指挥流程',
  materialNote: '使用本地需求文档',
  constraints: ['保留审批'],
  status: 'running',
  createdAt: '2026-05-23T00:00:00.000Z',
  updatedAt: '2026-05-23T00:01:00.000Z',
  summary: null,
  taskIds: ['research', 'build', 'review'],
  tasks: {
    research: {
      id: 'research',
      title: '调研参考流程',
      summary: '提取 Commander 模式',
      status: 'completed',
      workerId: 'worker-research',
      officeTaskId: 'task-research',
      dependencyIds: [],
      expectedArtifactIds: [],
      risk: 'low',
      approvalId: null,
      artifactIds: ['artifact-research'],
    },
    build: {
      id: 'build',
      title: '构建指挥台视觉',
      summary: '强化 3D Commander',
      status: 'approval_required',
      workerId: 'worker-builder',
      officeTaskId: 'task-build',
      dependencyIds: ['research'],
      expectedArtifactIds: [],
      risk: 'medium',
      approvalId: 'approval-build',
      artifactIds: [],
    },
    review: {
      id: 'review',
      title: '审阅交付',
      summary: '检查状态联动',
      status: 'planned',
      workerId: 'worker-review',
      officeTaskId: 'task-review',
      dependencyIds: ['build'],
      expectedArtifactIds: [],
      risk: 'low',
      approvalId: null,
      artifactIds: [],
    },
  },
};

const approvals: Record<string, ApprovalRequest> = {
  'approval-build': {
    id: 'approval-build',
    missionId: 'mission-001',
    taskId: 'build',
    officeTaskId: 'task-build',
    requestedByWorkerId: 'worker-builder',
    action: 'write files',
    reason: '需要修改 Commander 视觉组件',
    target: 'src/scene',
    impact: '更新 3D 指挥台',
    risk: 'medium',
    status: 'pending',
    requestedAt: '2026-05-23T00:02:00.000Z',
    resolvedAt: null,
    resolutionNote: null,
  },
};

describe('Commander visual state', () => {
  it('prioritizes pending approvals as the Commander tone', () => {
    expect(getCommanderTone(mission, approvals)).toBe('approval');
  });

  it('counts mission artifacts from task artifact ids', () => {
    expect(countMissionArtifacts(mission)).toBe(1);
  });

  it('builds worker link targets for non-planned mission tasks with known desks', () => {
    expect(getMissionWorkerLinks(mission, workers)).toEqual([
      { missionTaskId: 'research', workerId: 'worker-research', deskId: 'desk-a2', status: 'completed' },
      { missionTaskId: 'build', workerId: 'worker-builder', deskId: 'desk-b1', status: 'approval_required' },
    ]);
  });

  it('derives the full visual state summary', () => {
    expect(buildCommanderVisualState(mission, approvals, workers)).toMatchObject({
      tone: 'approval',
      missionId: 'mission-001',
      missionTitle: '复刻 Commander 工作流',
      totalTasks: 3,
      activeTasks: 1,
      blockedTasks: 0,
      completedTasks: 1,
      pendingApprovals: 1,
      artifactCount: 1,
    });
  });

  it('returns idle state when no mission is selected', () => {
    expect(buildCommanderVisualState(undefined, {}, workers)).toMatchObject({
      tone: 'idle',
      missionId: null,
      missionTitle: '等待任务',
      totalTasks: 0,
      pendingApprovals: 0,
      artifactCount: 0,
      linkTargets: [],
    });
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```powershell
npm.cmd run test -- src/commander/commanderVisualState.test.ts
```

Expected: FAIL because `src/commander/commanderVisualState.ts` does not exist.

- [ ] **Step 3: Add Commander visual state helper**

Create `src/commander/commanderVisualState.ts`:

```ts
import type {
  ApprovalRequest,
  CommanderMission,
  MissionTask,
  MissionTaskStatus,
  WorkerProfile,
} from '@/core/types';

export type CommanderVisualTone =
  | 'idle'
  | 'planning'
  | 'running'
  | 'approval'
  | 'blocked'
  | 'completed';

export interface CommanderLinkTarget {
  missionTaskId: string;
  workerId: string;
  deskId: string;
  status: MissionTaskStatus;
}

export interface CommanderVisualState {
  tone: CommanderVisualTone;
  missionId: string | null;
  missionTitle: string;
  totalTasks: number;
  activeTasks: number;
  blockedTasks: number;
  completedTasks: number;
  pendingApprovals: number;
  artifactCount: number;
  linkTargets: CommanderLinkTarget[];
}

function missionTasks(mission: CommanderMission): MissionTask[] {
  return mission.taskIds
    .map((taskId) => mission.tasks[taskId])
    .filter(Boolean);
}

export function countPendingApprovals(
  mission: CommanderMission | undefined,
  approvals: Record<string, ApprovalRequest>,
): number {
  if (!mission) return 0;
  return Object.values(approvals).filter(
    (approval) => approval.missionId === mission.id && approval.status === 'pending',
  ).length;
}

export function countMissionArtifacts(mission: CommanderMission | undefined): number {
  if (!mission) return 0;
  return missionTasks(mission).reduce((total, task) => total + task.artifactIds.length, 0);
}

export function getCommanderTone(
  mission: CommanderMission | undefined,
  approvals: Record<string, ApprovalRequest>,
): CommanderVisualTone {
  if (!mission) return 'idle';
  if (countPendingApprovals(mission, approvals) > 0) return 'approval';

  const tasks = missionTasks(mission);
  if (tasks.some((task) => task.status === 'blocked' || task.status === 'failed')) return 'blocked';
  if (mission.status === 'completed') return 'completed';
  if (tasks.some((task) => ['assigned', 'running', 'waiting_input', 'approval_required'].includes(task.status))) {
    return 'running';
  }
  return 'planning';
}

export function getMissionWorkerLinks(
  mission: CommanderMission | undefined,
  workers: WorkerProfile[],
): CommanderLinkTarget[] {
  if (!mission) return [];
  const workerById = new Map(workers.map((worker) => [worker.id, worker]));
  return missionTasks(mission)
    .filter((task) => task.status !== 'planned')
    .map((task) => {
      const worker = workerById.get(task.workerId);
      if (!worker) return null;
      return {
        missionTaskId: task.id,
        workerId: task.workerId,
        deskId: worker.deskId,
        status: task.status,
      };
    })
    .filter((target): target is CommanderLinkTarget => Boolean(target));
}

export function buildCommanderVisualState(
  mission: CommanderMission | undefined,
  approvals: Record<string, ApprovalRequest>,
  workers: WorkerProfile[],
): CommanderVisualState {
  if (!mission) {
    return {
      tone: 'idle',
      missionId: null,
      missionTitle: '等待任务',
      totalTasks: 0,
      activeTasks: 0,
      blockedTasks: 0,
      completedTasks: 0,
      pendingApprovals: 0,
      artifactCount: 0,
      linkTargets: [],
    };
  }

  const tasks = missionTasks(mission);
  return {
    tone: getCommanderTone(mission, approvals),
    missionId: mission.id,
    missionTitle: mission.title,
    totalTasks: tasks.length,
    activeTasks: tasks.filter((task) => ['assigned', 'running', 'waiting_input', 'approval_required'].includes(task.status)).length,
    blockedTasks: tasks.filter((task) => task.status === 'blocked' || task.status === 'failed').length,
    completedTasks: tasks.filter((task) => task.status === 'completed').length,
    pendingApprovals: countPendingApprovals(mission, approvals),
    artifactCount: countMissionArtifacts(mission),
    linkTargets: getMissionWorkerLinks(mission, workers),
  };
}
```

- [ ] **Step 4: Run visual state tests**

Run:

```powershell
npm.cmd run test -- src/commander/commanderVisualState.test.ts
```

Expected: PASS, 5 tests.

- [ ] **Step 5: Commit**

Run:

```powershell
git add src/commander/commanderVisualState.ts src/commander/commanderVisualState.test.ts
git commit -m "feat: derive Commander visual state"
```

## Task 2: Add Commander Visual Scene Tests

**Files:**
- Create: `src/scene/commanderVisualTesting.ts`
- Create: `src/scene/commanderVisualTesting.test.ts`
- Modify: `src/scene/sceneTesting.test.ts`

- [ ] **Step 1: Write scene visual tests**

Create `src/scene/commanderVisualTesting.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { defaultLayout } from '@/data/defaultLayout';
import {
  getCommanderFocalDesk,
  getCommanderWorkerDeskTargets,
  getDistanceBetweenDesks,
  hasCommanderFocalPriority,
} from './commanderVisualTesting';

describe('Commander visual scene metadata', () => {
  it('has a Commander focal desk with warmer accent priority', () => {
    const commander = getCommanderFocalDesk(defaultLayout);
    expect(commander).toMatchObject({
      id: 'desk-commander',
      isCommander: true,
      zone: 'commander',
    });
    expect(hasCommanderFocalPriority(defaultLayout)).toBe(true);
  });

  it('has worker desk targets that can be linked from Commander', () => {
    expect(getCommanderWorkerDeskTargets(defaultLayout).map((desk) => desk.id)).toEqual([
      'desk-a2',
      'desk-b1',
      'desk-b2',
    ]);
  });

  it('keeps Commander close enough to workers for visible mission links', () => {
    const commander = getCommanderFocalDesk(defaultLayout);
    const targets = getCommanderWorkerDeskTargets(defaultLayout);
    expect(commander).toBeDefined();
    for (const target of targets) {
      expect(getDistanceBetweenDesks(commander!, target)).toBeLessThanOrEqual(12);
    }
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```powershell
npm.cmd run test -- src/scene/commanderVisualTesting.test.ts
```

Expected: FAIL because `commanderVisualTesting.ts` does not exist.

- [ ] **Step 3: Add scene visual testing helpers**

Create `src/scene/commanderVisualTesting.ts`:

```ts
import type { Desk, OfficeLayout } from '@/core/types';

export function getCommanderFocalDesk(layout: OfficeLayout): Desk | undefined {
  return layout.desks.find((desk) => desk.isCommander);
}

export function getCommanderWorkerDeskTargets(layout: OfficeLayout): Desk[] {
  return layout.desks.filter((desk) => desk.zone === 'workstation');
}

export function getDistanceBetweenDesks(a: Desk, b: Desk): number {
  const dx = a.position[0] - b.position[0];
  const dz = a.position[2] - b.position[2];
  return Math.sqrt(dx * dx + dz * dz);
}

export function hasCommanderFocalPriority(layout: OfficeLayout): boolean {
  const commander = getCommanderFocalDesk(layout);
  const workers = getCommanderWorkerDeskTargets(layout);
  return Boolean(commander && commander.label.length > 0 && workers.length >= 3);
}
```

- [ ] **Step 4: Add a Commander visual assertion to existing scene tests**

Modify `src/scene/sceneTesting.test.ts` and add:

```ts
import { getCommanderWorkerDeskTargets } from './commanderVisualTesting';
```

Add this test:

```ts
it('keeps Commander visually connected to the worker pod area', () => {
  expect(getCommanderWorkerDeskTargets(defaultLayout).length).toBeGreaterThanOrEqual(3);
});
```

- [ ] **Step 5: Run scene tests**

Run:

```powershell
npm.cmd run test -- src/scene/commanderVisualTesting.test.ts src/scene/sceneTesting.test.ts
```

Expected:

- Commander visual tests PASS.
- Existing scene metadata tests PASS.

- [ ] **Step 6: Commit**

Run:

```powershell
git add src/scene/commanderVisualTesting.ts src/scene/commanderVisualTesting.test.ts src/scene/sceneTesting.test.ts
git commit -m "test: protect Commander visual scene metadata"
```

## Task 3: Build 3D Commander Focal Components

**Files:**
- Create: `src/scene/CommanderCommandRing.tsx`
- Create: `src/scene/CommanderStatusBoard.tsx`
- Modify: `src/scene/CommanderStation.tsx`
- Test: `src/scene/commanderVisualTesting.test.ts`

- [ ] **Step 1: Create CommanderCommandRing**

Create `src/scene/CommanderCommandRing.tsx`:

```tsx
import * as THREE from 'three';
import type { CommanderVisualTone } from '@/commander/commanderVisualState';
import { brightOfficeTheme } from './sceneVisualTheme';

const toneColors: Record<CommanderVisualTone, string> = {
  idle: brightOfficeTheme.commanderAccent,
  planning: '#6ecbff',
  running: '#00dff6',
  approval: '#f0a500',
  blocked: '#ff3366',
  completed: '#00e676',
};

interface CommanderCommandRingProps {
  tone: CommanderVisualTone;
  activeTasks: number;
  pendingApprovals: number;
}

export function CommanderCommandRing({ tone, activeTasks, pendingApprovals }: CommanderCommandRingProps) {
  const color = toneColors[tone];
  const pulseScale = tone === 'idle' ? 1 : 1.08;
  const ringThickness = pendingApprovals > 0 ? 0.13 : 0.09;

  return (
    <group position={[-6.2, 0.08, -3.8]} scale={[pulseScale, 1, pulseScale]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.22, 1.22 + ringThickness, 64]} />
        <meshBasicMaterial color={color} side={THREE.DoubleSide} transparent opacity={0.72} />
      </mesh>
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.58, 1.62, 64]} />
        <meshBasicMaterial color={brightOfficeTheme.commanderGlow} side={THREE.DoubleSide} transparent opacity={0.32} />
      </mesh>
      {activeTasks > 0 && (
        <mesh position={[0, 0.08, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.12 + activeTasks * 0.025, 24]} />
          <meshBasicMaterial color={color} transparent opacity={0.78} />
        </mesh>
      )}
      <pointLight position={[0, 1.6, 0]} color={color} intensity={pendingApprovals > 0 ? 0.9 : 0.55} distance={5.2} />
    </group>
  );
}
```

- [ ] **Step 2: Create CommanderStatusBoard**

Create `src/scene/CommanderStatusBoard.tsx`:

```tsx
import type { CommanderVisualState } from '@/commander/commanderVisualState';
import { brightOfficeTheme } from './sceneVisualTheme';

interface CommanderStatusBoardProps {
  state: CommanderVisualState;
}

function barWidth(value: number, total: number): number {
  if (total <= 0) return 0.08;
  return Math.max(0.08, Math.min(1.1, (value / total) * 1.1));
}

export function CommanderStatusBoard({ state }: CommanderStatusBoardProps) {
  const completeWidth = barWidth(state.completedTasks, state.totalTasks);
  const activeWidth = barWidth(state.activeTasks, state.totalTasks);
  const approvalWidth = state.pendingApprovals > 0 ? 0.65 : 0.08;

  return (
    <group position={[-6.2, 1.55, -4.64]}>
      <mesh>
        <boxGeometry args={[1.82, 0.9, 0.08]} />
        <meshStandardMaterial color="#10233a" emissive={brightOfficeTheme.commanderAccent} emissiveIntensity={0.24} roughness={0.28} />
      </mesh>
      <mesh position={[-0.33, 0.22, 0.055]}>
        <boxGeometry args={[completeWidth, 0.08, 0.035]} />
        <meshBasicMaterial color="#00e676" />
      </mesh>
      <mesh position={[-0.33, 0.02, 0.055]}>
        <boxGeometry args={[activeWidth, 0.08, 0.035]} />
        <meshBasicMaterial color={brightOfficeTheme.workerAccent} />
      </mesh>
      <mesh position={[-0.55, -0.18, 0.055]}>
        <boxGeometry args={[approvalWidth, 0.08, 0.035]} />
        <meshBasicMaterial color="#f0a500" />
      </mesh>
      <mesh position={[0.68, -0.28, 0.055]}>
        <circleGeometry args={[state.artifactCount > 0 ? 0.11 : 0.06, 24]} />
        <meshBasicMaterial color={state.artifactCount > 0 ? brightOfficeTheme.commanderGlow : '#35516a'} />
      </mesh>
    </group>
  );
}
```

- [ ] **Step 3: Strengthen CommanderStation base geometry**

Modify `src/scene/CommanderStation.tsx` so it imports `brightOfficeTheme` and renders a more substantial station:

```tsx
import { brightOfficeTheme } from './sceneVisualTheme';

export function CommanderStation() {
  return (
    <group position={[-6.2, 0, -3.8]}>
      <mesh position={[0, 0.03, -0.45]} receiveShadow>
        <cylinderGeometry args={[1.28, 1.38, 0.08, 40]} />
        <meshStandardMaterial color="#182033" emissive={brightOfficeTheme.commanderAccent} emissiveIntensity={0.26} roughness={0.55} />
      </mesh>
      <mesh position={[0, 0.86, -0.56]} castShadow>
        <boxGeometry args={[1.92, 0.12, 0.52]} />
        <meshStandardMaterial color="#25344a" metalness={0.25} roughness={0.35} />
      </mesh>
      <mesh position={[0, 1.25, -0.62]}>
        <boxGeometry args={[1.78, 0.78, 0.07]} />
        <meshStandardMaterial color="#10233a" emissive={brightOfficeTheme.commanderAccent} emissiveIntensity={0.5} roughness={0.24} />
      </mesh>
      <mesh position={[0, 1.66, -0.58]}>
        <boxGeometry args={[0.76, 0.06, 0.055]} />
        <meshBasicMaterial color={brightOfficeTheme.commanderGlow} />
      </mesh>
      <mesh position={[-0.72, 1.02, -0.56]}>
        <cylinderGeometry args={[0.045, 0.045, 0.58, 12]} />
        <meshBasicMaterial color={brightOfficeTheme.commanderGlow} />
      </mesh>
      <mesh position={[0.72, 1.02, -0.56]}>
        <cylinderGeometry args={[0.045, 0.045, 0.58, 12]} />
        <meshBasicMaterial color={brightOfficeTheme.commanderGlow} />
      </mesh>
    </group>
  );
}
```

- [ ] **Step 4: Run scene build verification**

Run:

```powershell
npm.cmd run test -- src/scene/commanderVisualTesting.test.ts
npm.cmd run build
```

Expected:

- Commander visual tests PASS.
- Build PASS.

- [ ] **Step 5: Commit**

Run:

```powershell
git add src/scene/CommanderCommandRing.tsx src/scene/CommanderStatusBoard.tsx src/scene/CommanderStation.tsx
git commit -m "feat: add Commander focal station visuals"
```

## Task 4: Add Mission Link Lines and Scene Visual Layer

**Files:**
- Create: `src/scene/MissionLinkLines.tsx`
- Create: `src/scene/CommanderVisualLayer.tsx`
- Modify: `src/scene/OfficeScene.tsx`
- Test: `src/commander/commanderVisualState.test.ts`, `src/scene/commanderVisualTesting.test.ts`

- [ ] **Step 1: Create MissionLinkLines**

Create `src/scene/MissionLinkLines.tsx`:

```tsx
import * as THREE from 'three';
import type { CommanderLinkTarget } from '@/commander/commanderVisualState';
import type { Desk } from '@/core/types';
import { brightOfficeTheme } from './sceneVisualTheme';

const statusColors: Record<string, string> = {
  completed: '#00e676',
  approval_required: '#f0a500',
  blocked: '#ff3366',
  failed: '#ff3366',
  running: brightOfficeTheme.workerAccent,
  assigned: '#6ecbff',
  waiting_input: '#f0a500',
};

interface MissionLinkLinesProps {
  commanderDesk: Desk;
  desks: Desk[];
  links: CommanderLinkTarget[];
}

function linePoints(from: Desk, to: Desk): THREE.Vector3[] {
  return [
    new THREE.Vector3(from.position[0], 0.16, from.position[2]),
    new THREE.Vector3((from.position[0] + to.position[0]) / 2, 0.22, (from.position[2] + to.position[2]) / 2),
    new THREE.Vector3(to.position[0], 0.16, to.position[2]),
  ];
}

export function MissionLinkLines({ commanderDesk, desks, links }: MissionLinkLinesProps) {
  const deskById = new Map(desks.map((desk) => [desk.id, desk]));
  return (
    <group>
      {links.map((link) => {
        const targetDesk = deskById.get(link.deskId);
        if (!targetDesk) return null;
        const geometry = new THREE.BufferGeometry().setFromPoints(linePoints(commanderDesk, targetDesk));
        return (
          <line key={`${link.missionTaskId}-${link.deskId}`} geometry={geometry}>
            <lineBasicMaterial
              color={statusColors[link.status] ?? brightOfficeTheme.workerAccent}
              transparent
              opacity={link.status === 'completed' ? 0.38 : 0.74}
            />
          </line>
        );
      })}
    </group>
  );
}
```

- [ ] **Step 2: Create CommanderVisualLayer**

Create `src/scene/CommanderVisualLayer.tsx`:

```tsx
import { buildCommanderVisualState } from '@/commander/commanderVisualState';
import { useCommanderStore } from '@/store/commanderStore';
import { useOfficeStore } from '@/store/officeStore';
import { CommanderCommandRing } from './CommanderCommandRing';
import { CommanderStatusBoard } from './CommanderStatusBoard';
import { MissionLinkLines } from './MissionLinkLines';

export function CommanderVisualLayer() {
  const selectedMissionId = useCommanderStore((state) => state.selectedMissionId);
  const missions = useCommanderStore((state) => state.missions);
  const approvals = useCommanderStore((state) => state.approvals);
  const workers = useCommanderStore((state) => state.workers);
  const desks = useOfficeStore((state) => state.desks);

  const mission = selectedMissionId ? missions[selectedMissionId] : undefined;
  const visualState = buildCommanderVisualState(mission, approvals, workers);
  const commanderDesk = desks.find((desk) => desk.isCommander);

  if (!commanderDesk) return null;

  return (
    <group>
      <CommanderCommandRing
        tone={visualState.tone}
        activeTasks={visualState.activeTasks}
        pendingApprovals={visualState.pendingApprovals}
      />
      <CommanderStatusBoard state={visualState} />
      <MissionLinkLines commanderDesk={commanderDesk} desks={desks} links={visualState.linkTargets} />
    </group>
  );
}
```

- [ ] **Step 3: Render CommanderVisualLayer in OfficeScene**

Modify `src/scene/OfficeScene.tsx`:

```tsx
import { CommanderVisualLayer } from './CommanderVisualLayer';
```

Render it immediately after `CommanderStation`:

```tsx
<CommanderStation />
<CommanderVisualLayer />
```

Keep `ResetCameraBtn` outside Canvas in `AppShell`; do not move it back into this scene.

- [ ] **Step 4: Run Commander and scene tests**

Run:

```powershell
npm.cmd run test -- src/commander/commanderVisualState.test.ts src/scene/commanderVisualTesting.test.ts src/scene/sceneTesting.test.ts
npm.cmd run build
```

Expected:

- Commander visual state tests PASS.
- Commander scene tests PASS.
- Existing scene tests PASS.
- Build PASS.

- [ ] **Step 5: Commit**

Run:

```powershell
git add src/scene/MissionLinkLines.tsx src/scene/CommanderVisualLayer.tsx src/scene/OfficeScene.tsx
git commit -m "feat: render Commander mission visual layer"
```

## Task 5: Strengthen Commander Desk and Agent Cues

**Files:**
- Modify: `src/scene/Desk.tsx`
- Modify: `src/scene/AgentCharacter.tsx`
- Test: build and browser QA

- [ ] **Step 1: Add Commander-specific desk monitor cues**

Modify `src/scene/Desk.tsx`:

- Import `brightOfficeTheme` if not already imported by Plan 06.
- Keep existing status logic.
- Add Commander-only top beacon above the monitor:

```tsx
{isCommander && (
  <mesh position={[0, 1.64, -0.38]}>
    <boxGeometry args={[1.05, 0.05, 0.055]} />
    <meshBasicMaterial color={brightOfficeTheme.commanderGlow} />
  </mesh>
)}
```

- Add Commander-only warm side panels:

```tsx
{isCommander && (
  <>
    <mesh position={[-0.78, 1.2, -0.37]}>
      <boxGeometry args={[0.05, 0.62, 0.07]} />
      <meshBasicMaterial color={brightOfficeTheme.commanderAccent} />
    </mesh>
    <mesh position={[0.78, 1.2, -0.37]}>
      <boxGeometry args={[0.05, 0.62, 0.07]} />
      <meshBasicMaterial color={brightOfficeTheme.commanderAccent} />
    </mesh>
  </>
)}
```

- Keep click target unchanged.

- [ ] **Step 2: Add Commander agent emphasis**

Modify `src/scene/AgentCharacter.tsx`:

- Read the existing `agent` from store as it already does.
- Compute:

```ts
const isCommander = agent?.role === 'coordinator' || agent?.isCommander;
```

If `Agent` does not have `isCommander`, use role only:

```ts
const isCommander = agent?.role === 'coordinator';
```

- Apply a small scale difference to the root group:

```tsx
<group ref={groupRef} position={position} scale={isCommander ? 1.12 : 1}>
```

- Use Commander accent for one existing accent material or status ring:

```ts
const commanderAccent = '#ffb84d';
```

Do not change hook order. Any `useFrame` calls must remain unconditional at the top level, preserving the previous hooks-crash fix.

- [ ] **Step 3: Run scene build verification**

Run:

```powershell
npm.cmd run test -- src/scene/sceneTesting.test.ts src/scene/cameraTesting.test.ts
npm.cmd run build
```

Expected:

- Scene tests PASS.
- Camera tests PASS.
- Build PASS.

- [ ] **Step 4: Commit**

Run:

```powershell
git add src/scene/Desk.tsx src/scene/AgentCharacter.tsx
git commit -m "feat: emphasize Commander desk and agent cues"
```

## Task 6: Upgrade Commander Dock Visual Hierarchy

**Files:**
- Modify: `src/ui/commander/CommanderDock.tsx`
- Modify: `src/ui/commander/CommanderComposer.tsx`
- Modify: `src/ui/commander/MissionGraph.tsx`
- Modify: `src/ui/commander/WorkerRoster.tsx`
- Modify: `src/ui/commander/ApprovalInbox.tsx`
- Modify: `src/ui/commander/ArtifactRail.tsx`
- Modify: `src/ui/commander/MissionSummary.tsx`
- Modify: `src/index.css`
- Test: Commander tests and build

- [ ] **Step 1: Add Commander visual state to CommanderDock**

Modify `src/ui/commander/CommanderDock.tsx`:

- Import `buildCommanderVisualState`.
- Derive visual state:

```tsx
const approvals = useCommanderStore((state) => state.approvals);
const visualState = buildCommanderVisualState(mission, approvals, workers);
```

- Add tone class:

```tsx
<aside className={`commander-dock commander-tone-${visualState.tone} ${commanderOpen ? 'is-open' : 'is-collapsed'}`}>
```

- Add header block before `CommanderComposer`:

```tsx
<div className="commander-hero">
  <div>
    <span className="commander-hero-kicker">任务指挥中心</span>
    <h2>龙虾 Commander</h2>
  </div>
  <span className="commander-hero-status">{visualState.missionTitle}</span>
</div>
```

- [ ] **Step 2: Make CommanderComposer read as command intake**

Modify `src/ui/commander/CommanderComposer.tsx`:

- Wrap the section with:

```tsx
<section className="commander-section commander-intake">
```

- Header title:

```tsx
<span>下达目标</span>
<span className="commander-pill">指挥入口</span>
```

- Button class remains `commander-primary`, but text should be Chinese if Plan 06 has not already changed it:

```tsx
规划任务
```

- [ ] **Step 3: Add MissionGraph visual selection and status classes**

Modify `src/ui/commander/MissionGraph.tsx`:

- Keep `selectMissionTask` and `selectTask`.
- Add a container class:

```tsx
<div className="mission-graph mission-graph-linked">
```

- Add `data-status` to mission node:

```tsx
data-status={task.status}
```

- Keep IDs visible in `<small>`.

- [ ] **Step 4: Add worker desk labels in WorkerRoster**

Modify `src/ui/commander/WorkerRoster.tsx`:

- Show `worker.workspace` and `worker.deskId` in each worker card.
- Add status class:

```tsx
className={`worker-card worker-card-${worker.status}`}
```

- Add text:

```tsx
<small>{worker.workspace} · {worker.deskId}</small>
```

- [ ] **Step 5: Make approvals and artifacts visually dominant**

Modify `src/ui/commander/ApprovalInbox.tsx`:

- Add `approval-card-pending` class when `approval.status === 'pending'`.
- Pending approval should appear before resolved approvals:

```ts
const sortedApprovals = [...items].sort((a, b) => Number(a.status !== 'pending') - Number(b.status !== 'pending'));
```

Modify `src/ui/commander/ArtifactRail.tsx`:

- Add `artifact-card-delivered` when artifact exists for selected mission.
- Keep path and worker metadata visible.

- [ ] **Step 6: Add Commander visual CSS**

Modify `src/index.css` and add:

```css
.commander-hero {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.85rem;
  border: 1px solid rgba(255, 184, 77, 0.34);
  background: linear-gradient(135deg, rgba(255, 184, 77, 0.16), rgba(0, 223, 246, 0.08));
}

.commander-hero-kicker {
  display: block;
  color: #ffd27a;
  font-size: 0.68rem;
  letter-spacing: 0.08em;
}

.commander-hero h2 {
  margin: 0.12rem 0 0;
  color: #ffffff;
  font-size: 1rem;
  font-weight: 700;
}

.commander-hero-status {
  max-width: 9rem;
  color: #d7f7ff;
  font-size: 0.72rem;
  line-height: 1.35;
  text-align: right;
}

.commander-tone-approval .commander-hero {
  border-color: rgba(240, 165, 0, 0.58);
  box-shadow: 0 0 24px rgba(240, 165, 0, 0.16);
}

.commander-tone-blocked .commander-hero {
  border-color: rgba(255, 51, 102, 0.55);
  box-shadow: 0 0 24px rgba(255, 51, 102, 0.16);
}

.commander-tone-completed .commander-hero {
  border-color: rgba(0, 230, 118, 0.5);
  box-shadow: 0 0 24px rgba(0, 230, 118, 0.14);
}

.commander-intake {
  border-color: rgba(255, 184, 77, 0.28);
}

.mission-graph-linked .mission-node {
  position: relative;
}

.mission-graph-linked .mission-node[data-status="approval_required"] {
  border-color: rgba(240, 165, 0, 0.6);
}

.mission-graph-linked .mission-node[data-status="completed"] {
  border-color: rgba(0, 230, 118, 0.45);
}

.worker-card {
  border: 1px solid rgba(0, 223, 246, 0.18);
}

.worker-card-working,
.worker-card-thinking {
  border-color: rgba(0, 223, 246, 0.42);
}

.worker-card-blocked {
  border-color: rgba(255, 51, 102, 0.46);
}

.approval-card-pending {
  border-color: rgba(240, 165, 0, 0.62);
  background: rgba(240, 165, 0, 0.08);
}

.artifact-card-delivered {
  border-color: rgba(0, 230, 118, 0.34);
}
```

- [ ] **Step 7: Run Commander verification**

Run:

```powershell
npm.cmd run test -- src/commander/commanderTesting.test.ts src/commander/commanderVisualState.test.ts src/demo/commanderScenario.test.ts
npm.cmd run build
```

Expected:

- Commander helper tests PASS.
- Commander visual state tests PASS.
- Commander scenario tests PASS.
- Build PASS.

- [ ] **Step 8: Commit**

Run:

```powershell
git add src/ui/commander src/index.css
git commit -m "feat: strengthen Commander dock hierarchy"
```

## Task 7: Browser QA for Commander Focal Experience

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

- [ ] **Step 3: Desktop Commander visual QA**

Open the app at `1366x768`.

Verify:

- Commander station is visually stronger than worker desks.
- A warm Commander ring appears around the Commander area.
- Status board appears near Commander station.
- When no mission exists, Commander state reads idle but still focal.
- Click `Commander 演示` or the localized equivalent.
- Mission links appear from Commander to active/completed worker desks.
- Pending approval produces yellow emphasis in both 3D and Commander dock.
- Artifact creation produces visible ArtifactRail output.
- Mission completion changes the Commander tone toward completed/green.
- Reset Demo clears mission links and resets Commander state.
- DemoControls remain clickable.
- Reset View remains clickable and does not cover DemoControls.
- Browser console has no React errors.

- [ ] **Step 4: Mobile Commander visual QA**

Set viewport to `390x844`.

Verify:

- Commander dock can open and collapse.
- Commander hero header does not overflow.
- Mission graph nodes remain usable.
- Approval cards do not exceed viewport width.
- Artifact cards wrap text correctly.
- Office still shows Commander area or central office area.
- No horizontal page overflow.

- [ ] **Step 5: Update requirement status**

Append this under the implementation status section in `docs/superpowers/specs/2026-05-23-video-replication-optimization-requirements.md`:

```md
- Plan 07 `Lobster Commander Visual Center`: implemented and verified.
- Commander now has a dedicated visual state model, 3D command ring, status board, mission links to Worker desks, and matching Commander dock hierarchy.
```

- [ ] **Step 6: Commit QA status**

Run:

```powershell
git add docs/superpowers/specs/2026-05-23-video-replication-optimization-requirements.md
git commit -m "docs: mark Commander visual center plan status"
```

## Final Verification Checklist

Before declaring Plan 07 complete, run:

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

Plan 07 is complete when:

1. Lobster Commander is the strongest visual focus in the office.
2. Commander has a warm 3D command ring and status board.
3. Mission tasks create visible links from Commander to Worker desks.
4. Pending approvals create yellow visual emphasis.
5. Blocked or failed tasks create red visual emphasis.
6. Completed missions create green completion emphasis.
7. Commander dock mirrors the same mission tone.
8. Worker roster shows desk/workspace context.
9. ArtifactRail reads as delivered output flowing back to Commander.
10. Demo reset clears the focal mission visuals.
11. Desktop browser QA passes.
12. 390px mobile browser QA passes.
13. Full tests and build pass.

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/07-lobster-commander-visual-center.md`. Two execution options:

1. **Subagent-Driven (recommended)** - Dispatch a fresh subagent per task, review between tasks, fast iteration.
2. **Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints.

Choose one before implementation begins.
