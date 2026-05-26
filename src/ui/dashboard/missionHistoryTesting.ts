import type { RuntimeMissionArtifact, RuntimeMissionListItem } from '@/runtime/localRuntimeHistory';
import type { RuntimeRawMessage } from '@/runtime/runtimeTypes';

export type ReplaySeverity = 'info' | 'warn' | 'error' | 'success';

export interface MissionHistoryStats {
  taskCount: number;
  completedTaskCount: number;
  artifactCount: number;
  approvalCount: number;
  toolCallCount: number;
  artifactEventCount: number;
  latestApprovalDecision: string | null;
  completed: boolean;
}

export interface MissionReplayRow {
  id: string;
  occurredAt: string;
  kind: string;
  title: string;
  detail: string;
  workerId: string | null;
  taskId: string | null;
  missionTaskId: string | null;
  approvalId: string | null;
  artifactId: string | null;
  severity: ReplaySeverity;
}

const EVENT_TITLES: Record<string, string> = {
  'runtime.task_created': 'Task created',
  'runtime.task_planned': 'Task planned',
  'runtime.task_assigned': 'Worker assigned',
  'runtime.task_started': 'Worker started',
  'runtime.artifact_created': 'Artifact created',
  'runtime.approval_requested': 'Approval requested',
  'runtime.approval_resolved': 'Approval resolved',
  'runtime.tool_called': 'Tool executed',
  'runtime.task_failed': 'Task failed',
  'runtime.task_completed': 'Task completed',
  'runtime.mission_completed': 'Mission completed',
};

function text(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function eventSeverity(event: RuntimeRawMessage): ReplaySeverity {
  if (event.type === 'runtime.task_failed') return 'error';
  if (event.type === 'runtime.approval_requested') return 'warn';
  if (event.type === 'runtime.approval_resolved') {
    return event.payload.resolution === 'rejected' ? 'error' : 'success';
  }
  if (
    event.type === 'runtime.artifact_created' ||
    event.type === 'runtime.task_completed' ||
    event.type === 'runtime.mission_completed'
  ) {
    return 'success';
  }
  return 'info';
}

function buildDetail(event: RuntimeRawMessage): string {
  const fields = [
    text(event.payload.title),
    text(event.payload.summary),
    text(event.payload.message),
    text(event.payload.action),
    text(event.payload.risk),
    text(event.payload.target),
    text(event.payload.resultSummary),
    text(event.payload.outputSummary),
    text(event.payload.errorSummary),
  ].filter(Boolean);
  return fields.join(' · ') || event.type;
}

export function sortMissionsByUpdatedAt(
  missions: RuntimeMissionListItem[],
): RuntimeMissionListItem[] {
  return [...missions].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function filterMissions(
  missions: RuntimeMissionListItem[],
  query: string,
  status: string,
): RuntimeMissionListItem[] {
  const normalized = query.trim().toLowerCase();
  return sortMissionsByUpdatedAt(missions).filter((mission) => {
    const matchesStatus = status === 'all' || mission.status === status;
    const matchesQuery =
      !normalized ||
      `${mission.title} ${mission.missionId}`.toLowerCase().includes(normalized);
    return matchesStatus && matchesQuery;
  });
}

export function deriveMissionHistoryStats(
  mission: RuntimeMissionListItem,
  events: RuntimeRawMessage[],
): MissionHistoryStats {
  const approvalResolvedEvents = events.filter((event) => event.type === 'runtime.approval_resolved');
  const approvalResolved = approvalResolvedEvents[approvalResolvedEvents.length - 1];
  return {
    taskCount: mission.taskCount,
    completedTaskCount: mission.completedTaskCount,
    artifactCount: mission.artifactCount,
    approvalCount:
      mission.approvalCount ||
      events.filter((event) => event.type === 'runtime.approval_requested').length,
    toolCallCount: events.filter((event) => event.type === 'runtime.tool_called').length,
    artifactEventCount: events.filter((event) => event.type === 'runtime.artifact_created').length,
    latestApprovalDecision: text(approvalResolved?.payload.resolution) || null,
    completed: mission.status === 'completed' || events.some((event) => event.type === 'runtime.mission_completed'),
  };
}

export function buildReplayRows(events: RuntimeRawMessage[]): MissionReplayRow[] {
  return events.map((event) => ({
    id: event.runtimeEventId,
    occurredAt: event.occurredAt,
    kind: event.type,
    title: EVENT_TITLES[event.type] || event.type,
    detail: buildDetail(event),
    workerId: event.workerId,
    taskId: event.taskId,
    missionTaskId: text(event.payload.missionTaskId) || null,
    approvalId: text(event.payload.approvalId) || null,
    artifactId: text(event.payload.artifactId) || null,
    severity: eventSeverity(event),
  }));
}

export function groupArtifactsByMissionTask(
  artifacts: RuntimeMissionArtifact[],
): Record<string, RuntimeMissionArtifact[]> {
  return artifacts.reduce<Record<string, RuntimeMissionArtifact[]>>((groups, artifact) => {
    const key = artifact.missionTaskId || 'unknown';
    groups[key] = groups[key] || [];
    groups[key].push(artifact);
    return groups;
  }, {});
}
