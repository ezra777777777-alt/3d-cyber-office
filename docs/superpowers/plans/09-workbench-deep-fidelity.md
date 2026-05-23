# Workbench Deep Fidelity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 Workbench 从“已有模块集合”升级成视频后半段那种可读、可追踪、能承接 Commander 工作流的完整附加功能区。

**Architecture:** 在现有 `dashboardStore`、`eventStore`、`officeStore`、`commanderStore` 之上增加一个 Workbench 投影层。所有模块继续使用本地 Zustand 和现有 demo/runtime 事件，不引入后端；新能力先通过纯函数测试保护，再逐个接到 UI。Workbench 不重写 Commander 和 Runtime，只把它们的任务、审批、产物、日志、复盘信息更清晰地投影出来。

**Tech Stack:** React 18, TypeScript, Vite, Zustand, Vitest, localStorage, Tailwind CSS.

---

## Source Requirement

使用以下需求文档作为产品基线：

`docs/superpowers/specs/2026-05-23-video-replication-optimization-requirements.md`

本计划覆盖：

- Section 12: Workbench 细化需求。
- Section 11: 工位和屏幕需求中的 Workbench 信息一致性。
- Section 14: 数据和状态需求中的来源标识和持久化。
- Section 15: 错误处理需求中的任务、文件、日志、Gateway 错误展示。
- Section 16: 可访问性和响应式需求。
- Section 18.2: P1 Workbench 细节验收。

本计划不覆盖：

- 真实 AI 执行接入，属于 Plan 10。
- Bundle 拆分和性能专项，属于 Plan 11。
- 3D 场景大改，已经由 Plan 06-08 负责。

## Current Baseline

当前项目已经具备：

- `src/store/dashboardStore.ts`：持久化 Calendar、Tasks、Files、Review、Rest 等状态。
- `src/ui/dashboard/CalendarView.tsx`
- `src/ui/dashboard/TasksView.tsx`
- `src/ui/dashboard/LogsView.tsx`
- `src/ui/dashboard/FilesView.tsx`
- `src/ui/dashboard/CronJobsView.tsx`
- `src/ui/dashboard/GatewayStatus.tsx`
- `src/ui/dashboard/DailyReview.tsx`
- `src/ui/dashboard/RestView.tsx`
- `src/ui/dashboard/workbenchTesting.ts`
- `src/ui/dashboard/workbenchTesting.test.ts`
- `src/data/demoSchedules.ts`
- `src/store/commanderStore.ts`
- `src/runtime/*`

当前差距：

1. 各 Workbench 模块虽然存在，但“同一条任务链”的关联感还不够强。
2. Calendar、Tasks、Files、Logs、Review 之间缺少统一的上下文导航。
3. 产物、审批、阻塞、Runtime 诊断没有足够醒目的中文解释和下一步动作。
4. Cron、Gateway、Rest 更像静态展示，还不像视频里“附加小功能”的一部分。
5. 390px 移动端仍需保护 Workbench 内容不横向溢出。

## File Structure

### Files to create

| File | Responsibility |
| --- | --- |
| `src/ui/dashboard/workbenchProjection.ts` | 把 Commander mission、Office tasks、events、runtime diagnostics 投影为统一 Workbench 上下文。 |
| `src/ui/dashboard/workbenchProjection.test.ts` | 保护任务依赖、产物映射、阻塞置顶、Review 汇总等纯逻辑。 |
| `src/ui/dashboard/WorkbenchContextStrip.tsx` | 每个 Workbench 页面顶部的当前任务链上下文条。 |
| `src/ui/dashboard/WorkbenchEmptyState.tsx` | 统一空状态，避免每个模块自己写散文案。 |
| `src/ui/dashboard/WorkbenchLinkedItem.tsx` | 可跳转的任务、Agent、Artifact、Log 引用组件。 |
| `src/ui/dashboard/workbenchCopy.ts` | Workbench 中文文案、状态说明和下一步动作建议。 |

### Files to modify

