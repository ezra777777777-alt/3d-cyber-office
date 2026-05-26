import type { GatewayDiagnostic, OfficeEvent } from '@/core/types';

export type RuntimeMode = 'demo' | 'mock' | 'connected' | 'offline' | 'error';

export type RuntimeConnectionStatus =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'degraded'
  | 'disconnected'
  | 'error'
  | 'protocol_mismatch';

export type RuntimeMessageType =
  | 'runtime.heartbeat'
  | 'runtime.worker_status'
  | 'runtime.task_created'
  | 'runtime.task_planned'
  | 'runtime.task_assigned'
  | 'runtime.task_started'
  | 'runtime.task_progress'
  | 'runtime.task_waiting_input'
  | 'runtime.approval_requested'
  | 'runtime.approval_resolved'
  | 'runtime.tool_called'
  | 'runtime.artifact_created'
  | 'runtime.task_completed'
  | 'runtime.task_failed'
  | 'runtime.adapter_error'
  | 'runtime.mission_completed';

export interface RuntimeRawMessage {
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

export interface NormalizedRuntimeEvent {
  event: OfficeEvent | null;
  diagnostics: GatewayDiagnostic[];
  raw: RuntimeRawMessage;
}

export interface RuntimeCompatibility {
  ok: boolean;
  diagnosticKind: GatewayDiagnostic['kind'];
  message: string;
}
