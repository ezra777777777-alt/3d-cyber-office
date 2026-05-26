# Multi-Agent Closed Loop Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the local runtime into a real multi-worker loop where Commander plans, Research gathers context, Builder creates or applies approved changes, Reviewer checks output, and Commander summarizes completion or asks for retry.

**Architecture:** Add a mission engine inside `scripts/local-runtime/` with durable in-memory mission state, worker profiles, step queue, retry policy, and artifact flow. Workers use the safe tool layer from Plan 26. The browser remains the command center, approval surface, event feed, and visual office.

**Tech Stack:** Node ESM, local runtime HTTP/SSE, model planner from Plan 25, safe tools from Plan 26, existing React Commander UI, existing event normalization.

---

## 0. Scope

Plan 27 is the first point where the system starts to feel like the video logic: the lobster Commander coordinates multiple AI workers and the office reflects progress. This plan uses real runtime state and tool boundaries, but still keeps execution conservative.

## 1. Non-Goals

- Do not implement autonomous infinite loops.
- Do not run unbounded commands.
- Do not install packages.
- Do not auto-commit git changes.
- Do not make runtime state persistent across restarts yet.
- Do not bypass approval for writes or commands.
- Do not add cloud queues.

---

## 2. Files

### Create

- `scripts/local-runtime/missionState.mjs`
  - Mission/task state container.
  - Status transitions.
  - Retry counters.

- `scripts/local-runtime/workerProfiles.mjs`
  - Commander, researcher, builder, reviewer worker definitions.

- `scripts/local-runtime/workerPrompts.mjs`
  - Prompt builders for each worker role.

- `scripts/local-runtime/workerEngine.mjs`
  - Executes one worker step at a time.
  - Calls model provider when configured.
  - Uses safe tools.

- `scripts/local-runtime/missionEngine.mjs`
  - Orchestrates full mission lifecycle.
  - Emits runtime events.
  - Handles blocked/approval/resume/retry.

- `scripts/local-runtime/missionEngine.test.mjs`
  - Node tests for mission state, worker sequencing, blocked approvals, retry logic.

- `docs/runtime/multi-agent-loop.md`
  - User-facing explanation and QA guide.

### Modify

- `scripts/local-runtime/server.mjs`
  - Replace timer-based `scheduleMissionEvents` with `missionEngine.startMission`.
  - Add mission status endpoints.
  - Add retry endpoint.

- `scripts/local-runtime/modelPlanner.mjs`
  - Keep plan-only behavior. Do not merge worker execution into planner.

- `scripts/local-runtime/toolRegistry.mjs`
  - Expose tool metadata for worker prompts.

- `src/runtime/runtimeTypes.ts`
  - Add message type if needed for `runtime.worker_status`.

- `src/runtime/normalizeRuntimeEvent.ts`
  - Map `runtime.worker_status` to `agent.status_changed` if not already mapped.

- `src/ui/dashboard/GatewayStatus.tsx`
  - Show active mission count if `/health` exposes it.

- `docs/runtime/runtime-security-checklist.md`
  - Add Plan 27 checklist.

- `docs/qa/final-acceptance-checklist.md`
  - Add Plan 27 acceptance item.

---

## 3. Target Runtime Lifecycle

1. `POST /missions`
2. Commander planner returns tasks.
3. Mission state is created.
4. Engine emits task created/planned/assigned events.
5. Researcher runs first:
   - Reads safe context.
   - Writes research artifact.
   - Completes task.
6. Builder runs second:
   - Uses research artifact.
   - Creates patch/report artifact.
   - Requests approval before any write or command.
   - If approved, executes approved action.
   - Completes task or blocks.
7. Reviewer runs third:
   - Reads artifacts.
   - Runs allowlisted tests/build only with approval.
   - Writes review artifact.
   - Completes or fails task.
8. Commander summarizes:
   - Completed tasks.
   - Artifacts.
   - Open risks.
   - Next recommended action.

---

## 4. Task 1: Mission State Machine

**Files:**

- Create: `scripts/local-runtime/missionState.mjs`
- Create: `scripts/local-runtime/missionEngine.test.mjs`

