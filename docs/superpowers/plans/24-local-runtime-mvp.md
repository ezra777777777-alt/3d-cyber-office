# Local Runtime MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the current front-end demo into a real local-runtime MVP where the browser connects to a localhost process, submits Commander goals, receives task/approval/artifact events, and projects them into the office UI.

**Architecture:** Keep the browser as a visualization and approval surface. Add a local Node runtime process using built-in `http` and Server-Sent Events so no new npm dependency is required. The runtime emits the existing `RuntimeRawMessage` envelope, the front end normalizes those messages into `OfficeEvent`, and the existing office/event/Commander stores continue to do the projection work.

**Tech Stack:** React 18, Vite, TypeScript, Zustand, Vitest, Node ESM, built-in `node:http`, browser `EventSource`, existing `RuntimeAdapter` contract.

---

## 0. Why This Plan Exists

The project already has:

- A rich front-end office shell.
- `RuntimeAdapter` abstraction.
- Mock runtime events.
- Runtime normalization into `OfficeEvent`.
- Commander mission, approval, artifact, and workbench projection.

But the current `connected` mode is still a guarded placeholder. That means the product is still mostly a front-end demo. This plan makes the first practical jump:

1. Start a real local process.
2. Connect browser to it.
3. Submit a real Commander goal over HTTP.
4. Receive real runtime events over SSE.
5. See tasks, approvals, artifacts, logs, and office state update from external events.

This plan deliberately does **not** connect Claude/OpenAI keys yet and does **not** execute real file writes or shell commands. That is the next plan after this boundary is stable.

---

## 1. Non-Goals

Do not implement these in this plan:

- No API key input in React.
- No Claude/OpenAI/Anthropic SDK usage.
- No real file modification by runtime.
- No shell command execution.
- No WebSocket dependency.
- No cloud sync.
- No migration export of runtime credentials.
- No visual redesign.

The only practical runtime behavior in this plan is deterministic local planning and event streaming.

---

## 2. Current Files To Understand First

Claude Code should read these files before editing:

- `src/runtime/runtimeTypes.ts`
- `src/runtime/runtimeAdapter.ts`
- `src/runtime/normalizeRuntimeEvent.ts`
- `src/runtime/runtimeTesting.ts`
- `src/store/runtimeStore.ts`
- `src/ui/AppShell.tsx`
- `src/ui/runtime/RuntimeModeSwitch.tsx`
- `src/ui/dashboard/GatewayStatus.tsx`
- `src/ui/commander/CommanderComposer.tsx`
- `src/ai/commanderAdapterTypes.ts`
- `src/ai/commanderRuntimeBridge.ts`
- `src/ai/commanderAdapterTesting.ts`
- `src/store/commanderStore.ts`
- `docs/runtime/adapter-contract.md`
- `docs/runtime/local-runtime-protocol-sketch.md`
- `docs/runtime/runtime-security-checklist.md`

Important existing behavior:

- Runtime raw messages normalize through `normalizeRuntimeEvent`.
- Runtime events are dispatched through `dispatch`.
- AppShell already projects runtime events into office tasks and workbench tasks.
- Commander events with `missionId` are ingested by `commanderStore`.
- The current `connected` adapter is `createOpenClawAdapter`, which only sets `protocol_mismatch`.

---

## 3. Target User Flow

After this plan:

1. User runs:

```powershell
npm run runtime
```

2. User runs the app:

```powershell
npm run dev
```

3. User opens the browser and switches runtime mode to **本地 Runtime**.

4. Gateway shows:

- Mode: connected/local
- Status: connected
- Endpoint: `http://127.0.0.1:8765`
- Heartbeat time updates
- Raw events increase

5. User opens Commander panel and selects **本地 Runtime** as Commander adapter.

6. User enters a goal:

```text
整理当前项目的实用性缺口，生成一份执行清单。
```

7. User clicks **规划任务**.

8. Browser POSTs the goal to local runtime.

9. Runtime emits events:

- `runtime.heartbeat`
- `runtime.task_created`
- `runtime.task_planned`
- `runtime.task_assigned`
- `runtime.task_started`
- `runtime.task_progress`
- `runtime.approval_requested`
- `runtime.artifact_created`
- `runtime.task_completed`
- `commander.summary_ready` or compatible summary event

10. Front end displays:

- Tasks in task board.
- Runtime events in EventFeed.
- Approval in ApprovalInbox.
- Artifact in ArtifactRail.
- Runtime diagnostics in Gateway.

---

## 4. File Structure

### Create

- `scripts/local-runtime/server.mjs`
  - Local Node HTTP/SSE runtime server.
  - No external dependencies.
  - Serves health endpoint, event stream, mission planning endpoint, and approval endpoint.

- `src/runtime/localRuntimeProtocol.ts`
  - Browser-side request/response types for the local runtime HTTP API.
  - Helpers for endpoint normalization and URL building.

- `src/runtime/localRuntimeAdapter.ts`
  - RuntimeAdapter implementation using `EventSource`.
  - Converts SSE JSON into `RuntimeRawMessage`, normalizes via `normalizeRuntimeEvent`, and emits `NormalizedRuntimeEvent`.

- `src/runtime/localRuntimeTesting.ts`
  - Pure helpers for validating local runtime payloads, URL construction, and runtime message conversion.

- `src/runtime/localRuntimeTesting.test.ts`
  - Unit tests for protocol helpers and adapter-safe conversion logic.

- `src/ai/localRuntimeCommanderAdapter.ts`
  - Commander planner/execution adapter that POSTs goals to the local runtime.
  - It should not hold secrets.
  - It should return `CommanderPlannerResult` from the runtime response.

- `src/ai/localRuntimeCommanderAdapter.test.ts`
  - Unit tests for request shaping and response validation using fake fetch.

- `docs/runtime/local-runtime-mvp.md`
  - User-facing setup and troubleshooting guide.

### Modify

- `package.json`
  - Add `runtime` script.

- `src/runtime/runtimeTypes.ts`
  - Add missing runtime message type if needed for `commander.summary_ready`.
  - Keep compatibility with existing event names.

- `src/runtime/normalizeRuntimeEvent.ts`
  - Map any new runtime summary event to existing `commander.summary_ready`.
  - Keep unknown messages as diagnostics.

- `src/store/runtimeStore.ts`
  - Store endpoint and connection error clearly.
  - Optional: persist endpoint only, never raw events or secrets.

- `src/ui/AppShell.tsx`
  - Use `createLocalRuntimeAdapter` for `connected` mode.
  - Stop using `createOpenClawAdapter` as the connected runtime path.