| File | Change |
| --- | --- |
| `src/store/dashboardStore.ts` | 增加 taskDependencyExpanded、selectedArtifactId、selectedRuntimeDiagnosticId、reviewScope、restMode 等状态。 |
| `src/ui/dashboard/CalendarView.tsx` | 增加中文周视图细节、今日高亮、关联任务跳转、计划/实际差异。 |
| `src/ui/dashboard/TasksView.tsx` | 增加依赖关系、Commander mission 映射、阻塞置顶、完成折叠。 |
| `src/ui/dashboard/LogsView.tsx` | 增加事件来源筛选、审批/产物跳转、高风险事件高亮。 |
| `src/ui/dashboard/FilesView.tsx` | 打通 Commander ArtifactRail，增加版本、来源、关联任务。 |
| `src/ui/dashboard/CronJobsView.tsx` | 增加健康检查、失败重试提示、日志关联。 |
| `src/ui/dashboard/GatewayStatus.tsx` | 增加中文诊断说明、协议不匹配修复建议、真实/占位连接区分。 |
| `src/ui/dashboard/DailyReview.tsx` | 汇入 Commander mission summary、日程完成率、Runtime 错误和明日建议。 |
| `src/ui/dashboard/RestView.tsx` | 增加专注/静音/轻量休息模式状态，不影响任务状态机。 |
| `src/ui/dashboard/WorkbenchHeader.tsx` | 接入 ContextStrip 或统一 subtitle。 |
| `src/index.css` | 增加 Workbench 响应式网格、状态标签、上下文条样式。 |
| `docs/superpowers/specs/2026-05-23-video-replication-optimization-requirements.md` | 实施后追加 Plan 09 状态。 |

## Data Model

### Workbench Link

```ts
export type WorkbenchLinkKind =
  | 'office_task'
  | 'mission_task'
  | 'agent'
  | 'artifact'
  | 'event'
  | 'runtime_diagnostic'
  | 'calendar_item'
  | 'review_entry';

export interface WorkbenchLink {
  kind: WorkbenchLinkKind;
  id: string;
  label: string;
  module: 'office' | 'calendar' | 'tasks' | 'logs' | 'files' | 'gateway' | 'review';
}
```

### Workbench Context

```ts
export interface WorkbenchContext {
  missionId: string | null;
  missionTitle: string | null;
  selectedTaskId: string | null;
  selectedMissionTaskId: string | null;
  selectedArtifactId: string | null;
  activeLinks: WorkbenchLink[];
  blockedCount: number;
  pendingApprovalCount: number;
  artifactCount: number;
  runtimeWarningCount: number;
}
```

## Task 1: Add Workbench Projection Helpers

**Files:**
- Create: `src/ui/dashboard/workbenchProjection.ts`
- Create: `src/ui/dashboard/workbenchProjection.test.ts`
- Modify: `src/ui/dashboard/workbenchTesting.ts`

- [ ] **Step 1: Write failing projection tests**

Create `src/ui/dashboard/workbenchProjection.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { buildWorkbenchContext, orderWorkbenchTasks, summarizeReviewInputs } from './workbenchProjection';

describe('workbench projection', () => {
  it('puts blocked and approval-required tasks before ordinary running tasks', () => {
    const tasks = orderWorkbenchTasks([
      { id: 'task-running', status: 'running', priority: 'medium', title: '运行任务' },
      { id: 'task-blocked', status: 'blocked', priority: 'high', title: '阻塞任务' },
      { id: 'task-approval', status: 'approval_required', priority: 'high', title: '审批任务' },
    ]);

    expect(tasks.map((task) => task.id)).toEqual(['task-blocked', 'task-approval', 'task-running']);
  });

  it('builds a context strip from mission, selected task, artifacts, approvals, and diagnostics', () => {
    const context = buildWorkbenchContext({
      mission: {
        id: 'mission-1',
        title: '复刻视频工作流',
        taskIds: ['research', 'build'],
        tasks: {
          research: { id: 'research', title: '调研', status: 'completed', officeTaskId: 'task-research', artifactIds: ['artifact-a'] },
          build: { id: 'build', title: '构建', status: 'approval_required', officeTaskId: 'task-build', artifactIds: [] },
        },
      },
      selectedTaskId: 'task-build',
      selectedMissionTaskId: 'build',
      selectedArtifactId: 'artifact-a',
      approvals: [{ id: 'approval-1', status: 'pending', taskId: 'build' }],
      runtimeDiagnostics: [{ id: 'diag-1', severity: 'warning', message: '协议不匹配' }],
    });

    expect(context).toMatchObject({
      missionId: 'mission-1',
      missionTitle: '复刻视频工作流',
      selectedTaskId: 'task-build',
      selectedMissionTaskId: 'build',
      selectedArtifactId: 'artifact-a',
      pendingApprovalCount: 1,
      artifactCount: 1,
      runtimeWarningCount: 1,
    });
  });

  it('summarizes review inputs from completed, blocked, artifact, and runtime counts', () => {
    expect(summarizeReviewInputs({
      completedTasks: 3,
      blockedTasks: 1,
      artifacts: 2,
      runtimeWarnings: 1,
    })).toEqual({
      health: 'needs_attention',
      headline: '今日完成 3 项，仍有 1 项阻塞',
      nextAction: '优先处理阻塞任务，并检查 Runtime 诊断。',
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```powershell
npm.cmd run test -- src/ui/dashboard/workbenchProjection.test.ts
```

Expected: FAIL because `workbenchProjection.ts` does not exist.

- [ ] **Step 3: Add projection implementation**

Create `src/ui/dashboard/workbenchProjection.ts`:

```ts
export type ProjectedTaskStatus =
  | 'blocked'
  | 'approval_required'
  | 'running'
  | 'waiting_input'
  | 'assigned'
  | 'completed'
  | 'planned'
  | string;

