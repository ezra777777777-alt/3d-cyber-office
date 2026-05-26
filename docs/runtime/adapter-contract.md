# Runtime Adapter Contract

## Purpose

The 3D Cyber Office does not talk directly to arbitrary agent runtimes from UI components. Runtime messages enter through a small adapter layer, are normalized into `OfficeEvent`, and then flow through the existing event bus.

There are two parallel adapter layers:

- **Runtime Adapter** (this document) — normalizes raw runtime messages (`source: 'runtime'`) from an external agent process
- **Commander Adapter** (`source: 'ai_adapter'`) — plans missions and executes worker tasks through AI planners. Documented in [real-ai-commander-adapter.md](./real-ai-commander-adapter.md)

## Modes

| Mode | Meaning |
| --- | --- |
| demo | Built-in scripted demo only. |
| mock | Browser mock adapter replays deterministic runtime events. |
| connected | Reserved for a local OpenClaw-compatible runtime process. |
| offline | Runtime controls visible, no adapter active. |
| error | Adapter failed or protocol is unsupported. |

## Raw Message Envelope

```ts
interface RuntimeRawMessage {
  runtimeEventId: string;
  protocol: string;
  version: string;
  type: RuntimeMessageType;
  occurredAt: string;
  workerId: string | null;
  taskId: string | null;
  missionId?: string | null;
  payload: Record<string, unknown>;
}
```

## Normalization Rules

- Runtime messages become `OfficeEvent` with `source: 'runtime'`.
- Runtime IDs are preserved as `runtimeEventId`.
- Unknown payload fields stay in `payload` but secrets are redacted before UI display.
- Unknown message types produce diagnostics and logs, not crashes.

## Safety Rules

- Do not store runtime tokens in localStorage.
- Do not display raw token, secret, password, API key, or authorization fields.
- Do not execute file writes or terminal commands from runtime messages in the browser.
- Treat `connected` mode as a local-process boundary, not a cloud sync feature.
- Unknown message types produce diagnostics, not crashes.
- Duplicate `runtimeEventId` values are ignored by the event bus.

## Payload Examples

### runtime.heartbeat

Raw:
```json
{
  "runtimeEventId": "rt-heartbeat-1",
  "protocol": "openclaw",
  "version": "0.4.0",
  "type": "runtime.heartbeat",
  "occurredAt": "2026-05-23T01:00:00.000Z",
  "workerId": null,
  "taskId": null,
  "payload": { "status": "connected", "latencyMs": 28 }
}
```

Normalized `OfficeEvent`:
```json
{
  "type": "runtime.heartbeat",
  "source": "runtime",
  "runtimeEventId": "rt-heartbeat-1",
  "taskId": null,
  "agentId": null,
  "payload": { "status": "connected", "latencyMs": 28 }
}
```

### runtime.task_started

Raw:
```json
{
  "runtimeEventId": "rt-task-1-started",
  "protocol": "openclaw",
  "version": "0.4.0",
  "type": "runtime.task_started",
  "occurredAt": "2026-05-23T01:00:02.000Z",
  "workerId": "agent-coder",
  "taskId": "runtime-task-1",
  "missionId": "mission-runtime-demo",
  "payload": { "message": "Worker started from runtime adapter." }
}
```

Normalized `OfficeEvent`:
```json
{
  "type": "task.started",
  "source": "runtime",
  "runtimeEventId": "rt-task-1-started",
  "taskId": "runtime-task-1",
  "agentId": "agent-coder",
  "missionId": "mission-runtime-demo",
  "payload": { "message": "Worker started from runtime adapter." }
}
```

### runtime.approval_requested

Raw:
```json
{
  "runtimeEventId": "rt-approval-1",
  "protocol": "openclaw",
  "version": "0.4.0",
  "type": "runtime.approval_requested",
  "occurredAt": "2026-05-23T01:00:03.000Z",
  "workerId": "agent-coder",
  "taskId": "runtime-task-1",
  "payload": { "approvalId": "approval-write", "reason": "Write to workspace files." }
}
```

