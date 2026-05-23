export const workbenchModuleCopy = {
  calendar: { title: '日程计划', subtitle: '查看本周计划、阶段进度和任务关联。' },
  tasks: { title: '任务台', subtitle: '追踪任务状态、依赖、阻塞和来源。' },
  logs: { title: '事件日志', subtitle: '查看 Demo、Runtime、Commander 和用户动作。' },
  files: { title: '文件产物', subtitle: '浏览产物、版本、来源和关联任务。' },
  cronjobs: { title: '定时任务', subtitle: '查看自动检查、复盘和失败重试。' },
  gateway: { title: '网关诊断', subtitle: '检查 Runtime 模式、协议和原始事件。' },
  review: { title: '每日复盘', subtitle: '汇总完成、阻塞、产物和下一步建议。' },
  rest: { title: '休息区', subtitle: '查看静音、专注和 Agent 轻量状态。' },
} as const;

export function nextActionForStatus(status: string): string {
  if (status === 'blocked' || status === 'failed') return '查看阻塞原因并切到日志定位来源。';
  if (status === 'approval_required') return '进入审批箱，确认风险后同意或拒绝。';
  if (status === 'waiting_input') return '补充用户输入后继续任务。';
  if (status === 'completed') return '查看产物或进入复盘。';
  return '继续观察任务进度。';
}
