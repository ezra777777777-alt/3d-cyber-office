# Workbench Fidelity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the current dashboard stubs into a video-faithful AI workbench with week planning, task-source views, searchable logs, file preview, cron run summaries, runtime diagnostics, daily review links, and a lightweight Rest/Fun surface.

**Architecture:** Keep the dashboard layer local and demo-capable while expanding shared dashboard domain data before UI modules branch. Use a persisted Zustand dashboard store for mutable local workbench state, derive selection jumps through existing Office/UI stores, and keep all runtime-specific diagnostics as modeled demo/runtime records so the later Runtime Adapter plan can replace data sources without rewriting page composition.

**Tech Stack:** React 18, TypeScript, Vite, Zustand, Tailwind CSS utility classes, Vitest, Browser/Playwright UI QA.

---

## File Structure

### Files to create

| File | Responsibility |
| --- | --- |
| `src/ui/dashboard/TasksView.tsx` | Source-aware task list with status filters and Office task links. |
| `src/ui/dashboard/RestView.tsx` | Lightweight quiet-garden/daily-surprise workbench module. |
| `src/ui/dashboard/WorkbenchHeader.tsx` | Shared title, source badge, and compact module summary treatment. |
| `src/ui/dashboard/FilePreview.tsx` | File metadata and Markdown/text preview shell. |
| `src/ui/dashboard/GatewayDiagnostics.tsx` | Structured runtime issue list and remediation cues. |
| `src/ui/dashboard/workbenchTesting.ts` | Pure workbench helpers for filters, file trees, cron sorting, and calendar week derivation. |
| `src/ui/dashboard/workbenchTesting.test.ts` | Focused tests for dashboard domain helpers. |

### Files to modify

| File | Responsibility of change |
| --- | --- |
| `src/core/types.ts` | Expand calendar, file, cron, gateway, review, and workbench task types. |
| `src/data/demoSchedules.ts` | Seed richer workbench demo data: weekly calendar items, source-aware tasks, file previews, cron runs, diagnostics, review links, rest cards. |
| `src/store/dashboardStore.ts` | Persist mutable calendar/tasks/rest preferences and expose file selection/filter actions. |
| `src/store/uiStore.ts` | Extend `activeModule` IDs for Tasks and Rest while keeping persisted module selection valid. |
| `src/ui/Navigation.tsx` | Add Tasks and Rest/Fun module entries without clearing selected Agent/Task context. |
| `src/ui/AppShell.tsx` | Route Tasks and Rest modules and keep existing SidePanel behavior. |
| `src/ui/dashboard/CalendarView.tsx` | Upgrade list layout into week planning + learning-plan surface using shared helpers. |
| `src/ui/dashboard/LogsView.tsx` | Add text/type/severity filters and richer event-source labels. |
| `src/ui/dashboard/FilesView.tsx` | Render workspace list/tree/preview/artifact relations instead of a flat demo file list. |
| `src/ui/dashboard/CronJobsView.tsx` | Render sort/filter/run summaries and link jobs back to Agent/Task context. |
| `src/ui/dashboard/GatewayStatus.tsx` | Render diagnostic runtime states and protocol mismatch/device/token hints. |
| `src/ui/dashboard/DailyReview.tsx` | Add date/source summaries and related Task/Artifact link zones. |
| `src/index.css` | Add only shared workbench layout classes needed for dense responsive panels. |

## Scope Guard

This plan implements the workbench layer from the full requirements spec:

- Navigation for `Calendar / Plan`, `Tasks`, `Logs / Events`, `Files`, `Cron`, `Gateway / Runtime`, `Review / Evolution`, and `Rest / Fun`.
- Calendar stage/progress behavior already present in the repo, upgraded into a week planning surface.
- File preview shell and demo provenance labels.
- Cron run summary and runtime diagnostic surfaces.
- Rest/Fun first workbench slice.

This plan does not add real Google Tasks sync, real filesystem reading, real OpenClaw gateway protocol code, Commander planning, or migration export.

## Task 1: Define Workbench Data Shapes and Helper Tests

**Files:**
- Create: `src/ui/dashboard/workbenchTesting.ts`
- Create: `src/ui/dashboard/workbenchTesting.test.ts`
- Modify: `src/core/types.ts`
- Modify: `src/data/demoSchedules.ts`
- Modify: `src/store/dashboardStore.ts`
- Modify: `package.json`

- [ ] **Step 1: Add Vitest test command if Task 1 of the Office plan has not already done it**

If `package.json` does not already contain Vitest, add:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "test": "vitest run"
  },
  "devDependencies": {
    "vitest": "^4.0.18"
  }
}
```

Run:

```powershell
npm install
```

Expected: package dependencies install and `npm run test -- --help` resolves the Vitest script.

- [ ] **Step 2: Write failing helper tests for the workbench data seam**

Create `src/ui/dashboard/workbenchTesting.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { demoCronJobs, demoFiles, demoSchedule, demoWorkbenchTasks } from '@/data/demoSchedules';
import {
  buildFileTree,
  filterWorkbenchTasks,
  getWeekColumns,
  sortCronJobsByNextRun,
} from './workbenchTesting';