- [ ] **Step 1: Write failing mission state tests**

Create `scripts/local-runtime/missionEngine.test.mjs`:

```js
import assert from 'node:assert/strict';
import test from 'node:test';
import { createMissionState } from './missionState.mjs';

const plan = {
  missionId: 'mission-loop-1',
  missionTitle: '整理实用化路线',
  missionSummary: '三步执行',
  tasks: [
    { id: 'research', role: 'researcher', title: '调研', summary: '调研', risk: 'low', dependencyIds: [], expectedArtifactKinds: ['notes'] },
    { id: 'build', role: 'builder', title: '构建', summary: '构建', risk: 'medium', dependencyIds: ['research'], expectedArtifactKinds: ['report'] },
    { id: 'review', role: 'reviewer', title: '复核', summary: '复核', risk: 'low', dependencyIds: ['build'], expectedArtifactKinds: ['review'] },
  ],
};

test('mission state creates planned tasks and finds ready work', () => {
  const state = createMissionState(plan);
  assert.equal(state.mission.status, 'planned');
  assert.equal(state.getReadyTasks().map((task) => task.id).join(','), 'research');
});

test('mission state unlocks dependent tasks after completion', () => {
  const state = createMissionState(plan);
  state.setTaskStatus('research', 'completed');
  assert.deepEqual(state.getReadyTasks().map((task) => task.id), ['build']);
});

test('mission state blocks task after max retries', () => {
  const state = createMissionState(plan, { maxRetries: 2 });
  state.recordFailure('research', 'first');
  state.recordFailure('research', 'second');
  assert.equal(state.getTask('research').status, 'blocked');
});
```

- [ ] **Step 2: Run failing test**

```powershell
npm.cmd run runtime:test
```

Expected:

```text
ERR_MODULE_NOT_FOUND missionState.mjs
```

- [ ] **Step 3: Implement mission state**

Create `scripts/local-runtime/missionState.mjs`:

```js
export function createMissionState(plan, options = {}) {
  const maxRetries = options.maxRetries ?? 2;
  const tasks = new Map(plan.tasks.map((task) => [
    task.id,
    {
      ...task,
      status: 'planned',
      artifactIds: [],
      retryCount: 0,
      errorSummary: null,
    },
  ]));

  const mission = {
    id: plan.missionId,
    title: plan.missionTitle,
    summary: plan.missionSummary || '',
    status: 'planned',
    startedAt: null,
    completedAt: null,
  };

  function getTask(taskId) {
    return tasks.get(taskId) || null;
  }

  function dependenciesComplete(task) {
    return (task.dependencyIds || []).every((dependencyId) => tasks.get(dependencyId)?.status === 'completed');
  }

  function getReadyTasks() {
    return [...tasks.values()].filter((task) => task.status === 'planned' && dependenciesComplete(task));
  }

  function setTaskStatus(taskId, status) {
    const task = tasks.get(taskId);
    if (!task) throw new Error(`Unknown task: ${taskId}`);
    task.status = status;
    if (status === 'running') mission.status = 'running';
    if ([...tasks.values()].every((item) => item.status === 'completed')) {
      mission.status = 'completed';
      mission.completedAt = new Date().toISOString();
    }
  }

  function recordFailure(taskId, message) {
    const task = getTask(taskId);
    if (!task) throw new Error(`Unknown task: ${taskId}`);
    task.retryCount += 1;
    task.errorSummary = message;
    task.status = task.retryCount >= maxRetries ? 'blocked' : 'planned';
    if (task.status === 'blocked') mission.status = 'blocked';
  }

  function addArtifact(taskId, artifactId) {
    const task = getTask(taskId);
    if (!task) throw new Error(`Unknown task: ${taskId}`);
    task.artifactIds.push(artifactId);
  }

  function snapshot() {
    return {
      mission: { ...mission },
      tasks: [...tasks.values()].map((task) => ({ ...task, artifactIds: [...task.artifactIds] })),
    };
  }

  return {
    mission,
    getTask,
    getReadyTasks,
    setTaskStatus,
    recordFailure,
    addArtifact,
    snapshot,
  };
}
```

