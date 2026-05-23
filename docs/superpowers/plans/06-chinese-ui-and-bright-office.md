# Chinese UI and Bright Office Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the app Chinese-first and make the 3D office read as a brighter blue-white cyber workspace while preserving the existing Commander, Runtime, Migration, and Demo behavior.

**Architecture:** Add a small localization layer for user-facing labels, then migrate the visible UI surfaces to Chinese-first text without changing domain IDs or event type names. Add scene visual theme helpers so lighting, fog, floor, walls, and Commander emphasis can be verified by tests instead of scattered color edits. Keep this plan focused on first-eye fidelity; deeper Commander visuals and guided camera flow are handled by later plans.

**Tech Stack:** React 18, TypeScript, Vite, React Three Fiber, Drei, Three.js, Zustand, Vitest, localStorage.

---

## Prerequisites

Execute after:

1. `docs/superpowers/plans/01-office-visual-fidelity.md`
2. `docs/superpowers/plans/02-workbench-fidelity.md`
3. `docs/superpowers/plans/03-commander-workflow.md`
4. `docs/superpowers/plans/04-runtime-adapter.md`
5. `docs/superpowers/plans/05-persistence-and-migration.md`

The current baseline has:

- 51 tests passing.
- Production build passing.
- `main` pushed to GitHub.
- Known remaining optimization requirement: Chinese UI and brighter office environment.

## Source Requirement

Use this spec as the product source:

`docs/superpowers/specs/2026-05-23-video-replication-optimization-requirements.md`

This plan covers these sections from that spec:

- Section 5: 中文化需求
- Section 6: 明亮办公室视觉需求
- Section 7: 龙虾 Commander 复刻需求, first visual emphasis only
- Section 10: 3D 办公室布局优化需求, first-eye readability only
- Section 16: 可访问性和响应式需求
- Section 18.1: P0 验收

This plan does not cover:

- Real AI execution.
- New Worker Adapter.
- Automatic camera path.
- Deep Workbench redesign.
- Bundle splitting.
- Migration wizard redesign beyond Chinese labels.

## File Structure

### Files to create

| File | Responsibility |
| --- | --- |
| `src/i18n/zh.ts` | Chinese-first labels, status names, module names, action labels, and helper formatters. |
| `src/i18n/i18nTesting.ts` | Pure validation helpers for label completeness and mobile label length. |
| `src/i18n/i18nTesting.test.ts` | Tests for module labels, status labels, runtime labels, and missing-label guards. |
| `src/scene/sceneVisualTheme.ts` | Central bright-office color, fog, material, and light intensity tokens. |
| `src/scene/sceneVisualTesting.ts` | Pure visual-theme assertions for brightness, contrast, and Commander emphasis. |
| `src/scene/sceneVisualTesting.test.ts` | Tests proving the office theme is brighter and Commander remains visually emphasized. |

### Files to modify

| File | Responsibility of change |
| --- | --- |
| `src/ui/Navigation.tsx` | Replace English module labels with localized labels and shorter mobile-safe Chinese labels. |
| `src/ui/StatusBar.tsx` | Localize Agent/task/runtime status text and heartbeat text. |
| `src/ui/DemoControls.tsx` | Localize demo buttons and error labels without changing handler behavior. |
| `src/ui/ResetCameraBtn.tsx` | Localize Reset View. |
| `src/ui/EventFeed.tsx` | Localize event display labels and empty state. |
| `src/ui/SidePanel.tsx` | Localize Agent and Task detail labels. |
| `src/ui/runtime/RuntimeModeSwitch.tsx` | Localize mode labels and status labels while preserving mode IDs. |
| `src/ui/runtime/RuntimeEventInspector.tsx` | Localize inspector heading and empty state. |
| `src/ui/commander/*.tsx` | Localize Commander visible text, buttons, empty states, approval actions, artifact labels, and summary labels. |
| `src/ui/dashboard/*.tsx` | Localize Workbench headers, controls, empty states, and primary action labels. |
| `src/migration/migrationTesting.ts` | Localize migration section labels in exported bundle UI metadata. |
| `src/data/demoCommander.ts` | Localize demo Worker names, mission defaults, approval reason, and artifact summaries. |
| `src/data/demoSchedules.ts` | Localize user-facing demo schedule/task/file/cron/gateway/review/rest strings. |
| `src/data/mockRuntimeEvents.ts` | Localize mock runtime task title and summary. |
| `src/store/commanderStore.ts` | Localize default draft and generated approval/artifact summary text. |
| `src/demo/scenarios.ts` | Localize standard demo task titles, summaries, progress messages, output summaries, and error summaries. |
| `src/demo/commanderScenario.ts` | Localize Commander scenario task titles, progress messages, approval reason, artifact titles, and summaries. |
| `src/scene/OfficeScene.tsx` | Use bright scene background and fog tokens. |
| `src/scene/Lighting.tsx` | Use bright-office light intensity and color tokens. |
| `src/scene/Floor.tsx` | Use brighter floor material tokens. |
| `src/scene/Walls.tsx` | Use brighter wall and ceiling tokens. |
| `src/scene/CommanderStation.tsx` | Strengthen Commander station visibility using theme tokens. |
| `src/scene/Desk.tsx` | Use Commander accent tokens and keep ordinary desk accent readable. |
| `src/index.css` | Add Chinese-first font stack, UI readability tweaks, mobile label wrapping, and brighter panel contrast where needed. |
| `docs/superpowers/specs/2026-05-23-video-replication-optimization-requirements.md` | Add a short implementation status note after this plan is executed. |

## Scope Guard

This plan owns:

- Chinese-first user-facing text for the existing UI.
- Bright office theme tokens.
- Applying bright tokens to the existing 3D scene.
- First-pass Commander visual emphasis.
- Mobile text-fit fixes caused by Chinese labels.
- Tests for label coverage and visual token sanity.

This plan does not own:

