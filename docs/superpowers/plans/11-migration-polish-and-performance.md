# Migration Polish and Performance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把项目从“功能完成”打磨成可长期迁移、可验证、可交付、性能不过度膨胀的版本，并消化当前 Vite 大 chunk warning。

**Architecture:** 先增强迁移安全和恢复体验，再做 bundle/code splitting，最后建立 QA 证据链。迁移逻辑继续使用白名单 bundle 和 schemaVersion；性能优化优先采用 Vite/Rollup 分包、React lazy、模块懒加载，不重写业务逻辑；最终交付通过测试、构建、HTTP smoke、浏览器 QA 清单和文档来收口。

**Tech Stack:** React 18, TypeScript, Vite, Rollup manualChunks, React.lazy, Zustand persist, Vitest, localStorage.

---

## Source Requirement

使用以下需求文档作为产品基线：

`docs/superpowers/specs/2026-05-23-video-replication-optimization-requirements.md`

本计划覆盖：

- Section 14: 数据、状态、持久化、迁移要求。
- Section 15: 错误处理和恢复路径。
- Section 16: 可访问性和响应式要求。
- Section 17: 性能需求。
- Section 18.3: P2 验收。
- Section 18.4: P3 验收。
- Section 19.5: 优化包 E。
- Section 22: 测试和验证要求。
- Section 23: 完整复刻最终验收。

本计划不覆盖：

- Workbench 深度功能，属于 Plan 09。
- 真实 AI adapter，属于 Plan 10。
- 新的 3D 视觉玩法。

## Current Baseline

当前已经具备：

- `src/migration/migrationTypes.ts`
- `src/migration/migrationTesting.ts`
- `src/migration/exportBundle.ts`
- `src/migration/importBundle.ts`
- `src/ui/dashboard/MigrationView.tsx`
- `docs/migration/3d-cyber-office-data-migration.md`
- `docs/migration/migration-checklist.md`
- `docs/migration/README.md`
- `vite.config.ts`
- `npm.cmd run test`
- `npm.cmd run build`

当前缺口：

1. 迁移 UI 已能导出/导入，但缺少更完整的健康检查和覆盖提醒。
2. Secret 扫描偏基础，真实 AI adapter 接入后需要更严格。
3. Vite build JS chunk 约 1.2MB，长期需要拆分。
4. 浏览器 QA 和迁移演练还没有固定成文档化流程。
5. `.gitignore`、dist、临时文件、截图和日志产物需要明确交付边界。
6. 最终交付需要一份“我换电脑怎么迁移、怎么验收”的中文入口。

## File Structure

### Files to create

| File | Responsibility |
| --- | --- |
| `src/migration/migrationHealth.ts` | 迁移后健康检查：key 存在、schemaVersion、状态计数、缺失字段、secret 风险。 |
| `src/migration/migrationHealth.test.ts` | 迁移健康检查测试。 |
| `src/performance/performanceBudget.ts` | 纯函数记录 bundle budget 和 warning 判断。 |
| `src/performance/performanceBudget.test.ts` | 性能预算测试。 |
| `src/ui/dashboard/MigrationHealthPanel.tsx` | Migration 页面中的健康检查面板。 |
| `docs/qa/final-acceptance-checklist.md` | 完整复刻最终验收清单。 |
| `docs/qa/browser-qa-checklist.md` | 桌面/移动端浏览器 QA 清单。 |
| `docs/qa/performance-notes.md` | Bundle、分包、性能预算说明。 |

### Files to modify

| File | Change |
| --- | --- |
| `src/ui/dashboard/MigrationView.tsx` | 增加健康检查面板、覆盖提醒、导入后刷新提示。 |
| `src/migration/migrationTesting.ts` | 增强 secret 扫描、bundle plan 和 restore checklist。 |
| `src/migration/exportBundle.ts` | 导出前加入健康检查和风险 metadata。 |
| `src/migration/importBundle.ts` | 导入前输出覆盖计划，导入后返回恢复检查结果。 |
| `vite.config.ts` | 增加 Rollup manualChunks 和 chunk size budget。 |
| `src/ui/AppShell.tsx` | 将大型 Workbench 模块懒加载。 |
| `src/scene/OfficeScene.tsx` | 如需要，将非首屏重资产组件延迟加载或保持当前。 |
| `docs/migration/README.md` | 更新成中文迁移总入口。 |
| `docs/migration/3d-cyber-office-data-migration.md` | 加入真实 AI 凭据不迁移说明和健康检查步骤。 |
| `.gitignore` | 明确 dist、screenshots、qa 临时产物、local env。 |
| `docs/superpowers/specs/2026-05-23-video-replication-optimization-requirements.md` | 实施后追加 Plan 11 状态。 |

