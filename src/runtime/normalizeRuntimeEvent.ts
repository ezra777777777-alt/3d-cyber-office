import type { EventType, OfficeEvent } from '@/core/types';
import { createEvent } from '@/core/event-bus';
import { detectProtocolCompatibility, redactRuntimePayload } from './runtimeTesting';
import type { NormalizedRuntimeEvent, RuntimeMessageType, RuntimeRawMessage } from './runtimeTypes';

const MESSAGE_TO_EVENT: Partial<Record<RuntimeMessageType, EventType>> = {
  'runtime.heartbeat': 'runtime.heartbeat',
  'runtime.worker_status': 'agent.status_changed',
  'runtime.task_created': 'task.created',
  'runtime.task_planned': 'task.planned',
  'runtime.task_assigned': 'task.assigned',
  'runtime.task_started': 'task.started',
  'runtime.task_progress': 'task.progress',
  'runtime.task_waiting_input': 'task.waiting_input',
  'runtime.approval_requested': 'approval.requested',
  'runtime.approval_resolved': 'approval.resolved',
  'runtime.tool_called': 'tool.called',
  'runtime.artifact_created': 'artifact.created',
  'runtime.task_completed': 'task.completed',
  'runtime.task_failed': 'task.failed',
  'runtime.adapter_error': 'runtime.adapter_error',
  'runtime.mission_completed': 'commander.summary_ready',
};

export function normalizeRuntimeEvent(raw: RuntimeRawMessage): NormalizedRuntimeEvent {
  const compatibility = detectProtocolCompatibility(raw.protocol, raw.version);
  const diagnostics = compatibility.ok
    ? []
    : [{
        id: `runtime-${raw.runtimeEventId}-protocol`,
        kind: compatibility.diagnosticKind,
        severity: 'error' as const,
        title: 'Runtime protocol mismatch',
        detail: compatibility.message,
      }];

  const eventType = MESSAGE_TO_EVENT[raw.type];
  if (!eventType) {
    return {
      raw,
      event: null,
      diagnostics: [
        ...diagnostics,
        {
          id: `runtime-${raw.runtimeEventId}-unknown`,
          kind: 'protocol_mismatch',
          severity: 'warn',
          title: 'Unknown runtime message',
          detail: `No OfficeEvent mapping exists for ${raw.type}.`,
        },
      ],
    };
  }

  const event: OfficeEvent = {
    ...createEvent(eventType, raw.taskId, raw.workerId, redactRuntimePayload(raw.payload)),
    occurredAt: raw.occurredAt,
    source: 'runtime',
    runtimeEventId: raw.runtimeEventId,
    missionId: raw.missionId ?? null,
    approvalId: typeof raw.payload.approvalId === 'string' ? raw.payload.approvalId : null,
    artifactId: typeof raw.payload.artifactId === 'string' ? raw.payload.artifactId : null,
  };

  return { raw, event, diagnostics };
}
