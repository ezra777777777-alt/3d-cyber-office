import type { TaskStatus, AgentStatus, Task, Agent } from './types';

const VALID_TASK_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  created: ['planned', 'queued', 'cancelled'],
  planned: ['queued', 'assigned', 'cancelled'],
  queued: ['assigned', 'cancelled'],
  assigned: ['running', 'cancelled'],
  running: ['waiting_input', 'approval_required', 'blocked', 'failed', 'completed', 'cancelled'],
  waiting_input: ['running', 'blocked', 'failed', 'cancelled'],
  approval_required: ['running', 'blocked', 'failed', 'cancelled'],
  blocked: ['running', 'failed', 'cancelled'],
  failed: ['queued', 'cancelled'],
  completed: [],
  cancelled: [],
};

const VALID_AGENT_TRANSITIONS: Record<AgentStatus, AgentStatus[]> = {
  idle: ['planning', 'working', 'offline'],
  planning: ['working', 'idle', 'offline'],
  working: ['idle', 'waiting_input', 'approval_required', 'blocked', 'completed', 'offline'],
  waiting_input: ['working', 'idle', 'offline'],
  approval_required: ['working', 'idle', 'blocked', 'offline'],
  blocked: ['working', 'idle', 'offline'],
  failed: ['idle', 'offline'],
  completed: ['idle', 'offline'],
  resting: ['idle', 'offline'],
  offline: ['idle', 'working'],
};

export function canTransitionTask(from: TaskStatus, to: TaskStatus): boolean {
  return VALID_TASK_TRANSITIONS[from]?.includes(to) ?? false;
}

export function canTransitionAgent(from: AgentStatus, to: AgentStatus): boolean {
  return VALID_AGENT_TRANSITIONS[from]?.includes(to) ?? false;
}

export function applyTaskEvent(task: Task, eventType: string): TaskStatus | null {
  const eventToStatus: Record<string, TaskStatus> = {
    'task.created': 'created',
    'task.planned': 'planned',
    'task.queued': 'queued',
    'task.assigned': 'assigned',
    'task.started': 'running',
    'task.running': 'running',
    'task.progress': 'running',
    'task.waiting_input': 'waiting_input',
    'task.approval_required': 'approval_required',
    'task.blocked': 'blocked',
    'task.failed': 'failed',
    'task.completed': 'completed',
    'task.cancelled': 'cancelled',
    'approval.requested': 'approval_required',
    'approval.resolved': 'running',
  };

  const newStatus = eventToStatus[eventType];
  if (!newStatus) return null;

  if (canTransitionTask(task.status, newStatus)) {
    return newStatus;
  }

  // Allow re-applying same status (e.g. multiple progress events)
  if (newStatus === task.status) return newStatus;

  // Allow direct transitions for demo flexibility
  return newStatus;
}

export function deriveAgentStatus(taskStatus: TaskStatus | null): AgentStatus {
  if (!taskStatus) return 'idle';
  switch (taskStatus) {
    case 'running':
      return 'working';
    case 'waiting_input':
      return 'waiting_input';
    case 'approval_required':
      return 'approval_required';
    case 'blocked':
      return 'blocked';
    case 'failed':
      return 'failed';
    case 'completed':
      return 'completed';
    case 'cancelled':
      return 'idle';
    default:
      return 'idle';
  }
}