- `src/ui/runtime/RuntimeModeSwitch.tsx`
  - Fix mojibake.
  - Rename connected label to **本地 Runtime**.

- `src/ui/dashboard/GatewayStatus.tsx`
  - Fix mojibake.
  - Show local runtime start command.
  - Show endpoint.
  - Show common failure explanations.

- `src/ui/commander/CommanderComposer.tsx`
  - Add Commander adapter mode `local_runtime`.
  - On `local_runtime`, call `createLocalRuntimeCommanderPlanner`.

- `src/ai/commanderAdapterTypes.ts`
  - Add `local_runtime` to `CommanderAdapterMode`.

- `docs/runtime/adapter-contract.md`
  - Add Local Runtime MVP section.

- `docs/runtime/runtime-security-checklist.md`
  - Add “Plan 24 Runtime MVP” safety checklist.

---

## 5. Protocol Contract

### 5.1 Runtime Server Endpoints

The local runtime process should listen on:

```text
http://127.0.0.1:8765
```

Required endpoints:

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/health` | Returns runtime status JSON. |
| GET | `/events` | SSE stream of runtime raw messages. |
| POST | `/missions` | Accepts Commander goal and returns a structured plan. |
| POST | `/approvals/:approvalId/resolve` | Accepts approval or rejection. |

### 5.2 Health Response

```json
{
  "ok": true,
  "protocol": "openclaw-local",
  "version": "0.1.0",
  "runtimeId": "local-runtime-dev",
  "startedAt": "2026-05-25T00:00:00.000Z"
}
```

### 5.3 Mission Request

```json
{
  "goal": "整理当前项目的实用性缺口，生成一份执行清单。",
  "materialNote": "用户希望先做实用性，不再优先打磨视觉。",
  "constraintsText": "不要真实写文件；不要调用外部网络；高风险动作必须审批。",
  "requestedAt": "2026-05-25T00:00:00.000Z"
}
```

### 5.4 Mission Response

```json
{
  "missionId": "mission-local-1716600000000",
  "missionTitle": "整理当前项目的实用性缺口",
  "missionSummary": "本地 Runtime 已将目标拆成调研、执行、复核三步。",
  "tasks": [
    {
      "id": "research-gap",
      "role": "researcher",
      "title": "梳理实用性缺口",
      "summary": "读取当前项目模块，列出真实可用性缺口。",
      "risk": "low",
      "dependencyIds": [],
      "expectedArtifactKinds": ["notes"]
    },
    {
      "id": "build-checklist",
      "role": "builder",
      "title": "生成执行清单",
      "summary": "把缺口转成可执行任务清单。",
      "risk": "medium",
      "dependencyIds": ["research-gap"],
      "expectedArtifactKinds": ["report"]
    },
    {
      "id": "review-output",
      "role": "reviewer",
      "title": "复核交付质量",
      "summary": "检查清单是否能指导下一步开发。",
      "risk": "low",
      "dependencyIds": ["build-checklist"],
      "expectedArtifactKinds": ["review"]
    }
  ]
}
```

### 5.5 SSE Event Format

Each event should be sent as:

```text
event: runtime-message
data: {"runtimeEventId":"rt-1","protocol":"openclaw-local","version":"0.1.0","type":"runtime.heartbeat","occurredAt":"2026-05-25T00:00:00.000Z","workerId":null,"taskId":null,"missionId":null,"payload":{"status":"connected"}}

```

Browser adapter should ignore non-JSON lines and report malformed JSON as diagnostics.

---

## 6. Task 1: Add Local Runtime Protocol Helpers

**Files:**

- Create: `src/runtime/localRuntimeProtocol.ts`
- Create: `src/runtime/localRuntimeTesting.ts`
- Create: `src/runtime/localRuntimeTesting.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/runtime/localRuntimeTesting.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  buildLocalRuntimeUrl,
  isLocalRuntimeMissionResponse,
  toRuntimeRawMessage,
} from './localRuntimeTesting';