- Rebuilding the office layout.
- Adding new 3D assets.
- Automatic camera choreography.
- Deep animation work.
- Real AI execution.
- Runtime credential handling.
- Replacing the existing state model.

## Localization Rules

Use these translations as the shared baseline.

```ts
export const moduleLabels = {
  office: '办公室',
  calendar: '日程',
  tasks: '任务',
  logs: '日志',
  files: '文件',
  cronjobs: '定时任务',
  gateway: '网关',
  review: '复盘',
  rest: '休息区',
  migration: '迁移',
} as const;

export const moduleShortLabels = {
  office: '办公室',
  calendar: '日程',
  tasks: '任务',
  logs: '日志',
  files: '文件',
  cronjobs: '定时',
  gateway: '网关',
  review: '复盘',
  rest: '休息',
  migration: '迁移',
} as const;
```

Preserve these English terms when useful, but place them inside Chinese context:

- Commander: `龙虾 Commander`
- Runtime: `运行时 Runtime`
- Gateway: `网关 Gateway`
- Agent: `AI Agent`
- Worker: `Worker 智能体`
- Artifact: `产物 Artifact`
- Demo: `演示 Demo`

Do not translate internal event type values such as `task.created`, `approval.requested`, or `runtime.heartbeat`.

## Bright Office Visual Rules

Use one centralized theme:

```ts
export const brightOfficeTheme = {
  background: '#dfefff',
  fog: '#dfefff',
  fogNear: 30,
  fogFar: 58,
  floor: '#7f93a8',
  floorRoughness: 0.52,
  wall: '#aebfd0',
  ceiling: '#d6e7f7',
  ceilingOpacity: 0.32,
  gridMajor: '#38d9ff',
  gridMinor: '#84e7ff',
  ambient: '#f3f8ff',
  ambientIntensity: 1.15,
  keyLight: '#fff7e8',
  keyLightIntensity: 1.45,
  fillCyan: '#00e5ff',
  fillCyanIntensity: 0.48,
  fillViolet: '#9d6bff',
  fillVioletIntensity: 0.34,
  commanderAccent: '#ffb84d',
  commanderGlow: '#ffd27a',
  workerAccent: '#00dff6',
} as const;
```

The exact values can be tuned during implementation, but tests must keep these conditions true:

- Background brightness is higher than the old `#1e1e35`.
- Floor brightness is higher than the old `#2a2a38`.
- Wall brightness is higher than the old `#4a4a58`.
- Ambient intensity is at least `1`.
- Commander accent is visually warmer than worker accent.

## Task 1: Add Localization Foundation

**Files:**
- Create: `src/i18n/zh.ts`
- Create: `src/i18n/i18nTesting.ts`
- Create: `src/i18n/i18nTesting.test.ts`

- [ ] **Step 1: Write the failing localization tests**

Create `src/i18n/i18nTesting.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  agentStatusLabels,
  eventTypeLabels,
  moduleLabels,
  moduleShortLabels,
  runtimeModeLabels,
  runtimeStatusLabels,
  taskStatusLabels,
} from './zh';
import {
  findMissingLabels,
  findOverlongMobileLabels,
  getKnownModuleIds,
  hasChineseText,
} from './i18nTesting';

describe('Chinese UI labels', () => {
  it('covers every navigation module with Chinese labels', () => {
    expect(getKnownModuleIds()).toEqual([
      'office',
      'calendar',
      'tasks',
      'logs',
      'files',
      'cronjobs',
      'gateway',
      'review',
      'rest',
      'migration',
    ]);
    expect(findMissingLabels(moduleLabels, getKnownModuleIds())).toEqual([]);
    expect(Object.values(moduleLabels).every(hasChineseText)).toBe(true);
  });

  it('keeps mobile navigation labels short enough for 390px viewports', () => {
    expect(findOverlongMobileLabels(moduleShortLabels, 4)).toEqual([]);
  });

  it('covers common task and agent states', () => {
    expect(taskStatusLabels.completed).toBe('已完成');
    expect(taskStatusLabels.blocked).toBe('阻塞');
    expect(agentStatusLabels.working).toBe('工作中');
    expect(agentStatusLabels.idle).toBe('空闲');
  });

  it('covers runtime labels without changing runtime IDs', () => {
    expect(runtimeModeLabels.connected).toBe('真实连接');
    expect(runtimeStatusLabels.protocol_mismatch).toBe('协议不匹配');
  });

  it('keeps event type labels user readable while preserving event type keys', () => {
    expect(eventTypeLabels['approval.requested']).toBe('请求审批');
    expect(eventTypeLabels['artifact.created']).toBe('产物生成');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```powershell
npm.cmd run test -- src/i18n/i18nTesting.test.ts
```

Expected: FAIL because `src/i18n/zh.ts` and `src/i18n/i18nTesting.ts` do not exist.

- [ ] **Step 3: Add Chinese label module**

Create `src/i18n/zh.ts`:

```ts
import type { AgentStatus, EventType, TaskStatus } from '@/core/types';
import type { RuntimeConnectionStatus, RuntimeMode } from '@/runtime/runtimeTypes';

export type ModuleId =
  | 'office'
  | 'calendar'
  | 'tasks'
  | 'logs'
  | 'files'
  | 'cronjobs'
  | 'gateway'
  | 'review'
  | 'rest'
  | 'migration';

export const moduleLabels: Record<ModuleId, string> = {
  office: '办公室',
  calendar: '日程',
  tasks: '任务',
  logs: '日志',
  files: '文件',
  cronjobs: '定时任务',
  gateway: '网关',
  review: '复盘',
  rest: '休息区',
  migration: '迁移',
};

export const moduleShortLabels: Record<ModuleId, string> = {
  office: '办公室',
  calendar: '日程',
  tasks: '任务',
  logs: '日志',
  files: '文件',
  cronjobs: '定时',
  gateway: '网关',
  review: '复盘',
  rest: '休息',
  migration: '迁移',
};

