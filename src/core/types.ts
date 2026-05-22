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
  | 'task.created'
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
  | 'approval.requested'
  | 'approval.resolved'
  | 'agent.status_changed'
  | 'office.demo_reset'
  | 'user.action';

export interface OfficeEvent {
  id: string;
  type: EventType;
  occurredAt: string;
  taskId: string | null;
  agentId: string | null;
  payload: Record<string, unknown>;
}

// ─── Dashboard ────────────────────────────────────────
export interface CalendarItem {
  id: string;
  title: string;
  time: string;
  taskId: string | null;
  type: 'meeting' | 'task' | 'plan' | 'review';
  progress?: number; // 0-1 for plans
  stages?: PlanStage[];
  completed?: boolean; // user can mark as done
}

export interface PlanStage {
  label: string;
  done: boolean;
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
  updatedAt: string;
  path: string;
  size: string;
}

export interface CronJob {
  id: string;
  name: string;
  schedule: string;
  lastResult: 'success' | 'failed' | 'running' | 'pending';
  nextRun: string;
  agentId: string | null;
}

export interface GatewayInfo {
  id: string;
  name: string;
  status: 'connected' | 'disconnected' | 'error';
  lastHeartbeat: string;
  message: string;
}

export interface ReviewCard {
  id: string;
  date: string;
  completed: string;
  shortcomings: string;
  suggestions: string;
  relatedTaskIds: string[];
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

// ─── Settings ─────────────────────────────────────────
export interface AppSettings {
  demoAutoStart: boolean;
  effectsIntensity: 'low' | 'medium' | 'high';
  defaultCameraView: 'overview' | 'front' | 'top';
}