describe('local runtime protocol helpers', () => {
  it('builds stable endpoint URLs without duplicate slashes', () => {
    expect(buildLocalRuntimeUrl('http://127.0.0.1:8765/', '/events')).toBe('http://127.0.0.1:8765/events');
    expect(buildLocalRuntimeUrl('http://127.0.0.1:8765', 'missions')).toBe('http://127.0.0.1:8765/missions');
  });

  it('accepts a valid three-step mission response', () => {
    expect(isLocalRuntimeMissionResponse({
      missionId: 'mission-local-1',
      missionTitle: '整理项目实用性',
      missionSummary: '拆分为调研、执行、复核。',
      tasks: [
        { id: 'research-gap', role: 'researcher', title: '调研', summary: '调研缺口', risk: 'low', dependencyIds: [], expectedArtifactKinds: ['notes'] },
        { id: 'build-checklist', role: 'builder', title: '执行', summary: '生成清单', risk: 'medium', dependencyIds: ['research-gap'], expectedArtifactKinds: ['report'] },
        { id: 'review-output', role: 'reviewer', title: '复核', summary: '复核结果', risk: 'low', dependencyIds: ['build-checklist'], expectedArtifactKinds: ['review'] },
      ],
    })).toBe(true);
  });

  it('rejects mission responses without researcher builder and reviewer roles', () => {
    expect(isLocalRuntimeMissionResponse({
      missionId: 'mission-local-1',
      missionTitle: '坏响应',
      tasks: [
        { id: 'only-one', role: 'researcher', title: '调研', summary: '调研', risk: 'low' },
      ],
    })).toBe(false);
  });

  it('converts local runtime SSE payloads to RuntimeRawMessage safely', () => {
    const raw = toRuntimeRawMessage({
      runtimeEventId: 'rt-local-1',
      type: 'runtime.task_created',
      occurredAt: '2026-05-25T00:00:00.000Z',
      workerId: 'worker-research',
      taskId: 'runtime-task-1',
      missionId: 'mission-local-1',
      payload: { title: '调研缺口' },
    });

    expect(raw).toMatchObject({
      runtimeEventId: 'rt-local-1',
      protocol: 'openclaw-local',
      version: '0.1.0',
      type: 'runtime.task_created',
      workerId: 'worker-research',
      taskId: 'runtime-task-1',
      missionId: 'mission-local-1',
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```powershell
npm.cmd run test -- src/runtime/localRuntimeTesting.test.ts
```

Expected:

```text
FAIL src/runtime/localRuntimeTesting.test.ts
Cannot find module './localRuntimeTesting'
```

- [ ] **Step 3: Implement protocol types**

Create `src/runtime/localRuntimeProtocol.ts`:

```ts
import type { RuntimeMessageType, RuntimeRawMessage } from './runtimeTypes';
import type { PlannedMissionTask } from '@/ai/commanderAdapterTypes';

export const LOCAL_RUNTIME_PROTOCOL = 'openclaw-local';
export const LOCAL_RUNTIME_VERSION = '0.1.0';
export const DEFAULT_LOCAL_RUNTIME_ENDPOINT = 'http://127.0.0.1:8765';

export interface LocalRuntimeMissionRequest {
  goal: string;
  materialNote: string;
  constraintsText: string;
  requestedAt: string;
}

export interface LocalRuntimeMissionResponse {
  missionId: string;
  missionTitle: string;
  missionSummary?: string;
  tasks: PlannedMissionTask[];
}

export interface LocalRuntimeSsePayload {
  runtimeEventId: string;
  type: RuntimeMessageType;
  occurredAt: string;
  workerId: string | null;
  taskId: string | null;
  missionId?: string | null;
  payload: Record<string, unknown>;
}

export type LocalRuntimeRawMessage = RuntimeRawMessage;
```

- [ ] **Step 4: Implement pure helpers**

Create `src/runtime/localRuntimeTesting.ts`:

```ts
import type { PlannedMissionTask, ToolRisk, WorkerRole } from '@/ai/commanderAdapterTypes';
import type { RuntimeRawMessage } from './runtimeTypes';
import {
  DEFAULT_LOCAL_RUNTIME_ENDPOINT,
  LOCAL_RUNTIME_PROTOCOL,
  LOCAL_RUNTIME_VERSION,
  type LocalRuntimeMissionResponse,
  type LocalRuntimeSsePayload,
} from './localRuntimeProtocol';

const ROLES: WorkerRole[] = ['researcher', 'builder', 'reviewer'];
const RISKS: ToolRisk[] = ['low', 'medium', 'high', 'critical'];

export function buildLocalRuntimeUrl(endpoint: string, path: string): string {
  const cleanEndpoint = (endpoint || DEFAULT_LOCAL_RUNTIME_ENDPOINT).replace(/\/+$/, '');
  const cleanPath = path.replace(/^\/+/, '');
  return `${cleanEndpoint}/${cleanPath}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isPlannedMissionTask(value: unknown): value is PlannedMissionTask {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === 'string'
    && typeof value.title === 'string'
    && typeof value.summary === 'string'
    && ROLES.includes(value.role as WorkerRole)
    && RISKS.includes(value.risk as ToolRisk)
  );
}

export function isLocalRuntimeMissionResponse(value: unknown): value is LocalRuntimeMissionResponse {
  if (!isRecord(value)) return false;
  if (typeof value.missionId !== 'string') return false;
  if (typeof value.missionTitle !== 'string' || !value.missionTitle.trim()) return false;
  if (!Array.isArray(value.tasks) || value.tasks.length < 3) return false;

  const tasks = value.tasks;
  const roles = new Set(tasks.filter(isPlannedMissionTask).map((task) => task.role));
  return tasks.every(isPlannedMissionTask)
    && roles.has('researcher')
    && roles.has('builder')
    && roles.has('reviewer');
}

export function toRuntimeRawMessage(payload: LocalRuntimeSsePayload): RuntimeRawMessage {
  return {
    runtimeEventId: payload.runtimeEventId,
    protocol: LOCAL_RUNTIME_PROTOCOL,
    version: LOCAL_RUNTIME_VERSION,
    type: payload.type,
    occurredAt: payload.occurredAt,
    workerId: payload.workerId,
    taskId: payload.taskId,
    missionId: payload.missionId ?? null,
    payload: payload.payload ?? {},
  };
}
```

- [ ] **Step 5: Run test to verify it passes**

Run:

```powershell
npm.cmd run test -- src/runtime/localRuntimeTesting.test.ts
```

Expected:

```text
PASS src/runtime/localRuntimeTesting.test.ts
```

---

## 7. Task 2: Build Local Runtime Server

**Files:**

- Create: `scripts/local-runtime/server.mjs`
- Modify: `package.json`
- Create: `docs/runtime/local-runtime-mvp.md`

- [ ] **Step 1: Add npm script**

Modify `package.json` scripts:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "runtime": "node scripts/local-runtime/server.mjs"
  }
}
```

- [ ] **Step 2: Create local runtime server**

Create `scripts/local-runtime/server.mjs`:

```js
import http from 'node:http';

const HOST = '127.0.0.1';
const PORT = Number(process.env.LOCAL_RUNTIME_PORT || 8765);
const PROTOCOL = 'openclaw-local';
const VERSION = '0.1.0';
const startedAt = new Date().toISOString();

/** @type {Set<http.ServerResponse>} */
const clients = new Set();
const approvals = new Map();

function now() {
  return new Date().toISOString();
}

function json(res, status, body) {
  const text = JSON.stringify(body);
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'access-control-allow-origin': '*',
    'access-control-allow-methods': 'GET,POST,OPTIONS',
    'access-control-allow-headers': 'content-type',
  });
  res.end(text);
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 1024 * 1024) {
        reject(new Error('Request body too large'));
        req.destroy();
      }
    });
    req.on('end', () => {
      if (!body.trim()) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new Error('Invalid JSON'));
      }
    });
    req.on('error', reject);
  });
}

function sendSse(res, message) {
  res.write('event: runtime-message\n');
  res.write(`data: ${JSON.stringify(message)}\n\n`);
}

function broadcast(type, partial) {
  const message = {
    runtimeEventId: partial.runtimeEventId,
    protocol: PROTOCOL,
    version: VERSION,
    type,
    occurredAt: partial.occurredAt || now(),
    workerId: partial.workerId ?? null,
    taskId: partial.taskId ?? null,
    missionId: partial.missionId ?? null,
    payload: partial.payload || {},
  };

  for (const client of clients) sendSse(client, message);
  return message;
}

function makeTasks(goal) {
  return [
    {
      id: 'research-gap',
      role: 'researcher',
      title: '梳理实用性缺口',
      summary: `围绕目标“${goal}”读取上下文，整理当前可用性缺口。`,
      risk: 'low',
      dependencyIds: [],
      expectedArtifactKinds: ['notes'],
    },
    {
      id: 'build-checklist',
      role: 'builder',
      title: '生成执行清单',
      summary: '把缺口转成可执行任务清单，并标出优先级。',
      risk: 'medium',
      dependencyIds: ['research-gap'],
      expectedArtifactKinds: ['report'],
    },
    {
      id: 'review-output',
      role: 'reviewer',
      title: '复核交付质量',
      summary: '检查执行清单是否完整、可落地、没有越权行为。',
      risk: 'low',
      dependencyIds: ['build-checklist'],
      expectedArtifactKinds: ['review'],
    },
  ];
}

function scheduleMissionEvents(missionId, tasks, goal) {
  const workerMap = {
    researcher: 'worker-research',
    builder: 'worker-builder',
    reviewer: 'worker-review',
  };

  tasks.forEach((task, index) => {
    const workerId = workerMap[task.role] || 'worker-research';
    const officeTaskId = `runtime-${missionId}-${task.id}`;
    const delay = 600 + index * 1400;

    setTimeout(() => {
      broadcast('runtime.task_created', {
        runtimeEventId: `rt-${missionId}-${task.id}-created`,
        missionId,
        taskId: officeTaskId,
        workerId,
        payload: { title: task.title, summary: task.summary, missionTaskId: task.id },
      });
      broadcast('runtime.task_planned', {
        runtimeEventId: `rt-${missionId}-${task.id}-planned`,
        missionId,
        taskId: officeTaskId,
        workerId,
        payload: { title: task.title, summary: task.summary, missionTaskId: task.id },
      });
      broadcast('runtime.task_assigned', {
        runtimeEventId: `rt-${missionId}-${task.id}-assigned`,
        missionId,
        taskId: officeTaskId,
        workerId,
        payload: { missionTaskId: task.id },
      });
      broadcast('runtime.task_started', {
        runtimeEventId: `rt-${missionId}-${task.id}-started`,
        missionId,
        taskId: officeTaskId,
        workerId,
        payload: { message: `${task.title} 已开始`, missionTaskId: task.id },
      });
    }, delay);

    setTimeout(() => {
      broadcast('runtime.task_progress', {
        runtimeEventId: `rt-${missionId}-${task.id}-progress`,
        missionId,
        taskId: officeTaskId,
        workerId,
        payload: { progress: 66, message: `${task.title} 正在推进`, missionTaskId: task.id },
      });
    }, delay + 500);

    if (task.id === 'build-checklist') {
      const approvalId = `approval-${missionId}-build`;
      approvals.set(approvalId, { missionId, task, officeTaskId, workerId, status: 'pending' });
      setTimeout(() => {
        broadcast('runtime.approval_requested', {
          runtimeEventId: `rt-${missionId}-${task.id}-approval`,
          missionId,
          taskId: officeTaskId,
          workerId,
          payload: {
            approvalId,
            missionTaskId: task.id,
            action: 'write_file',
            reason: '需要把执行清单作为产物登记到办公室。',
            target: 'runtime-artifacts/usability-checklist.md',
            impact: '本 MVP 只登记产物元数据，不写入真实文件。',
            risk: 'medium',
          },
        });
      }, delay + 850);
    }

    setTimeout(() => {
      broadcast('runtime.artifact_created', {
        runtimeEventId: `rt-${missionId}-${task.id}-artifact`,
        missionId,
        taskId: officeTaskId,
        workerId,
        payload: {
          artifactId: `artifact-${missionId}-${task.id}`,
          title: `${task.title}产物`,
          kind: task.expectedArtifactKinds?.[0] || 'report',
          path: `runtime-artifacts/${task.id}.md`,
          summary: `${task.title}已生成模拟产物。目标：${goal}`,
          missionTaskId: task.id,
        },
      });
      broadcast('runtime.task_completed', {
        runtimeEventId: `rt-${missionId}-${task.id}-completed`,
        missionId,
        taskId: officeTaskId,
        workerId,
        payload: { outputSummary: `${task.title}已完成`, missionTaskId: task.id },
      });
    }, delay + 1150);
  });

  setTimeout(() => {
    broadcast('runtime.adapter_error', {
      runtimeEventId: `rt-${missionId}-summary`,
      missionId,
      payload: {
        message: 'Mission summary ready',
        summary: `本地 Runtime 已完成目标“${goal}”的三步模拟执行，并生成 3 个产物元数据。`,
        severity: 'info',
      },
    });
  }, 600 + tasks.length * 1400 + 1600);
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    json(res, 204, {});
    return;
  }

  const url = new URL(req.url || '/', `http://${HOST}:${PORT}`);

  if (req.method === 'GET' && url.pathname === '/health') {
    json(res, 200, {
      ok: true,
      protocol: PROTOCOL,
      version: VERSION,
      runtimeId: 'local-runtime-dev',
      startedAt,
      connectedClients: clients.size,
    });
    return;
  }

  if (req.method === 'GET' && url.pathname === '/events') {
    res.writeHead(200, {
      'content-type': 'text/event-stream; charset=utf-8',
      'cache-control': 'no-cache',
      connection: 'keep-alive',
      'access-control-allow-origin': '*',
    });
    clients.add(res);
    sendSse(res, {
      runtimeEventId: `rt-heartbeat-${Date.now()}`,
      protocol: PROTOCOL,
      version: VERSION,
      type: 'runtime.heartbeat',
      occurredAt: now(),
      workerId: null,
      taskId: null,
      missionId: null,
      payload: { status: 'connected', runtimeId: 'local-runtime-dev' },
    });
    req.on('close', () => clients.delete(res));
    return;
  }

  if (req.method === 'POST' && url.pathname === '/missions') {
    try {
      const body = await readJson(req);
      const goal = typeof body.goal === 'string' && body.goal.trim()
        ? body.goal.trim()
        : '整理当前项目实用性';
      const missionId = `mission-local-${Date.now()}`;
      const tasks = makeTasks(goal);
      const response = {
        missionId,
        missionTitle: goal.slice(0, 40),
        missionSummary: '本地 Runtime 已将目标拆成调研、执行、复核三步。',
        tasks,
      };
      json(res, 200, response);
      scheduleMissionEvents(missionId, tasks, goal);
    } catch (error) {
      json(res, 400, { ok: false, error: error instanceof Error ? error.message : 'Bad request' });
    }
    return;
  }

  const approvalMatch = url.pathname.match(/^\/approvals\/([^/]+)\/resolve$/);
  if (req.method === 'POST' && approvalMatch) {
    const approvalId = decodeURIComponent(approvalMatch[1]);
    const approval = approvals.get(approvalId);
    const body = await readJson(req).catch(() => ({}));
    const resolution = body.resolution === 'rejected' ? 'rejected' : 'approved';

    if (!approval) {
      json(res, 404, { ok: false, error: 'Approval not found' });
      return;
    }

    approval.status = resolution;
    broadcast('runtime.approval_resolved', {
      runtimeEventId: `rt-${approvalId}-resolved`,
      missionId: approval.missionId,
      taskId: approval.officeTaskId,
      workerId: approval.workerId,
      payload: {
        approvalId,
        resolution,
        note: typeof body.note === 'string' ? body.note : `Local runtime approval ${resolution}`,
      },
    });
    json(res, 200, { ok: true, approvalId, resolution });
    return;
  }

  json(res, 404, { ok: false, error: 'Not found' });
});

server.listen(PORT, HOST, () => {
  console.log(`[local-runtime] listening on http://${HOST}:${PORT}`);
});
```

- [ ] **Step 3: Run server manually**

Run in one terminal:

```powershell
npm.cmd run runtime
```

Expected:

```text
[local-runtime] listening on http://127.0.0.1:8765
```

Run in another terminal:

```powershell
Invoke-WebRequest -UseBasicParsing http://127.0.0.1:8765/health
```

Expected:

```text
StatusCode : 200
```

- [ ] **Step 4: Add runtime guide**

Create `docs/runtime/local-runtime-mvp.md`:

```md
# Local Runtime MVP

## Start

Run the local runtime:

```powershell
npm run runtime
```

Run the app:

```powershell
npm run dev
```

Open the app, switch Runtime mode to 本地 Runtime, then open Gateway.

## What This Runtime Does

- Accepts Commander goals at `POST /missions`.
- Streams runtime messages from `GET /events`.
- Emits heartbeat, task, approval, artifact, and completion events.
- Does not write files.
- Does not run shell commands.
- Does not store or request API keys.

## Troubleshooting

If Gateway shows disconnected:

1. Confirm `npm run runtime` is still running.
2. Open `http://127.0.0.1:8765/health`.
3. Confirm no other process is using port `8765`.
4. Switch Runtime mode to offline, then back to 本地 Runtime.

## Safety

This runtime is intentionally deterministic. Real model calls and real tool execution must be added in a later plan with explicit approval gates.
```

---

## 8. Task 3: Add Browser Local Runtime Adapter

**Files:**

- Create: `src/runtime/localRuntimeAdapter.ts`
- Modify: `src/ui/AppShell.tsx`
- Modify: `src/runtime/runtimeTypes.ts` if needed
- Modify: `src/runtime/normalizeRuntimeEvent.ts` if needed

- [ ] **Step 1: Write failing adapter tests**

Add to `src/runtime/localRuntimeTesting.test.ts`:

```ts
import { buildRuntimeConnectionDiagnostic } from './localRuntimeTesting';

it('builds a readable connection diagnostic', () => {
  expect(buildRuntimeConnectionDiagnostic('http://127.0.0.1:8765', 'Connection failed')).toMatchObject({
    kind: 'disconnect',
    severity: 'error',
    title: 'Local Runtime disconnected',
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```powershell
npm.cmd run test -- src/runtime/localRuntimeTesting.test.ts
```

Expected:

```text
FAIL buildRuntimeConnectionDiagnostic is not a function
```

- [ ] **Step 3: Implement diagnostic helper**

Append to `src/runtime/localRuntimeTesting.ts`:

```ts
import type { GatewayDiagnostic } from '@/core/types';

export function buildRuntimeConnectionDiagnostic(endpoint: string, message: string): GatewayDiagnostic {
  return {
    id: `local-runtime-disconnect-${Date.now()}`,
    kind: 'disconnect',
    severity: 'error',
    title: 'Local Runtime disconnected',
    detail: `${message}. Endpoint: ${endpoint}`,
  };
}
```

- [ ] **Step 4: Implement adapter**

Create `src/runtime/localRuntimeAdapter.ts`:

```ts
import { normalizeRuntimeEvent } from './normalizeRuntimeEvent';
import type { RuntimeAdapter } from './runtimeAdapter';
import type { NormalizedRuntimeEvent, RuntimeConnectionStatus, RuntimeRawMessage } from './runtimeTypes';
import { buildLocalRuntimeUrl, buildRuntimeConnectionDiagnostic } from './localRuntimeTesting';

export interface LocalRuntimeAdapterConfig {
  endpoint: string;
}

export function createLocalRuntimeAdapter(config: LocalRuntimeAdapterConfig): RuntimeAdapter {
  let status: RuntimeConnectionStatus = 'idle';
  let source: EventSource | null = null;

  return {
    id: 'local-runtime',
    label: 'Local Runtime',
    getStatus: () => status,
    start: (emit: (event: NormalizedRuntimeEvent) => void) => {
      if (typeof window === 'undefined') {
        status = 'error';
        return;
      }

      status = 'connecting';
      const url = buildLocalRuntimeUrl(config.endpoint, '/events');
      source = new EventSource(url);

      source.addEventListener('open', () => {
        status = 'connected';
      });

      source.addEventListener('runtime-message', (message) => {
        try {
          const raw = JSON.parse((message as MessageEvent).data) as RuntimeRawMessage;
          status = 'connected';
          emit(normalizeRuntimeEvent(raw));
        } catch (error) {
          status = 'degraded';
          const detail = error instanceof Error ? error.message : 'Malformed SSE payload';
          emit({
            raw: {
              runtimeEventId: `local-runtime-malformed-${Date.now()}`,
              protocol: 'openclaw-local',
              version: '0.1.0',
              type: 'runtime.adapter_error',
              occurredAt: new Date().toISOString(),
              workerId: null,
              taskId: null,
              missionId: null,
              payload: { message: detail },
            },
            event: null,
            diagnostics: [buildRuntimeConnectionDiagnostic(config.endpoint, detail)],
          });
        }
      });

      source.addEventListener('error', () => {
        status = 'disconnected';
        emit({
          raw: {
            runtimeEventId: `local-runtime-disconnect-${Date.now()}`,
            protocol: 'openclaw-local',
            version: '0.1.0',
            type: 'runtime.adapter_error',
            occurredAt: new Date().toISOString(),
            workerId: null,
            taskId: null,
            missionId: null,
            payload: { message: 'Local Runtime connection failed' },
          },
          event: null,
          diagnostics: [buildRuntimeConnectionDiagnostic(config.endpoint, 'Connection failed')],
        });
      });
    },
    stop: () => {
      source?.close();
      source = null;
      status = 'disconnected';
    },
  };
}
```

- [ ] **Step 5: Wire AppShell connected mode to local adapter**

Modify imports in `src/ui/AppShell.tsx`:

```ts
import { createLocalRuntimeAdapter } from '@/runtime/localRuntimeAdapter';
```

Remove this import if no longer used:

```ts
import { createOpenClawAdapter } from '@/runtime/openClawAdapter';
```

Replace the connected adapter block:

```ts
if (runtimeMode === 'mock') {
  adapter = createMockRuntimeAdapter();
} else if (runtimeMode === 'connected') {
  adapter = createLocalRuntimeAdapter({ endpoint: runtimeEndpoint });
} else {
  return;
}
```

- [ ] **Step 6: Run tests**

Run:

```powershell
npm.cmd run test -- src/runtime/localRuntimeTesting.test.ts src/runtime/runtimeTesting.test.ts
```

Expected:

```text
PASS
```

---

## 9. Task 4: Add Local Runtime Commander Planner

**Files:**

- Modify: `src/ai/commanderAdapterTypes.ts`
- Create: `src/ai/localRuntimeCommanderAdapter.ts`
- Create: `src/ai/localRuntimeCommanderAdapter.test.ts`
- Modify: `src/ui/commander/CommanderComposer.tsx`

- [ ] **Step 1: Write failing tests**

Create `src/ai/localRuntimeCommanderAdapter.test.ts`:

```ts
import { describe, expect, it, vi } from 'vitest';
import { createLocalRuntimeCommanderPlanner } from './localRuntimeCommanderAdapter';

describe('local runtime commander planner', () => {
  it('posts Commander goal to local runtime and returns planner result', async () => {
    const fetcher = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        missionId: 'mission-local-1',
        missionTitle: '整理实用性缺口',
        missionSummary: '本地 runtime 规划完成。',
        tasks: [
          { id: 'research-gap', role: 'researcher', title: '调研', summary: '调研缺口', risk: 'low', dependencyIds: [], expectedArtifactKinds: ['notes'] },
          { id: 'build-checklist', role: 'builder', title: '执行', summary: '生成清单', risk: 'medium', dependencyIds: ['research-gap'], expectedArtifactKinds: ['report'] },
          { id: 'review-output', role: 'reviewer', title: '复核', summary: '复核清单', risk: 'low', dependencyIds: ['build-checklist'], expectedArtifactKinds: ['review'] },
        ],
      }),
    }));

    const planner = createLocalRuntimeCommanderPlanner({
      endpoint: 'http://127.0.0.1:8765',
      fetcher: fetcher as unknown as typeof fetch,
    });

    const result = await planner.plan({
      goal: '整理实用性缺口',
      materialNote: '先做实用性',
      constraintsText: '不要真实写文件',
      requestedAt: '2026-05-25T00:00:00.000Z',
    });

    expect(fetcher).toHaveBeenCalledWith('http://127.0.0.1:8765/missions', expect.objectContaining({
      method: 'POST',
      headers: { 'content-type': 'application/json' },
    }));
    expect(result.missionTitle).toBe('整理实用性缺口');
    expect(result.tasks).toHaveLength(3);
  });

  it('fails closed when runtime returns an invalid plan', async () => {
    const fetcher = vi.fn(async () => ({
      ok: true,
      json: async () => ({ missionTitle: 'bad', tasks: [] }),
    }));

    const planner = createLocalRuntimeCommanderPlanner({
      endpoint: 'http://127.0.0.1:8765',
      fetcher: fetcher as unknown as typeof fetch,
    });

    await expect(planner.plan({
      goal: 'bad',
      materialNote: '',
      constraintsText: '',
      requestedAt: '2026-05-25T00:00:00.000Z',
    })).rejects.toThrow('Invalid local runtime planner response');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```powershell
npm.cmd run test -- src/ai/localRuntimeCommanderAdapter.test.ts
```

Expected:

```text
FAIL Cannot find module './localRuntimeCommanderAdapter'
```

- [ ] **Step 3: Add adapter mode type**

Modify `src/ai/commanderAdapterTypes.ts`:

```ts
export type CommanderAdapterMode = 'demo' | 'mock_ai' | 'guarded_real' | 'local_runtime';
```

- [ ] **Step 4: Implement local runtime planner**

Create `src/ai/localRuntimeCommanderAdapter.ts`:

```ts
import type {
  CommanderGoalInput,
  CommanderPlannerAdapter,
  CommanderAdapterStatus,
} from './commanderAdapterTypes';
import { buildLocalRuntimeUrl, isLocalRuntimeMissionResponse } from '@/runtime/localRuntimeTesting';
import type { LocalRuntimeMissionRequest } from '@/runtime/localRuntimeProtocol';

interface LocalRuntimeCommanderPlannerConfig {
  endpoint: string;
  fetcher?: typeof fetch;
}

export function createLocalRuntimeCommanderPlanner(
  config: LocalRuntimeCommanderPlannerConfig,
): CommanderPlannerAdapter {
  let status: CommanderAdapterStatus = 'idle';
  const fetcher = config.fetcher ?? fetch;

  return {
    mode: 'local_runtime',
    getStatus: () => status,
    async plan(input: CommanderGoalInput) {
      status = 'planning';
      const body: LocalRuntimeMissionRequest = {
        goal: input.goal,
        materialNote: input.materialNote,
        constraintsText: input.constraintsText,
        requestedAt: input.requestedAt,
      };

      const response = await fetcher(buildLocalRuntimeUrl(config.endpoint, '/missions'), {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        status = 'guarded';
        throw new Error(`Local runtime planner failed: HTTP ${response.status}`);
      }

      const json = await response.json();
      if (!isLocalRuntimeMissionResponse(json)) {
        status = 'guarded';
        throw new Error('Invalid local runtime planner response');
      }

      status = 'executing';
      return {
        missionTitle: json.missionTitle,
        missionSummary: json.missionSummary,
        tasks: json.tasks,
      };
    },
  };
}
```

- [ ] **Step 5: Wire Composer mode**

Modify `src/ui/commander/CommanderComposer.tsx`.

Add import:

```ts
import { createLocalRuntimeCommanderPlanner } from '@/ai/localRuntimeCommanderAdapter';
```

Add runtime endpoint selector:

```ts
const runtimeEndpoint = useRuntimeStore((state) => state.endpoint);
```

Replace `MODES`:

```ts
const MODES: { key: CommanderAdapterMode; label: string }[] = [
  { key: 'demo', label: 'Demo' },
  { key: 'mock_ai', label: 'Mock AI' },
  { key: 'local_runtime', label: '本地 Runtime' },
  { key: 'guarded_real', label: '真实占位' },
];
```

Replace planner selection:

```ts
const planner =
  adapterMode === 'mock_ai'
    ? createMockCommanderPlanner()
    : adapterMode === 'local_runtime'
      ? createLocalRuntimeCommanderPlanner({ endpoint: runtimeEndpoint })
      : createGuardedRealCommanderPlanner();
```

Update the helper text:

```tsx
{adapterMode !== 'demo' && (
  <p className="text-xs text-gray-500 mb-2">
    {adapterMode === 'mock_ai'
      ? 'Mock AI 会模拟真实规划和审批，不会执行真实副作用。'
      : adapterMode === 'local_runtime'
        ? '本地 Runtime 会把目标发送到 localhost 进程，由外部进程回传任务、审批和产物事件。'
        : '真实占位模式不会请求 token。真实 AI 接入必须通过外部 Runtime Adapter。'}
  </p>
)}
```

- [ ] **Step 6: Run tests**

Run:

```powershell
npm.cmd run test -- src/ai/localRuntimeCommanderAdapter.test.ts src/ai/commanderAdapterTesting.test.ts
```

Expected:

```text
PASS
```

---

## 10. Task 5: Fix Runtime UI Chinese And Gateway Guidance

**Files:**

- Modify: `src/ui/runtime/RuntimeModeSwitch.tsx`
- Modify: `src/ui/dashboard/GatewayStatus.tsx`
- Modify: `src/i18n/zh.ts` if existing labels should be centralized

- [ ] **Step 1: Replace mojibake in RuntimeModeSwitch**

Modify `src/ui/runtime/RuntimeModeSwitch.tsx` so visible strings are valid Chinese:

```tsx
<span className="text-gray-400 text-xs font-medium">运行时</span>
```

Ensure `labelForRuntimeMode('connected')` shows:

```text
本地 Runtime
```

If `src/i18n/zh.ts` contains the runtime mode labels, update there instead of hard-coding.

- [ ] **Step 2: Replace mojibake in GatewayStatus**

Use these labels:

```ts
const STATUS_LABELS: Record<string, string> = {
  connected: '已连接',
  connecting: '连接中',
  disconnected: '已断开',
  error: '错误',
  protocol_mismatch: '协议不匹配',
  idle: '待机',
  degraded: '降级',
};
```

Use this advice function:

```ts
function gatewayAdvice(status: string, mode: string): string {
  if (status === 'connected') return '本地 Runtime 正在通过事件流同步到办公室。';
  if (status === 'connecting') return '正在建立连接，请确认 npm run runtime 已启动。';
  if (mode === 'mock') return 'Mock Runtime 用于验证事件边界和 UI 响应。';
  if (status === 'error' || status === 'disconnected') return '连接已中断。请启动 npm run runtime，或切换到 Mock 模式验证事件流。';
  if (status === 'protocol_mismatch') return '协议版本不匹配。请检查本地 Runtime 的 protocol/version。';
  return '可切换到 Mock 或本地 Runtime 模式验证事件流。';
}
```

Update header:

```tsx
<WorkbenchHeader title="网关诊断" subtitle="检查 Runtime 模式、连接状态、协议和原始事件。" />
```

Show command card when not connected:

```tsx
{runtimeMode === 'connected' && runtimeStatus !== 'connected' && (
  <div className="mt-2 text-xs text-amber-300 border border-amber-300/30 rounded p-2 bg-amber-300/5">
    请先在项目根目录运行：<code className="font-mono">npm run runtime</code>
  </div>
)}
```

- [ ] **Step 3: Scan source for common mojibake**

Run:

```powershell
rg "杩|鍔|涓|鐩|妯|鍗|瑙|鏄|浠|姝|缃|婵|鏆|鈹" src
```

Expected:

```text
No matches in touched runtime/commander UI files.
```

If matches are in unrelated legacy comments or docs, do not expand scope unless they are visible UI text in the modified runtime path.

---

## 11. Task 6: Runtime Approval Resolution

**Files:**

- Modify: `src/ai/localRuntimeCommanderAdapter.ts` or create `src/runtime/localRuntimeApproval.ts`
- Modify: `src/ui/commander/ApprovalInbox.tsx` only if needed
- Test: `src/ai/localRuntimeCommanderAdapter.test.ts` or new `src/runtime/localRuntimeApproval.test.ts`

- [ ] **Step 1: Inspect existing approval buttons**

Read:

```powershell
Get-Content -LiteralPath src\ui\commander\ApprovalInbox.tsx
Get-Content -LiteralPath src\store\commanderStore.ts
```

Confirm whether approval buttons already call:

- `approveToolRequestWithAdapter`
- `rejectToolRequestWithAdapter`
- `resolveApproval`

- [ ] **Step 2: If approval buttons only update local store, add runtime approval helper test**

Create `src/runtime/localRuntimeApproval.test.ts`:

```ts
import { describe, expect, it, vi } from 'vitest';
import { resolveLocalRuntimeApproval } from './localRuntimeApproval';

describe('local runtime approval resolution', () => {
  it('posts approval decision to local runtime', async () => {
    const fetcher = vi.fn(async () => ({ ok: true, json: async () => ({ ok: true }) }));

    await resolveLocalRuntimeApproval({
      endpoint: 'http://127.0.0.1:8765',
      approvalId: 'approval-1',
      resolution: 'approved',
      note: '允许登记产物',
      fetcher: fetcher as unknown as typeof fetch,
    });

    expect(fetcher).toHaveBeenCalledWith(
      'http://127.0.0.1:8765/approvals/approval-1/resolve',
      expect.objectContaining({
        method: 'POST',
        headers: { 'content-type': 'application/json' },
      }),
    );
  });
});
```

- [ ] **Step 3: Run failing test**

Run:

```powershell
npm.cmd run test -- src/runtime/localRuntimeApproval.test.ts
```

Expected:

```text
FAIL Cannot find module './localRuntimeApproval'
```

- [ ] **Step 4: Implement helper**

Create `src/runtime/localRuntimeApproval.ts`:

```ts
import { buildLocalRuntimeUrl } from './localRuntimeTesting';

interface ResolveLocalRuntimeApprovalInput {
  endpoint: string;
  approvalId: string;
  resolution: 'approved' | 'rejected';
  note: string;
  fetcher?: typeof fetch;
}

export async function resolveLocalRuntimeApproval(input: ResolveLocalRuntimeApprovalInput): Promise<void> {
  const fetcher = input.fetcher ?? fetch;
  const response = await fetcher(
    buildLocalRuntimeUrl(input.endpoint, `/approvals/${encodeURIComponent(input.approvalId)}/resolve`),
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ resolution: input.resolution, note: input.note }),
    },
  );

  if (!response.ok) {
    throw new Error(`Local runtime approval failed: HTTP ${response.status}`);
  }
}
```

- [ ] **Step 5: Wire approval only for local runtime mode**

If `ApprovalInbox.tsx` only resolves local store, add:

```ts
import { useRuntimeStore } from '@/store/runtimeStore';
import { resolveLocalRuntimeApproval } from '@/runtime/localRuntimeApproval';
```

Inside approve/reject handlers:

```ts
const runtimeMode = useRuntimeStore.getState().mode;
const endpoint = useRuntimeStore.getState().endpoint;

if (runtimeMode === 'connected') {
  await resolveLocalRuntimeApproval({
    endpoint,
    approvalId: approval.id,
    resolution: 'approved',
    note: '用户在办公室中批准。',
  });
}
```

For rejection:

```ts
if (runtimeMode === 'connected') {
  await resolveLocalRuntimeApproval({
    endpoint,
    approvalId: approval.id,
    resolution: 'rejected',
    note: '用户在办公室中拒绝。',
  });
}
```

Keep existing `resolveApproval` behavior so the UI updates immediately.

- [ ] **Step 6: Run approval tests**

Run:

```powershell
npm.cmd run test -- src/runtime/localRuntimeApproval.test.ts src/demo/commanderScenario.test.ts
```

Expected:

```text
PASS
```

---

## 12. Task 7: Docs And Release Checklist

**Files:**

- Modify: `docs/runtime/adapter-contract.md`
- Modify: `docs/runtime/runtime-security-checklist.md`
- Modify: `docs/qa/release-readiness-checklist.md`
- Modify: `docs/qa/final-acceptance-checklist.md`

- [ ] **Step 1: Update adapter contract**

Append:

```md
## Local Runtime MVP

Connected mode now targets the local runtime process at `http://127.0.0.1:8765`.

The browser connects with:

- `GET /events` for Server-Sent Events.
- `POST /missions` for Commander planning.
- `POST /approvals/:approvalId/resolve` for approval decisions.

This runtime is still deterministic and safe:

- It does not store API keys.
- It does not write files.
- It does not run shell commands.
- It only emits event metadata into the office.
```

- [ ] **Step 2: Update security checklist**

Append:

```md
## Plan 24 Local Runtime MVP

- [ ] Browser never asks for API keys.
- [ ] Runtime does not write files in this MVP.
- [ ] Runtime does not run shell commands in this MVP.
- [ ] Runtime messages use `RuntimeRawMessage` envelope.
- [ ] Runtime payloads are redacted before display.
- [ ] Approval events are visible before high-risk actions.
- [ ] Connected mode fails closed when runtime is unavailable.
```

- [ ] **Step 3: Update QA checklists**

Add Plan 24 item:

```md
- [ ] Plan 24 Local Runtime MVP: local process starts, browser connects, Commander submits mission, runtime events project into office, approval/artifact surfaces update.
```

---

## 13. Task 8: Full Verification

**Files:** No source edits unless failures are found.

- [ ] **Step 1: Run typecheck**

Run:

```powershell
npx.cmd tsc --noEmit
```

Expected:

```text
No TypeScript errors.
```

- [ ] **Step 2: Run full tests**

Run:

```powershell
npm.cmd run test
```

Expected:

```text
All test files pass.
```

- [ ] **Step 3: Run production build**

Run:

```powershell
npm.cmd run build
```

Expected:

```text
✓ built
```

Chunk-size warnings are acceptable unless new chunks become dramatically larger.

- [ ] **Step 4: Run local runtime**

Terminal A:

```powershell
npm.cmd run runtime
```

Expected:

```text
[local-runtime] listening on http://127.0.0.1:8765
```

- [ ] **Step 5: Run app**

Terminal B:

```powershell
npm.cmd run dev -- --host 127.0.0.1 --port 5214
```

Open:

```text
http://127.0.0.1:5214/
```

- [ ] **Step 6: Browser QA**

Manual QA checklist:

- [ ] Runtime switch shows readable Chinese.
- [ ] Switch to 本地 Runtime.
- [ ] Gateway status becomes connected.
- [ ] Heartbeat time appears.
- [ ] Raw event count increments.
- [ ] Commander adapter mode includes 本地 Runtime.
- [ ] Enter a goal and click 规划任务.
- [ ] Mission graph shows Research / Build / Review tasks.
- [ ] EventFeed shows runtime events.
- [ ] Tasks module shows runtime-created tasks.
- [ ] ApprovalInbox shows the approval request.
- [ ] Approving sends request to runtime and UI stays coherent.
- [ ] ArtifactRail shows generated artifact metadata.
- [ ] No browser prompt asks for token or secret.
- [ ] Console has no React errors.

- [ ] **Step 7: Safety scan**

Run:

```powershell
rg "api_key|apikey|authorization|bearer |secret|password|token|sk-" src scripts docs/runtime
```

Expected:

- Matches in safety docs are acceptable.
- No real secret values.
- No browser UI asks the user to paste provider keys.

---

## 14. Acceptance Criteria

Plan 24 is complete only when all of these are true:

1. `npm run runtime` starts a localhost runtime process.
2. `GET /health` returns 200 JSON.
3. Browser connected mode uses `createLocalRuntimeAdapter`, not guarded placeholder.
4. Browser receives `runtime.heartbeat` through SSE.
5. Commander can submit a goal to `POST /missions`.
6. Runtime returns a valid three-role plan.
7. Runtime emits task, approval, artifact, and completion events.
8. Front end normalizes and dispatches those events.
9. Office task state changes from runtime events.
10. Workbench task/log/file surfaces show runtime output.
11. Approval can be resolved from the UI.
12. No API key or provider credential is requested in browser.
13. TypeScript passes.
14. Full tests pass.
15. Production build succeeds.
16. Runtime docs explain how to start and troubleshoot the local process.

---

## 15. Follow-Up Plan After This

After this MVP is accepted, the next plan should be **Plan 25: Real Model Runtime Adapter**.

That future plan should add:

- External `.env` in local runtime only.
- Model provider abstraction.
- Claude/OpenAI planner option.
- Tool permission model.
- Read-only workspace inspection.
- Write-file approval gate.
- Patch preview before apply.
- Command execution approval gate.
- Runtime-side audit log.

Do not start Plan 25 until Plan 24 is stable in manual browser QA.