export const taskStatusLabels: Record<TaskStatus, string> = {
  created: '已创建',
  planned: '已规划',
  assigned: '已分配',
  running: '运行中',
  waiting_input: '等待输入',
  blocked: '阻塞',
  reviewing: '审核中',
  completed: '已完成',
  failed: '失败',
};

export const agentStatusLabels: Record<AgentStatus, string> = {
  idle: '空闲',
  thinking: '思考中',
  working: '工作中',
  waiting: '等待中',
  blocked: '阻塞',
  completed: '已完成',
};

export const runtimeModeLabels: Record<RuntimeMode, string> = {
  demo: '演示',
  mock: '模拟',
  connected: '真实连接',
  offline: '离线',
  error: '错误',
};

export const runtimeStatusLabels: Record<RuntimeConnectionStatus, string> = {
  idle: '待机',
  connecting: '连接中',
  connected: '已连接',
  protocol_mismatch: '协议不匹配',
  disconnected: '已断开',
  error: '错误',
};

export const eventTypeLabels: Partial<Record<EventType, string>> = {
  'office.demo_reset': '重置演示',
  'task.created': '任务创建',
  'task.planned': '任务规划',
  'task.assigned': '任务分配',
  'task.started': '任务开始',
  'task.progress': '任务进展',
  'task.waiting_input': '等待输入',
  'task.blocked': '任务阻塞',
  'task.reviewing': '进入审核',
  'task.completed': '任务完成',
  'task.failed': '任务失败',
  'agent.status_changed': '状态变化',
  'approval.requested': '请求审批',
  'approval.resolved': '审批完成',
  'artifact.created': '产物生成',
  'commander.summary_ready': '指挥总结',
  'runtime.heartbeat': '运行时心跳',
  'runtime.protocol_mismatch': '协议不匹配',
  'user.action': '用户操作',
};

export const actionLabels = {
  startStandardDemo: '标准演示',
  startCommanderDemo: 'Commander 演示',
  startApprovedDelivery: '审批交付',
  pause: '暂停',
  resume: '继续',
  reset: '重置',
  resetView: '重置视角',
  previewJson: '预览 JSON',
  downloadJson: '下载 JSON',
  previewImport: '预览导入',
  applyImport: '应用导入',
  markComplete: '标记完成',
  approve: '同意',
  reject: '拒绝',
  openCommander: '打开 Commander',
  hideCommander: '收起 Commander',
} as const;

export function labelForTaskStatus(status: TaskStatus): string {
  return taskStatusLabels[status] ?? status;
}

export function labelForAgentStatus(status: AgentStatus): string {
  return agentStatusLabels[status] ?? status;
}

export function labelForEventType(type: EventType): string {
  return eventTypeLabels[type] ?? type;
}

export function labelForRuntimeMode(mode: RuntimeMode): string {
  return runtimeModeLabels[mode] ?? mode;
}

export function labelForRuntimeStatus(status: RuntimeConnectionStatus): string {
  return runtimeStatusLabels[status] ?? status;
}
```

- [ ] **Step 4: Add localization testing helpers**

Create `src/i18n/i18nTesting.ts`:

```ts
import { moduleLabels, type ModuleId } from './zh';

export function getKnownModuleIds(): ModuleId[] {
  return Object.keys(moduleLabels) as ModuleId[];
}

export function hasChineseText(value: string): boolean {
  return /[\u4e00-\u9fff]/.test(value);
}

export function findMissingLabels<T extends string>(
  labels: Partial<Record<T, string>>,
  requiredKeys: readonly T[],
): T[] {
  return requiredKeys.filter((key) => !labels[key]?.trim());
}

export function findOverlongMobileLabels<T extends string>(
  labels: Record<T, string>,
  maxCharacters: number,
): T[] {
  return (Object.keys(labels) as T[]).filter((key) => labels[key].length > maxCharacters);
}
```

- [ ] **Step 5: Run localization tests**

Run:

```powershell
npm.cmd run test -- src/i18n/i18nTesting.test.ts
```

Expected: PASS, 5 tests.

- [ ] **Step 6: Commit**

Run:

```powershell
git add src/i18n/zh.ts src/i18n/i18nTesting.ts src/i18n/i18nTesting.test.ts
git commit -m "feat: add Chinese UI label foundation"
```

## Task 2: Localize Shell Controls

**Files:**
- Modify: `src/ui/Navigation.tsx`
- Modify: `src/ui/StatusBar.tsx`
- Modify: `src/ui/DemoControls.tsx`
- Modify: `src/ui/ResetCameraBtn.tsx`
- Modify: `src/ui/runtime/RuntimeModeSwitch.tsx`
- Test: `src/i18n/i18nTesting.test.ts`

- [ ] **Step 1: Update navigation labels**

Modify `src/ui/Navigation.tsx` so the module list keeps IDs but uses localized labels:

```tsx
import { useUIStore } from '@/store/uiStore';
import { moduleLabels, moduleShortLabels, type ModuleId } from '@/i18n/zh';

const MODULES: { id: ModuleId }[] = [
  { id: 'office' },
  { id: 'calendar' },
  { id: 'tasks' },
  { id: 'logs' },
  { id: 'files' },
  { id: 'cronjobs' },
  { id: 'gateway' },
  { id: 'review' },
  { id: 'rest' },
  { id: 'migration' },
];

