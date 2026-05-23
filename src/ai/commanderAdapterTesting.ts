import type {
  CommanderPlannerResult,
  ToolActionKind,
  ToolRisk,
  WorkerExecutionEvent,
} from './commanderAdapterTypes';
import type { OfficeEvent } from '@/core/types';

const RISK_BY_ACTION: Record<ToolActionKind, ToolRisk> = {
  read_context: 'low',
  write_file: 'high',
  delete_file: 'critical',
  run_command: 'high',
  network_request: 'high',
  call_model: 'medium',
  export_data: 'high',
};

export function classifyToolRisk(action: { kind: ToolActionKind; target: string }): ToolRisk {
  return RISK_BY_ACTION[action.kind];
}

export function isValidPlannerResult(result: CommanderPlannerResult): boolean {
  const roles = new Set(result.tasks.map((task) => task.role));
  const ids = new Set(result.tasks.map((task) => task.id));
  return Boolean(
    result.missionTitle.trim()
    && roles.has('researcher')
    && roles.has('builder')
    && roles.has('reviewer')
    && result.tasks.every((task) => task.title.trim() && task.summary.trim() && ids.has(task.id)),
  );
}

export function hasSecretLikeValue(value: unknown): boolean {
  const text = JSON.stringify(value).toLowerCase();
  return [
    'authorization',
    'bearer ',
    'api_key',
    'apikey',
    'secret',
    'password',
    'token',
    'sk-live',
    'sk-',
  ].some((needle) => text.includes(needle));
}

export function normalizeWorkerEvent(event: WorkerExecutionEvent): OfficeEvent {
  const typeMap: Record<WorkerExecutionEvent['type'], OfficeEvent['type']> = {
    'worker.task_started': 'task.started',
    'worker.task_progress': 'task.progress',
    'worker.task_completed': 'task.completed',
    'worker.task_blocked': 'task.blocked',
    'worker.tool_requested': 'approval.requested',
    'worker.artifact_created': 'artifact.created',
  };

  const toolRequest = event.payload?.toolRequest as Record<string, unknown> | undefined;
  const payloadArtifactId = event.payload?.artifactId as string | undefined;

  return {
    id: event.id,
    type: typeMap[event.type],
    taskId: event.officeTaskId,
    agentId: event.workerId,
    missionId: event.missionId,
    occurredAt: event.occurredAt,
    source: 'ai_adapter',
    approvalId: toolRequest ? (toolRequest.id as string) : undefined,
    artifactId: payloadArtifactId ?? undefined,
    payload: {
      ...(event.payload ?? {}),
      missionTaskId: event.missionTaskId,
      message: event.message,
      ...(toolRequest
        ? {
            action: toolRequest.kind,
            reason: toolRequest.reason,
            target: toolRequest.target,
            impact: toolRequest.impact,
            risk: toolRequest.risk,
            requestedByWorkerId: toolRequest.requestedByWorkerId,
          }
        : {}),
    },
  };
}