## Target Budgets

| Metric | Target | Notes |
| --- | --- | --- |
| Main JS initial chunk | Under 700 kB minified | If Three/R3F vendor chunk is separate, total can exceed this. |
| Individual lazy Workbench chunk | Under 250 kB minified | Dashboard modules should not all load on first paint. |
| CSS bundle | Under 80 kB minified | Current CSS is acceptable. |
| Migration bundle | Under 5 MB for normal local state | Warn but do not block above this. |
| Mobile layout | 390px no horizontal overflow | Required. |
| Secret scan | Zero real credentials | Documentation examples allowed only as fake strings. |

## Task 1: Add Migration Health Checks

**Files:**
- Create: `src/migration/migrationHealth.ts`
- Create: `src/migration/migrationHealth.test.ts`
- Modify: `src/migration/migrationTesting.ts`

- [ ] **Step 1: Write failing migration health tests**

Create `src/migration/migrationHealth.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  checkMigrationBundleHealth,
  countPersistedRecords,
  createMigrationCoverageSummary,
} from './migrationHealth';

describe('migration health checks', () => {
  it('counts persisted records by approved storage key', () => {
    expect(countPersistedRecords({
      'cyber-office-ui': { activeModule: 'office' },
      'cyber-office-data': { agents: [{ id: 'agent-1' }], tasks: [{ id: 'task-1' }] },
      'cyber-office-dashboard': { calendarItems: [{ id: 'cal-1' }], workbenchTasks: [{ id: 'wb-1' }] },
      'cyber-office-commander': { missions: { 'mission-1': {} }, artifacts: { 'artifact-1': {} } },
    })).toEqual({
      ui: 1,
      agents: 1,
      tasks: 1,
      calendarItems: 1,
      workbenchTasks: 1,
      missions: 1,
      artifacts: 1,
    });
  });

  it('reports missing recommended state without failing the import', () => {
    const health = checkMigrationBundleHealth({
      schemaVersion: 1,
      exportedAt: '2026-05-23T00:00:00.000Z',
      app: '3d-cyber-office',
      storage: {
        'cyber-office-ui': { activeModule: 'office' },
      },
    });

    expect(health.status).toBe('warning');
    expect(health.warnings).toContain('缺少 office 数据，导入后将使用默认 Agent 和任务。');
  });

  it('blocks bundles with secret-like values', () => {
    const health = checkMigrationBundleHealth({
      schemaVersion: 1,
      exportedAt: '2026-05-23T00:00:00.000Z',
      app: '3d-cyber-office',
      storage: {
        'cyber-office-ui': { authorization: 'Bearer abc.def.ghi' },
      },
    });

    expect(health.status).toBe('blocked');
    expect(health.errors[0]).toContain('疑似敏感凭据');
  });

  it('creates a Chinese coverage summary for the migration UI', () => {
    expect(createMigrationCoverageSummary({
      ui: 1,
      agents: 4,
      tasks: 12,
      calendarItems: 3,
      workbenchTasks: 5,
      missions: 1,
      artifacts: 2,
    })).toContain('Agent 4 个');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```powershell
npm.cmd run test -- src/migration/migrationHealth.test.ts
```

Expected: FAIL because `migrationHealth.ts` does not exist.

- [ ] **Step 3: Add migration health implementation**

Create `src/migration/migrationHealth.ts`:

```ts
export interface MigrationHealthBundle {
  schemaVersion: number;
  exportedAt: string;
  app: string;
  storage: Record<string, unknown>;
}

export interface PersistedRecordCounts {
  ui: number;
  agents: number;
  tasks: number;
  calendarItems: number;
  workbenchTasks: number;
  missions: number;
  artifacts: number;
}

export interface MigrationHealthResult {
  status: 'ok' | 'warning' | 'blocked';
  errors: string[];
  warnings: string[];
  counts: PersistedRecordCounts;
}

