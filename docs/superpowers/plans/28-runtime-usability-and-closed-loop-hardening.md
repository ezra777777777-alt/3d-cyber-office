# Runtime Usability and Closed-Loop Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the local Runtime flow feel usable and trustworthy for a normal user: the app detects stale runtime processes, shows clear connection state, runs a visible approval loop, resumes after approval, creates artifacts, and ends with a real Commander summary instead of an error-looking event.

**Architecture:** Keep the browser as the visual command center and keep all real work inside `scripts/local-runtime/`. Add explicit runtime health/version metadata, normalize mission completion into Commander summary events, make the default deterministic mission demonstrate one approval gate, and improve Gateway/Commander UI so users know what is running and what to do next. Remove dead runtime code and add regression tests around the exact user path.

**Tech Stack:** React 18, TypeScript, Zustand, Vite, Vitest, Node ESM runtime, HTTP/SSE, existing Commander store, existing Runtime adapter, existing safe tool layer.

---

## 0. Why This Plan Exists

The current system can pass tests and can run a local mission, but a user can still have a rough experience:

- Old runtime processes can keep occupying `127.0.0.1:8765`, so the browser connects to stale behavior after the code has changed.
- Completed missions currently emit `runtime.adapter_error` for summary, which reads like a failure and does not update `MissionSummary` as a first-class Commander summary.
- The default mission path usually completes without approval, so the most important "Commander asks user before risky work" loop is not visible.
- The runtime endpoint is hard-coded in the store and not editable in UI.
- Runtime-generated `.local-runtime/` artifacts pollute git status.
- `server.mjs` still has old timer-based dead code that should not survive into a product path.

This plan is not a visual polish plan. It is the next practical product-hardening plan.

---

## 1. Scope

### In Scope

- Runtime health identity and stale-process detection.
- Editable Runtime endpoint in Gateway.
- Runtime summary event mapped into Commander summary.
- Default mission approval gate that visibly pauses and resumes.
- Approval UI consistency when runtime approval fails.
- Dead code cleanup in local runtime server.
- `.local-runtime/` gitignore cleanup.
- End-to-end runtime QA scripts/tests.
- User-facing docs/checklist updates.

### Out of Scope

- New 3D character art.
- New video scene replication.
- Real cloud deployment.
- Persistent runtime database.
- Installing Playwright or new dependencies.
- Autonomous infinite agent loops.
- Auto-committing generated file changes.

---

## 2. Current Evidence From QA

- `npm.cmd run runtime:test` passes: 38 tests.
- `npm.cmd run test` passes: 33 files / 160 tests.
- `npm.cmd run build` succeeds.
- Build warning remains: `vendor-3d` is about 824 KB and there is a commander/runtime circular chunk warning.
- Existing process on `127.0.0.1:8765` can be stale even when code on disk is newer.
- Existing process on `127.0.0.1:8766` can also be stale.
- A fresh runtime on a high port can complete a mission and return `/missions/:id`, but the default deterministic path does not request approval.
- Existing runtime summary is emitted as `runtime.adapter_error`.

---

## 3. Files

### Create

- `src/runtime/runtimeHealth.ts`
  - Pure helpers for comparing runtime health metadata and producing UI-safe warnings.

- `src/runtime/runtimeHealth.test.ts`
  - Unit tests for stale runtime detection, endpoint labels, and version mismatch diagnostics.

- `scripts/local-runtime/runtimeIdentity.mjs`
  - Runtime build identity, process id, protocol version, started timestamp, and source signature helpers.

- `scripts/local-runtime/runtimeIdentity.test.mjs`
  - Node tests for identity metadata shape and stale comparison fields.

- `scripts/local-runtime/missionCompletion.test.mjs`
  - Runtime tests for `runtime.mission_completed` or equivalent completion event.

- `docs/qa/runtime-user-flow-checklist.md`
  - Manual user acceptance checklist for the complete flow.

### Modify

- `.gitignore`
  - Add `.local-runtime/`.

- `scripts/local-runtime/server.mjs`
  - Remove unused `scheduleMissionEvents`.
  - Add health identity fields.
  - Keep `/missions`, `/missions/:id`, `/events`, `/approvals/:id/resolve`, and `/tools/request`.

- `scripts/local-runtime/deterministicPlanner.mjs`
  - Make the build task high-risk or explicitly request approval when the user asks for execution/write/checklist output.

- `scripts/local-runtime/workerEngine.mjs`
  - For high-risk build tasks, return `approval_required` with a concrete `artifact.write` or `workspace.write_file` request depending on risk policy.

- `scripts/local-runtime/missionEngine.mjs`
  - Emit a completion event that is not an adapter error.
  - Include mission status, completed count, artifact count, and summary payload.

- `scripts/local-runtime/missionEngine.test.mjs`
  - Add tests for default approval pause/resume and completion event.

- `src/runtime/runtimeTypes.ts`
  - Add `runtime.mission_completed` if using a new runtime message type.