describe('workbench helpers', () => {
  it('groups calendar items into seven week columns', () => {
    expect(getWeekColumns(demoSchedule, '2026-05-19')).toHaveLength(7);
  });

  it('filters source-aware tasks by status and source', () => {
    expect(filterWorkbenchTasks(demoWorkbenchTasks, 'blocked', 'runtime').map((task) => task.id)).toEqual([
      'wb-task-runtime-review',
    ]);
  });

  it('builds a workspace tree from file paths', () => {
    expect(buildFileTree(demoFiles)[0]).toMatchObject({ name: 'workspace', kind: 'folder' });
  });

  it('sorts cron jobs by upcoming run time', () => {
    expect(sortCronJobsByNextRun(demoCronJobs)[0]?.id).toBe('cron-2');
  });
});
```

- [ ] **Step 3: Run the focused test to verify it fails**

Run:

```powershell
npm run test -- src/ui/dashboard/workbenchTesting.test.ts
```

Expected: FAIL because helper functions and richer workbench task data do not exist yet.

- [ ] **Step 4: Expand dashboard types**

Update `src/core/types.ts` with these type additions or equivalent compatible extensions:

```ts
export type WorkbenchSource = 'demo' | 'local' | 'runtime' | 'cron' | 'google_tasks';

export interface CalendarItem {
  id: string;
  title: string;
  date: string;
  time: string;
  taskId: string | null;
  agentId?: string | null;
  source?: WorkbenchSource;
  type: 'meeting' | 'task' | 'plan' | 'review' | 'cron';
  progress?: number;
  stages?: PlanStage[];
  completed?: boolean;
}

export interface WorkbenchTask {
  id: string;
  title: string;
  status: 'today' | 'todo' | 'running' | 'blocked' | 'completed';
  source: WorkbenchSource;
  officeTaskId: string | null;
  agentId: string | null;
  dueLabel: string;
  priority: 'low' | 'medium' | 'high';
  summary: string;
}

export interface FileRecord {
  id: string;
  name: string;
  sourceTaskId: string | null;
  sourceAgentId?: string | null;
  source: WorkbenchSource;
  updatedAt: string;
  path: string;
  size: string;
  kind: 'folder' | 'markdown' | 'text' | 'json' | 'config';
  preview?: string;
}

export interface CronRunSummary {
  id: string;
  startedAt: string;
  durationMs: number;
  result: 'success' | 'failed' | 'running' | 'pending';
  taskId: string | null;
  message: string;
}

export interface CronJob {
  id: string;
  name: string;
  schedule: string;
  enabled: boolean;
  lastResult: 'success' | 'failed' | 'running' | 'pending';
  nextRun: string;
  agentId: string | null;
  linkedTaskId?: string | null;
  runs: CronRunSummary[];
}

export interface GatewayDiagnostic {
  id: string;
  kind: 'token_missing' | 'device_approval' | 'protocol_mismatch' | 'disconnect' | 'healthy';
  severity: 'info' | 'warn' | 'error' | 'success';
  title: string;
  detail: string;
}

export interface GatewayInfo {
  id: string;
  name: string;
  source: WorkbenchSource;
  status: 'connected' | 'connecting' | 'disconnected' | 'error' | 'protocol_mismatch';
  protocol: string;
  lastHeartbeat: string;
  message: string;
  diagnostics: GatewayDiagnostic[];
}

export interface ReviewCard {
  id: string;
  date: string;
  source: 'demo' | 'system' | 'user';
  completed: string;
  shortcomings: string;
  suggestions: string;
  relatedTaskIds: string[];
  relatedFileIds: string[];
}

export interface RestCard {
  id: string;
  title: string;
  kind: 'quiet_garden' | 'sound_space' | 'daily_surprise';
  summary: string;
  accent: string;
}
```

- [ ] **Step 5: Seed richer demo data**

Update `src/data/demoSchedules.ts` so:

- Every `CalendarItem` has a `date`, `source`, and optional `agentId`.
- `demoWorkbenchTasks` includes at least:

```ts
export const demoWorkbenchTasks: WorkbenchTask[] = [
  {
    id: 'wb-task-google-plan',
    title: '整理今日任务清单',
    status: 'today',
    source: 'google_tasks',
    officeTaskId: 'task-001',
    agentId: 'agent-writer',
    dueLabel: 'Today 10:00',
    priority: 'high',
    summary: 'External task mirror for the office workbench.',
  },
  {
    id: 'wb-task-runtime-review',
    title: '夜间 Review 等待审批',
    status: 'blocked',
    source: 'runtime',
    officeTaskId: 'task-003',
    agentId: 'agent-analyst',
    dueLabel: 'Blocked',
    priority: 'high',
    summary: 'A runtime task waiting for approval before continuing.',
  },
];
```

- Each demo file has `source`, `kind`, and `preview`.
- Each cron job has `enabled`, `linkedTaskId`, and one or more `runs`.
- `demoGateways` includes one healthy runtime and one `protocol_mismatch` record with diagnostics.
- `demoReviews` has `source` and `relatedFileIds`.
- `demoRestCards` includes Quiet Garden, Sound Space, and Daily Surprise.

- [ ] **Step 6: Create pure workbench helpers**

Create `src/ui/dashboard/workbenchTesting.ts`:

```ts
import type { CalendarItem, CronJob, FileRecord, WorkbenchTask } from '@/core/types';