const SECRET_PATTERNS = [
  /authorization/i,
  /bearer\s+[a-z0-9._-]+/i,
  /api[_-]?key/i,
  /password/i,
  /secret/i,
  /token/i,
  /sk-[a-z0-9]/i,
];

function objectRecord(value: unknown): Record<string, any> {
  return value && typeof value === 'object' ? value as Record<string, any> : {};
}

export function countPersistedRecords(storage: Record<string, unknown>): PersistedRecordCounts {
  const office = objectRecord(storage['cyber-office-data']);
  const dashboard = objectRecord(storage['cyber-office-dashboard']);
  const commander = objectRecord(storage['cyber-office-commander']);
  const ui = objectRecord(storage['cyber-office-ui']);

  return {
    ui: Object.keys(ui).length,
    agents: Array.isArray(office.agents) ? office.agents.length : 0,
    tasks: Array.isArray(office.tasks) ? office.tasks.length : 0,
    calendarItems: Array.isArray(dashboard.calendarItems) ? dashboard.calendarItems.length : 0,
    workbenchTasks: Array.isArray(dashboard.workbenchTasks) ? dashboard.workbenchTasks.length : 0,
    missions: commander.missions ? Object.keys(commander.missions).length : 0,
    artifacts: commander.artifacts ? Object.keys(commander.artifacts).length : 0,
  };
}

export function hasSecretLikeContent(value: unknown): boolean {
  const text = JSON.stringify(value);
  return SECRET_PATTERNS.some((pattern) => pattern.test(text));
}

export function checkMigrationBundleHealth(bundle: MigrationHealthBundle): MigrationHealthResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const counts = countPersistedRecords(bundle.storage);

  if (bundle.app !== '3d-cyber-office') errors.push('迁移包 app 标识不匹配。');
  if (!bundle.schemaVersion || bundle.schemaVersion < 1) errors.push('迁移包 schemaVersion 无效。');
  if (hasSecretLikeContent(bundle.storage)) errors.push('迁移包中发现疑似敏感凭据，请移除 token、password 或 authorization 后再导入。');

  if (!bundle.storage['cyber-office-data']) warnings.push('缺少 office 数据，导入后将使用默认 Agent 和任务。');
  if (!bundle.storage['cyber-office-dashboard']) warnings.push('缺少 dashboard 数据，日程和工作台偏好将使用默认值。');
  if (!bundle.storage['cyber-office-commander']) warnings.push('缺少 commander 数据，历史 mission 和 artifact 不会恢复。');

  return {
    status: errors.length > 0 ? 'blocked' : warnings.length > 0 ? 'warning' : 'ok',
    errors,
    warnings,
    counts,
  };
}

export function createMigrationCoverageSummary(counts: PersistedRecordCounts): string {
  return [
    `UI 字段 ${counts.ui} 个`,
    `Agent ${counts.agents} 个`,
    `任务 ${counts.tasks} 个`,
    `日程 ${counts.calendarItems} 条`,
    `工作台任务 ${counts.workbenchTasks} 条`,
    `Mission ${counts.missions} 个`,
    `Artifact ${counts.artifacts} 个`,
  ].join('，');
}
```

- [ ] **Step 4: Run migration tests**

```powershell
npm.cmd run test -- src/migration/migrationHealth.test.ts src/migration/migrationTesting.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add src/migration/migrationHealth.ts src/migration/migrationHealth.test.ts src/migration/migrationTesting.ts
git commit -m "feat: add migration health checks"
```

## Task 2: Add Migration Health UI

**Files:**
- Create: `src/ui/dashboard/MigrationHealthPanel.tsx`
- Modify: `src/ui/dashboard/MigrationView.tsx`
- Modify: `src/migration/exportBundle.ts`
- Modify: `src/migration/importBundle.ts`

- [ ] **Step 1: Add panel component**

Create `src/ui/dashboard/MigrationHealthPanel.tsx`:

```tsx
import type { MigrationHealthResult } from '@/migration/migrationHealth';
import { createMigrationCoverageSummary } from '@/migration/migrationHealth';

