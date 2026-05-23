import type { CalendarItem, CronJob, FileRecord, GatewayInfo, ReviewCard, RestCard, WorkbenchTask } from '@/core/types';

export const demoSchedule: CalendarItem[] = [
  {
    id: 'cal-1', title: 'Daily standup review', date: '2026-05-19', time: '09:00',
    taskId: null, agentId: 'agent-coordinator', source: 'demo', type: 'meeting',
  },
  {
    id: 'cal-2', title: '整理参考视频能力清单', date: '2026-05-19', time: '10:00',
    taskId: 'task-001', agentId: 'agent-writer', source: 'local', type: 'task',
    progress: 1, completed: true,
  },
  {
    id: 'cal-3', title: 'Learning: R3F advanced patterns', date: '2026-05-20', time: '14:00',
    taskId: null, agentId: 'agent-coder', source: 'local', type: 'plan',
    progress: 0.5, completed: false,
    stages: [
      { label: 'Read R3F docs', done: true },
      { label: 'Build sample scene', done: true },
      { label: 'Implement event-driven updates', done: false },
      { label: 'Performance profiling', done: false },
    ],
  },
  {
    id: 'cal-4', title: 'Agent 工作复盘', date: '2026-05-21', time: '17:00',
    taskId: null, agentId: 'agent-analyst', source: 'demo', type: 'review',
    progress: 0, completed: false,
    stages: [
      { label: "Review today's task logs", done: false },
      { label: 'Write improvement notes', done: false },
    ],
  },
  {
    id: 'cal-5', title: '夜间代码审查 (cron)', date: '2026-05-22', time: '02:00',
    taskId: 'task-002', agentId: 'agent-coder', source: 'cron', type: 'cron',
    progress: 0, completed: false,
  },
  {
    id: 'cal-6', title: '周度架构评审', date: '2026-05-23', time: '15:00',
    taskId: null, agentId: 'agent-coordinator', source: 'demo', type: 'meeting',
  },
  {
    id: 'cal-7', title: 'Sprint retro 准备', date: '2026-05-25', time: '10:00',
    taskId: 'task-003', agentId: 'agent-analyst', source: 'local', type: 'task',
    progress: 0, completed: false,
  },
];

export const demoWorkbenchTasks: WorkbenchTask[] = [
  {
    id: 'wb-task-google-plan',
    title: '整理今日任务清单',
    status: 'today',
    source: 'google_tasks',
    officeTaskId: 'task-001',
    agentId: 'agent-writer',
    dueLabel: 'Today 10:00',
    priority: 'high',
    summary: 'External task mirror for the office workbench.',
  },
  {
    id: 'wb-task-runtime-review',
    title: '夜间 Review 等待审批',
    status: 'blocked',
    source: 'runtime',
    officeTaskId: 'task-003',
    agentId: 'agent-analyst',
    dueLabel: 'Blocked',
    priority: 'high',
    summary: 'A runtime task waiting for approval before continuing.',
  },
  {
    id: 'wb-task-demo-backup',
    title: '每日数据备份验证',
    status: 'running',
    source: 'cron',
    officeTaskId: null,
    agentId: 'agent-coder',
    dueLabel: 'Today 01:00',
    priority: 'medium',
    summary: 'Verify backup integrity from nightly cron run.',
  },
  {
    id: 'wb-task-local-docs',
    title: '更新 API 文档',
    status: 'todo',
    source: 'local',
    officeTaskId: 'task-002',
    agentId: null,
    dueLabel: 'This week',
    priority: 'low',
    summary: 'Local documentation task linked to office code review.',
  },
];

export const demoFiles: FileRecord[] = [
  {
    id: 'file-1', name: 'requirements-v0.2.md', sourceTaskId: 'task-001',
    sourceAgentId: 'agent-writer', source: 'local',
    updatedAt: '2026-05-22T10:30:00+08:00', path: '/docs/specs/',
    size: '24KB', kind: 'markdown',
    preview: '# Requirements v0.2\n\n## Overview\nThis document defines the 3D Cyber Office requirements.\n\n## Key Features\n- 3D office scene with real-time agent visualization\n- Event-driven task lifecycle\n- Dashboard workbench modules',
  },
  {
    id: 'file-2', name: 'office-layout.json', sourceTaskId: 'task-002',
    sourceAgentId: 'agent-coder', source: 'local',
    updatedAt: '2026-05-22T11:00:00+08:00', path: '/config/',
    size: '2KB', kind: 'json',
    preview: '{\n  "roomSize": [20, 3.5, 14],\n  "desks": 6,\n  "zones": ["commander", "workstation", "pending", "completed", "collaboration", "diagnostics", "rest"]\n}',
  },
  {
    id: 'file-3', name: 'agent-configs.yaml', sourceTaskId: null,
    sourceAgentId: null, source: 'demo',
    updatedAt: '2026-05-22T09:00:00+08:00', path: '/config/',
    size: '1KB', kind: 'config',
    preview: 'agents:\n  - id: agent-coordinator\n    role: coordinator\n    desk: desk-commander\n  - id: agent-coder\n    role: coding\n    desk: desk-a2',
  },
  {
    id: 'file-4', name: 'demo-scenario-log.txt', sourceTaskId: 'task-003',
    sourceAgentId: 'agent-analyst', source: 'runtime',
    updatedAt: '2026-05-22T17:00:00+08:00', path: '/logs/',
    size: '8KB', kind: 'text',
    preview: '[2026-05-22 09:00] Demo engine started\n[2026-05-22 09:01] Agent coordinator assigned to task-001\n[2026-05-22 09:05] Agent writer completed task-001\n[2026-05-22 14:00] Agent coder blocked on task-002',
  },
];