- `src/runtime/normalizeRuntimeEvent.ts`
  - Map runtime completion to `commander.summary_ready`.

- `src/runtime/runtimeTesting.test.ts`
  - Assert completion messages normalize into Commander summary.

- `src/store/runtimeStore.ts`
  - Store endpoint and last health snapshot.
  - Add endpoint setter persistence if appropriate.

- `src/store/commanderStore.ts`
  - Ensure runtime-completed summary updates selected mission summary and completed status.

- `src/ui/dashboard/GatewayStatus.tsx`
  - Add endpoint input.
  - Add health check/reconnect button.
  - Show runtime pid, started time, active mission count, planner provider, and stale warning.

- `src/ui/commander/ApprovalInbox.tsx`
  - Use "approving/rejecting" pending state.
  - Sync runtime first in connected mode, then update local state.
  - Show a visible error if runtime approval fails.

- `src/ui/commander/MissionSummary.tsx`
  - Make runtime completion summary look like a successful outcome, not a raw event.

- `src/ui/commander/CommanderComposer.tsx`
  - If local runtime endpoint is disconnected/stale, show a clear message before planning.

- `docs/runtime/local-runtime-mvp.md`
  - Update start/restart guidance.

- `docs/qa/release-readiness-checklist.md`
  - Add Plan 28 checkboxes.

---

## 4. User-Facing Target Flow

1. User opens the app.
2. User switches runtime mode to "本地 Runtime".
3. Gateway shows:
   - endpoint: `http://127.0.0.1:8765`
   - connection status
   - runtime pid
   - started time
   - planner provider
   - whether this looks stale
4. If runtime is missing or stale, user sees:
   - command: `npm.cmd run runtime`
   - advice: stop old process or change endpoint port
   - reconnect button
5. User opens Commander.
6. User selects "本地 Runtime".
7. User enters a goal.
8. Runtime plans research/build/review tasks.
9. Research runs and creates artifact.
10. Build pauses with approval request.
11. User clicks approve.
12. Runtime executes approved action.
13. Build completes.
14. Review completes.
15. Commander summary shows completed mission, artifact count, and next action.
16. Logs and Gateway show events without presenting summary as an error.

---

## 5. Implementation Tasks

### Task 1: Runtime Identity and Stale Detection

**Files:**
- Create: `scripts/local-runtime/runtimeIdentity.mjs`
- Create: `scripts/local-runtime/runtimeIdentity.test.mjs`
- Create: `src/runtime/runtimeHealth.ts`
- Create: `src/runtime/runtimeHealth.test.ts`
- Modify: `scripts/local-runtime/server.mjs`
- Modify: `src/store/runtimeStore.ts`

- [ ] **Step 1: Add runtime identity helper**

Create `scripts/local-runtime/runtimeIdentity.mjs`:

```js
import fs from 'node:fs';
import path from 'node:path';

export const RUNTIME_BUILD_ID = 'plan-28-runtime-usability';

export function getRuntimeSourceSignature(root = process.cwd()) {
  const files = [
    'scripts/local-runtime/server.mjs',
    'scripts/local-runtime/missionEngine.mjs',
    'scripts/local-runtime/workerEngine.mjs',
    'scripts/local-runtime/deterministicPlanner.mjs',
  ];

  return files
    .map((file) => {
      const fullPath = path.join(root, file);
      const stat = fs.statSync(fullPath);
      return `${file}:${stat.mtimeMs}`;
    })
    .join('|');
}

export function createRuntimeIdentity(input = {}) {
  return {
    runtimeId: input.runtimeId || 'local-runtime-dev',
    buildId: input.buildId || RUNTIME_BUILD_ID,
    pid: process.pid,
    nodeVersion: process.version,
    startedAt: input.startedAt || new Date().toISOString(),
    sourceSignature: input.sourceSignature || getRuntimeSourceSignature(input.root || process.cwd()),
  };
}
```

- [ ] **Step 2: Test runtime identity**

Create `scripts/local-runtime/runtimeIdentity.test.mjs`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRuntimeIdentity } from './runtimeIdentity.mjs';

test('runtime identity exposes user-visible stale-process fields', () => {
  const identity = createRuntimeIdentity({
    runtimeId: 'test-runtime',
    buildId: 'test-build',
    startedAt: '2026-05-25T00:00:00.000Z',
    sourceSignature: 'sig',
  });

  assert.equal(identity.runtimeId, 'test-runtime');
  assert.equal(identity.buildId, 'test-build');
  assert.equal(identity.startedAt, '2026-05-25T00:00:00.000Z');
  assert.equal(identity.sourceSignature, 'sig');
  assert.equal(typeof identity.pid, 'number');
  assert.equal(typeof identity.nodeVersion, 'string');
});
```

- [ ] **Step 3: Add browser-side health helper**

Create `src/runtime/runtimeHealth.ts`:

```ts
export interface RuntimeHealthSnapshot {
  ok: boolean;
  protocol: string;
  version: string;
  runtimeId: string;
  buildId?: string;
  pid?: number;
  startedAt?: string;
  sourceSignature?: string;
  activeMissionCount?: number;
  planner?: {
    provider?: string;
    modelName?: string | null;
    configured?: boolean;
    reason?: string;
  };
}