export function MigrationHealthPanel({ health }: { health: MigrationHealthResult | null }) {
  if (!health) {
    return (
      <section className="cyber-panel p-3">
        <h3 className="text-sm font-semibold text-white">迁移健康检查</h3>
        <p className="text-sm text-gray-400 mt-1">预览导出或导入后，这里会显示状态覆盖、风险和恢复建议。</p>
      </section>
    );
  }

  const color = health.status === 'blocked' ? 'text-red-300' : health.status === 'warning' ? 'text-amber-300' : 'text-cyber-success';
  return (
    <section className="cyber-panel p-3">
      <h3 className="text-sm font-semibold text-white">迁移健康检查</h3>
      <p className={`text-sm mt-1 ${color}`}>{health.status === 'ok' ? '可以迁移' : health.status === 'warning' ? '可以迁移，但有缺失项' : '已阻止迁移'}</p>
      <p className="text-xs text-gray-400 mt-2">{createMigrationCoverageSummary(health.counts)}</p>
      {health.errors.length > 0 && (
        <ul className="mt-2 text-xs text-red-300 space-y-1">
          {health.errors.map((error) => <li key={error}>{error}</li>)}
        </ul>
      )}
      {health.warnings.length > 0 && (
        <ul className="mt-2 text-xs text-amber-300 space-y-1">
          {health.warnings.map((warning) => <li key={warning}>{warning}</li>)}
        </ul>
      )}
    </section>
  );
}
```

- [ ] **Step 2: Use health checks in MigrationView**

Modify `MigrationView.tsx`:

- Import `MigrationHealthPanel`.
- Keep `health` in component state.
- After export preview, call `checkMigrationBundleHealth(bundle)`.
- After import preview, call `checkMigrationBundleHealth(parsedBundle)`.
- Disable `Apply Import` when `health.status === 'blocked'`.

Required UI copy:

```tsx
<p className="text-xs text-gray-500">
  Runtime 凭据不会进入迁移包。换电脑后请在外部 Runtime 里重新配置真实服务。
</p>
```

- [ ] **Step 3: Export/import returns health**

Modify `exportBundle.ts` and `importBundle.ts` so callers can access health:

```ts
import { checkMigrationBundleHealth } from './migrationHealth';

const health = checkMigrationBundleHealth(bundle);
return { bundle, health };
```

If existing functions return plain bundle, preserve the old function and add `previewExportBundleWithHealth()` instead of breaking callers.

- [ ] **Step 4: Run tests and build**

```powershell
npm.cmd run test -- src/migration/migrationHealth.test.ts src/migration/migrationTesting.test.ts
npm.cmd run build
```

Expected: PASS and build success.

- [ ] **Step 5: Browser QA**

Verify:

- Migration page shows health panel.
- Export preview shows coverage counts.
- Pasting JSON with `authorization` blocks import.
- Missing optional keys show warnings, not hard failure.
- Mobile 390px has no horizontal overflow.

- [ ] **Step 6: Commit**

```powershell
git add src/ui/dashboard/MigrationHealthPanel.tsx src/ui/dashboard/MigrationView.tsx src/migration/exportBundle.ts src/migration/importBundle.ts
git commit -m "feat: add migration health panel"
```

## Task 3: Add Performance Budget Tests

**Files:**
- Create: `src/performance/performanceBudget.ts`
- Create: `src/performance/performanceBudget.test.ts`

- [ ] **Step 1: Write performance budget tests**

Create `src/performance/performanceBudget.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { classifyChunkBudget, summarizeBundleBudget } from './performanceBudget';

describe('performance budget', () => {
  it('warns when an initial app chunk exceeds the target budget', () => {
    expect(classifyChunkBudget({ name: 'index.js', sizeKb: 1240, kind: 'initial' })).toBe('over_budget');
  });

  it('accepts separated vendor chunks when app entry is smaller', () => {
    expect(summarizeBundleBudget([
      { name: 'app.js', sizeKb: 420, kind: 'initial' },
      { name: 'vendor-three.js', sizeKb: 760, kind: 'vendor' },
      { name: 'dashboard.js', sizeKb: 180, kind: 'lazy' },
    ])).toMatchObject({
      status: 'ok',
      overBudget: [],
    });
  });

  it('warns for lazy chunks above 250 kB', () => {
    expect(classifyChunkBudget({ name: 'dashboard.js', sizeKb: 300, kind: 'lazy' })).toBe('warning');
  });
});
```

- [ ] **Step 2: Add implementation**

Create `src/performance/performanceBudget.ts`:

```ts
export type ChunkKind = 'initial' | 'lazy' | 'vendor' | 'css';
export type ChunkBudgetStatus = 'ok' | 'warning' | 'over_budget';

