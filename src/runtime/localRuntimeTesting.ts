import type { PlannedMissionTask, ToolRisk, WorkerRole } from '@/ai/commanderAdapterTypes';
import type { GatewayDiagnostic } from '@/core/types';
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
    typeof value.id === 'string' &&
    typeof value.title === 'string' &&
    typeof value.summary === 'string' &&
    ROLES.includes(value.role as WorkerRole) &&
    RISKS.includes(value.risk as ToolRisk)
  );
}

export function isLocalRuntimeMissionResponse(value: unknown): value is LocalRuntimeMissionResponse {
  if (!isRecord(value)) return false;
  if (typeof value.missionId !== 'string') return false;
  if (typeof value.missionTitle !== 'string' || !value.missionTitle.trim()) return false;
  if (!Array.isArray(value.tasks) || value.tasks.length < 3) return false;

  const tasks = value.tasks;
  const roles = new Set(tasks.filter(isPlannedMissionTask).map((task) => task.role));
  return (
    tasks.every(isPlannedMissionTask) &&
    roles.has('researcher') &&
    roles.has('builder') &&
    roles.has('reviewer')
  );
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

export function buildRuntimeConnectionDiagnostic(
  endpoint: string,
  message: string,
): GatewayDiagnostic {
  return {
    id: `local-runtime-disconnect-${Date.now()}`,
    kind: 'disconnect',
    severity: 'error',
    title: 'Local Runtime disconnected',
    detail: `${message}. Endpoint: ${endpoint}`,
  };
}