export interface CalendarDayColumn {
  date: string;
  items: CalendarItem[];
}

export interface FileTreeNode {
  id: string;
  name: string;
  kind: 'folder' | 'file';
  fileId?: string;
  children: FileTreeNode[];
}

export function getWeekColumns(items: CalendarItem[], weekStartDate: string): CalendarDayColumn[] {
  const start = new Date(`${weekStartDate}T00:00:00`);
  return Array.from({ length: 7 }, (_, index) => {
    const next = new Date(start);
    next.setDate(start.getDate() + index);
    const date = next.toISOString().slice(0, 10);
    return { date, items: items.filter((item) => item.date === date) };
  });
}

export function filterWorkbenchTasks(
  tasks: WorkbenchTask[],
  status: WorkbenchTask['status'] | 'all',
  source: WorkbenchTask['source'] | 'all',
): WorkbenchTask[] {
  return tasks.filter((task) => (status === 'all' || task.status === status) && (source === 'all' || task.source === source));
}

export function sortCronJobsByNextRun(jobs: CronJob[]): CronJob[] {
  return [...jobs].sort((a, b) => new Date(a.nextRun).getTime() - new Date(b.nextRun).getTime());
}

export function buildFileTree(files: FileRecord[]): FileTreeNode[] {
  const root: FileTreeNode = { id: 'workspace', name: 'workspace', kind: 'folder', children: [] };

  for (const file of files) {
    const segments = file.path.split('/').filter(Boolean);
    let cursor = root;

    for (const segment of segments) {
      let next = cursor.children.find((child) => child.kind === 'folder' && child.name === segment);
      if (!next) {
        next = { id: `${cursor.id}/${segment}`, name: segment, kind: 'folder', children: [] };
        cursor.children.push(next);
      }
      cursor = next;
    }

    cursor.children.push({ id: file.id, name: file.name, kind: 'file', fileId: file.id, children: [] });
  }

  return [root];
}
```

- [ ] **Step 7: Extend dashboard store without mixing runtime secrets**

Update `src/store/dashboardStore.ts` to:

- Persist `calendarItems`.
- Store `workbenchTasks`.
- Store `selectedFileId`.
- Store `restMuted`.
- Provide `setSelectedFile`, `setTaskStatusFilter`, `setTaskSourceFilter`, and `toggleRestMuted`.

Use this state shape:

```ts
interface DashboardState {
  calendarItems: CalendarItem[];
  workbenchTasks: WorkbenchTask[];
  selectedFileId: string | null;
  taskStatusFilter: WorkbenchTask['status'] | 'all';
  taskSourceFilter: WorkbenchTask['source'] | 'all';
  restMuted: boolean;
  toggleStage: (itemId: string, stageIdx: number) => void;
  markComplete: (itemId: string) => void;
  resetCalendar: () => void;
  setSelectedFile: (fileId: string | null) => void;
  setTaskStatusFilter: (filter: WorkbenchTask['status'] | 'all') => void;
  setTaskSourceFilter: (filter: WorkbenchTask['source'] | 'all') => void;
  toggleRestMuted: () => void;
}
```

Persist only this local dashboard state; do not persist gateway tokens or future filesystem payloads.

- [ ] **Step 8: Run focused tests and build**

Run:

```powershell
npm run test -- src/ui/dashboard/workbenchTesting.test.ts
npm run build
```

Expected: PASS after all current type errors from richer demo data are fixed.

- [ ] **Step 9: Commit**

```powershell
git add package.json package-lock.json src/core/types.ts src/data/demoSchedules.ts src/store/dashboardStore.ts src/ui/dashboard/workbenchTesting.ts src/ui/dashboard/workbenchTesting.test.ts
git commit -m "feat: define workbench dashboard models"
```

## Task 2: Add Tasks and Rest Modules to the Workbench Shell

**Files:**
- Create: `src/ui/dashboard/TasksView.tsx`
- Create: `src/ui/dashboard/RestView.tsx`
- Create: `src/ui/dashboard/WorkbenchHeader.tsx`
- Modify: `src/store/uiStore.ts`
- Modify: `src/ui/Navigation.tsx`
- Modify: `src/ui/AppShell.tsx`
- Modify: `src/index.css`

- [ ] **Step 1: Add failing filter assertions for Tasks chips**

Extend `src/ui/dashboard/workbenchTesting.test.ts`:

```ts
it('keeps completed task cards out of running filters', () => {
  expect(filterWorkbenchTasks(demoWorkbenchTasks, 'running', 'all').every((task) => task.status === 'running')).toBe(true);
});
```

- [ ] **Step 2: Run the focused helper test**

Run:

```powershell
npm run test -- src/ui/dashboard/workbenchTesting.test.ts
```

Expected: PASS if Task 1 filter helper is correct. Keep it as regression coverage while adding the UI.

- [ ] **Step 3: Add shared workbench header**

Create `src/ui/dashboard/WorkbenchHeader.tsx`:

```tsx
import type { ReactNode } from 'react';
import type { WorkbenchSource } from '@/core/types';