export interface ProjectedWorkbenchTask {
  id: string;
  title: string;
  status: ProjectedTaskStatus;
  priority?: 'low' | 'medium' | 'high';
}

export interface MinimalMissionTask {
  id: string;
  title: string;
  status: ProjectedTaskStatus;
  officeTaskId: string;
  artifactIds: string[];
}

export interface MinimalMission {
  id: string;
  title: string;
  taskIds: string[];
  tasks: Record<string, MinimalMissionTask>;
}

export interface MinimalApproval {
  id: string;
  status: 'pending' | 'approved' | 'rejected';
  taskId: string;
}

export interface MinimalRuntimeDiagnostic {
  id: string;
  severity: 'info' | 'warning' | 'error';
  message: string;
}

export interface BuildWorkbenchContextInput {
  mission?: MinimalMission;
  selectedTaskId: string | null;
  selectedMissionTaskId: string | null;
  selectedArtifactId: string | null;
  approvals: MinimalApproval[];
  runtimeDiagnostics: MinimalRuntimeDiagnostic[];
}

export interface WorkbenchLink {
  kind: 'office_task' | 'mission_task' | 'artifact' | 'runtime_diagnostic';
  id: string;
  label: string;
  module: 'tasks' | 'files' | 'gateway';
}

export interface WorkbenchContext {
  missionId: string | null;
  missionTitle: string | null;
  selectedTaskId: string | null;
  selectedMissionTaskId: string | null;
  selectedArtifactId: string | null;
  activeLinks: WorkbenchLink[];
  blockedCount: number;
  pendingApprovalCount: number;
  artifactCount: number;
  runtimeWarningCount: number;
}

const STATUS_RANK: Record<string, number> = {
  blocked: 0,
  failed: 0,
  approval_required: 1,
  waiting_input: 2,
  running: 3,
  assigned: 4,
  planned: 5,
  completed: 6,
};

export function orderWorkbenchTasks<T extends ProjectedWorkbenchTask>(tasks: T[]): T[] {
  return [...tasks].sort((a, b) => {
    const statusDelta = (STATUS_RANK[a.status] ?? 9) - (STATUS_RANK[b.status] ?? 9);
    if (statusDelta !== 0) return statusDelta;
    const priorityRank = { high: 0, medium: 1, low: 2 };
    return (priorityRank[a.priority ?? 'medium'] ?? 1) - (priorityRank[b.priority ?? 'medium'] ?? 1);
  });
}

export function buildWorkbenchContext(input: BuildWorkbenchContextInput): WorkbenchContext {
  const missionTasks = input.mission
    ? input.mission.taskIds.map((id) => input.mission!.tasks[id]).filter(Boolean)
    : [];
  const artifactIds = missionTasks.flatMap((task) => task.artifactIds);
  const links: WorkbenchLink[] = [];

  if (input.selectedTaskId) {
    links.push({ kind: 'office_task', id: input.selectedTaskId, label: input.selectedTaskId, module: 'tasks' });
  }
  if (input.selectedMissionTaskId) {
    links.push({ kind: 'mission_task', id: input.selectedMissionTaskId, label: input.selectedMissionTaskId, module: 'tasks' });
  }
  if (input.selectedArtifactId) {
    links.push({ kind: 'artifact', id: input.selectedArtifactId, label: input.selectedArtifactId, module: 'files' });
  }
  for (const diagnostic of input.runtimeDiagnostics.filter((item) => item.severity !== 'info')) {
    links.push({ kind: 'runtime_diagnostic', id: diagnostic.id, label: diagnostic.message, module: 'gateway' });
  }

  return {
    missionId: input.mission?.id ?? null,
    missionTitle: input.mission?.title ?? null,
    selectedTaskId: input.selectedTaskId,
    selectedMissionTaskId: input.selectedMissionTaskId,
    selectedArtifactId: input.selectedArtifactId,
    activeLinks: links,
    blockedCount: missionTasks.filter((task) => task.status === 'blocked' || task.status === 'failed').length,
    pendingApprovalCount: input.approvals.filter((approval) => approval.status === 'pending').length,
    artifactCount: artifactIds.length,
    runtimeWarningCount: input.runtimeDiagnostics.filter((item) => item.severity === 'warning' || item.severity === 'error').length,
  };
}