Normalized `OfficeEvent`:
```json
{
  "type": "approval.requested",
  "source": "runtime",
  "runtimeEventId": "rt-approval-1",
  "taskId": "runtime-task-1",
  "agentId": "agent-coder",
  "approvalId": "approval-write",
  "payload": { "approvalId": "approval-write", "reason": "Write to workspace files." }
}
```

### runtime.tool_called

Raw:
```json
{
  "runtimeEventId": "rt-tool-1",
  "protocol": "openclaw",
  "version": "0.4.0",
  "type": "runtime.tool_called",
  "occurredAt": "2026-05-23T01:00:03.000Z",
  "workerId": "agent-coder",
  "taskId": "runtime-task-1",
  "payload": { "tool": "workspace.inspect", "target": "src/runtime" }
}
```

Normalized `OfficeEvent`:
```json
{
  "type": "tool.called",
  "source": "runtime",
  "runtimeEventId": "rt-tool-1",
  "taskId": "runtime-task-1",
  "agentId": "agent-coder",
  "payload": { "tool": "workspace.inspect", "target": "src/runtime" }
}
```

### runtime.artifact_created

Raw:
```json
{
  "runtimeEventId": "rt-artifact-1",
  "protocol": "openclaw",
  "version": "0.4.0",
  "type": "runtime.artifact_created",
  "occurredAt": "2026-05-23T01:00:04.000Z",
  "workerId": "agent-coder",
  "taskId": "runtime-task-1",
  "payload": { "artifactId": "runtime-artifact-1", "title": "Runtime adapter notes", "path": "docs/runtime/adapter-contract.md" }
}
```

Normalized `OfficeEvent`:
```json
{
  "type": "artifact.created",
  "source": "runtime",
  "runtimeEventId": "rt-artifact-1",
  "taskId": "runtime-task-1",
  "agentId": "agent-coder",
  "artifactId": "runtime-artifact-1",
  "payload": { "artifactId": "runtime-artifact-1", "title": "Runtime adapter notes", "path": "docs/runtime/adapter-contract.md" }
}
```

### runtime.adapter_error

Raw:
```json
{
  "runtimeEventId": "rt-error-1",
  "protocol": "openclaw",
  "version": "0.4.0",
  "type": "runtime.adapter_error",
  "occurredAt": "2026-05-23T01:00:05.000Z",
  "workerId": null,
  "taskId": null,
  "payload": { "message": "Connection refused: 127.0.0.1:8765", "code": "ECONNREFUSED" }
}
```

Normalized `OfficeEvent`:
```json
{
  "type": "runtime.adapter_error",
  "source": "runtime",
  "runtimeEventId": "rt-error-1",
  "taskId": null,
  "agentId": null,
  "payload": { "message": "Connection refused: 127.0.0.1:8765", "code": "ECONNREFUSED" }
}
```

## Real Runtime Boundary

The current guarded placeholder (`guarded_real` mode) refuses to plan or execute missions, directing users to configure an external runtime. The next implementation path is documented in:

- **[runtime-integration-options.md](./runtime-integration-options.md)** — 6 candidate approaches compared
- **[runtime-integration-decision.md](./runtime-integration-decision.md)** — ADR with recommended path
- **[runtime-security-checklist.md](./runtime-security-checklist.md)** — Credential, file, command, network, and event safety requirements
- **[local-runtime-protocol-sketch.md](./local-runtime-protocol-sketch.md)** — Protocol message format draft

The adapter contract in this document remains the boundary all external runtimes must satisfy.

## First Connected Slice

The first real runtime milestone should only prove:

1. Heartbeat arrives.
2. One runtime task is created.
3. One worker status is mapped to an Agent.
4. One artifact metadata event is displayed.
5. Gateway diagnostics report protocol/version health.

Full tool execution and file writes come later.

## Migration and Device Notes

- Runtime store is not persisted.
- Mock mode works after migration.
- Connected mode requires installing/running the local runtime on the new device.
- Secrets are re-created on the target machine, not exported.
- Browser localStorage export is not enough to migrate a real runtime.

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