const SOURCE_LABELS: Record<WorkbenchSource, string> = {
  demo: 'Demo',
  local: 'Local',
  runtime: 'Runtime',
  cron: 'Cron',
  google_tasks: 'Google Tasks',
};

export function SourceBadge({ source }: { source: WorkbenchSource }) {
  return (
    <span className="rounded border border-cyber-border bg-cyber-panel px-2 py-0.5 text-[11px] text-gray-300">
      {SOURCE_LABELS[source]}
    </span>
  );
}

export function WorkbenchHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle: string;
  actions?: ReactNode;
}) {
  return (
    <header className="workbench-header">
      <div>
        <h2 className="text-lg font-semibold text-cyber-accent">{title}</h2>
        <p className="text-xs text-gray-500">{subtitle}</p>
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}
```

- [ ] **Step 4: Extend UI module IDs**

Update `src/store/uiStore.ts` so `activeModule` supports:

```ts
type ModuleId = 'office' | 'calendar' | 'tasks' | 'logs' | 'files' | 'cronjobs' | 'gateway' | 'review' | 'rest';
```

Keep existing Zustand persistence behavior and default module fallback working for older persisted values.

- [ ] **Step 5: Add navigation entries**

Update `src/ui/Navigation.tsx`:

```ts
const MODULES = [
  { id: 'office', label: 'Office' },
  { id: 'calendar', label: 'Calendar' },
  { id: 'tasks', label: 'Tasks' },
  { id: 'logs', label: 'Logs' },
  { id: 'files', label: 'Files' },
  { id: 'cronjobs', label: 'Cron Jobs' },
  { id: 'gateway', label: 'Gateway' },
  { id: 'review', label: 'Review' },
  { id: 'rest', label: 'Rest' },
] as const;
```

Do not reintroduce `clearSelection()` on module change.

- [ ] **Step 6: Build Tasks view**

Create `src/ui/dashboard/TasksView.tsx`:

```tsx
import { useDashboardStore } from '@/store/dashboardStore';
import { useOfficeStore } from '@/store/officeStore';
import { useUIStore } from '@/store/uiStore';
import { filterWorkbenchTasks } from './workbenchTesting';
import { SourceBadge, WorkbenchHeader } from './WorkbenchHeader';

const STATUS_FILTERS = ['all', 'today', 'todo', 'running', 'blocked', 'completed'] as const;
const SOURCE_FILTERS = ['all', 'demo', 'local', 'runtime', 'cron', 'google_tasks'] as const;

export function TasksView() {
  const tasks = useDashboardStore((state) => state.workbenchTasks);
  const statusFilter = useDashboardStore((state) => state.taskStatusFilter);
  const sourceFilter = useDashboardStore((state) => state.taskSourceFilter);
  const setStatusFilter = useDashboardStore((state) => state.setTaskStatusFilter);
  const setSourceFilter = useDashboardStore((state) => state.setTaskSourceFilter);
  const selectTask = useUIStore((state) => state.selectTask);
  const selectAgent = useUIStore((state) => state.selectAgent);
  const getTask = useOfficeStore((state) => state.getTask);
  const filtered = filterWorkbenchTasks(tasks, statusFilter, sourceFilter);

  return (
    <div className="workbench-page">
      <WorkbenchHeader title="Tasks" subtitle="External lists and office tasks share one workbench view." />
      <div className="workbench-filter-row">
        {STATUS_FILTERS.map((filter) => (
          <button key={filter} className={statusFilter === filter ? 'cyber-btn text-xs' : 'workbench-chip'} onClick={() => setStatusFilter(filter)}>
            {filter}
          </button>
        ))}
      </div>
      <div className="workbench-filter-row">
        {SOURCE_FILTERS.map((filter) => (
          <button key={filter} className={sourceFilter === filter ? 'cyber-btn text-xs' : 'workbench-chip'} onClick={() => setSourceFilter(filter)}>
            {filter.replace('_', ' ')}
          </button>
        ))}
      </div>
      <div className="grid gap-3">
        {filtered.map((task) => {
          const officeTask = task.officeTaskId ? getTask(task.officeTaskId) : undefined;
          return (
            <article key={task.id} className="cyber-panel p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h3 className="text-sm font-medium text-white">{task.title}</h3>
                  <p className="mt-1 text-xs text-gray-500">{task.summary}</p>
                </div>
                <SourceBadge source={task.source} />
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-gray-400">
                <span>{task.status}</span>
                <span>{task.priority}</span>
                <span>{task.dueLabel}</span>
                {officeTask ? <button className="cyber-btn text-xs" onClick={() => selectTask(officeTask.id)}>Task detail</button> : null}
                {task.agentId ? <button className="cyber-btn text-xs" onClick={() => selectAgent(task.agentId!)}>Agent</button> : null}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 7: Build Rest view**

Create `src/ui/dashboard/RestView.tsx`:

```tsx
import { demoRestCards } from '@/data/demoSchedules';
import { useDashboardStore } from '@/store/dashboardStore';
import { WorkbenchHeader } from './WorkbenchHeader';

export function RestView() {
  const restMuted = useDashboardStore((state) => state.restMuted);
  const toggleRestMuted = useDashboardStore((state) => state.toggleRestMuted);

  return (
    <div className="workbench-page">
      <WorkbenchHeader
        title="Quiet Garden"
        subtitle="Rest, sound, and daily-surprise slices for idle agents."
        actions={<button className="cyber-btn text-xs" onClick={toggleRestMuted}>{restMuted ? 'Unmute' : 'Mute'}</button>}
      />
      <div className="grid gap-3 md:grid-cols-3">
        {demoRestCards.map((card) => (
          <article key={card.id} className="cyber-panel p-4">
            <div className="mb-2 h-1 rounded" style={{ backgroundColor: card.accent }} />
            <h3 className="text-sm font-medium text-white">{card.title}</h3>
            <p className="mt-2 text-xs leading-5 text-gray-400">{card.summary}</p>
            <div className="mt-3 text-[11px] uppercase tracking-wide text-gray-500">{card.kind.replace('_', ' ')}</div>
          </article>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 8: Route the new views**

Update `src/ui/AppShell.tsx` imports and module branch:

```tsx
import { TasksView } from './dashboard/TasksView';
import { RestView } from './dashboard/RestView';
```

Add branches:

```tsx
activeModule === 'tasks' ? (
  <TasksView />
) : activeModule === 'rest' ? (
  <RestView />
)
```

Keep the existing Office bottom HUD visible only in Office mode.

- [ ] **Step 9: Add compact workbench shell classes**

Update `src/index.css`:

```css
.workbench-page {
  height: 100%;
  overflow-y: auto;
  padding: 1.5rem;
}

.workbench-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.workbench-filter-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.workbench-chip {
  border: 1px solid transparent;
  border-radius: 0.375rem;
  padding: 0.25rem 0.75rem;
  color: rgb(156 163 175);
  font-size: 0.75rem;
  text-transform: capitalize;
}

.workbench-chip:hover {
  border-color: rgb(255 255 255 / 0.08);
  background: rgb(255 255 255 / 0.05);
  color: white;
}
```

- [ ] **Step 10: Run focused tests and build**

Run:

```powershell
npm run test -- src/ui/dashboard/workbenchTesting.test.ts
npm run build
```

Expected: PASS.

- [ ] **Step 11: Commit**

```powershell
git add src/store/uiStore.ts src/ui/Navigation.tsx src/ui/AppShell.tsx src/ui/dashboard/WorkbenchHeader.tsx src/ui/dashboard/TasksView.tsx src/ui/dashboard/RestView.tsx src/index.css src/ui/dashboard/workbenchTesting.test.ts
git commit -m "feat: add tasks and rest workbench modules"
```

## Task 3: Upgrade Calendar Into a Week Planning Surface

**Files:**
- Modify: `src/ui/dashboard/CalendarView.tsx`
- Modify: `src/store/dashboardStore.ts`
- Modify: `src/data/demoSchedules.ts`
- Modify: `src/ui/dashboard/workbenchTesting.ts`
- Modify: `src/ui/dashboard/workbenchTesting.test.ts`

- [ ] **Step 1: Add failing week-navigation helper coverage**

Extend `src/ui/dashboard/workbenchTesting.ts` with a date helper signature in the test first:

```ts
import { shiftWeekStart } from './workbenchTesting';

it('shifts the calendar week by whole weeks', () => {
  expect(shiftWeekStart('2026-05-19', 1)).toBe('2026-05-26');
  expect(shiftWeekStart('2026-05-19', -1)).toBe('2026-05-12');
});
```

- [ ] **Step 2: Run focused test to verify it fails**

Run:

```powershell
npm run test -- src/ui/dashboard/workbenchTesting.test.ts
```

Expected: FAIL because `shiftWeekStart` is not implemented yet.

- [ ] **Step 3: Implement week shifting**

Add to `src/ui/dashboard/workbenchTesting.ts`:

```ts
export function shiftWeekStart(weekStartDate: string, weeks: number): string {
  const date = new Date(`${weekStartDate}T00:00:00`);
  date.setDate(date.getDate() + weeks * 7);
  return date.toISOString().slice(0, 10);
}
```

- [ ] **Step 4: Add persisted current week state**

Update `src/store/dashboardStore.ts` with:

```ts
calendarWeekStart: string;
setCalendarWeekStart: (weekStart: string) => void;
```

Initialize it to `'2026-05-19'` for the demo fixture unless a persisted local value exists.

- [ ] **Step 5: Recompose CalendarView**

Update `src/ui/dashboard/CalendarView.tsx` so it:

- Uses `WorkbenchHeader`.
- Uses `getWeekColumns(items, calendarWeekStart)`.
- Renders Previous Week and Next Week buttons using `shiftWeekStart`.
- Renders seven date columns on desktop and stacked day sections on narrow screens.
- Keeps the existing progress bar, stage toggles, Mark Complete event dispatch, and Task/Agent selection behavior.
- Separates `Plan` items with stages into a visible learning-plan panel below or beside the week grid.

Keep the current `handleComplete` and `handleStage` event dispatch payload semantics.

- [ ] **Step 6: Add demo data across the demo week**

Update `src/data/demoSchedules.ts` so items span several dates in the week beginning `2026-05-19`. Include:

- Daily standup/review.
- A learning plan with stages.
- A completed task.
- A cron-generated schedule item.
- A review item.

- [ ] **Step 7: Run focused tests and build**

Run:

```powershell
npm run test -- src/ui/dashboard/workbenchTesting.test.ts
npm run build
```

Expected: PASS.

- [ ] **Step 8: Commit**

```powershell
git add src/ui/dashboard/CalendarView.tsx src/store/dashboardStore.ts src/data/demoSchedules.ts src/ui/dashboard/workbenchTesting.ts src/ui/dashboard/workbenchTesting.test.ts
git commit -m "feat: expand calendar workbench planning"
```

## Task 4: Upgrade Logs and Files for Searchable Workbench Inspection

**Files:**
- Create: `src/ui/dashboard/FilePreview.tsx`
- Modify: `src/ui/dashboard/LogsView.tsx`
- Modify: `src/ui/dashboard/FilesView.tsx`
- Modify: `src/ui/dashboard/workbenchTesting.ts`
- Modify: `src/ui/dashboard/workbenchTesting.test.ts`
- Modify: `src/store/dashboardStore.ts`

- [ ] **Step 1: Add failing log and file helper tests**

Extend `src/ui/dashboard/workbenchTesting.test.ts`:

```ts
import { filterEventRows, findFileRecord } from './workbenchTesting';

it('finds the selected file record for preview', () => {
  expect(findFileRecord(demoFiles, 'file-1')?.kind).toBe('markdown');
});

it('filters event rows by query and level', () => {
  const rows = [
    { id: 'evt-1', type: 'task.completed', message: 'finished spec', level: 'success' as const },
    { id: 'evt-2', type: 'task.blocked', message: 'approval needed', level: 'error' as const },
  ];
  expect(filterEventRows(rows, 'approval', 'error').map((row) => row.id)).toEqual(['evt-2']);
});
```

- [ ] **Step 2: Run focused test to verify it fails**

Run:

```powershell
npm run test -- src/ui/dashboard/workbenchTesting.test.ts
```

Expected: FAIL because `findFileRecord` and `filterEventRows` do not exist yet.

- [ ] **Step 3: Add helper functions**

Update `src/ui/dashboard/workbenchTesting.ts`:

```ts
export type EventRowLevel = 'info' | 'warn' | 'error' | 'success';

export interface EventRowSearchItem {
  id: string;
  type: string;
  message: string;
  level: EventRowLevel;
}

export function findFileRecord(files: FileRecord[], fileId: string | null): FileRecord | undefined {
  return files.find((file) => file.id === fileId);
}

export function filterEventRows(
  rows: EventRowSearchItem[],
  query: string,
  level: EventRowLevel | 'all',
): EventRowSearchItem[] {
  const normalized = query.trim().toLowerCase();
  return rows.filter((row) => {
    const matchesLevel = level === 'all' || row.level === level;
    const matchesQuery = !normalized || `${row.type} ${row.message}`.toLowerCase().includes(normalized);
    return matchesLevel && matchesQuery;
  });
}
```

- [ ] **Step 4: Recompose LogsView**

Update `src/ui/dashboard/LogsView.tsx` so it:

- Uses `WorkbenchHeader`.
- Keeps severity filter behavior.
- Adds a search input.
- Adds event-type source labels for user action, task event, approval/tool/runtime events when present.
- Uses a searchable row projection with `filterEventRows`.
- Keeps Task/Agent selection on row click.

Use this input shape:

```tsx
<input
  value={query}
  onChange={(event) => setQuery(event.target.value)}
  placeholder="Search task, approval, tool, runtime..."
  className="min-w-[220px] flex-1 rounded border border-cyber-border bg-cyber-dark px-3 py-1.5 text-xs text-white outline-none focus:border-cyber-accent/50"
/>
```

- [ ] **Step 5: Create FilePreview**

Create `src/ui/dashboard/FilePreview.tsx`:

```tsx
import type { FileRecord } from '@/core/types';
import { SourceBadge } from './WorkbenchHeader';

export function FilePreview({ file }: { file: FileRecord | undefined }) {
  if (!file) {
    return <div className="cyber-panel p-4 text-sm text-gray-500">Select a file to preview its workbench artifact.</div>;
  }

  return (
    <section className="cyber-panel min-h-[280px] p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-medium text-white">{file.name}</h3>
          <p className="mt-1 text-xs text-gray-500">{file.path}</p>
        </div>
        <SourceBadge source={file.source} />
      </div>
      <div className="mt-4 rounded border border-cyber-border bg-cyber-dark/70 p-3 text-xs leading-6 text-gray-300 whitespace-pre-wrap">
        {file.preview || 'Preview unavailable for this file type.'}
      </div>
    </section>
  );
}
```

- [ ] **Step 6: Recompose FilesView**

Update `src/ui/dashboard/FilesView.tsx` so it:

- Uses `buildFileTree(demoFiles)`.
- Shows workspace tree/list in the left column.
- Uses `selectedFileId` and `setSelectedFile` from `dashboardStore`.
- Renders `FilePreview`.
- Shows file provenance: source Task, source Agent if available, source badge.
- Keeps selecting linked Office tasks from file rows or provenance buttons.

The preview must render demo Markdown/text from the `preview` field rather than attempting direct filesystem reads in this plan.

- [ ] **Step 7: Run focused tests and build**

Run:

```powershell
npm run test -- src/ui/dashboard/workbenchTesting.test.ts
npm run build
```

Expected: PASS.

- [ ] **Step 8: Commit**

```powershell
git add src/ui/dashboard/LogsView.tsx src/ui/dashboard/FilesView.tsx src/ui/dashboard/FilePreview.tsx src/ui/dashboard/workbenchTesting.ts src/ui/dashboard/workbenchTesting.test.ts src/store/dashboardStore.ts
git commit -m "feat: deepen logs and files workbench"
```

## Task 5: Upgrade Cron and Gateway Diagnostics

**Files:**
- Create: `src/ui/dashboard/GatewayDiagnostics.tsx`
- Modify: `src/ui/dashboard/CronJobsView.tsx`
- Modify: `src/ui/dashboard/GatewayStatus.tsx`
- Modify: `src/ui/dashboard/workbenchTesting.ts`
- Modify: `src/ui/dashboard/workbenchTesting.test.ts`

- [ ] **Step 1: Add failing cron filter coverage**

Extend `src/ui/dashboard/workbenchTesting.test.ts`:

```ts
import { filterCronJobs } from './workbenchTesting';

it('filters failing cron jobs without losing next-run ordering', () => {
  expect(filterCronJobs(demoCronJobs, 'failed').map((job) => job.lastResult)).toEqual(['failed']);
});
```

- [ ] **Step 2: Run focused test to verify it fails**

Run:

```powershell
npm run test -- src/ui/dashboard/workbenchTesting.test.ts
```

Expected: FAIL because `filterCronJobs` does not exist yet.

- [ ] **Step 3: Implement cron filter helper**

Add to `src/ui/dashboard/workbenchTesting.ts`:

```ts
export function filterCronJobs(
  jobs: CronJob[],
  result: CronJob['lastResult'] | 'all',
): CronJob[] {
  return sortCronJobsByNextRun(jobs).filter((job) => result === 'all' || job.lastResult === result);
}
```

- [ ] **Step 4: Recompose CronJobsView**

Update `src/ui/dashboard/CronJobsView.tsx` so it:

- Uses `WorkbenchHeader`.
- Adds filter chips for `all`, `success`, `failed`, `running`, `pending`.
- Uses sorted/filtered jobs.
- Shows `enabled`, `schedule`, `nextRun`, last result, and recent `runs`.
- Links Agent and linked Task through existing UI store selection.

- [ ] **Step 5: Create GatewayDiagnostics**

Create `src/ui/dashboard/GatewayDiagnostics.tsx`:

```tsx
import type { GatewayDiagnostic } from '@/core/types';

const SEVERITY_CLASS: Record<GatewayDiagnostic['severity'], string> = {
  info: 'border-cyber-border text-gray-300',
  warn: 'border-cyber-warning/40 text-cyber-warning',
  error: 'border-cyber-error/40 text-cyber-error',
  success: 'border-cyber-success/40 text-cyber-success',
};

export function GatewayDiagnostics({ diagnostics }: { diagnostics: GatewayDiagnostic[] }) {
  return (
    <div className="mt-3 grid gap-2">
      {diagnostics.map((diagnostic) => (
        <div key={diagnostic.id} className={`rounded border p-3 ${SEVERITY_CLASS[diagnostic.severity]}`}>
          <div className="text-xs font-medium">{diagnostic.title}</div>
          <p className="mt-1 text-xs leading-5 text-gray-400">{diagnostic.detail}</p>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 6: Recompose GatewayStatus**

Update `src/ui/dashboard/GatewayStatus.tsx` so it:

- Uses `WorkbenchHeader`.
- Shows runtime `source`, `protocol`, `status`, `lastHeartbeat`, and message.
- Renders `GatewayDiagnostics`.
- Has visual treatment for `protocol_mismatch`, `device_approval`, `token_missing`, healthy, and disconnect diagnostics.
- Does not render raw tokens.

- [ ] **Step 7: Run focused tests and build**

Run:

```powershell
npm run test -- src/ui/dashboard/workbenchTesting.test.ts
npm run build
```

Expected: PASS.

- [ ] **Step 8: Commit**

```powershell
git add src/ui/dashboard/CronJobsView.tsx src/ui/dashboard/GatewayStatus.tsx src/ui/dashboard/GatewayDiagnostics.tsx src/ui/dashboard/workbenchTesting.ts src/ui/dashboard/workbenchTesting.test.ts
git commit -m "feat: add cron and gateway diagnostics"
```

## Task 6: Link Daily Review Back to Workbench Evidence

**Files:**
- Modify: `src/ui/dashboard/DailyReview.tsx`
- Modify: `src/data/demoSchedules.ts`
- Modify: `src/ui/dashboard/workbenchTesting.ts`
- Modify: `src/ui/dashboard/workbenchTesting.test.ts`

- [ ] **Step 1: Add failing review-source helper coverage**

Extend `src/ui/dashboard/workbenchTesting.test.ts`:

```ts
import { getLatestReview } from './workbenchTesting';
import { demoReviews } from '@/data/demoSchedules';

it('selects the latest review card by date', () => {
  expect(getLatestReview(demoReviews)?.id).toBe('review-1');
});
```

- [ ] **Step 2: Run focused test to verify it fails**

Run:

```powershell
npm run test -- src/ui/dashboard/workbenchTesting.test.ts
```

Expected: FAIL because `getLatestReview` does not exist yet.

- [ ] **Step 3: Implement latest review helper**

Add to `src/ui/dashboard/workbenchTesting.ts`:

```ts
import type { ReviewCard } from '@/core/types';

export function getLatestReview(reviews: ReviewCard[]): ReviewCard | undefined {
  return [...reviews].sort((a, b) => b.date.localeCompare(a.date))[0];
}
```

- [ ] **Step 4: Expand demo review evidence**

Update `src/data/demoSchedules.ts` review fixture so:

- One review links at least one related Task.
- One review links at least one related file.
- Review source is shown as `demo`.
- Suggestions mention today follow-up without claiming automatic system mutation.

- [ ] **Step 5: Recompose DailyReview**

Update `src/ui/dashboard/DailyReview.tsx` so it:

- Uses `WorkbenchHeader`.
- Shows the latest review prominently.
- Keeps completed/shortcomings/suggestions sections.
- Shows a source badge.
- Renders related Task buttons through `selectTask`.
- Renders related file chips and selects the file through `dashboardStore.setSelectedFile` before switching to `files` module through `uiStore.setActiveModule('files')`.
- Shows historical review cards below the latest review when more than one exists.

- [ ] **Step 6: Run focused tests and build**

Run:

```powershell
npm run test -- src/ui/dashboard/workbenchTesting.test.ts
npm run build
```

Expected: PASS.

- [ ] **Step 7: Commit**

```powershell
git add src/ui/dashboard/DailyReview.tsx src/data/demoSchedules.ts src/ui/dashboard/workbenchTesting.ts src/ui/dashboard/workbenchTesting.test.ts
git commit -m "feat: link daily review evidence"
```

## Task 7: Browser QA for Full Workbench Fidelity

**Files:**
- Modify only if QA finds a defect in files owned by Tasks 1 through 6.

- [ ] **Step 1: Start the local app**

Run:

```powershell
npm run dev
```

Expected: Vite prints a local URL, normally `http://localhost:5173`.

- [ ] **Step 2: Verify navigation coverage**

Using the Browser plugin:

1. Open the Vite URL.
2. Click Calendar, Tasks, Logs, Files, Cron Jobs, Gateway, Review, and Rest.
3. Confirm every module renders without blank content or console errors.
4. Confirm the SidePanel still remains available when a Task/Agent is selected from a workbench module.

- [ ] **Step 3: Capture desktop screenshots**

Capture desktop evidence for:

- Calendar week + plan progress.
- Tasks filter/source view.
- Files tree + preview.
- Cron run summaries.
- Gateway protocol diagnostic.
- Review evidence links.
- Rest module cards.

- [ ] **Step 4: Verify narrow layout**

At a narrow width around 390px:

- Open Calendar and Files.
- Confirm columns stack or remain scrollable without text escaping buttons/cards.
- Confirm navigation remains usable enough to reach Tasks and Rest.

- [ ] **Step 5: Verify key interactions**

Using Browser:

- Toggle a Calendar stage and confirm progress changes.
- Mark a Plan complete and confirm all stages remain visually complete.
- Filter Tasks to runtime blocked and confirm the runtime task is visible.
- Search Logs after Demo events exist and confirm filtering narrows rows.
- Select a file and confirm preview changes.
- Click a Review related file and confirm Files becomes active with the file selected.

- [ ] **Step 6: Fix only workbench regressions found during QA**

Keep fixes scoped to dashboard, store, navigation, and CSS files owned by this plan.

- [ ] **Step 7: Run final verification**

Run:

```powershell
npm run test
npm run build
```

Expected: all workbench helper tests PASS and production build PASS.

- [ ] **Step 8: Commit**

```powershell
git add src
git commit -m "test: verify workbench fidelity"
```

## Plan Self-Review Checklist

Before execution is considered ready:

- [ ] Calendar, Tasks, Logs, Files, Cron, Gateway, Review, and Rest all have implementation tasks.
- [ ] Real Google Tasks, real filesystem reads, and real runtime protocol work stay out of this plan.
- [ ] Local dashboard persistence never stores gateway tokens.
- [ ] File preview is modeled through demo/workbench data so the later Runtime Adapter can replace the source.
- [ ] Review can navigate back to task and file evidence.
- [ ] Browser QA covers navigation, interactions, desktop surfaces, narrow layout, and selection context.

