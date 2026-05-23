// ─── Agent ────────────────────────────────────────────
export type AgentStatus =
  | 'idle'
  | 'planning'
  | 'working'
  | 'waiting_input'
  | 'approval_required'
  | 'blocked'
  | 'failed'
  | 'completed'
  | 'resting'
  | 'offline';

export type AgentRole = 'research' | 'coding' | 'writing' | 'analysis' | 'coordinator';

export interface Agent {
  id: string;
  name: string;
  role: AgentRole;
  status: AgentStatus;
  deskId: string;
  currentTaskId: string | null;
  lastActiveAt: string;
}

// ─── Task ─────────────────────────────────────────────
export type TaskStatus =
  | 'created'
  | 'planned'
  | 'queued'
  | 'assigned'
  | 'running'
  | 'waiting_input'
  | 'approval_required'
  | 'blocked'
  | 'failed'
  | 'completed'
  | 'cancelled';

export interface Task {
  id: string;
  title: string;
  summary: string;
  status: TaskStatus;
  assignedAgentId: string | null;
  createdAt: string;
  updatedAt: string;
  outputSummary: string | null;
  errorSummary: string | null;
}

// ─── Desk ─────────────────────────────────────────────
export type DeskZone =
  | 'commander'
  | 'workstation'
  | 'pending'
  | 'completed'
  | 'collaboration'
  | 'diagnostics'
  | 'rest';

export interface Desk {
  id: string;
  position: [number, number, number];
  rotation: number;
  label: string;
  zone: DeskZone;
  isCommander?: boolean;
}

// ─── Event ────────────────────────────────────────────
export type EventType =
  | 'user.message'
  | 'user.action'
  | 'task.created'
  | 'task.planned'
  | 'task.queued'
  | 'task.assigned'
  | 'task.started'
  | 'task.progress'
  | 'task.waiting_input'
  | 'task.approval_required'
  | 'task.blocked'
  | 'task.failed'
  | 'task.completed'
  | 'task.cancelled'
  | 'tool.called'
  | 'artifact.created'
  | 'approval.requested'
  | 'approval.resolved'
  | 'agent.status_changed'
  | 'commander.summary_ready'
  | 'runtime.heartbeat'
  | 'runtime.adapter_error'
  | 'office.demo_reset';

export interface OfficeEvent {
  id: string;
  type: EventType;
  occurredAt: string;
  source?: WorkbenchSource;
  runtimeEventId?: string | null;
  missionId?: string | null;
  taskId: string | null;
  agentId: string | null;
  approvalId?: string | null;
  artifactId?: string | null;
  payload: Record<string, unknown>;
}

// ─── Dashboard ────────────────────────────────────────
export type WorkbenchSource = 'demo' | 'local' | 'runtime' | 'cron' | 'google_tasks' | 'system' | 'user';

export interface CalendarItem {
  id: string;
  title: string;
  date: string;
  time: string;
  taskId: string | null;
  agentId?: string | null;
  source?: WorkbenchSource;
  type: 'meeting' | 'task' | 'plan' | 'review' | 'cron';
  progress?: number;
  stages?: PlanStage[];
  completed?: boolean;
}

export interface PlanStage {
  label: string;
  done: boolean;
}

export interface WorkbenchTask {
  id: string;
  title: string;
  status: 'today' | 'todo' | 'running' | 'blocked' | 'completed';
  source: WorkbenchSource;
  officeTaskId: string | null;
  agentId: string | null;
  dueLabel: string;
  priority: 'low' | 'medium' | 'high';
  summary: string;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'success';
  message: string;
  agentId: string | null;
  taskId: string | null;
}

export interface FileRecord {
  id: string;
  name: string;
  sourceTaskId: string | null;
  sourceAgentId?: string | null;
  source: WorkbenchSource;
  updatedAt: string;
  path: string;
  size: string;
  kind: 'folder' | 'markdown' | 'text' | 'json' | 'config';
  preview?: string;
}

export interface CronRunSummary {
  id: string;
  startedAt: string;
  durationMs: number;
  result: 'success' | 'failed' | 'running' | 'pending';
  taskId: string | null;
  message: string;
}