- [ ] **Step 4: Verify tests**

```powershell
npm.cmd run runtime:test
```

Expected:

```text
pass
```

---

## 5. Task 2: Worker Profiles And Prompts

**Files:**

- Create: `scripts/local-runtime/workerProfiles.mjs`
- Create: `scripts/local-runtime/workerPrompts.mjs`
- Modify: `scripts/local-runtime/missionEngine.test.mjs`

- [ ] **Step 1: Add failing profile tests**

Append:

```js
import { getWorkerForRole, listWorkerProfiles } from './workerProfiles.mjs';
import { buildWorkerPrompt } from './workerPrompts.mjs';

test('worker profiles include commander researcher builder reviewer', () => {
  assert.deepEqual(listWorkerProfiles().map((worker) => worker.role), ['commander', 'researcher', 'builder', 'reviewer']);
  assert.equal(getWorkerForRole('builder').id, 'worker-builder');
});

test('worker prompt includes task and available tools', () => {
  const prompt = buildWorkerPrompt({
    worker: getWorkerForRole('researcher'),
    mission: { id: 'mission-1', title: '整理实用化路线' },
    task: { id: 'research', title: '调研', summary: '调研缺口' },
    artifacts: [],
    tools: [{ name: 'workspace.read_file', risk: 'low' }],
  });

  assert.equal(prompt.includes('整理实用化路线'), true);
  assert.equal(prompt.includes('workspace.read_file'), true);
});
```

- [ ] **Step 2: Run failing test**

```powershell
npm.cmd run runtime:test
```

Expected:

```text
ERR_MODULE_NOT_FOUND workerProfiles.mjs
```

- [ ] **Step 3: Implement worker profiles**

Create `scripts/local-runtime/workerProfiles.mjs`:

```js
const WORKERS = [
  {
    id: 'worker-commander',
    role: 'commander',
    name: 'Lobster Commander',
    capabilities: ['planning', 'routing', 'summarizing', 'retry_decision'],
  },
  {
    id: 'worker-research',
    role: 'researcher',
    name: 'Research Worker',
    capabilities: ['read_context', 'search_text', 'write_notes'],
  },
  {
    id: 'worker-builder',
    role: 'builder',
    name: 'Builder Worker',
    capabilities: ['draft_patch', 'write_artifact', 'request_write_approval'],
  },
  {
    id: 'worker-review',
    role: 'reviewer',
    name: 'Review Worker',
    capabilities: ['review_artifacts', 'request_test_approval', 'write_review'],
  },
];

export function listWorkerProfiles() {
  return WORKERS.map((worker) => ({ ...worker, capabilities: [...worker.capabilities] }));
}

export function getWorkerForRole(role) {
  const worker = WORKERS.find((item) => item.role === role);
  if (!worker) throw new Error(`Unknown worker role: ${role}`);
  return { ...worker, capabilities: [...worker.capabilities] };
}
```

- [ ] **Step 4: Implement worker prompts**

Create `scripts/local-runtime/workerPrompts.mjs`:

```js
export function buildWorkerPrompt(input) {
  const artifactText = input.artifacts.length
    ? input.artifacts.map((artifact) => `- ${artifact.title}: ${artifact.summary || artifact.path}`).join('\n')
    : '- No prior artifacts.';

  const toolText = input.tools.map((tool) => `- ${tool.name} (${tool.risk})`).join('\n');

  return [
    `You are ${input.worker.name}.`,
    `Mission: ${input.mission.title}`,
    `Task: ${input.task.title}`,
    `Task summary: ${input.task.summary}`,
    '',
    'Available tools:',
    toolText,
    '',
    'Prior artifacts:',
    artifactText,
    '',
    'Return concise JSON with summary, artifactTitle, artifactKind, artifactContent, and requestedTool if needed.',
    'Do not request destructive actions.',
  ].join('\n');
}
```

- [ ] **Step 5: Verify tests**

```powershell
npm.cmd run runtime:test
```

Expected:

```text
pass
```

---

## 6. Task 3: Worker Engine

**Files:**