export function Navigation() {
  const activeModule = useUIStore((s) => s.activeModule);
  const setActiveModule = useUIStore((s) => s.setActiveModule);

  return (
    <nav className="flex items-center gap-1 px-2 sm:px-3 py-1.5 sm:py-2 border-b border-cyber-border bg-cyber-panel/80 backdrop-blur-sm flex-wrap">
      <div className="text-cyber-accent font-semibold text-xs sm:text-sm mr-2 sm:mr-4 tracking-wider whitespace-nowrap">
        3D 赛博办公室
      </div>
      {MODULES.map((mod) => (
        <button
          key={mod.id}
          onClick={() => setActiveModule(mod.id)}
          className={`px-1.5 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-xs rounded transition-colors whitespace-nowrap ${
            activeModule === mod.id
              ? 'bg-cyber-accent/15 text-cyber-accent border border-cyber-accent/30'
              : 'text-gray-300 hover:text-white hover:bg-white/5'
          }`}
          title={moduleLabels[mod.id]}
        >
          <span className="sm:hidden">{moduleShortLabels[mod.id]}</span>
          <span className="hidden sm:inline">{moduleLabels[mod.id]}</span>
        </button>
      ))}
    </nav>
  );
}
```

- [ ] **Step 2: Localize StatusBar**

Modify `src/ui/StatusBar.tsx`:

- Import `labelForRuntimeMode`, `labelForRuntimeStatus`.
- Replace `Agents`, `Tasks`, `Runtime`, `heartbeat`, and raw runtime labels with Chinese display text.
- Keep numeric counts unchanged.

Use this display format:

```tsx
运行时：{labelForRuntimeMode(runtimeMode)} / {labelForRuntimeStatus(runtimeStatus)}
```

For heartbeat:

```tsx
心跳：{lastHeartbeatAt ? new Date(lastHeartbeatAt).toLocaleTimeString('zh-CN') : '暂无'}
```

- [ ] **Step 3: Localize DemoControls without changing handlers**

Modify `src/ui/DemoControls.tsx`:

- Import `actionLabels`.
- Replace button text:

```tsx
{actionLabels.startStandardDemo}
{actionLabels.startCommanderDemo}
{actionLabels.startApprovedDelivery}
{demoPaused ? actionLabels.resume : actionLabels.pause}
{actionLabels.reset}
```

- Keep existing `try/catch`, `startDemoEngine`, `createMissionFromDraft`, and reset logic unchanged.
- Keep `console.error('[DemoControls] ...')` prefixes unchanged so debugging remains searchable.

- [ ] **Step 4: Localize ResetCameraBtn**

Modify `src/ui/ResetCameraBtn.tsx`:

```tsx
import { actionLabels } from '@/i18n/zh';
```

Change button label to:

```tsx
{actionLabels.resetView}
```

- [ ] **Step 5: Localize RuntimeModeSwitch**

Modify `src/ui/runtime/RuntimeModeSwitch.tsx`:

- Import `labelForRuntimeMode`, `labelForRuntimeStatus`.
- Keep mode IDs as `demo`, `mock`, `connected`, `offline`.
- Display localized labels in buttons.
- Display status as:

```tsx
运行时：{labelForRuntimeStatus(status)}
```

- [ ] **Step 6: Run shell verification**

Run:

```powershell
npm.cmd run test -- src/i18n/i18nTesting.test.ts
npm.cmd run build
```

Expected:

- Localization tests PASS.
- Build PASS.
- No TypeScript errors.

- [ ] **Step 7: Commit**

Run:

```powershell
git add src/ui/Navigation.tsx src/ui/StatusBar.tsx src/ui/DemoControls.tsx src/ui/ResetCameraBtn.tsx src/ui/runtime/RuntimeModeSwitch.tsx
git commit -m "feat: localize app shell controls"
```

## Task 3: Localize Commander and Event Surfaces

**Files:**
- Modify: `src/ui/EventFeed.tsx`
- Modify: `src/ui/SidePanel.tsx`
- Modify: `src/ui/commander/CommanderDock.tsx`
- Modify: `src/ui/commander/CommanderComposer.tsx`
- Modify: `src/ui/commander/MissionGraph.tsx`
- Modify: `src/ui/commander/WorkerRoster.tsx`
- Modify: `src/ui/commander/ApprovalInbox.tsx`
- Modify: `src/ui/commander/ArtifactRail.tsx`
- Modify: `src/ui/commander/MissionSummary.tsx`
- Modify: `src/data/demoCommander.ts`
- Modify: `src/store/commanderStore.ts`
- Test: existing Commander tests

- [ ] **Step 1: Localize EventFeed labels**

Modify `src/ui/EventFeed.tsx`:

- Import `labelForEventType`.
- Use `labelForEventType(event.type)` as the primary display label.
- Keep raw event type visible in smaller muted text for debugging:

```tsx
<span className="text-[10px] text-gray-500">{event.type}</span>
```

- Empty state should read:

```tsx
暂无事件。启动演示后会看到任务流。
```

- [ ] **Step 2: Localize SidePanel detail labels**

Modify `src/ui/SidePanel.tsx`:

- Import `labelForAgentStatus` and `labelForTaskStatus`.
- Replace headings:
  - `Agent Details` -> `AI Agent 详情`
  - `Task Details` -> `任务详情`
  - `Current Task` -> `当前任务`
  - `Status` -> `状态`
  - `Role` -> `职责`
  - `Updated` -> `更新`
  - close button title -> `关闭详情`
- Keep IDs visible in monospace.

- [ ] **Step 3: Localize Commander dock chrome**

Modify `src/ui/commander/CommanderDock.tsx`:

- Change collapsed/open button:

```tsx
{commanderOpen ? '收起 Commander' : '打开 Commander'}
```

- Main heading:

```tsx
龙虾 Commander
```

- Empty mission hint:

```tsx
输入目标后，Commander 会拆解任务并分配 Worker。
```

- [ ] **Step 4: Localize CommanderComposer**

Modify `src/ui/commander/CommanderComposer.tsx` labels:

- Goal label: `目标`
- Material note label: `资料说明`
- Constraints label: `约束条件`
- Submit button: `规划任务`
- Empty goal validation text: `先输入一个目标。`

Keep the same store actions and draft fields.

- [ ] **Step 5: Localize MissionGraph**

Modify `src/ui/commander/MissionGraph.tsx`:

- Use Chinese section title `任务图`.
- Use Chinese status labels for MissionTask statuses:

```ts
const MISSION_STATUS_LABELS = {
  queued: '排队中',
  assigned: '已分配',
  running: '运行中',
  waiting_input: '等待输入',
  approval_required: '等待审批',
  blocked: '阻塞',
  completed: '已完成',
  failed: '失败',
} as const;
```

- Keep task IDs visible for debugging.

- [ ] **Step 6: Localize WorkerRoster**

Modify `src/ui/commander/WorkerRoster.tsx`:

- Heading: `Worker 团队`
- Empty state: `暂无 Worker。`
- Current task label: `当前任务`
- Role label: `职责`

- [ ] **Step 7: Localize ApprovalInbox**

Modify `src/ui/commander/ApprovalInbox.tsx`:

- Heading: `审批箱`
- Empty state: `暂无待审批操作。`
- Labels:
  - `请求方`
  - `影响范围`
  - `风险`
  - `原因`
- Buttons:
  - `同意`
  - `拒绝`

Do not change `resolveApproval` behavior.

- [ ] **Step 8: Localize ArtifactRail and MissionSummary**

Modify `src/ui/commander/ArtifactRail.tsx`:

- Heading: `产物`
- Empty state: `任务完成后，产物会出现在这里。`
- Labels:
  - `来源`
  - `路径`
  - `关联任务`

Modify `src/ui/commander/MissionSummary.tsx`:

- Heading: `任务总结`
- Empty state: `暂无总结。`
- Counts:
  - `任务完成`
  - `审批`
  - `产物`

- [ ] **Step 9: Localize Commander demo data**

Modify `src/data/demoCommander.ts`:

- Worker names:
  - `Lobster Commander` -> `龙虾 Commander`
  - `Research Worker` -> `调研 Worker`
  - `Builder Worker` -> `构建 Worker`
  - `Review Worker` -> `审阅 Worker`
- Mission title:
  - `Video-faithful Commander workflow` -> `复刻视频里的 Commander 工作流`
- Approval reason:
  - `The build worker must update Commander React components and tests.` -> `构建 Worker 需要修改 Commander 组件和测试。`
- Artifact titles and summaries should be Chinese-first while keeping paths unchanged.

Modify `src/store/commanderStore.ts` default draft:

```ts
const defaultDraft: CommanderDraft = {
  goal: '复刻参考视频里的 3D 赛博办公室 Commander 工作流。',
  materialNote: '使用已整理的视频需求文档、当前项目代码和本地演示数据。',
  constraintsText: '保持演示模式可运行\n写入文件前需要审批\n产物必须关联到 Worker 任务',
};
```

- [ ] **Step 10: Run Commander verification**

Run:

```powershell
npm.cmd run test -- src/commander/commanderTesting.test.ts src/demo/commanderScenario.test.ts
npm.cmd run build
```

Expected:

- Commander tests PASS.
- Commander scenario tests PASS.
- Build PASS.

- [ ] **Step 11: Commit**

Run:

```powershell
git add src/ui/EventFeed.tsx src/ui/SidePanel.tsx src/ui/commander src/data/demoCommander.ts src/store/commanderStore.ts
git commit -m "feat: localize Commander and event surfaces"
```

## Task 4: Localize Workbench, Runtime, Migration, and Demo Data

**Files:**
- Modify: `src/ui/dashboard/WorkbenchHeader.tsx`
- Modify: `src/ui/dashboard/CalendarView.tsx`
- Modify: `src/ui/dashboard/TasksView.tsx`
- Modify: `src/ui/dashboard/LogsView.tsx`
- Modify: `src/ui/dashboard/FilesView.tsx`
- Modify: `src/ui/dashboard/FilePreview.tsx`
- Modify: `src/ui/dashboard/CronJobsView.tsx`
- Modify: `src/ui/dashboard/GatewayStatus.tsx`
- Modify: `src/ui/dashboard/GatewayDiagnostics.tsx`
- Modify: `src/ui/dashboard/DailyReview.tsx`
- Modify: `src/ui/dashboard/RestView.tsx`
- Modify: `src/ui/dashboard/MigrationView.tsx`
- Modify: `src/ui/runtime/RuntimeEventInspector.tsx`
- Modify: `src/migration/migrationTesting.ts`
- Modify: `src/data/demoSchedules.ts`
- Modify: `src/data/mockRuntimeEvents.ts`
- Modify: `src/demo/scenarios.ts`
- Modify: `src/demo/commanderScenario.ts`
- Test: `src/ui/dashboard/workbenchTesting.test.ts`, `src/migration/migrationTesting.test.ts`, `src/runtime/runtimeTesting.test.ts`

- [ ] **Step 1: Localize Workbench headers**

Change visible `WorkbenchHeader` title/subtitle call sites:

| Component | Title | Subtitle |
| --- | --- | --- |
| `CalendarView` | `日程 / 计划` | `查看本周计划、阶段进度和关联任务。` |
| `TasksView` | `任务` | `按状态、来源和负责人跟踪工作。` |
| `LogsView` | `日志` | `查看任务、Agent 和 Runtime 事件。` |
| `FilesView` | `文件` | `查看产物、资料和任务关联。` |
| `CronJobsView` | `定时任务` | `检查自动任务、运行时间和结果。` |
| `GatewayStatus` | `网关 / Runtime` | `查看连接模式、协议状态和运行诊断。` |
| `DailyReview` | `每日复盘` | `汇总完成、阻塞、产物和下一步。` |
| `RestView` | `休息区` | `给 Agent 工作室保留一点轻松空间。` |
| `MigrationView` | `迁移` | `导出本地状态，并在另一台电脑恢复。` |

- [ ] **Step 2: Localize Calendar controls**

In `CalendarView.tsx`:

- `Mark Complete` -> `标记完成`
- `Completed` -> `已完成`
- `Progress` -> `进度`
- `Stages` -> `阶段`
- Weekday display should use Chinese:

```ts
new Intl.DateTimeFormat('zh-CN', { weekday: 'short', month: 'numeric', day: 'numeric' })
```

- [ ] **Step 3: Localize Tasks filters and cards**

In `TasksView.tsx`:

- Filter labels:
  - `Status` -> `状态`
  - `Source` -> `来源`
  - `All` -> `全部`
- Priority:
  - `high` -> `高`
  - `medium` -> `中`
  - `low` -> `低`
- Empty state:

```tsx
暂无任务。启动演示或 Runtime Mock 后会出现任务。
```

- [ ] **Step 4: Localize Logs, Files, Cron, Review, Rest**

Apply these exact visible text replacements:

| Existing concept | Chinese display |
| --- | --- |
| Event log empty state | `暂无日志。任务事件会出现在这里。` |
| File preview empty state | `选择一个文件查看预览。` |
| Related task | `关联任务` |
| Last run | `上次运行` |
| Next run | `下次运行` |
| Owner | `负责人` |
| Daily summary | `每日总结` |
| Next steps | `下一步` |
| Rest muted | `休息区已静音` |
| Mute | `静音` |
| Unmute | `取消静音` |

- [ ] **Step 5: Localize Gateway and Runtime inspector**

In `GatewayStatus.tsx`:

- `Runtime Controller` -> `运行时控制`
- `Mode` -> `模式`
- `Status` -> `状态`
- `Endpoint` -> `端点`
- `Heartbeat` -> `心跳`
- `Raw events` -> `原始事件`
- Guarded connected warning should read:

```tsx
真实连接目前使用安全保护入口，不会请求或保存凭据。请在后端 Runtime 中配置密钥。
```

In `RuntimeEventInspector.tsx`:

- Heading: `Runtime 原始事件`
- Empty state: `暂无 Runtime 原始事件。`

- [ ] **Step 6: Localize Migration UI**

In `MigrationView.tsx`:

- `Export package` -> `导出迁移包`
- `Preview JSON` -> `预览 JSON`
- `Download JSON` -> `下载 JSON`
- `Import package` -> `导入迁移包`
- `Preview Import` -> `预览导入`
- `Apply Import` -> `应用导入`
- Status messages:
  - `Export ready:` -> `导出已准备：`
  - `Import preview is valid.` -> `导入预览有效。`
  - `Import preview failed.` -> `导入预览失败。`
  - `Import applied. Refresh the page to load restored state.` -> `导入已应用。刷新页面后加载恢复状态。`
- Checklist items should be Chinese.

In `src/migration/migrationTesting.ts`, change labels:

```ts
const LABELS: Record<MigrationStorageKey, string> = {
  'cyber-office-ui': '界面偏好',
  'cyber-office-data': '办公室 Agent 和任务',
  'cyber-office-dashboard': '工作台状态',
  'cyber-office-commander': 'Commander 任务和产物',
};
```

- [ ] **Step 7: Localize demo and mock data**

Modify data files so user-facing titles and summaries are Chinese-first:

- `src/data/demoSchedules.ts`
- `src/data/mockRuntimeEvents.ts`
- `src/demo/scenarios.ts`
- `src/demo/commanderScenario.ts`

Keep IDs, paths, event type names, runtime protocol names, and task IDs unchanged.

For `mockRuntimeEvents.ts`, use:

```ts
payload: { title: 'Runtime 驱动的办公室检查', summary: 'Mock Runtime 创建了这个任务。' }
```

- [ ] **Step 8: Run workbench/runtime/migration verification**

Run:

```powershell
npm.cmd run test -- src/ui/dashboard/workbenchTesting.test.ts src/migration/migrationTesting.test.ts src/runtime/runtimeTesting.test.ts
npm.cmd run build
```

Expected:

- Workbench tests PASS.
- Migration tests PASS.
- Runtime tests PASS.
- Build PASS.

- [ ] **Step 9: Commit**

Run:

```powershell
git add src/ui/dashboard src/ui/runtime src/migration/migrationTesting.ts src/data/demoSchedules.ts src/data/mockRuntimeEvents.ts src/demo/scenarios.ts src/demo/commanderScenario.ts
git commit -m "feat: localize workbench and demo content"
```

## Task 5: Add Bright Office Visual Theme

**Files:**
- Create: `src/scene/sceneVisualTheme.ts`
- Create: `src/scene/sceneVisualTesting.ts`
- Create: `src/scene/sceneVisualTesting.test.ts`
- Modify: `src/scene/OfficeScene.tsx`
- Modify: `src/scene/Lighting.tsx`
- Modify: `src/scene/Floor.tsx`
- Modify: `src/scene/Walls.tsx`
- Modify: `src/scene/Desk.tsx`
- Modify: `src/scene/CommanderStation.tsx`

- [ ] **Step 1: Write visual theme tests**

Create `src/scene/sceneVisualTesting.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { brightOfficeTheme } from './sceneVisualTheme';
import {
  getHexBrightness,
  isBrighterThan,
  isWarmCommanderAccent,
} from './sceneVisualTesting';