export interface CronJob {
  id: string;
  name: string;
  schedule: string;
  enabled: boolean;
  lastResult: 'success' | 'failed' | 'running' | 'pending';
  nextRun: string;
  agentId: string | null;
  linkedTaskId?: string | null;
  runs: CronRunSummary[];
}

export interface GatewayDiagnostic {
  id: string;
  kind: 'token_missing' | 'device_approval' | 'protocol_mismatch' | 'disconnect' | 'healthy';
  severity: 'info' | 'warn' | 'error' | 'success';
  title: string;
  detail: string;
}

export interface GatewayInfo {
  id: string;
  name: string;
  source: WorkbenchSource;
  status: 'connected' | 'connecting' | 'disconnected' | 'error' | 'protocol_mismatch';
  protocol: string;
  lastHeartbeat: string;
  message: string;
  diagnostics: GatewayDiagnostic[];
}

export interface ReviewCard {
  id: string;
  date: string;
  source: 'demo' | 'system' | 'user';
  completed: string;
  shortcomings: string;
  suggestions: string;
  relatedTaskIds: string[];
  relatedFileIds: string[];
}

export interface RestCard {
  id: string;
  title: string;
  kind: 'quiet_garden' | 'sound_space' | 'daily_surprise';
  summary: string;
  accent: string;
}

// ─── Layout Config ────────────────────────────────────
export interface SceneZone {
  id: 'commander' | 'workers' | 'intake' | 'delivery' | 'collaboration' | 'diagnostics' | 'rest';
  label: string;
  subtitle: string;
  position: [number, number, number];
  accent: string;
}

export interface OfficeLayout {
  roomSize: [number, number, number];
  desks: Desk[];
  zones: SceneZone[];
}

// ─── Commander ───────────────────────────────────────
export type RiskLevel = 'low' | 'medium' | 'high';

export type MissionStatus =
  | 'draft'
  | 'planned'
  | 'running'
  | 'waiting_input'
  | 'approval_required'
  | 'blocked'
  | 'completed';

export type MissionTaskStatus =
  | 'planned'
  | 'assigned'
  | 'running'
  | 'waiting_input'
  | 'approval_required'
  | 'blocked'
  | 'failed'
  | 'completed';

export interface MissionTask {
  id: string;
  title: string;
  summary: string;
  status: MissionTaskStatus;
  workerId: string;
  officeTaskId: string;
  dependencyIds: string[];
  expectedArtifactIds: string[];
  risk: RiskLevel;
  approvalId: string | null;
  artifactIds: string[];
}

export interface CommanderMission {
  id: string;
  title: string;
  originalGoal: string;
  materialNote: string;
  constraints: string[];
  status: MissionStatus;
  createdAt: string;
  updatedAt: string;
  summary: string | null;
  taskIds: string[];
  tasks: Record<string, MissionTask>;
}

export interface WorkerProfile {
  id: string;
  name: string;
  role: 'commander' | 'researcher' | 'builder' | 'reviewer';
  capabilities: string[];
  tools: string[];
  workspace: string;
  deskId: string;
  runtimeRef: string | null;
  status: AgentStatus;
  lastSeenAt: string;
}

export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface ApprovalRequest {
  id: string;
  missionId: string;
  taskId: string;
  officeTaskId: string;
  requestedByWorkerId: string;
  action: string;
  reason: string;
  target: string;
  impact: string;
  risk: RiskLevel;
  status: ApprovalStatus;
  requestedAt: string;
  resolvedAt: string | null;
  resolutionNote: string | null;
}

export interface Artifact {
  id: string;
  missionId: string;
  title: string;
  kind: 'notes' | 'patch' | 'review' | 'report';
  path: string;
  summary: string;
  createdByWorkerId: string;
  taskId: string;
  officeTaskId: string;
  previewable: boolean;
  workspaceBacked: boolean;
  createdAt: string;
}

// ─── Settings ─────────────────────────────────────────
export interface AppSettings {
  demoAutoStart: boolean;
  effectsIntensity: 'low' | 'medium' | 'high';
  defaultCameraView: 'overview' | 'front' | 'top';
}