- Create: `scripts/local-runtime/workerEngine.mjs`
- Modify: `scripts/local-runtime/missionEngine.test.mjs`

- [ ] **Step 1: Add failing worker engine tests**

Append:

```js
import { createWorkerEngine } from './workerEngine.mjs';
import { createArtifactStore } from './artifactStore.mjs';

test('worker engine writes a low-risk research artifact', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'worker-engine-'));
  try {
    const engine = createWorkerEngine({
      workspaceRoot: root,
      modelPlanWorker: async () => ({
        summary: '完成调研',
        artifactTitle: '调研笔记',
        artifactKind: 'notes',
        artifactContent: '# 调研笔记',
      }),
    });

    const result = await engine.runTask({
      mission: { id: 'mission-1', title: '整理路线' },
      task: { id: 'research', role: 'researcher', title: '调研', summary: '调研缺口' },
      artifacts: [],
    });

    assert.equal(result.status, 'completed');
    assert.equal(result.artifact.title, '调研笔记');
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('worker engine returns approval_required for high-risk requested tool', async () => {
  const engine = createWorkerEngine({
    workspaceRoot: process.cwd(),
    modelPlanWorker: async () => ({
      summary: '需要写文件',
      requestedTool: {
        toolName: 'workspace.write_file',
        input: { path: 'src/example.ts', content: 'x' },
        reason: '需要写入文件',
        impact: '修改项目文件',
      },
    }),
  });

  const result = await engine.runTask({
    mission: { id: 'mission-1', title: '整理路线' },
    task: { id: 'build', role: 'builder', title: '构建', summary: '构建清单' },
    artifacts: [],
  });

  assert.equal(result.status, 'approval_required');
  assert.equal(result.toolRequest.toolName, 'workspace.write_file');
});
```

- [ ] **Step 2: Run failing test**

```powershell
npm.cmd run runtime:test
```

Expected:

```text
ERR_MODULE_NOT_FOUND workerEngine.mjs
```

- [ ] **Step 3: Implement worker engine**

Create `scripts/local-runtime/workerEngine.mjs`:

```js
import { createToolRegistry } from './toolRegistry.mjs';
import { getWorkerForRole } from './workerProfiles.mjs';
import { buildWorkerPrompt } from './workerPrompts.mjs';

function defaultWorkerResult(input) {
  return {
    summary: `${input.task.title}已完成。`,
    artifactTitle: `${input.task.title}产物`,
    artifactKind: input.task.expectedArtifactKinds?.[0] || 'notes',
    artifactContent: `# ${input.task.title}\n\n${input.task.summary}\n`,
  };
}

export function createWorkerEngine(options) {
  const tools = createToolRegistry({ workspaceRoot: options.workspaceRoot || process.cwd() });
  const modelPlanWorker = options.modelPlanWorker || (async (input) => defaultWorkerResult(input));

  async function runTask(input) {
    const worker = getWorkerForRole(input.task.role);
    const prompt = buildWorkerPrompt({
      worker,
      mission: input.mission,
      task: input.task,
      artifacts: input.artifacts || [],
      tools: [
        { name: 'workspace.list_files', risk: 'low' },
        { name: 'workspace.read_file', risk: 'low' },
        { name: 'workspace.search_text', risk: 'low' },
        { name: 'artifact.write', risk: 'low' },
        { name: 'workspace.write_file', risk: 'high' },
        { name: 'command.run', risk: 'high' },
      ],
    });

    const decision = await modelPlanWorker({ ...input, worker, prompt });

    if (decision.requestedTool) {
      const toolName = decision.requestedTool.toolName;
      if (tools.policy.isApprovalRequired(toolName)) {
        return {
          status: 'approval_required',
          summary: decision.summary || 'Worker requested approval.',
          worker,
          toolRequest: decision.requestedTool,
        };
      }

      const result = await tools.executeApproved({
        toolName,
        input: decision.requestedTool.input || {},
        missionId: input.mission.id,
        taskId: input.task.id,
        officeTaskId: input.officeTaskId || `runtime-${input.mission.id}-${input.task.id}`,
        workerId: worker.id,
      });
      return { status: 'completed', summary: decision.summary || 'Tool executed.', worker, result };
    }

    const artifact = await tools.executeApproved({
      toolName: 'artifact.write',
      input: {
        title: decision.artifactTitle || `${input.task.title}产物`,
        kind: decision.artifactKind || input.task.expectedArtifactKinds?.[0] || 'notes',
        content: decision.artifactContent || decision.summary || input.task.summary,
        summary: decision.summary || input.task.summary,
      },
      missionId: input.mission.id,
      taskId: input.task.id,
      officeTaskId: input.officeTaskId || `runtime-${input.mission.id}-${input.task.id}`,
      workerId: worker.id,
    });

    return {
      status: 'completed',
      summary: decision.summary || `${input.task.title}已完成。`,
      worker,
      artifact,
    };
  }

  return { runTask };
}
```

- [ ] **Step 4: Verify tests**

```powershell
npm.cmd run runtime:test
```

Expected:

```text
pass
```

---

## 7. Task 4: Mission Engine

**Files:**

- Create: `scripts/local-runtime/missionEngine.mjs`
- Modify: `scripts/local-runtime/missionEngine.test.mjs`

- [ ] **Step 1: Add failing orchestration test**

Append:

```js
import { createMissionEngine } from './missionEngine.mjs';