export function summarizeReviewInputs(input: {
  completedTasks: number;
  blockedTasks: number;
  artifacts: number;
  runtimeWarnings: number;
}) {
  if (input.blockedTasks > 0 || input.runtimeWarnings > 0) {
    return {
      health: 'needs_attention' as const,
      headline: `今日完成 ${input.completedTasks} 项，仍有 ${input.blockedTasks} 项阻塞`,
      nextAction: '优先处理阻塞任务，并检查 Runtime 诊断。',
    };
  }
  return {
    health: 'healthy' as const,
    headline: `今日完成 ${input.completedTasks} 项，交付 ${input.artifacts} 个产物`,
    nextAction: '可以进入复盘并规划下一轮任务。',
  };
}
```

- [ ] **Step 4: Run projection tests**

```powershell
npm.cmd run test -- src/ui/dashboard/workbenchProjection.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add src/ui/dashboard/workbenchProjection.ts src/ui/dashboard/workbenchProjection.test.ts
git commit -m "feat: add workbench projection helpers"
```

## Task 2: Add Shared Workbench UI Primitives

**Files:**
- Create: `src/ui/dashboard/WorkbenchContextStrip.tsx`
- Create: `src/ui/dashboard/WorkbenchEmptyState.tsx`
- Create: `src/ui/dashboard/WorkbenchLinkedItem.tsx`
- Create: `src/ui/dashboard/workbenchCopy.ts`
- Modify: `src/index.css`

- [ ] **Step 1: Add Chinese copy helpers**

Create `src/ui/dashboard/workbenchCopy.ts`:

```ts
export const workbenchModuleCopy = {
  calendar: { title: '日程计划', subtitle: '查看本周计划、阶段进度和任务关联。' },
  tasks: { title: '任务台', subtitle: '追踪任务状态、依赖、阻塞和来源。' },
  logs: { title: '事件日志', subtitle: '查看 Demo、Runtime、Commander 和用户动作。' },
  files: { title: '文件产物', subtitle: '浏览产物、版本、来源和关联任务。' },
  cronjobs: { title: '定时任务', subtitle: '查看自动检查、复盘和失败重试。' },
  gateway: { title: '网关诊断', subtitle: '检查 Runtime 模式、协议和原始事件。' },
  review: { title: '每日复盘', subtitle: '汇总完成、阻塞、产物和下一步建议。' },
  rest: { title: '休息区', subtitle: '查看静音、专注和 Agent 轻量状态。' },
} as const;

export function nextActionForStatus(status: string): string {
  if (status === 'blocked' || status === 'failed') return '查看阻塞原因并切到日志定位来源。';
  if (status === 'approval_required') return '进入审批箱，确认风险后同意或拒绝。';
  if (status === 'waiting_input') return '补充用户输入后继续任务。';
  if (status === 'completed') return '查看产物或进入复盘。';
  return '继续观察任务进度。';
}
```

- [ ] **Step 2: Add linked item component**

Create `src/ui/dashboard/WorkbenchLinkedItem.tsx`:

```tsx
import { useUIStore } from '@/store/uiStore';
import type { WorkbenchLink } from './workbenchProjection';

export function WorkbenchLinkedItem({ link }: { link: WorkbenchLink }) {
  const setActiveModule = useUIStore((state) => state.setActiveModule);
  const selectTask = useUIStore((state) => state.selectTask);
  const selectMissionTask = useUIStore((state) => state.selectMissionTask);

  return (
    <button
      type="button"
      className="workbench-linked-item"
      onClick={() => {
        setActiveModule(link.module);
        if (link.kind === 'office_task') selectTask(link.id);
        if (link.kind === 'mission_task') selectMissionTask(link.id);
      }}
    >
      <span>{link.label}</span>
      <small>{link.kind}</small>
    </button>
  );
}
```

- [ ] **Step 3: Add context strip**

Create `src/ui/dashboard/WorkbenchContextStrip.tsx`:

```tsx
import type { WorkbenchContext } from './workbenchProjection';
import { WorkbenchLinkedItem } from './WorkbenchLinkedItem';