export interface ChunkBudgetInput {
  name: string;
  sizeKb: number;
  kind: ChunkKind;
}

const BUDGETS: Record<ChunkKind, number> = {
  initial: 700,
  lazy: 250,
  vendor: 900,
  css: 80,
};

export function classifyChunkBudget(chunk: ChunkBudgetInput): ChunkBudgetStatus {
  const budget = BUDGETS[chunk.kind];
  if (chunk.sizeKb <= budget) return 'ok';
  return chunk.kind === 'initial' ? 'over_budget' : 'warning';
}

export function summarizeBundleBudget(chunks: ChunkBudgetInput[]) {
  const overBudget = chunks.filter((chunk) => classifyChunkBudget(chunk) === 'over_budget');
  const warnings = chunks.filter((chunk) => classifyChunkBudget(chunk) === 'warning');
  return {
    status: overBudget.length > 0 ? 'over_budget' : warnings.length > 0 ? 'warning' : 'ok',
    overBudget: overBudget.map((chunk) => chunk.name),
    warnings: warnings.map((chunk) => chunk.name),
  };
}
```

- [ ] **Step 3: Run tests**

```powershell
npm.cmd run test -- src/performance/performanceBudget.test.ts
```

Expected: PASS.

- [ ] **Step 4: Commit**

```powershell
git add src/performance/performanceBudget.ts src/performance/performanceBudget.test.ts
git commit -m "test: add bundle performance budget helpers"
```

## Task 4: Split Vite Chunks

**Files:**
- Modify: `vite.config.ts`
- Modify: `src/ui/AppShell.tsx`

- [ ] **Step 1: Add manualChunks**

Modify `vite.config.ts`:

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/three') || id.includes('@react-three')) return 'vendor-3d';
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom') || id.includes('node_modules/zustand')) return 'vendor-react';
          if (id.includes('/src/ui/dashboard/')) return 'dashboard';
          if (id.includes('/src/ui/commander/')) return 'commander';
          if (id.includes('/src/runtime/')) return 'runtime';
        },
      },
    },
  },
});
```

If current `vite.config.ts` already contains aliases or plugin settings, merge this without removing existing config.

- [ ] **Step 2: Lazy-load dashboard views**

Modify `src/ui/AppShell.tsx`:

```tsx
import { lazy, Suspense } from 'react';

const CalendarView = lazy(() => import('./dashboard/CalendarView').then((m) => ({ default: m.CalendarView })));
const TasksView = lazy(() => import('./dashboard/TasksView').then((m) => ({ default: m.TasksView })));
const LogsView = lazy(() => import('./dashboard/LogsView').then((m) => ({ default: m.LogsView })));
const FilesView = lazy(() => import('./dashboard/FilesView').then((m) => ({ default: m.FilesView })));
const CronJobsView = lazy(() => import('./dashboard/CronJobsView').then((m) => ({ default: m.CronJobsView })));
const GatewayStatus = lazy(() => import('./dashboard/GatewayStatus').then((m) => ({ default: m.GatewayStatus })));
const DailyReview = lazy(() => import('./dashboard/DailyReview').then((m) => ({ default: m.DailyReview })));
const RestView = lazy(() => import('./dashboard/RestView').then((m) => ({ default: m.RestView })));
const MigrationView = lazy(() => import('./dashboard/MigrationView').then((m) => ({ default: m.MigrationView })));
```

Wrap dashboard switch:

```tsx
<Suspense fallback={<div className="p-4 text-sm text-gray-400">正在加载工作台...</div>}>
  {activeModule === 'calendar' ? (
    <CalendarView />
  ) : activeModule === 'tasks' ? (
    <TasksView />
  ) : activeModule === 'logs' ? (
    <LogsView />
  ) : activeModule === 'files' ? (
    <FilesView />
  ) : activeModule === 'cronjobs' ? (
    <CronJobsView />
  ) : activeModule === 'gateway' ? (
    <GatewayStatus />
  ) : activeModule === 'review' ? (
    <DailyReview />
  ) : activeModule === 'rest' ? (
    <RestView />
  ) : activeModule === 'migration' ? (
    <MigrationView />
  ) : (
    <OfficeScene />
  )}
</Suspense>
```