export const demoCronJobs: CronJob[] = [
  {
    id: 'cron-1', name: '夜间代码审查', schedule: '0 2 * * *', enabled: true,
    lastResult: 'success', nextRun: '2026-05-23T02:00:00+08:00',
    agentId: 'agent-coder', linkedTaskId: 'task-002',
    runs: [
      { id: 'run-1a', startedAt: '2026-05-22T02:00:00+08:00', durationMs: 4200, result: 'success', taskId: 'task-002', message: 'Review passed — no issues found.' },
      { id: 'run-1b', startedAt: '2026-05-21T02:00:00+08:00', durationMs: 3800, result: 'success', taskId: null, message: 'Review passed.' },
    ],
  },
  {
    id: 'cron-2', name: '每日数据备份', schedule: '0 1 * * *', enabled: true,
    lastResult: 'success', nextRun: '2026-05-23T01:00:00+08:00',
    agentId: null, linkedTaskId: null,
    runs: [
      { id: 'run-2a', startedAt: '2026-05-22T01:00:00+08:00', durationMs: 12000, result: 'success', taskId: null, message: 'Backup completed — 1.2GB compressed.' },
    ],
  },
  {
    id: 'cron-3', name: '定时报告生成', schedule: '0 8 * * *', enabled: true,
    lastResult: 'failed', nextRun: '2026-05-23T08:00:00+08:00',
    agentId: 'agent-analyst', linkedTaskId: 'task-003',
    runs: [
      { id: 'run-3a', startedAt: '2026-05-22T08:00:00+08:00', durationMs: 800, result: 'failed', taskId: 'task-003', message: 'Report template missing — file not found.' },
      { id: 'run-3b', startedAt: '2026-05-21T08:00:00+08:00', durationMs: 3500, result: 'success', taskId: null, message: 'Daily report generated.' },
    ],
  },
  {
    id: 'cron-4', name: '健康检查心跳', schedule: '*/15 * * * *', enabled: false,
    lastResult: 'pending', nextRun: '—',
    agentId: null, linkedTaskId: null,
    runs: [],
  },
];

export const demoGateways: GatewayInfo[] = [
  {
    id: 'gw-1', name: 'Codex API', source: 'runtime',
    status: 'connected', protocol: 'OpenClaw v2',
    lastHeartbeat: '2026-05-22T11:30:00+08:00', message: '正常',
    diagnostics: [
      { id: 'diag-1a', kind: 'healthy', severity: 'success', title: 'Connection stable', detail: 'Codex API responding within 200ms.' },
    ],
  },
  {
    id: 'gw-2', name: 'OpenAI API', source: 'runtime',
    status: 'connected', protocol: 'HTTPS/REST',
    lastHeartbeat: '2026-05-22T11:29:00+08:00', message: '正常',
    diagnostics: [
      { id: 'diag-2a', kind: 'token_missing', severity: 'warn', title: 'Token expiring soon', detail: 'API token expires in 3 days. Renew via gateway settings.' },
    ],
  },
  {
    id: 'gw-3', name: 'Local Script Runner', source: 'local',
    status: 'protocol_mismatch', protocol: 'stdio',
    lastHeartbeat: '2026-05-22T10:00:00+08:00', message: '协议版本不匹配',
    diagnostics: [
      { id: 'diag-3a', kind: 'protocol_mismatch', severity: 'error', title: 'Protocol version mismatch', detail: 'Script runner expects v1 protocol but gateway sends v2.' },
      { id: 'diag-3b', kind: 'device_approval', severity: 'warn', title: 'Device not yet approved', detail: 'Local runner requires one-time device approval in gateway console.' },
    ],
  },
];

export const demoReviews: ReviewCard[] = [
  {
    id: 'review-1',
    date: '2026-05-22',
    source: 'demo',
    completed: '完成需求文档 v0.2 编写；确定技术选型方案；搭建 3D 场景骨架',
    shortcomings: '3D 场景性能优化尚未测试；Dashboard 模块仍为骨架',
    suggestions: '今日重点实施 Workbench Fidelity 计划，升级所有仪表盘面板',
    relatedTaskIds: ['task-001', 'task-002'],
    relatedFileIds: ['file-1', 'file-2'],
  },
  {
    id: 'review-2',
    date: '2026-05-21',
    source: 'system',
    completed: 'Agent 事件驱动闭环验证通过；Demo 引擎运行稳定',
    shortcomings: '窄视口下部分 UI 元素重叠',
    suggestions: '添加响应式断点；检查 flex-wrap 行为',
    relatedTaskIds: ['task-003'],
    relatedFileIds: ['file-4'],
  },
];

export const demoRestCards: RestCard[] = [
  {
    id: 'rest-1',
    title: 'Quiet Garden',
    kind: 'quiet_garden',
    summary: 'Take a mindful pause. Ambient nature sounds and a gentle visual scene to reset focus between deep-work sessions.',
    accent: '#7ce3aa',
  },
  {
    id: 'rest-2',
    title: 'Sound Space',
    kind: 'sound_space',
    summary: 'Curated lo-fi beats and ambient textures. Timer-based sessions with optional break reminders.',
    accent: '#6ecbff',
  },
  {
    id: 'rest-3',
    title: 'Daily Surprise',
    kind: 'daily_surprise',
    summary: 'A random tip, quote, or micro-challenge drawn from the agent workbench to spark curiosity.',
    accent: '#ffb84d',
  },
];
