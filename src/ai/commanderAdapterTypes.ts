import type { OfficeEvent } from '@/core/types';

export type CommanderAdapterMode = 'demo' | 'mock_ai' | 'guarded_real' | 'local_runtime';
export type CommanderAdapterStatus =
  | 'idle'
  | 'planning'
  | 'executing'
  | 'approval_required'
  | 'blocked'
  | 'completed'
  | 'guarded';

export type WorkerRole = 'researcher' | 'builder' | 'reviewer' | 'coordinator';
export type ToolActionKind =
  | 'read_context'
  | 'write_file'
  | 'delete_file'
  | 'run_command'
  | 'network_request'
  | 'call_model'
  | 'export_data';

export type ToolRisk = 'low' | 'medium' | 'high' | 'critical';

export interface CommanderGoalInput {
  goal: string;
  materialNote: string;
  constraintsText: string;
  requestedAt: string;
}

export interface PlannedMissionTask {
  id: string;
  role: WorkerRole;
  title: string;
  summary: string;
  risk: ToolRisk;
  dependencyIds?: string[];
  expectedArtifactKinds?: Array<'notes' | 'patch' | 'review' | 'report'>;
}

export interface CommanderPlannerResult {
  missionId?: string;
  missionTitle: string;
  missionSummary?: string;
  tasks: PlannedMissionTask[];
}

export interface ToolRequest {
  id: string;
  missionId: string;
  missionTaskId: string;
  officeTaskId: string;
  requestedByWorkerId: string;
  kind: ToolActionKind;
  target: string;
  reason: string;
  impact: string;
  risk: ToolRisk;
}

export interface WorkerExecutionEvent {
  id: string;
  missionId: string;
  missionTaskId: string;
  officeTaskId: string;
  workerId: string;
  type:
    | 'worker.task_started'
    | 'worker.task_progress'
    | 'worker.task_completed'
    | 'worker.task_blocked'
    | 'worker.tool_requested'
    | 'worker.artifact_created';
  message: string;
  occurredAt: string;
  payload?: Record<string, unknown>;
}

export interface CommanderPlannerAdapter {
  mode: CommanderAdapterMode;
  getStatus(): CommanderAdapterStatus;
  plan(input: CommanderGoalInput): Promise<CommanderPlannerResult>;
}

export interface WorkerExecutionAdapter {
  mode: CommanderAdapterMode;
  getStatus(): CommanderAdapterStatus;
  startMission(missionId: string, tasks: PlannedMissionTask[]): Promise<WorkerExecutionEvent[]>;
  approveToolRequest(requestId: string): Promise<WorkerExecutionEvent[]>;
  rejectToolRequest(requestId: string, reason: string): Promise<WorkerExecutionEvent[]>;
}

export type WorkerEventNormalizer = (event: WorkerExecutionEvent) => OfficeEvent;