export interface RuntimeHealthView {
  label: string;
  staleWarning: string | null;
  detailRows: Array<{ label: string; value: string }>;
}

export function buildRuntimeHealthView(
  endpoint: string,
  health: RuntimeHealthSnapshot | null,
  expectedBuildId = 'plan-28-runtime-usability',
): RuntimeHealthView {
  if (!health) {
    return {
      label: '未连接',
      staleWarning: '没有拿到 Runtime 健康信息。请确认 npm.cmd run runtime 正在项目根目录运行。',
      detailRows: [{ label: '端点', value: endpoint }],
    };
  }

  const staleWarning =
    health.buildId && health.buildId !== expectedBuildId
      ? `当前 Runtime buildId 是 ${health.buildId}，不是 ${expectedBuildId}。请重启本地 Runtime。`
      : null;

  return {
    label: health.ok ? '已连接' : '异常',
    staleWarning,
    detailRows: [
      { label: '端点', value: endpoint },
      { label: '协议', value: `${health.protocol}@${health.version}` },
      { label: 'Runtime', value: health.runtimeId },
      { label: 'Build', value: health.buildId || '未知' },
      { label: 'PID', value: health.pid ? String(health.pid) : '未知' },
      { label: '启动时间', value: health.startedAt || '未知' },
      { label: '任务数', value: String(health.activeMissionCount ?? 0) },
      { label: 'Planner', value: health.planner?.provider || '未知' },
    ],
  };
}
```

- [ ] **Step 4: Test health helper**

Create `src/runtime/runtimeHealth.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { buildRuntimeHealthView } from './runtimeHealth';

describe('buildRuntimeHealthView', () => {
  it('explains missing runtime health', () => {
    const view = buildRuntimeHealthView('http://127.0.0.1:8765', null);
    expect(view.label).toBe('未连接');
    expect(view.staleWarning).toContain('npm.cmd run runtime');
  });

  it('warns when build id is stale', () => {
    const view = buildRuntimeHealthView('http://127.0.0.1:8765', {
      ok: true,
      protocol: 'openclaw-local',
      version: '0.1.0',
      runtimeId: 'local-runtime-dev',
      buildId: 'old-build',
    });
    expect(view.staleWarning).toContain('请重启本地 Runtime');
  });

  it('shows connected details for current runtime', () => {
    const view = buildRuntimeHealthView('http://127.0.0.1:8765', {
      ok: true,
      protocol: 'openclaw-local',
      version: '0.1.0',
      runtimeId: 'local-runtime-dev',
      buildId: 'plan-28-runtime-usability',
      pid: 123,
      activeMissionCount: 2,
      planner: { provider: 'mock' },
    });
    expect(view.label).toBe('已连接');
    expect(view.staleWarning).toBeNull();
    expect(view.detailRows.find((row) => row.label === 'PID')?.value).toBe('123');
  });
});
```

- [ ] **Step 5: Wire identity into `/health`**

Modify `scripts/local-runtime/server.mjs`:

```js
import { createRuntimeIdentity } from './runtimeIdentity.mjs';

const runtimeIdentity = createRuntimeIdentity({ startedAt });
```

Update the `/health` response:

```js
json(res, 200, {
  ok: true,
  protocol: PROTOCOL,
  version: VERSION,
  ...runtimeIdentity,
  connectedClients: clients.size,
  planner: redactEnvForHealth(runtimeEnv),
  activeMissionCount: missionEngine.listMissions().length,
});
```

- [ ] **Step 6: Extend runtime store**

Modify `src/store/runtimeStore.ts`:

```ts
import type { RuntimeHealthSnapshot } from '@/runtime/runtimeHealth';

