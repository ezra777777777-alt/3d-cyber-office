# Real AI Commander Adapter

## Purpose

The Commander adapter layer lets the 3D Cyber Office turn user goals into structured mission plans and execute them via AI workers — without ever storing credentials in the browser. It defines a safety boundary between the UI and any real AI backend.

## Architecture

```
User Goal
  │
  ▼
CommanderComposer ──▶ CommanderPlannerAdapter.plan()
  │                         │
  │                         ▼
  │                   PlannedMissionTask[]
  │                         │
  ▼                         ▼
Commander Store ◀── planMissionWithAdapter()
  │                         │
  ▼                         ▼
WorkerExecutionAdapter ◀── startWorkerExecutionWithAdapter()
  │
  ▼
WorkerExecutionEvent[] ──▶ normalizeWorkerEvent() ──▶ OfficeEvent ──▶ ingestCommanderEvent()
```

Two adapter interfaces live in `src/ai/commanderAdapterTypes.ts`:

- **CommanderPlannerAdapter** — breaks a goal into a 3-phase plan (research → build → review)
- **WorkerExecutionAdapter** — executes tasks, emits events, requests approval for high-risk actions

## Modes

| Mode | Source | Behavior |
| --- | --- | --- |
| `demo` | Built-in scripted data | No adapter invoked; uses `createDemoMission()` directly |
| `mock_ai` | `src/ai/mockCommanderPlanner.ts` + `src/ai/mockWorkerExecutionAdapter.ts` | Deterministic mock that plans 3-phase missions and simulates worker execution with tool-request approval |
| `guarded_real` | `src/ai/guardedRealCommanderAdapter.ts` | Throws on `plan()` and `startMission()` with a message directing users to configure an external Runtime Adapter. Never prompts for credentials |

## Safety Rules

The guarded real adapter enforces these invariants:

1. **No credential storage** — no token, API key, secret, password, or environment variable is ever stored in localStorage, sessionStorage, or IndexedDB
2. **No in-browser credential prompts** — the UI never renders an API key input. Real credentials must live in a local runtime process outside the browser
3. **Approval gate for high-risk actions** — `write_file`, `delete_file`, `run_command`, `network_request`, and `export_data` require explicit user approval before the worker proceeds
4. **Secret detection at the boundary** — `hasSecretLikeValue()` scans payloads for `Authorization`, `Bearer`, `api_key`, `sk-*` patterns before they enter the event bus

## Tool Risk Classification

| Kind | Risk | Requires Approval |
| --- | --- | --- |
| `read_context` | low | No |
| `call_model` | medium | No |
| `write_file` | high | Yes |
| `run_command` | high | Yes |
| `network_request` | high | Yes |
| `export_data` | high | Yes |
| `delete_file` | critical | Yes |

See `classifyToolRisk()` in `src/ai/commanderAdapterTesting.ts`.

## Event Flow

1. Planner returns `CommanderPlannerResult` with structured tasks
2. `planMissionWithAdapter()` creates a `CommanderMission` from the planner result, stores it, then hands tasks to the worker adapter
3. Worker emits `WorkerExecutionEvent[]` at each step
4. `normalizeWorkerEvent()` maps worker events to `OfficeEvent` with `source: 'ai_adapter'`
5. `ingestCommanderEvent()` processes normalized events: updates task status, creates approval requests, attaches artifacts

### Event Type Mapping

| Worker Event | Office Event |
| --- | --- |
| `worker.task_started` | `task.started` |
| `worker.task_progress` | `task.progress` |
| `worker.task_completed` | `task.completed` |
| `worker.task_blocked` | `task.blocked` |
| `worker.tool_requested` | `approval.requested` |
| `worker.artifact_created` | `artifact.created` |

## Approval Flow

When a worker emits `worker.tool_requested`, the bridge creates an approval record in the Commander store. The `ApprovalInbox` UI renders pending approvals with:

- Action description, reason, target, impact
- Risk badge (低 / 中 / 高 / 严重)
- Worker attribution
- High-risk warning for `high` and `critical` actions
- Approve / Reject buttons

On approval: worker continues, emits `artifact_created` + `task_completed`
On rejection: task is blocked, worker stops

## Implementing a Real Adapter

To connect a real AI backend, implement the two interfaces:

```ts
// Implementing CommanderPlannerAdapter
const myPlanner: CommanderPlannerAdapter = {
  mode: 'guarded_real',
  getStatus: () => 'idle',
  plan: async (input) => {
    // Call your AI planning service (running locally, not from the browser)
    const response = await fetch('http://localhost:8765/plan', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    return response.json();
  },
};

// Implementing WorkerExecutionAdapter
const myWorker: WorkerExecutionAdapter = {
  mode: 'guarded_real',
  getStatus: () => 'idle',
  startMission: async (missionId, tasks) => { /* ... */ },
  approveToolRequest: async (requestId) => { /* ... */ },
  rejectToolRequest: async (requestId, reason) => { /* ... */ },
};
```

The adapter implementations run inside the UI process but must only communicate with a local runtime — they must not embed credentials or call remote AI APIs directly.

## Testing

`src/ai/commanderAdapterTesting.ts` exports pure helpers for testing adapter implementations:

- `classifyToolRisk(action)` — returns `ToolRisk` for a given tool action
- `isValidPlannerResult(result)` — verifies minimum structure (3 roles, all tasks have ids/titles/summaries)
- `hasSecretLikeValue(value)` — detects credential-like strings
- `normalizeWorkerEvent(event)` — maps worker events to OfficeEvents with `source: 'ai_adapter'`

Tests live in `src/ai/commanderAdapterTesting.test.ts` and cover risk classification, planner validation, secret detection, event normalization, mock planner structure, mock worker approval lifecycle, and guarded adapter refusal.

## Migration Notes

- Commander store fields `adapterMode`, `adapterStatus`, `adapterError` are NOT persisted (except `adapterMode`). On page reload, mode restores but status resets to `idle`.
- Mock AI mode works after migration without any external dependencies.
- Guarded real mode must be paired with a local runtime process installed on the target machine.
- The demo mode and its data (`demoCommander.ts`) are separate from the adapter layer and always available.