test('mission engine runs tasks in dependency order and emits events', async () => {
  const events = [];
  const root = await mkdtemp(path.join(os.tmpdir(), 'mission-engine-'));
  try {
    const engine = createMissionEngine({
      workspaceRoot: root,
      emit: (type, partial) => events.push({ type, partial }),
      workerEngine: {
        runTask: async ({ task }) => ({
          status: 'completed',
          summary: `${task.id} done`,
          artifact: { artifactId: `artifact-${task.id}`, title: `${task.id} artifact`, path: `${task.id}.md`, kind: 'notes' },
        }),
      },
    });

    await engine.startMission(plan);

    assert.deepEqual(events.filter((event) => event.type === 'runtime.task_completed').map((event) => event.partial.payload.missionTaskId), ['research', 'build', 'review']);
    assert.equal(events.some((event) => event.type === 'runtime.artifact_created'), true);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
```

- [ ] **Step 2: Run failing test**

```powershell
npm.cmd run runtime:test
```

Expected:

```text
ERR_MODULE_NOT_FOUND missionEngine.mjs
```

- [ ] **Step 3: Implement mission engine**

Create `scripts/local-runtime/missionEngine.mjs`:

```js
import { createMissionState } from './missionState.mjs';
import { createWorkerEngine } from './workerEngine.mjs';
import { getWorkerForRole } from './workerProfiles.mjs';

export function createMissionEngine(options) {
  const missions = new Map();
  const emit = options.emit;
  const workerEngine = options.workerEngine || createWorkerEngine({ workspaceRoot: options.workspaceRoot || process.cwd() });

  function officeTaskId(missionId, taskId) {
    return `runtime-${missionId}-${taskId}`;
  }

  function emitTask(type, missionId, task, workerId, payload = {}) {
    emit(type, {
      runtimeEventId: `rt-${missionId}-${task.id}-${type}-${Date.now()}`,
      missionId,
      taskId: officeTaskId(missionId, task.id),
      workerId,
      payload: { ...payload, missionTaskId: task.id, title: task.title, summary: task.summary },
    });
  }

  async function runOneTask(state, task) {
    const missionId = state.mission.id;
    const worker = getWorkerForRole(task.role);
    state.setTaskStatus(task.id, 'running');
    emitTask('runtime.task_assigned', missionId, task, worker.id);
    emitTask('runtime.task_started', missionId, task, worker.id, { message: `${task.title}已开始` });

    const result = await workerEngine.runTask({
      mission: state.mission,
      task,
      officeTaskId: officeTaskId(missionId, task.id),
      artifacts: [],
    });

    if (result.status === 'approval_required') {
      state.setTaskStatus(task.id, 'waiting_input');
      emitTask('runtime.approval_requested', missionId, task, worker.id, {
        approvalId: `approval-${missionId}-${task.id}-${Date.now()}`,
        action: result.toolRequest.toolName,
        reason: result.toolRequest.reason,
        target: result.toolRequest.input?.path || result.toolRequest.input?.command || result.toolRequest.toolName,
        impact: result.toolRequest.impact,
        risk: 'high',
      });
      return false;
    }

    if (result.artifact) {
      state.addArtifact(task.id, result.artifact.artifactId);
      emitTask('runtime.artifact_created', missionId, task, worker.id, {
        artifactId: result.artifact.artifactId,
        title: result.artifact.title,
        kind: result.artifact.kind,
        path: result.artifact.path,
        summary: result.summary,
      });
    }

    state.setTaskStatus(task.id, 'completed');
    emitTask('runtime.task_completed', missionId, task, worker.id, { outputSummary: result.summary });
    return true;
  }

  async function startMission(plan) {
    const state = createMissionState(plan);
    missions.set(plan.missionId, state);

    for (const task of plan.tasks) {
      emitTask('runtime.task_created', plan.missionId, task, getWorkerForRole(task.role).id);
      emitTask('runtime.task_planned', plan.missionId, task, getWorkerForRole(task.role).id);
    }

    let progressed = true;
    while (progressed && state.mission.status !== 'completed' && state.mission.status !== 'blocked') {
      progressed = false;
      const ready = state.getReadyTasks();
      for (const task of ready) {
        const completed = await runOneTask(state, task);
        progressed = progressed || completed;
        if (!completed) return state.snapshot();
      }
    }

    if (state.mission.status === 'completed') {
      emit('runtime.adapter_error', {
        runtimeEventId: `rt-${plan.missionId}-summary-${Date.now()}`,
        missionId: plan.missionId,
        taskId: null,
        workerId: 'worker-commander',
        payload: {
          message: 'Mission summary ready',
          summary: `${plan.missionTitle} 已完成。`,
          severity: 'info',
        },
      });
    }

    return state.snapshot();
  }

  function getMission(missionId) {
    return missions.get(missionId)?.snapshot() || null;
  }

  return {
    startMission,
    getMission,
  };
}
```

- [ ] **Step 4: Verify tests**

```powershell
npm.cmd run runtime:test
```

Expected:

```text
pass
```

---

## 8. Task 5: Replace Timer Scenario In Server

**Files:**

- Modify: `scripts/local-runtime/server.mjs`

- [ ] **Step 1: Add mission engine**

At top:

```js
import { createMissionEngine } from './missionEngine.mjs';
```

After `broadcast` is defined:

```js
const missionEngine = createMissionEngine({
  workspaceRoot: process.cwd(),
  emit: broadcast,
});
```

- [ ] **Step 2: Stop using timer-based scheduler**

In `POST /missions`, replace:

```js
scheduleMissionEvents(missionId, tasks, goal);
```

with:

```js
missionEngine.startMission(response).catch((error) => {
  broadcast('runtime.task_failed', {
    runtimeEventId: `rt-${missionId}-engine-failed`,
    missionId,
    taskId: null,
    workerId: 'worker-commander',
    payload: { errorSummary: error instanceof Error ? error.message : 'Mission engine failed' },
  });
});
```

Delete `scheduleMissionEvents` only after browser QA confirms mission events still flow.

- [ ] **Step 3: Add mission status endpoint**

Before 404:

```js
const missionMatch = url.pathname.match(/^\/missions\/([^/]+)$/);
if (req.method === 'GET' && missionMatch) {
  const missionId = decodeURIComponent(missionMatch[1]);
  const mission = missionEngine.getMission(missionId);
  if (!mission) {
    json(res, 404, { ok: false, error: 'Mission not found' });
    return;
  }
  json(res, 200, { ok: true, mission });
  return;
}
```

- [ ] **Step 4: Add active mission count to health**

If mission engine exposes `listMissions()`, include:

```js
activeMissionCount: missionEngine.listMissions().length,
```

If not, skip this until a later polish task.

---

## 9. Task 6: Runtime Worker Status Events

**Files:**

- Modify: `src/runtime/runtimeTypes.ts`
- Modify: `src/runtime/normalizeRuntimeEvent.ts`
- Modify: `src/runtime/runtimeTesting.test.ts`

- [ ] **Step 1: Add failing normalization test**

Append to `src/runtime/runtimeTesting.test.ts`:

```ts
it('maps runtime worker status to agent status change', () => {
  const msg: RuntimeRawMessage = {
    ...baseMessage,
    runtimeEventId: 'rt-worker-status',
    type: 'runtime.worker_status',
    workerId: 'worker-builder',
    taskId: null,
    payload: { status: 'working' },
  };

  const result = normalizeRuntimeEvent(msg);
  expect(result.event).toMatchObject({
    type: 'agent.status_changed',
    agentId: 'worker-builder',
    payload: { status: 'working' },
  });
});
```

- [ ] **Step 2: Run failing test**

```powershell
npm.cmd run test -- src/runtime/runtimeTesting.test.ts
```

Expected:

```text
expected event type agent.status_changed but got null
```

- [ ] **Step 3: Add mapping**

In `src/runtime/normalizeRuntimeEvent.ts`, add:

```ts
'runtime.worker_status': 'agent.status_changed',
```

to `MESSAGE_TO_EVENT`.

- [ ] **Step 4: Verify test**

```powershell
npm.cmd run test -- src/runtime/runtimeTesting.test.ts
```

Expected:

```text
PASS
```

---

## 10. Task 7: Docs And QA

**Files:**

- Create: `docs/runtime/multi-agent-loop.md`
- Modify: `docs/runtime/runtime-security-checklist.md`
- Modify: `docs/qa/final-acceptance-checklist.md`

- [ ] **Step 1: Add runtime doc**

Create:

```md
# Multi-Agent Loop

## Worker Roles

- Commander: plans, routes, summarizes.
- Research Worker: reads context and writes notes.
- Builder Worker: creates implementation artifacts and requests approval for writes.
- Review Worker: checks artifacts and requests approval for tests/build.

## Loop

1. Commander receives goal.
2. Planner creates tasks.
3. Mission engine executes dependency-ready tasks.
4. Workers emit progress and artifacts.
5. Risky tools pause for approval.
6. Commander summarizes completion or blocked state.

## Safety

The engine is not autonomous forever. It runs a finite task graph, uses Plan 26 tool policy, and blocks when approval is needed.
```

- [ ] **Step 2: Update checklist**

Append:

```md
## Plan 27 Multi-Agent Closed Loop

- [ ] Mission engine runs finite task graph only.
- [ ] Research runs before dependent build tasks.
- [ ] Builder cannot write without approval.
- [ ] Reviewer cannot run commands without approval.
- [ ] Blocked tasks stop the mission.
- [ ] Commander summary is emitted after completion.
- [ ] No infinite retry loop.
```

---

## 11. Task 8: Final Verification

- [ ] **Step 1: Runtime tests**

```powershell
npm.cmd run runtime:test
```

- [ ] **Step 2: App tests**

```powershell
npm.cmd run test
```

- [ ] **Step 3: Build**

```powershell
npm.cmd run build
```

- [ ] **Step 4: Browser QA**

1. Start runtime.
2. Start app.
3. Switch to 本地 Runtime.
4. Submit a Commander goal.
5. Confirm Research runs first.
6. Confirm Build runs after Research.
7. Confirm Review runs after Build.
8. Confirm artifact rail gains artifacts.
9. Confirm approval pauses high-risk actions.
10. Confirm summary appears after completion or blocked state.

---

## 12. Acceptance Criteria

Plan 27 is complete when:

1. Runtime has mission state.
2. Runtime has worker profiles.
3. Runtime has worker prompts.
4. Runtime has worker engine.
5. Runtime has mission engine.
6. Mission tasks run by dependency order.
7. Artifacts are produced by workers.
8. High-risk worker actions pause for approval.
9. Approved actions resume.
10. Failed tasks retry only up to max retry count.
11. Completed missions emit Commander summary.
12. Runtime tests pass.
13. App tests pass.
14. Build succeeds.