interface RuntimeState {
  // existing fields...
  health: RuntimeHealthSnapshot | null;
  setHealth: (health: RuntimeHealthSnapshot | null) => void;
}
```

Initialize and add setter:

```ts
health: null,
setHealth: (health) => set({ health }),
resetRuntime: () => set({
  status: 'idle',
  diagnostics: [],
  rawEvents: [],
  lastHeartbeatAt: null,
  health: null,
}),
```

- [ ] **Step 7: Run tests**

Run:

```powershell
npm.cmd run runtime:test
npm.cmd run test
```

Expected:

- Runtime tests pass.
- Vitest includes `runtimeHealth.test.ts` and passes.

---

### Task 2: Gateway Endpoint Editor and Reconnect UX

**Files:**
- Modify: `src/ui/dashboard/GatewayStatus.tsx`
- Modify: `src/ui/runtime/RuntimeModeSwitch.tsx`
- Modify: `src/store/runtimeStore.ts`
- Test: `src/runtime/runtimeHealth.test.ts`

- [ ] **Step 1: Add endpoint persistence decision**

Endpoint should be persisted because users may choose another port when `8765` is occupied. Use Zustand `persist` only for `endpoint`, not raw events.

Modify `src/store/runtimeStore.ts` to use `persist`:

```ts
import { persist } from 'zustand/middleware';
```

Wrap store:

```ts
export const useRuntimeStore = create<RuntimeState>()(
  persist(
    (set) => ({
      // existing state/actions
    }),
    {
      name: 'cyber-office-runtime',
      partialize: (state) => ({ endpoint: state.endpoint }),
    },
  ),
);
```

- [ ] **Step 2: Add health fetch action**

Add action in store:

```ts
refreshHealth: () => Promise<void>;
```

Implementation:

```ts
refreshHealth: async () => {
  const endpoint = useRuntimeStore.getState().endpoint.replace(/\/$/, '');
  try {
    const response = await fetch(`${endpoint}/health`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const health = await response.json();
    set({ health, status: health.ok ? 'connected' : 'error' });
  } catch {
    set({ health: null, status: 'disconnected' });
  }
},
```

- [ ] **Step 3: Add Gateway endpoint controls**

In `src/ui/dashboard/GatewayStatus.tsx`, add:

```tsx
const setRuntimeEndpoint = useRuntimeStore((s) => s.setEndpoint);
const refreshHealth = useRuntimeStore((s) => s.refreshHealth);
const runtimeHealth = useRuntimeStore((s) => s.health);
const healthView = buildRuntimeHealthView(runtimeEndpoint, runtimeHealth);
```

Add UI block:

```tsx
<div className="cyber-panel p-3 mb-3">
  <div className="text-xs text-gray-400 mb-2">本地 Runtime 端点</div>
  <div className="flex gap-2 max-sm:flex-col">
    <input
      className="cyber-input flex-1"
      value={runtimeEndpoint}
      onChange={(event) => setRuntimeEndpoint(event.target.value)}
      aria-label="Runtime endpoint"
    />
    <button className="cyber-btn" type="button" onClick={refreshHealth}>
      检查连接
    </button>
  </div>
  {healthView.staleWarning && (
    <div className="mt-2 text-xs text-amber-300 border border-amber-400/30 rounded p-2">
      {healthView.staleWarning}
    </div>
  )}
  <div className="grid grid-cols-2 max-sm:grid-cols-1 gap-2 mt-3 text-xs">
    {healthView.detailRows.map((row) => (
      <div key={row.label} className="flex justify-between gap-3 border border-white/10 rounded px-2 py-1">
        <span className="text-gray-500">{row.label}</span>
        <span className="text-gray-200 font-mono text-right break-all">{row.value}</span>
      </div>
    ))}
  </div>
</div>
```

- [ ] **Step 4: Add visible restart advice**

Add text near disconnected/stale state:

```tsx
<div className="text-xs text-gray-400 leading-relaxed">
  如果端口被旧进程占用，请先结束旧的 node 进程，或设置环境变量换端口：
  <code className="font-mono"> $env:LOCAL_RUNTIME_PORT="19765"; npm.cmd run runtime</code>
</div>
```

- [ ] **Step 5: Run UI tests**

Run:

```powershell
npm.cmd run test
```

Expected:

- Runtime store compiles.
- No TypeScript errors from new store action.

---

### Task 3: First-Class Runtime Completion Event

**Files:**
- Modify: `src/runtime/runtimeTypes.ts`
- Modify: `src/runtime/normalizeRuntimeEvent.ts`
- Modify: `src/runtime/runtimeTesting.test.ts`
- Modify: `scripts/local-runtime/missionEngine.mjs`
- Create/Modify: `scripts/local-runtime/missionCompletion.test.mjs`
- Modify: `src/store/commanderStore.ts`

- [ ] **Step 1: Add runtime message type**

Modify `src/runtime/runtimeTypes.ts`:

```ts
export type RuntimeMessageType =
  // existing values...
  | 'runtime.mission_completed';
```

- [ ] **Step 2: Normalize to Commander summary**

Modify `src/runtime/normalizeRuntimeEvent.ts`:

```ts
const MESSAGE_TO_EVENT: Partial<Record<RuntimeMessageType, EventType>> = {
  // existing mappings...
  'runtime.mission_completed': 'commander.summary_ready',
};
```

- [ ] **Step 3: Add normalization test**

Modify `src/runtime/runtimeTesting.test.ts`:

```ts
it('maps runtime mission completion into Commander summary', () => {
  const msg: RuntimeRawMessage = {
    ...baseMessage,
    runtimeEventId: 'rt-mission-completed',
    type: 'runtime.mission_completed',
    missionId: 'mission-1',
    taskId: null,
    workerId: 'worker-commander',
    payload: {
      message: '任务完成',
      summary: '已完成 3 个任务，产出 3 个产物。',
      missionStatus: 'completed',
      completedTaskCount: 3,
      artifactCount: 3,
    },
  };

  const result = normalizeRuntimeEvent(msg);
  expect(result.event?.type).toBe('commander.summary_ready');
  expect(result.event?.missionId).toBe('mission-1');
  expect(result.event?.payload.summary).toBe('已完成 3 个任务，产出 3 个产物。');
});
```

- [ ] **Step 4: Emit completion from mission engine**

Replace `emitSummaryIfCompleted` in `scripts/local-runtime/missionEngine.mjs`:

```js
function emitSummaryIfCompleted(state) {
  if (state.mission.status !== 'completed') return;

  const snapshot = state.snapshot();
  const completedTaskCount = snapshot.tasks.filter((task) => task.status === 'completed').length;
  const artifactCount = snapshot.tasks.reduce((sum, task) => sum + task.artifactIds.length, 0);

  emit('runtime.mission_completed', {
    runtimeEventId: `rt-${state.mission.id}-mission-completed-${Date.now()}`,
    missionId: state.mission.id,
    taskId: null,
    workerId: 'worker-commander',
    payload: {
      message: 'Mission completed',
      summary: `${state.mission.title} 已完成：${completedTaskCount} 个任务，${artifactCount} 个产物。`,
      missionStatus: 'completed',
      completedTaskCount,
      artifactCount,
    },
  });
}
```

- [ ] **Step 5: Fix Commander summary payload reading**

Modify `src/store/commanderStore.ts`:

```ts
if (event.type === 'commander.summary_ready') {
  const summary = String(event.payload.summary ?? event.payload.message ?? '任务已完成。');
  get().setMissionSummary(event.missionId, summary);
  if (event.payload.missionStatus === 'completed') {
    get().setMissionStatus(event.missionId, 'completed');
  }
  return;
}
```

- [ ] **Step 6: Run tests**

Run:

```powershell
npm.cmd run runtime:test
npm.cmd run test
```

Expected:

- No `runtime.adapter_error` summary tests remain.
- Completion event maps to Commander summary.

---

### Task 4: Default Approval Gate That Users Can See

**Files:**
- Modify: `scripts/local-runtime/deterministicPlanner.mjs`
- Modify: `scripts/local-runtime/workerEngine.mjs`
- Modify: `scripts/local-runtime/missionEngine.test.mjs`
- Modify: `docs/runtime/multi-agent-loop.md`

- [ ] **Step 1: Make deterministic build task high risk**

Modify the build task in `scripts/local-runtime/deterministicPlanner.mjs`:

```js
{
  id: 'build-checklist',
  role: 'builder',
  title: '生成执行清单',
  summary: '把缺口转成可执行任务清单，并在审批通过后登记为产物。',
  risk: 'high',
  dependencyIds: ['research-gap'],
  expectedArtifactKinds: ['report'],
}
```

- [ ] **Step 2: Return approval request for high-risk builder task**

Modify `scripts/local-runtime/workerEngine.mjs` before default artifact write:

```js
if (input.task.role === 'builder' && input.task.risk === 'high' && !input.approvalGranted) {
  return {
    status: 'approval_required',
    summary: 'Builder 需要用户批准后才能写入执行产物。',
    worker,
    toolRequest: {
      id: `tool-${input.mission.id}-${input.task.id}`,
      toolName: 'workspace.write_file',
      input: {
        path: `.local-runtime/${input.mission.id}-${input.task.id}.md`,
        content: `# ${input.task.title}\n\n${input.task.summary}\n`,
      },
      reason: '构建 Worker 将把执行清单写入本地 Runtime 工作区。',
      impact: '仅写入 .local-runtime 目录，不修改项目源码。',
    },
  };
}
```

- [ ] **Step 3: Pass approval-granted state after approval**

Modify `scripts/local-runtime/missionEngine.mjs` so `resolveApproval` does not re-run the same task through approval again. Keep the current direct `tools.executeApproved` path, then mark task completed and drain dependencies. Do not call `runOneTask` again for the approved task.

Expected code remains:

```js
const result = await tools.executeApproved({
  toolName: toolRequest.toolName,
  input: toolRequest.input || {},
  missionId,
  taskId: task.id,
  officeTaskId: officeTaskId(missionId, task.id),
  workerId: worker.id,
});

emit('runtime.tool_called', {
  runtimeEventId: `rt-${approvalId}-tool-called`,
  missionId,
  taskId: officeTaskId(missionId, task.id),
  workerId: worker.id,
  payload: {
    tool: toolRequest.toolName,
    resultSummary: 'Approved tool executed.',
    result,
    missionTaskId: task.id,
  },
});

state.setTaskStatus(task.id, 'completed');
emitTask('runtime.task_completed', missionId, task, worker.id, {
  outputSummary: 'Approved action completed.',
});
```

- [ ] **Step 4: Add runtime test for default approval path**

Modify `scripts/local-runtime/missionEngine.test.mjs`:

```js
test('default mission pauses at build approval and completes after approval', async () => {
  const emitted = [];
  const engine = createMissionEngine({
    workspaceRoot: process.cwd(),
    emit: (type, partial) => emitted.push({ type, partial }),
  });

  const plan = createDeterministicPlan({
    missionId: 'mission-approval-default',
    goal: '验证默认审批闭环',
  });

  const snapshot = await engine.startMission(plan);
  assert.equal(snapshot.mission.status, 'waiting_input');

  const approval = emitted.find((event) => event.type === 'runtime.approval_requested');
  assert.ok(approval);

  const resolved = await engine.resolveApproval(
    approval.partial.payload.approvalId,
    'approved',
    'test approved',
  );

  assert.equal(resolved.snapshot.mission.status, 'completed');
  assert.ok(emitted.some((event) => event.type === 'runtime.tool_called'));
  assert.ok(emitted.some((event) => event.type === 'runtime.mission_completed'));
});
```

- [ ] **Step 5: Run runtime tests**

Run:

```powershell
npm.cmd run runtime:test
```

Expected:

- New approval test passes.
- Existing worker approval tests still pass.

---

### Task 5: Approval UI Consistency and Failure Handling

**Files:**
- Modify: `src/ui/commander/ApprovalInbox.tsx`
- Create/Modify: `src/runtime/localRuntimeApproval.test.ts`

- [ ] **Step 1: Add local pending state**

In `ApprovalInbox.tsx`:

```tsx
import { useState } from 'react';

const [pendingApprovalId, setPendingApprovalId] = useState<string | null>(null);
const [approvalError, setApprovalError] = useState<string | null>(null);
```

- [ ] **Step 2: Create shared decision handler**

Add inside component:

```tsx
async function decideApproval(
  approvalId: string,
  resolution: 'approved' | 'rejected',
  localNote: string,
  runtimeNote: string,
) {
  setPendingApprovalId(approvalId);
  setApprovalError(null);
  try {
    const runtimeStore = useRuntimeStore.getState();
    if (runtimeStore.mode === 'connected') {
      await resolveLocalRuntimeApproval({
        endpoint: runtimeStore.endpoint,
        approvalId,
        resolution,
        note: runtimeNote,
      });
    }

    const adapter = getActiveWorkerAdapter();
    if (adapter) {
      if (resolution === 'approved') {
        await approveToolRequestWithAdapter(adapter, approvalId);
      } else {
        await rejectToolRequestWithAdapter(adapter, approvalId, localNote);
      }
    }

    resolveApproval(approvalId, resolution, localNote);
  } catch (error) {
    const message = error instanceof Error ? error.message : '审批同步失败';
    setApprovalError(message);
  } finally {
    setPendingApprovalId(null);
  }
}
```

- [ ] **Step 3: Replace button handlers**

Approve:

```tsx
onClick={() =>
  decideApproval(
    approval.id,
    'approved',
    '已同意，继续执行。',
    '用户在办公室中批准。',
  )
}
disabled={pendingApprovalId === approval.id}
```

Reject:

```tsx
onClick={() =>
  decideApproval(
    approval.id,
    'rejected',
    '已拒绝，需要修改后重新提交。',
    '用户在办公室中拒绝。',
  )
}
disabled={pendingApprovalId === approval.id}
```

- [ ] **Step 4: Show error message**

Add above approval list:

```tsx
{approvalError && (
  <div className="text-xs text-red-300 border border-red-500/30 rounded p-2 mb-2 bg-red-500/5">
    审批没有同步到 Runtime：{approvalError}
  </div>
)}
```

- [ ] **Step 5: Run tests and typecheck**

Run:

```powershell
npm.cmd run test
npm.cmd run build
```

Expected:

- No hook order issues.
- Build succeeds.

---

### Task 6: Remove Dead Runtime Code and Ignore Runtime Artifacts

**Files:**
- Modify: `scripts/local-runtime/server.mjs`
- Modify: `.gitignore`
- Modify: `docs/runtime/local-runtime-mvp.md`

- [ ] **Step 1: Delete `scheduleMissionEvents`**

Remove the entire unused function from `scripts/local-runtime/server.mjs`:

```js
function scheduleMissionEvents(missionId, tasks, goal) {
  // remove entire function body and declaration
}
```

Also remove unused `approvals` map if no remaining legacy path depends on it:

```js
const approvals = new Map();
```

If legacy approval handling is still needed for `/tools/request`, keep `approvalQueue` only.

- [ ] **Step 2: Simplify approval endpoint**

In `/approvals/:id/resolve`, prefer order:

1. Try `missionEngine.resolveApproval`.
2. Try `approvalQueue.resolveApproval`.
3. Return 404.

Do not keep the old `legacy` branch after `approvals` is removed.

- [ ] **Step 3: Ignore runtime artifacts**

Modify `.gitignore`:

```gitignore
.local-runtime/
```

- [ ] **Step 4: Update docs**

Modify `docs/runtime/local-runtime-mvp.md`:

```md
Runtime artifacts are written under `.local-runtime/`. This directory is ignored by git and can be deleted when you want to clear local run output.
```

- [ ] **Step 5: Run syntax and tests**

Run:

```powershell
node --check scripts\local-runtime\server.mjs
npm.cmd run runtime:test
```

Expected:

- No syntax errors.
- Runtime tests pass.

---

### Task 7: End-to-End Runtime QA Script

**Files:**
- Create: `scripts/local-runtime/e2e-user-flow.mjs`
- Modify: `package.json`
- Create: `docs/qa/runtime-user-flow-checklist.md`

- [ ] **Step 1: Add E2E script**

Create `scripts/local-runtime/e2e-user-flow.mjs`:

```js
import http from 'node:http';
import { spawn } from 'node:child_process';

const port = Number(process.env.LOCAL_RUNTIME_E2E_PORT || 19765);
const endpoint = `http://127.0.0.1:${port}`;
const events = [];

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForHealth() {
  for (let i = 0; i < 40; i += 1) {
    try {
      const response = await fetch(`${endpoint}/health`);
      if (response.ok) return response.json();
    } catch {
      await sleep(250);
    }
  }
  throw new Error('Runtime did not become healthy.');
}

function post(path, body) {
  return fetch(`${endpoint}${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function connectEvents(onApproval) {
  const req = http.get(`${endpoint}/events`, (res) => {
    res.setEncoding('utf8');
    let buffer = '';
    res.on('data', (chunk) => {
      buffer += chunk;
      const parts = buffer.split('\n\n');
      buffer = parts.pop() || '';
      for (const part of parts) {
        const line = part.split('\n').find((item) => item.startsWith('data: '));
        if (!line) continue;
        const message = JSON.parse(line.slice(6));
        events.push(message);
        if (message.type === 'runtime.approval_requested') onApproval(message);
      }
    });
  });
  return req;
}

const child = spawn(process.execPath, ['scripts/local-runtime/server.mjs'], {
  cwd: process.cwd(),
  env: { ...process.env, LOCAL_RUNTIME_PORT: String(port) },
  stdio: ['ignore', 'pipe', 'pipe'],
});

child.stderr.on('data', (data) => process.stderr.write(data));

try {
  const health = await waitForHealth();
  console.log('[health]', JSON.stringify({
    buildId: health.buildId,
    pid: health.pid,
    planner: health.planner,
  }));

  let approvalResolved = false;
  const req = connectEvents(async (message) => {
    if (approvalResolved) return;
    approvalResolved = true;
    const approvalId = message.payload.approvalId;
    const response = await post(`/approvals/${encodeURIComponent(approvalId)}/resolve`, {
      resolution: 'approved',
      note: 'E2E approved',
    });
    console.log('[approval]', response.status, await response.text());
  });

  const created = await post('/missions', {
    goal: '端到端验证：规划、审批、产物、复核、总结',
    materialNote: 'Plan 28 QA',
    constraintsText: '必须出现审批并在同意后继续。',
  });
  const plan = await created.json();
  console.log('[mission]', plan.missionId);

  await sleep(7000);
  req.destroy();

  const detail = await fetch(`${endpoint}/missions/${encodeURIComponent(plan.missionId)}`).then((r) => r.json());
  const types = events.map((event) => event.type);

  const required = [
    'runtime.task_created',
    'runtime.task_started',
    'runtime.approval_requested',
    'runtime.approval_resolved',
    'runtime.tool_called',
    'runtime.task_completed',
    'runtime.mission_completed',
  ];

  for (const type of required) {
    if (!types.includes(type)) {
      throw new Error(`Missing event type: ${type}`);
    }
  }

  if (detail.mission.mission.status !== 'completed') {
    throw new Error(`Mission did not complete: ${detail.mission.mission.status}`);
  }

  console.log('[events]', types.join(','));
  console.log('[result] PASS');
} finally {
  child.kill();
}
```

- [ ] **Step 2: Add package script**

Modify `package.json`:

```json
"runtime:e2e": "node scripts/local-runtime/e2e-user-flow.mjs"
```

- [ ] **Step 3: Add QA checklist**

Create `docs/qa/runtime-user-flow-checklist.md`:

```md
# Runtime User Flow QA Checklist

## Automated

- [ ] `npm.cmd run runtime:test`
- [ ] `npm.cmd run test`
- [ ] `npm.cmd run build`
- [ ] `npm.cmd run runtime:e2e`

## Manual Browser Flow

- [ ] Start app with `npm.cmd run dev`.
- [ ] Start runtime with `npm.cmd run runtime`.
- [ ] Open Gateway.
- [ ] Confirm endpoint is visible.
- [ ] Confirm health details show build id, pid, planner, active missions.
- [ ] Switch top runtime mode to 本地 Runtime.
- [ ] Open Commander.
- [ ] Choose 本地 Runtime.
- [ ] Enter a goal.
- [ ] Click 规划任务.
- [ ] Confirm mission graph appears.
- [ ] Confirm approval card appears.
- [ ] Click 同意.
- [ ] Confirm task resumes and completes.
- [ ] Confirm artifact rail has output.
- [ ] Confirm Mission Summary shows success.
- [ ] Confirm EventFeed does not show mission completion as adapter error.
- [ ] Refresh page and confirm persisted endpoint remains correct.
```

- [ ] **Step 4: Run E2E**

Run:

```powershell
npm.cmd run runtime:e2e
```

Expected:

```text
[result] PASS
```

---

### Task 8: Release Checklist and User Docs

**Files:**
- Modify: `docs/qa/release-readiness-checklist.md`
- Modify: `docs/qa/final-acceptance-checklist.md`
- Modify: `docs/runtime/local-runtime-mvp.md`
- Modify: `docs/runtime/multi-agent-loop.md`

- [ ] **Step 1: Update release checklist**

Add:

```md
- [ ] Plan 28 Runtime 可用性打磨：Gateway 显示 endpoint/buildId/pid，能识别旧进程，默认 mission 触发审批，审批后继续，完成后显示 Commander Summary。
```

- [ ] **Step 2: Update final acceptance checklist**

Add under Runtime:

```md
- [ ] Runtime completion uses `commander.summary_ready`, not `runtime.adapter_error`.
- [ ] Default local runtime mission pauses for approval and resumes after approval.
- [ ] Stale runtime process warning is visible when build id mismatches.
```

- [ ] **Step 3: Update local runtime docs**

Add troubleshooting:

```md
## 端口被旧 Runtime 占用

如果 Gateway 显示 buildId 不是当前版本，说明浏览器连到了旧进程。

处理方式：

1. 关闭旧的 `node scripts/local-runtime/server.mjs` 进程。
2. 或者换端口启动：

```powershell
$env:LOCAL_RUNTIME_PORT="19765"
npm.cmd run runtime
```

3. 在 Gateway 里把端点改成 `http://127.0.0.1:19765`。
4. 点击“检查连接”。
```

- [ ] **Step 4: Run full verification**

Run:

```powershell
npm.cmd run runtime:test
npm.cmd run test
npm.cmd run build
npm.cmd run runtime:e2e
```

Expected:

- Runtime tests pass.
- Frontend tests pass.
- Build succeeds.
- E2E prints `[result] PASS`.

---

## 6. Acceptance Criteria

### Functional

- [ ] Gateway can show and edit runtime endpoint.
- [ ] Gateway can fetch and display runtime health metadata.
- [ ] Health includes `buildId`, `pid`, `startedAt`, planner metadata, active mission count.
- [ ] UI warns when runtime build id is stale.
- [ ] Default local runtime mission triggers an approval request.
- [ ] Approving from UI resumes the runtime mission.
- [ ] Mission completes after approval.
- [ ] Completion appears as Commander summary, not adapter error.
- [ ] Runtime artifacts do not appear as untracked git files because `.local-runtime/` is ignored.
- [ ] Dead `scheduleMissionEvents` code is removed.

### UX

- [ ] A non-technical user can see what to do when Runtime is not running.
- [ ] The app does not silently connect to an old runtime without warning.
- [ ] Approval buttons show in-progress state.
- [ ] Approval failure leaves the approval pending and shows an error.
- [ ] Mission Summary reads like a successful result.

### Verification

- [ ] `npm.cmd run runtime:test`
- [ ] `npm.cmd run test`
- [ ] `npm.cmd run build`
- [ ] `npm.cmd run runtime:e2e`
- [ ] Manual browser QA checklist completed in `docs/qa/runtime-user-flow-checklist.md`.

---

## 7. Known Follow-Ups After Plan 28

These are deliberately not part of Plan 28:

- Bundle split for `vendor-3d` and commander/runtime circular chunk.
- Browser screenshot automation with a real Playwright dependency or Codex Browser tool.
- Runtime persistence across restarts.
- Real model worker execution beyond deterministic/mock behavior.
- Visual redesign of avatars and lobster.
- Better project onboarding command that starts Vite and Runtime together.

---

## 8. Implementation Order

1. Task 1: Runtime identity.
2. Task 2: Gateway endpoint and health UI.
3. Task 3: Completion event mapping.
4. Task 4: Default approval path.
5. Task 5: Approval UI consistency.
6. Task 6: Dead code and `.gitignore`.
7. Task 7: E2E script.
8. Task 8: Docs/checklists.

This order prevents rework: health identity comes before UI, event schema comes before Commander summary, default approval behavior comes before approval UI polishing, and E2E comes after the flow is stable.