describe('bright office visual theme', () => {
  it('makes the office background, floor, and walls brighter than the old scene', () => {
    expect(isBrighterThan(brightOfficeTheme.background, '#1e1e35')).toBe(true);
    expect(isBrighterThan(brightOfficeTheme.floor, '#2a2a38')).toBe(true);
    expect(isBrighterThan(brightOfficeTheme.wall, '#4a4a58')).toBe(true);
  });

  it('keeps enough light in the scene for first-eye readability', () => {
    expect(brightOfficeTheme.ambientIntensity).toBeGreaterThanOrEqual(1);
    expect(brightOfficeTheme.keyLightIntensity).toBeGreaterThan(1);
    expect(brightOfficeTheme.fogNear).toBeGreaterThanOrEqual(28);
  });

  it('keeps Commander warmer and more visually emphasized than worker accents', () => {
    expect(isWarmCommanderAccent(brightOfficeTheme.commanderAccent, brightOfficeTheme.workerAccent)).toBe(true);
    expect(getHexBrightness(brightOfficeTheme.commanderGlow)).toBeGreaterThan(getHexBrightness(brightOfficeTheme.commanderAccent));
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```powershell
npm.cmd run test -- src/scene/sceneVisualTesting.test.ts
```

Expected: FAIL because visual theme files do not exist.

- [ ] **Step 3: Add visual theme tokens**

Create `src/scene/sceneVisualTheme.ts`:

```ts
export const brightOfficeTheme = {
  background: '#dfefff',
  fog: '#dfefff',
  fogNear: 30,
  fogFar: 58,
  floor: '#7f93a8',
  floorRoughness: 0.52,
  wall: '#aebfd0',
  ceiling: '#d6e7f7',
  ceilingOpacity: 0.32,
  gridMajor: '#38d9ff',
  gridMinor: '#84e7ff',
  ambient: '#f3f8ff',
  ambientIntensity: 1.15,
  keyLight: '#fff7e8',
  keyLightIntensity: 1.45,
  fillCyan: '#00e5ff',
  fillCyanIntensity: 0.48,
  fillViolet: '#9d6bff',
  fillVioletIntensity: 0.34,
  commanderAccent: '#ffb84d',
  commanderGlow: '#ffd27a',
  workerAccent: '#00dff6',
} as const;
```

- [ ] **Step 4: Add visual testing helpers**

Create `src/scene/sceneVisualTesting.ts`:

```ts
function parseHex(hex: string): { r: number; g: number; b: number } {
  const normalized = hex.replace('#', '');
  const value = Number.parseInt(normalized, 16);
  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  };
}

export function getHexBrightness(hex: string): number {
  const { r, g, b } = parseHex(hex);
  return (r * 299 + g * 587 + b * 114) / 1000;
}

export function isBrighterThan(candidate: string, baseline: string): boolean {
  return getHexBrightness(candidate) > getHexBrightness(baseline);
}

export function isWarmCommanderAccent(commanderAccent: string, workerAccent: string): boolean {
  const commander = parseHex(commanderAccent);
  const worker = parseHex(workerAccent);
  return commander.r > commander.b && commander.r > worker.r;
}
```

- [ ] **Step 5: Apply bright theme to OfficeScene**

Modify `src/scene/OfficeScene.tsx`:

- Import `brightOfficeTheme`.
- Replace Canvas background and fog:

```tsx
<color attach="background" args={[brightOfficeTheme.background]} />
<fog attach="fog" args={[brightOfficeTheme.fog, brightOfficeTheme.fogNear, brightOfficeTheme.fogFar]} />
```

- [ ] **Step 6: Apply bright theme to Lighting**

Modify `src/scene/Lighting.tsx`:

```tsx
import { brightOfficeTheme } from './sceneVisualTheme';

export function Lighting() {
  return (
    <>
      <ambientLight intensity={brightOfficeTheme.ambientIntensity} color={brightOfficeTheme.ambient} />
      <directionalLight
        position={[8, 12, 4]}
        intensity={brightOfficeTheme.keyLightIntensity}
        color={brightOfficeTheme.keyLight}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <pointLight position={[-6, 3.4, -2]} intensity={brightOfficeTheme.fillCyanIntensity} color={brightOfficeTheme.fillCyan} />
      <pointLight position={[6, 3.4, -2]} intensity={brightOfficeTheme.fillVioletIntensity} color={brightOfficeTheme.fillViolet} />
      <pointLight position={[0, 4.2, -5]} intensity={0.55} color={brightOfficeTheme.commanderGlow} />
    </>
  );
}
```

- [ ] **Step 7: Apply bright theme to Floor and Walls**

Modify `src/scene/Floor.tsx`:

- Import `brightOfficeTheme`.
- Set floor material color to `brightOfficeTheme.floor`.
- Set roughness to `brightOfficeTheme.floorRoughness`.
- Keep existing geometry and grid behavior.

Modify `src/scene/Walls.tsx`:

- Import `brightOfficeTheme`.
- Set `wallColor` to `brightOfficeTheme.wall`.
- Set ceiling color to `brightOfficeTheme.ceiling`.
- Set ceiling opacity to `brightOfficeTheme.ceilingOpacity`.
- Keep `transparent` and `depthWrite={false}` for ceiling visibility.

- [ ] **Step 8: Emphasize Commander desk and station**

Modify `src/scene/Desk.tsx`:

- Import `brightOfficeTheme`.
- Change accent selection:

```ts
const accentColor = isCommander ? brightOfficeTheme.commanderAccent : brightOfficeTheme.workerAccent;
```

Modify `src/scene/CommanderStation.tsx`:

- Import `brightOfficeTheme`.
- Use `brightOfficeTheme.commanderAccent` and `brightOfficeTheme.commanderGlow` for station rings, panels, and point lights.
- Increase any Commander station emissive intensity by roughly 25 percent from the existing value.
- Keep geometry positions unchanged in this plan.

- [ ] **Step 9: Run visual tests and scene tests**

Run:

```powershell
npm.cmd run test -- src/scene/sceneVisualTesting.test.ts src/scene/sceneTesting.test.ts src/scene/cameraTesting.test.ts
npm.cmd run build
```

Expected:

- Visual theme tests PASS.
- Existing scene tests PASS.
- Camera tests PASS.
- Build PASS.

- [ ] **Step 10: Commit**

Run:

```powershell
git add src/scene/sceneVisualTheme.ts src/scene/sceneVisualTesting.ts src/scene/sceneVisualTesting.test.ts src/scene/OfficeScene.tsx src/scene/Lighting.tsx src/scene/Floor.tsx src/scene/Walls.tsx src/scene/Desk.tsx src/scene/CommanderStation.tsx
git commit -m "feat: brighten office scene theme"
```

## Task 6: Tune Chinese Fonts, Panels, and Mobile Text Fit

**Files:**
- Modify: `src/index.css`
- Test: build and browser QA

- [ ] **Step 1: Update global font stack**

Modify `src/index.css` body font stack:

```css
body {
  margin: 0;
  min-width: 320px;
  min-height: 100vh;
  background: #dfefff;
  color: #eaf7ff;
  font-family:
    "Inter",
    "Microsoft YaHei",
    "PingFang SC",
    "Noto Sans SC",
    system-ui,
    sans-serif;
}
```

Keep monospace font on JSON, IDs, event types, code blocks, and migration textareas:

```css
.mono,
code,
pre,
.migration-textarea,
.runtime-event-row pre {
  font-family: "JetBrains Mono", "Fira Code", Consolas, monospace;
}
```

- [ ] **Step 2: Improve panel contrast for brighter background**

Keep panels dark enough to read over the bright 3D scene:

```css
.cyber-panel {
  background: rgba(6, 14, 28, 0.88);
  border: 1px solid rgba(0, 240, 255, 0.22);
  box-shadow: 0 12px 34px rgba(4, 10, 22, 0.34);
}
```

Do not reintroduce `backdrop-blur-sm` on DemoControls, because previous verification found it can create stacking-context click issues.

- [ ] **Step 3: Add mobile Chinese label fit rules**

Add to the existing `@media (max-width: 640px)` block:

```css
nav button {
  max-width: 4.5rem;
  overflow: hidden;
  text-overflow: ellipsis;
}

.bottom-hud {
  gap: 0.35rem;
}

.demo-controls .cyber-btn {
  min-height: 1.75rem;
  line-height: 1.1;
  white-space: normal;
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
git add src/index.css
git commit -m "style: tune Chinese typography and mobile labels"
```

## Task 7: Browser QA and Regression Verification

**Files:**
- Modify: `docs/superpowers/specs/2026-05-23-video-replication-optimization-requirements.md`

- [ ] **Step 1: Run full automated verification**

Run:

```powershell
npm.cmd run test
npm.cmd run build
```

Expected:

- All test files PASS.
- All tests PASS.
- Build PASS.
- Large chunk warning may remain; it belongs to Plan 11.

- [ ] **Step 2: Start dev server**

Run:

```powershell
npm.cmd run dev -- --host 127.0.0.1
```

Expected:

- Vite prints a localhost URL.
- Use the printed port for browser QA. If port `5173` is busy, use the next printed port.

- [ ] **Step 3: Desktop browser QA**

Open the app at the Vite URL with a `1366x768` viewport.

Verify:

- Navigation shows Chinese module labels.
- StatusBar shows Chinese status text.
- Runtime mode switch uses Chinese labels.
- Office first screen is visibly brighter than before.
- Commander station is easier to spot than ordinary desks.
- Standard Demo, Commander Demo, Approved Delivery, Pause, Resume, Reset buttons are clickable.
- Reset View button remains separate from DemoControls.
- SidePanel appears when clicking an Agent or desk.
- EventFeed displays Chinese event summaries plus raw event type where useful.
- Browser console has no React errors.

- [ ] **Step 4: Mobile browser QA**

Set viewport to `390x844`.

Verify:

- Body does not horizontally overflow.
- Navigation Chinese labels fit.
- DemoControls buttons remain clickable.
- SidePanel overlays and can close.
- Gateway page does not overflow.
- Migration page textareas fit inside viewport.
- Office scene still shows the Commander area or central office area.

- [ ] **Step 5: Runtime and Migration QA**

In the browser:

1. Switch Runtime to `mock`.
2. Verify EventFeed receives runtime events.
3. Open Gateway.
4. Verify raw event count appears and Runtime inspector is Chinese.
5. Open Migration.
6. Click `预览 JSON`.
7. Verify section labels are Chinese.
8. Paste exported JSON into import box.
9. Click `预览导入`.
10. Verify import summary is Chinese and valid.

- [ ] **Step 6: Update optimization requirement status**

Append this section near the top of `docs/superpowers/specs/2026-05-23-video-replication-optimization-requirements.md` after the metadata block:

```md
## Implementation Status

- Plan 06 `Chinese UI and Bright Office`: implemented and verified.
- Chinese-first UI labels are in place for the app shell, Commander, Workbench, Runtime, and Migration surfaces.
- Bright office visual theme is applied through centralized scene tokens.
- Remaining optimization work continues in Plans 07 through 11.
```

- [ ] **Step 7: Commit QA status**

Run:

```powershell
git add docs/superpowers/specs/2026-05-23-video-replication-optimization-requirements.md
git commit -m "docs: mark Chinese UI and bright office plan status"
```

## Final Verification Checklist

Before declaring Plan 06 complete, run:

```powershell
npm.cmd run test
npm.cmd run build
git status --short
```

Expected:

- `npm.cmd run test` exits 0.
- `npm.cmd run build` exits 0.
- `git status --short` shows no modified tracked files.
- Untracked generated folders such as `node_modules/`, `dist/`, logs, or `tsconfig.tsbuildinfo` are not staged.

## Completion Criteria

Plan 06 is complete when:

1. Main navigation and primary UI controls are Chinese-first.
2. Commander, Workbench, Runtime, and Migration surfaces are usable in Chinese.
3. Existing IDs, event type strings, storage keys, and runtime protocol values remain stable.
4. The 3D office is materially brighter and easier to read on first load.
5. Commander station has warmer, stronger emphasis than ordinary worker desks.
6. 390px mobile viewport has no horizontal overflow from Chinese labels.
7. Demo controls remain clickable.
8. Reset View remains outside the Canvas and does not cover DemoControls.
9. Full tests and production build pass.
10. Browser QA passes on desktop and mobile.

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/06-chinese-ui-and-bright-office.md`. Two execution options:

1. **Subagent-Driven (recommended)** - Dispatch a fresh subagent per task, review between tasks, fast iteration.
2. **Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints.

Choose one before implementation begins.
