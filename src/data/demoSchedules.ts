import type { CalendarItem, CronJob, FileRecord, GatewayInfo, ReviewCard } from '@/core/types';

export const demoSchedule: CalendarItem[] = [
  { id: 'cal-1', title: 'Daily standup review', time: '09:00', taskId: null, type: 'meeting' },
  {
    id: 'cal-2',
    title: '整理参考视频能力清单',
    time: '10:00',
    taskId: 'task-001',
    type: 'task',
    progress: 1,
    completed: true,
  },
  {
    id: 'cal-3',
    title: 'Learning: R3F advanced patterns',
    time: '14:00',
    taskId: null,
    type: 'plan',
    progress: 0.5,
    stages: [
      { label: 'Read R3F docs', done: true },
      { label: 'Build sample scene', done: true },
      { label: 'Implement event-driven updates', done: false },
      { label: 'Performance profiling', done: false },
    ],
    completed: false,
  },
  {
    id: 'cal-4',
    title: 'Agent 工作复盘',
    time: '17:00',
    taskId: null,
    type: 'review',
    progress: 0,
    stages: [
      { label: 'Review today\'s task logs', done: false },
      { label: 'Write improvement notes', done: false },
    ],
    completed: false,
  },
];

export const demoFiles: FileRecord[] = [
  { id: 'file-1', name: 'requirements-v0.2.md', sourceTaskId: 'task-001', updatedAt: '2026-05-22T10:30:00+08:00', path: '/docs/specs/', size: '24KB' },
  { id: 'file-2', name: 'office-layout.json', sourceTaskId: 'task-002', updatedAt: '2026-05-22T11:00:00+08:00', path: '/config/', size: '2KB' },
  { id: 'file-3', name: 'agent-configs.yaml', sourceTaskId: null, updatedAt: '2026-05-22T09:00:00+08:00', path: '/config/', size: '1KB' },
];

export const demoCronJobs: CronJob[] = [
  { id: 'cron-1', name: '夜间代码审查', schedule: '0 2 * * *', lastResult: 'success', nextRun: '2026-05-23T02:00:00+08:00', agentId: 'agent-coder' },
  { id: 'cron-2', name: '每日数据备份', schedule: '0 1 * * *', lastResult: 'success', nextRun: '2026-05-23T01:00:00+08:00', agentId: null },
  { id: 'cron-3', name: '定时报告生成', schedule: '0 8 * * *', lastResult: 'failed', nextRun: '2026-05-23T08:00:00+08:00', agentId: 'agent-analyst' },
];

export const demoGateways: GatewayInfo[] = [
  { id: 'gw-1', name: 'Codex API', status: 'connected', lastHeartbeat: '2026-05-22T11:30:00+08:00', message: '正常' },
  { id: 'gw-2', name: 'OpenAI API', status: 'connected', lastHeartbeat: '2026-05-22T11:29:00+08:00', message: '正常' },
  { id: 'gw-3', name: 'Local Script Runner', status: 'disconnected', lastHeartbeat: '2026-05-22T10:00:00+08:00', message: '连接断开' },
];

export const demoReviews: ReviewCard[] = [
  {
    id: 'review-1',
    date: '2026-05-21',
    completed: '完成需求文档 v0.2 编写；确定技术选型方案',
    shortcomings: '3D 场景性能优化尚未测试',
    suggestions: '今日重点搭建场景骨架，先不用过度优化',
    relatedTaskIds: ['task-001'],
  },
];
