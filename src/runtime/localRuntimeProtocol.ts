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
