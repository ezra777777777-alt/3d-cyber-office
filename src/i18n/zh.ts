import type { AgentStatus, EventType, TaskStatus } from '@/core/types';
import type { RuntimeConnectionStatus, RuntimeMode } from '@/runtime/runtimeTypes';

export type ModuleId =
  | 'office'
  | 'calendar'
  | 'tasks'
  | 'logs'
  | 'files'
  | 'cronjobs'
  | 'gateway'
  | 'review'
  | 'rest'
  | 'migration';

export const moduleLabels: Record<ModuleId, string> = {
  office: '办公室',
  calendar: '日程',
  tasks: '任务',
  logs: '日志',
  files: '文件',
  cronjobs: '定时任务',
  gateway: '网关',
  review: '复盘',
  rest: '休息区',
  migration: '迁移',
};

export const moduleShortLabels: Record<ModuleId, string> = {
  office: '办公室',
  calendar: '日程',
  tasks: '任务',
  logs: '日志',
  files: '文件',
  cronjobs: '定时',
  gateway: '网关',
  review: '复盘',
  rest: '休息',
  migration: '迁移',
};

export const taskStatusLabels: Record<TaskStatus, string> = {
  created: '已创建',
  planned: '已规划',
  queued: '排队中',
  assigned: '已分配',
  running: '运行中',
  waiting_input: '等待输入',
  approval_required: '等待审批',
  blocked: '阻塞',
  failed: '失败',
  completed: '已完成',
  cancelled: '已取消',
};

export const agentStatusLabels: Record<AgentStatus, string> = {
  idle: '空闲',
  planning: '规划中',
  working: '工作中',
  waiting_input: '等待输入',
  approval_required: '等待审批',
  blocked: '阻塞',
  failed: '失败',
  completed: '已完成',
  resting: '休息中',
  offline: '离线',
};

export const runtimeModeLabels: Record<RuntimeMode, string> = {
  demo: '演示',
  mock: '模拟',
  connected: '本地 Runtime',
  offline: '离线',
  error: '错误',
};

export const runtimeStatusLabels: Record<RuntimeConnectionStatus, string> = {
  idle: '待机',
  connecting: '连接中',
  connected: '已连接',
  degraded: '降级',
  protocol_mismatch: '协议不匹配',
  disconnected: '已断开',
  error: '错误',
};

export const eventTypeLabels: Partial<Record<EventType, string>> = {
  'user.message': '用户消息',
  'user.action': '用户操作',
  'office.demo_reset': '重置演示',
  'task.created': '任务创建',
  'task.planned': '任务规划',
  'task.queued': '任务排队',
  'task.assigned': '任务分配',
  'task.started': '任务开始',
  'task.progress': '任务进展',
  'task.waiting_input': '等待输入',
  'task.approval_required': '需要审批',
  'task.blocked': '任务阻塞',
  'task.failed': '任务失败',
  'task.completed': '任务完成',
  'task.cancelled': '任务取消',
  'tool.called': '工具调用',
  'artifact.created': '产物生成',
  'approval.requested': '请求审批',
  'approval.resolved': '审批完成',
  'agent.status_changed': '状态变化',
  'commander.summary_ready': '指挥总结',
  'runtime.heartbeat': '运行时心跳',
  'runtime.adapter_error': '适配器错误',
};

export const actionLabels = {
  startStandardDemo: '标准演示',
  startCommanderDemo: 'Commander 演示',
  startApprovedDelivery: '审批交付',
  pause: '暂停',
  resume: '继续',
  reset: '重置',
  resetView: '重置视角',
  previewJson: '预览 JSON',
  downloadJson: '下载 JSON',
  previewImport: '预览导入',
  applyImport: '应用导入',
  markComplete: '标记完成',
  approve: '同意',
  reject: '拒绝',
  openCommander: '打开 Commander',
  hideCommander: '收起 Commander',
  startGuidedDemo: '完整导览',
  guidedDemo: '导览',
} as const;

export function labelForTaskStatus(status: TaskStatus): string {
  return taskStatusLabels[status] ?? status;
}

export function labelForAgentStatus(status: AgentStatus): string {
  return agentStatusLabels[status] ?? status;
}

export function labelForEventType(type: EventType): string {
  return eventTypeLabels[type] ?? type;
}

export function labelForRuntimeMode(mode: RuntimeMode): string {
  return runtimeModeLabels[mode] ?? mode;
}

export function labelForRuntimeStatus(status: RuntimeConnectionStatus): string {
  return runtimeStatusLabels[status] ?? status;
}