export function WorkbenchContextStrip({ context }: { context: WorkbenchContext }) {
  if (!context.missionId && context.activeLinks.length === 0) return null;

  return (
    <section className="workbench-context-strip">
      <div>
        <span className="workbench-context-kicker">当前工作链</span>
        <strong>{context.missionTitle ?? '暂无 Commander 任务'}</strong>
      </div>
      <div className="workbench-context-stats">
        <span>审批 {context.pendingApprovalCount}</span>
        <span>产物 {context.artifactCount}</span>
        <span>诊断 {context.runtimeWarningCount}</span>
      </div>
      <div className="workbench-context-links">
        {context.activeLinks.map((link) => (
          <WorkbenchLinkedItem key={`${link.kind}-${link.id}`} link={link} />
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Add empty state**

Create `src/ui/dashboard/WorkbenchEmptyState.tsx`:

```tsx
export function WorkbenchEmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: string;
}) {
  return (
    <div className="workbench-empty-state">
      <strong>{title}</strong>
      <p>{body}</p>
      {action && <small>{action}</small>}
    </div>
  );
}
```

- [ ] **Step 5: Add CSS**

Modify `src/index.css` inside the existing `@layer components` section:

```css
.workbench-context-strip {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 0.75rem;
  align-items: center;
  padding: 0.75rem;
  border: 1px solid rgb(0 240 255 / 0.22);
  background: rgb(8 14 24 / 0.72);
  border-radius: 0.5rem;
}

.workbench-context-kicker {
  display: block;
  color: rgb(148 163 184);
  font-size: 0.72rem;
}

.workbench-context-stats,
.workbench-context-links {
  display: flex;
  gap: 0.4rem;
  flex-wrap: wrap;
}

.workbench-linked-item {
  border: 1px solid rgb(255 255 255 / 0.12);
  background: rgb(255 255 255 / 0.05);
  color: rgb(226 232 240);
  border-radius: 0.4rem;
  padding: 0.35rem 0.5rem;
  text-align: left;
}

.workbench-linked-item small {
  display: block;
  color: rgb(148 163 184);
  font-size: 0.65rem;
}

.workbench-empty-state {
  padding: 1rem;
  border: 1px dashed rgb(148 163 184 / 0.32);
  border-radius: 0.5rem;
  color: rgb(203 213 225);
}

@media (max-width: 640px) {
  .workbench-context-strip {
    grid-template-columns: 1fr;
  }
}
```

- [ ] **Step 6: Run build**

```powershell
npm.cmd run build
```

Expected: TypeScript and Vite build succeed.

- [ ] **Step 7: Commit**

```powershell
git add src/ui/dashboard/WorkbenchContextStrip.tsx src/ui/dashboard/WorkbenchEmptyState.tsx src/ui/dashboard/WorkbenchLinkedItem.tsx src/ui/dashboard/workbenchCopy.ts src/index.css
git commit -m "feat: add shared workbench primitives"
```

## Task 3: Upgrade Calendar and Tasks

**Files:**
- Modify: `src/store/dashboardStore.ts`
- Modify: `src/ui/dashboard/CalendarView.tsx`
- Modify: `src/ui/dashboard/TasksView.tsx`
- Test: `src/ui/dashboard/workbenchProjection.test.ts`
- Test: `src/ui/dashboard/workbenchTesting.test.ts`

- [ ] **Step 1: Extend dashboard store**

Modify `src/store/dashboardStore.ts` state:

```ts
taskDependencyExpanded: Record<string, boolean>;
selectedArtifactId: string | null;
selectedRuntimeDiagnosticId: string | null;
reviewScope: 'today' | 'mission' | 'runtime';
restMode: 'normal' | 'focus' | 'muted';

setTaskDependencyExpanded: (taskId: string, expanded: boolean) => void;
setSelectedArtifactId: (artifactId: string | null) => void;
setSelectedRuntimeDiagnosticId: (diagnosticId: string | null) => void;
setReviewScope: (scope: 'today' | 'mission' | 'runtime') => void;
setRestMode: (mode: 'normal' | 'focus' | 'muted') => void;
```

Add default values:

```ts
taskDependencyExpanded: {},
selectedArtifactId: null,
selectedRuntimeDiagnosticId: null,
reviewScope: 'today',
restMode: 'normal',
```

Add actions:

```ts
setTaskDependencyExpanded: (taskId, expanded) =>
  set((state) => ({
    taskDependencyExpanded: {
      ...state.taskDependencyExpanded,
      [taskId]: expanded,
    },
  })),
setSelectedArtifactId: (selectedArtifactId) => set({ selectedArtifactId }),
setSelectedRuntimeDiagnosticId: (selectedRuntimeDiagnosticId) => set({ selectedRuntimeDiagnosticId }),
setReviewScope: (reviewScope) => set({ reviewScope }),
setRestMode: (restMode) => set({ restMode }),
```

Ensure the persisted dashboard state includes the five new fields.

- [ ] **Step 2: Calendar week labels and task links**

Modify `CalendarView.tsx`:

- Show weekday labels as `周一` through `周日`.
- Highlight today with a visible border and `今天` label.
- For any item with `taskId`, render a link button that calls `useUIStore.getState().selectTask(taskId)` and `setActiveModule('tasks')`.
- Show `计划进度` and `实际完成` when stages exist.

Required UI copy:

```ts
const WEEKDAY_LABELS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
```

- [ ] **Step 3: Tasks dependency and blocked-first ordering**

Modify `TasksView.tsx`:

- Use `orderWorkbenchTasks()` before rendering.
- Show dependency chips when a task has dependency IDs.
- Put blocked/failed/approval_required tasks visually first.
- Add a collapse area for completed tasks.
- Add `nextActionForStatus(task.status)` below blocked or approval tasks.

Example task card addition:

```tsx
{task.dependencyIds?.length > 0 && (
  <div className="flex flex-wrap gap-1 mt-2">
    {task.dependencyIds.map((depId) => (
      <span key={depId} className="text-[11px] px-2 py-0.5 rounded border border-cyber-border text-gray-400">
        依赖 {depId}
      </span>
    ))}
  </div>
)}
```

- [ ] **Step 4: Run targeted tests**

```powershell
npm.cmd run test -- src/ui/dashboard/workbenchProjection.test.ts src/ui/dashboard/workbenchTesting.test.ts
```

Expected: PASS.

- [ ] **Step 5: Browser QA**

Start:

```powershell
npm.cmd run dev
```

Verify:

- `日程` has Chinese weekday labels.
- Today's cell is visually marked.
- Stage progress still persists after refresh.
- `任务` shows blocked/approval tasks before running tasks.
- Completed tasks can be collapsed or are visually de-emphasized.
- 390px viewport has no horizontal overflow.

- [ ] **Step 6: Commit**

```powershell
git add src/store/dashboardStore.ts src/ui/dashboard/CalendarView.tsx src/ui/dashboard/TasksView.tsx
git commit -m "feat: deepen calendar and task workbench views"
```

## Task 4: Upgrade Logs and Files

**Files:**
- Modify: `src/ui/dashboard/LogsView.tsx`
- Modify: `src/ui/dashboard/FilesView.tsx`
- Modify: `src/ui/commander/ArtifactRail.tsx`
- Test: `src/ui/dashboard/workbenchTesting.test.ts`

- [ ] **Step 1: Logs filters and jump targets**

Modify `LogsView.tsx`:

- Add source filters: `全部`, `Demo`, `Commander`, `Runtime`, `用户`.
- Highlight event types:
  - `approval.requested`
  - `approval.resolved`
  - `artifact.created`
  - `runtime.adapter_error`
  - `task.failed`
- For events with `taskId`, add a button `查看任务`.
- For artifact events, add a button `查看产物`.

Required behavior:

```ts
function severityForEvent(type: string): 'normal' | 'warning' | 'success' | 'danger' {
  if (type.includes('failed') || type.includes('adapter_error')) return 'danger';
  if (type.includes('approval.requested') || type.includes('blocked')) return 'warning';
  if (type.includes('completed') || type.includes('artifact.created')) return 'success';
  return 'normal';
}
```

- [ ] **Step 2: Files artifact versions**

Modify `FilesView.tsx`:

- Read `artifacts` from `useCommanderStore`.
- Merge existing demo file items with Commander artifacts.
- Show artifact kind, originating worker, task, and created time.
- Clicking a Commander artifact selects `selectedArtifactId` in `dashboardStore`.

Render copy:

```tsx
<span className="text-xs text-gray-500">来源：Commander 产物</span>
<span className="text-xs text-cyber">关联任务：{artifact.taskId}</span>
```

- [ ] **Step 3: ArtifactRail cross-link**

Modify `ArtifactRail.tsx`:

- Add `查看文件` button.
- On click: set active module to `files` and set selected artifact id in `dashboardStore`.

Required event:

```tsx
onClick={() => {
  useUIStore.getState().setActiveModule('files');
  useDashboardStore.getState().setSelectedArtifactId(artifact.id);
}}
```

- [ ] **Step 4: Run tests and build**

```powershell
npm.cmd run test -- src/ui/dashboard/workbenchTesting.test.ts
npm.cmd run build
```

Expected: PASS and build success.

- [ ] **Step 5: Browser QA**

Verify:

- Logs filter by source without clearing selected task.
- `artifact.created` log can take user to Files.
- Files shows Commander artifacts after running guided demo.
- ArtifactRail `查看文件` moves to Files.
- Mobile Files list wraps long paths.

- [ ] **Step 6: Commit**

```powershell
git add src/ui/dashboard/LogsView.tsx src/ui/dashboard/FilesView.tsx src/ui/commander/ArtifactRail.tsx
git commit -m "feat: connect logs and files to commander artifacts"
```

## Task 5: Upgrade Cron, Gateway, Review, and Rest

**Files:**
- Modify: `src/ui/dashboard/CronJobsView.tsx`
- Modify: `src/ui/dashboard/GatewayStatus.tsx`
- Modify: `src/ui/dashboard/DailyReview.tsx`
- Modify: `src/ui/dashboard/RestView.tsx`
- Test: `src/runtime/runtimeTesting.test.ts`
- Test: `src/ui/dashboard/workbenchProjection.test.ts`

- [ ] **Step 1: Cron diagnostics**

Modify `CronJobsView.tsx`:

- Add job categories: `复盘`, `Runtime 健康检查`, `产物整理`.
- Show last run, next run, status, and retry copy.
- Failed jobs render a `查看日志` button that switches to Logs.

Required Chinese copy:

```ts
const CRON_ACTIONS = {
  retry: '下次自动重试',
  logs: '查看相关日志',
  healthy: '运行正常',
};
```

- [ ] **Step 2: Gateway Chinese diagnosis**

Modify `GatewayStatus.tsx`:

- Connected placeholder must show `占位连接，不会请求凭据`.
- Protocol mismatch must explain `当前真实适配器尚未接入 OpenClaw 服务`.
- Mock mode must explain `Mock Runtime 用于验证事件边界`.
- Raw event inspector must not expose token-like values.

Required status copy:

```ts
function gatewayAdvice(status: string): string {
  if (status === 'protocol_mismatch') return '这是受保护的占位连接。接入真实服务前不会要求输入 token。';
  if (status === 'connected') return 'Runtime 正在通过事件边界同步到办公室。';
  if (status === 'connecting') return '正在建立连接，请观察心跳和诊断。';
  return '可切换到 Mock 模式验证事件流。';
}
```

- [ ] **Step 3: Daily review context**

Modify `DailyReview.tsx`:

- Read Commander mission summary when available.
- Include Calendar completion rate.
- Include Runtime warning count.
- Generate a next-day suggestion from `summarizeReviewInputs()`.

Required review cards:

1. `今日完成`
2. `仍在阻塞`
3. `产物交付`
4. `Runtime 诊断`
5. `明日建议`

- [ ] **Step 4: Rest mode**

Modify `RestView.tsx`:

- Add segmented control: `正常`, `专注`, `静音`.
- Persist with `dashboardStore.restMode`.
- Do not write to `officeStore` task statuses.
- Show copy: `休息模式只影响界面提醒，不改变任务状态。`

- [ ] **Step 5: Run tests**

```powershell
npm.cmd run test -- src/runtime/runtimeTesting.test.ts src/ui/dashboard/workbenchProjection.test.ts
npm.cmd run test
```

Expected: all tests pass.

- [ ] **Step 6: Browser QA**

Verify:

- Cron failure state has a next action.
- Gateway Connected mode remains guarded and asks for no credentials.
- Review shows Commander summary after guided demo.
- Rest mode persists after refresh and does not alter task statuses.

- [ ] **Step 7: Commit**

```powershell
git add src/ui/dashboard/CronJobsView.tsx src/ui/dashboard/GatewayStatus.tsx src/ui/dashboard/DailyReview.tsx src/ui/dashboard/RestView.tsx src/store/dashboardStore.ts
git commit -m "feat: deepen cron gateway review and rest workbench"
```

## Task 6: Integrate Context Strip Across Workbench

**Files:**
- Modify: `src/ui/dashboard/WorkbenchHeader.tsx`
- Modify: every dashboard view that uses `WorkbenchHeader`
- Test: `src/ui/dashboard/workbenchProjection.test.ts`

- [ ] **Step 1: Build context in WorkbenchHeader**

Modify `WorkbenchHeader.tsx`:

```tsx
import { buildWorkbenchContext } from './workbenchProjection';
import { WorkbenchContextStrip } from './WorkbenchContextStrip';
import { useCommanderStore } from '@/store/commanderStore';
import { useRuntimeStore } from '@/store/runtimeStore';
import { useUIStore } from '@/store/uiStore';
import { useDashboardStore } from '@/store/dashboardStore';

export function WorkbenchHeader({ moduleId }: { moduleId: string }) {
  const selectedMissionId = useCommanderStore((state) => state.selectedMissionId);
  const mission = useCommanderStore((state) => selectedMissionId ? state.missions[selectedMissionId] : undefined);
  const approvals = useCommanderStore((state) => Object.values(state.approvals));
  const diagnostics = useRuntimeStore((state) => state.diagnostics);
  const selectedTaskId = useUIStore((state) => state.selectedTaskId);
  const selectedMissionTaskId = useUIStore((state) => state.selectedMissionTaskId);
  const selectedArtifactId = useDashboardStore((state) => state.selectedArtifactId);

  const context = buildWorkbenchContext({
    mission,
    selectedTaskId,
    selectedMissionTaskId,
    selectedArtifactId,
    approvals,
    runtimeDiagnostics: diagnostics,
  });

  return (
    <header className="workbench-header">
      {/* existing title/subtitle area remains here */}
      <WorkbenchContextStrip context={context} />
    </header>
  );
}
```

If actual store property names differ, adapt the mapping in this file only; keep `workbenchProjection.ts` pure.

- [ ] **Step 2: Ensure every Workbench page renders the header**

Check and update:

- `CalendarView`
- `TasksView`
- `LogsView`
- `FilesView`
- `CronJobsView`
- `GatewayStatus`
- `DailyReview`
- `RestView`
- `MigrationView` only if layout already supports it without clutter.

- [ ] **Step 3: Run build**

```powershell
npm.cmd run build
```

Expected: no TypeScript errors.

- [ ] **Step 4: Browser QA**

Verify:

- Context strip visible in Tasks, Logs, Files, Gateway, Review.
- Clicking context links changes modules and preserves selection.
- Strip wraps on 390px without horizontal overflow.

- [ ] **Step 5: Commit**

```powershell
git add src/ui/dashboard
git commit -m "feat: add workbench context strip across modules"
```

## Task 7: Documentation and Final Verification

**Files:**
- Modify: `docs/superpowers/specs/2026-05-23-video-replication-optimization-requirements.md`
- Optionally modify: `docs/migration/README.md`

- [ ] **Step 1: Update implementation status**

Append under `## Implementation Status`:

```md
- Plan 09 `Workbench Deep Fidelity`: **implemented and verified** (2026-05-23).
- Workbench modules now share a Commander-aware context strip, deeper Calendar/Tasks/Logs/Files/Cron/Gateway/Review/Rest projections, artifact cross-links, Runtime diagnosis copy, and mobile-safe layout improvements.
```

- [ ] **Step 2: Run full verification**

```powershell
npm.cmd run test
npm.cmd run build
```

Expected:

- All Vitest files pass.
- TypeScript succeeds.
- Vite build succeeds.
- Large chunk warning may remain; it belongs to Plan 11.

- [ ] **Step 3: Browser QA checklist**

Run:

```powershell
npm.cmd run dev
```

Desktop 1366x768:

- Guided demo runs.
- Workbench transitions keep HUD and DemoControls visible.
- Calendar stage progress persists.
- Tasks show blocked/approval first.
- Logs can jump to task/file.
- Files show Commander artifacts.
- Gateway mock/connected copy is understandable.
- Review summarizes Commander and Runtime state.
- Rest mode persists.

Mobile 390x844:

- No horizontal overflow in all Workbench modules.
- Context strip wraps.
- Bottom demo controls remain clickable.
- Long file paths wrap.

- [ ] **Step 4: Commit**

```powershell
git add docs/superpowers/specs/2026-05-23-video-replication-optimization-requirements.md docs/migration/README.md
git commit -m "docs: mark workbench deep fidelity plan status"
```

## Final Acceptance

Plan 09 is complete when:

1. Workbench modules feel like one connected work system rather than separate panels.
2. Calendar, Tasks, Logs, Files, Gateway, Review, and Rest all expose Chinese, task-aware context.
3. Commander mission tasks, artifacts, approvals, and Runtime diagnostics are visible in relevant Workbench views.
4. A user can jump between task, log, file, and review context without losing selection.
5. 390px mobile layout has no horizontal overflow.
6. `npm.cmd run test` passes.
7. `npm.cmd run build` succeeds.