- [ ] **Step 3: Build and inspect chunks**

```powershell
npm.cmd run build
```

Expected:

- Build succeeds.
- The old single `index-*.js` chunk is reduced or split into named chunks.
- Large vendor chunks may remain, but app code should not all be in one file.

- [ ] **Step 4: Browser QA**

Run:

```powershell
npm.cmd run dev
```

Verify:

- Office loads.
- Navigation to each Workbench module works after lazy loading.
- Guided demo module transitions still work.
- Migration page still imports/exports.
- No React Suspense console errors.

- [ ] **Step 5: Commit**

```powershell
git add vite.config.ts src/ui/AppShell.tsx
git commit -m "perf: split dashboard and vendor chunks"
```

## Task 5: Clean Delivery Boundaries

**Files:**
- Modify: `.gitignore`
- Create: `docs/qa/performance-notes.md`

- [ ] **Step 1: Update gitignore**

Modify `.gitignore` to include:

```gitignore
dist/
.vite/
node_modules/
*.local
.env
.env.*
!/.env.example
screenshots/
qa-artifacts/
playwright-report/
test-results/
*.log
```

Do not ignore source docs under `docs/qa`.

- [ ] **Step 2: Add performance notes**

Create `docs/qa/performance-notes.md`:

```md
# Performance Notes

## Current Strategy

The app uses Vite manual chunks and React lazy loading to keep the office shell responsive while dashboard modules load on demand.

## Chunk Groups

- `vendor-3d`: Three.js, React Three Fiber, Drei
- `vendor-react`: React, ReactDOM, Zustand
- `dashboard`: Workbench modules
- `commander`: Commander UI
- `runtime`: Runtime adapter code

## Budget

- Initial app chunk target: under 700 kB minified
- Lazy dashboard chunk target: under 250 kB minified
- CSS target: under 80 kB minified

## Known Tradeoff

The 3D vendor chunk can remain large because Three.js and R3F are core dependencies. The important goal is that dashboard and migration code do not all ship inside the first app chunk.

## Verification

Run:

```powershell
npm.cmd run build
```

Check `dist/assets` and confirm chunks are split by responsibility.
```

- [ ] **Step 3: Commit**

```powershell
git add .gitignore docs/qa/performance-notes.md
git commit -m "docs: define performance and delivery boundaries"
```

## Task 6: Final QA Documentation

**Files:**
- Create: `docs/qa/browser-qa-checklist.md`
- Create: `docs/qa/final-acceptance-checklist.md`
- Modify: `docs/migration/README.md`
- Modify: `docs/migration/3d-cyber-office-data-migration.md`

- [ ] **Step 1: Browser QA checklist**

Create `docs/qa/browser-qa-checklist.md`:

```md
# Browser QA Checklist

## Desktop 1366x768

- [ ] Office scene loads and is not dark.
- [ ] Reset View is clickable.
- [ ] Complete Guided Demo starts.
- [ ] Pause freezes events, narration, and camera.
- [ ] Reset clears demo state.
- [ ] Commander panel stays readable.
- [ ] Workbench modules open: Calendar, Tasks, Logs, Files, Cron, Gateway, Review, Rest, Migration.
- [ ] Gateway Mock mode produces runtime events.
- [ ] Connected mode remains guarded and asks for no credentials.
- [ ] Migration export preview works.
- [ ] Migration import preview blocks secret-like values.

## Mobile 390x844

- [ ] No page has horizontal overflow.
- [ ] Navigation wraps or scrolls without clipping text.
- [ ] DemoControls remain clickable.
- [ ] SidePanel overlays instead of crushing content.
- [ ] Migration textareas fit the viewport.
- [ ] Gateway raw event panel wraps text.
- [ ] Workbench cards do not overlap.

## Console

- [ ] No React hook order errors.
- [ ] No uncaught TypeError.
- [ ] No token, secret, or authorization value appears.
```

- [ ] **Step 2: Final acceptance checklist**

Create `docs/qa/final-acceptance-checklist.md`:

```md
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
- [ ] User understands credentials must be recreated manually.

## Engineering

- [ ] `npm.cmd run test` passes.
- [ ] `npm.cmd run build` succeeds.
- [ ] Bundle is split or warning is documented.
- [ ] Browser QA checklist is complete.
```

- [ ] **Step 3: Update migration README**

Modify `docs/migration/README.md` so the first section is:

```md
# 3D 赛博办公室迁移指南

如果你要把项目迁移到另一台电脑，请先看：

1. `3d-cyber-office-data-migration.md`：完整迁移教程。
2. `migration-checklist.md`：快速检查清单。
3. `../qa/final-acceptance-checklist.md`：迁移后验收。

重要提醒：真实 Runtime、AI provider token、API key、password 不会进入迁移包。换电脑后需要在外部安全 Runtime 中重新配置。
```

- [ ] **Step 4: Update migration tutorial**

Modify `docs/migration/3d-cyber-office-data-migration.md`:

Add sections:

```md
## 迁移后健康检查

导入迁移包后，请检查 Migration 页面的“迁移健康检查”：

- `可以迁移`：核心状态完整。
- `可以迁移，但有缺失项`：缺少部分状态，系统会使用默认值。
- `已阻止迁移`：迁移包中有敏感凭据或 schema 错误。

## 凭据不迁移

迁移包不会导出：

- API key
- token
- password
- authorization header
- cookie
- 外部 Runtime 凭据

如果你启用了真实 AI Runtime，请在新电脑上重新配置外部 Runtime，不要把凭据粘进浏览器 localStorage。
```

- [ ] **Step 5: Commit**

```powershell
git add docs/qa/browser-qa-checklist.md docs/qa/final-acceptance-checklist.md docs/migration/README.md docs/migration/3d-cyber-office-data-migration.md
git commit -m "docs: add final qa and migration polish guides"
```

## Task 7: Final Verification and Spec Status

**Files:**
- Modify: `docs/superpowers/specs/2026-05-23-video-replication-optimization-requirements.md`

- [ ] **Step 1: Run full verification**

```powershell
npm.cmd run test
npm.cmd run build
rg "api[_-]?key|authorization|bearer|secret|password|sk-" src docs -n
```

Expected:

- Tests pass.
- Build succeeds.
- Secret scan only shows documentation warnings, fake examples, and test fixtures.
- Build output shows split chunks or the performance note explains remaining vendor size.

- [ ] **Step 2: HTTP smoke**

Start dev server:

```powershell
npm.cmd run dev
```

Then in PowerShell:

```powershell
Invoke-WebRequest -UseBasicParsing -Uri "http://127.0.0.1:5173/" | Select-Object StatusCode
```

If Vite chooses another port, use that printed port.

Expected: `StatusCode 200`.

- [ ] **Step 3: Browser QA**

Use `docs/qa/browser-qa-checklist.md`.

Minimum required views:

- Desktop 1366x768.
- Mobile 390x844.
- Office first screen.
- Guided Demo.
- Migration.
- Gateway Mock.
- Gateway Connected placeholder.

- [ ] **Step 4: Update implementation status**

Append under `## Implementation Status`:

```md
- Plan 11 `Migration Polish and Performance`: **implemented and verified** (2026-05-23).
- Migration now has health checks, secret blocking, clearer Chinese recovery guidance, final QA checklists, performance budget helpers, Vite chunk splitting, and delivery boundary documentation.
```

- [ ] **Step 5: Commit**

```powershell
git add docs/superpowers/specs/2026-05-23-video-replication-optimization-requirements.md
git commit -m "docs: mark migration polish and performance plan status"
```

## Final Acceptance

Plan 11 is complete when:

1. Migration export/import has health checks.
2. Secret-like values block import/export risk paths.
3. Migration docs are clear enough for moving to another computer.
4. Browser QA and final acceptance checklists exist.
5. Vite build is split into meaningful chunks or remaining warning is documented with a reason.
6. Dashboard modules lazy-load without breaking guided demo transitions.
7. `.gitignore` keeps build, screenshots, logs, env files, and QA artifacts out of source control.
8. `npm.cmd run test` passes.
9. `npm.cmd run build` succeeds.
10. HTTP smoke returns 200.
11. Desktop and 390px mobile QA pass.
