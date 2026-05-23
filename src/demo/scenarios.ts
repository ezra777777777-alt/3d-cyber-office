import type { OfficeEvent, EventType } from '@/core/types';
import { createEvent } from '@/core/event-bus';

export interface ScenarioStep {
  delayMs: number;
  event: OfficeEvent;
}

// Scenario A: normal flow — create → assign → execute → complete
export function scenarioNormal(): ScenarioStep[] {
  const steps: ScenarioStep[] = [];
  let t = 0;

  steps.push({ delayMs: t, event: createEvent('task.created', 'task-001', null, { title: '整理参考视频能力清单', summary: '从视频中抽取办公室原型需求' }) });
  t += 1500;
  steps.push({ delayMs: t, event: createEvent('task.queued', 'task-001', null, {}) });
  t += 1000;
  steps.push({ delayMs: t, event: createEvent('task.assigned', 'task-001', 'agent-coordinator', {}) });
  t += 800;
  steps.push({ delayMs: t, event: createEvent('task.started', 'task-001', 'agent-coordinator', { message: '开始分析视频内容...' }) });
  t += 2000;
  steps.push({ delayMs: t, event: createEvent('task.progress', 'task-001', 'agent-coordinator', { message: '正在分析视频抽帧与交互模式', progress: 0.3 }) });
  t += 2000;
  steps.push({ delayMs: t, event: createEvent('task.progress', 'task-001', 'agent-coordinator', { message: '提取关键能力清单', progress: 0.6 }) });
  t += 2000;
  steps.push({ delayMs: t, event: createEvent('task.progress', 'task-001', 'agent-coordinator', { message: '整理完成，正在生成摘要', progress: 0.9 }) });
  t += 1500;
  steps.push({ delayMs: t, event: createEvent('task.completed', 'task-001', 'agent-coordinator', { message: '任务完成', outputSummary: '已生成需求文档 v0.2，含 21 个章节' }) });

  return steps;
}

// Scenario B: failure flow — create → assign → execute → blocked
export function scenarioBlocked(): ScenarioStep[] {
  const steps: ScenarioStep[] = [];
  let t = 0;

  steps.push({ delayMs: t, event: createEvent('task.created', 'task-002', null, { title: 'Office layout optimization', summary: '优化办公室场景布局' }) });
  t += 1200;
  steps.push({ delayMs: t, event: createEvent('task.queued', 'task-002', null, {}) });
  t += 800;
  steps.push({ delayMs: t, event: createEvent('task.assigned', 'task-002', 'agent-coder', {}) });
  t += 600;
  steps.push({ delayMs: t, event: createEvent('task.started', 'task-002', 'agent-coder', { message: '开始优化布局...' }) });
  t += 2000;
  steps.push({ delayMs: t, event: createEvent('task.progress', 'task-002', 'agent-coder', { message: '检测到布局冲突', progress: 0.4 }) });
  t += 1500;
  steps.push({ delayMs: t, event: createEvent('task.blocked', 'task-002', 'agent-coder', { message: '无法解析碰撞检测', errorSummary: 'Layout collision detected at desk-b1' }) });

  return steps;
}

// Scenario C: waiting for input flow
export function scenarioWaitingInput(): ScenarioStep[] {
  const steps: ScenarioStep[] = [];
  let t = 4500; // Start after initial delay

  steps.push({ delayMs: t, event: createEvent('task.created', 'task-003', null, { title: 'Generate weekly report', summary: '生成本周工作总结报告' }) });
  t += 1000;
  steps.push({ delayMs: t, event: createEvent('task.queued', 'task-003', null, {}) });
  t += 800;
  steps.push({ delayMs: t, event: createEvent('task.assigned', 'task-003', 'agent-writer', {}) });
  t += 600;
  steps.push({ delayMs: t, event: createEvent('task.started', 'task-003', 'agent-writer', { message: '正在收集本周数据...' }) });
  t += 2500;
  steps.push({ delayMs: t, event: createEvent('task.waiting_input', 'task-003', 'agent-writer', { message: '请确认报告模板和格式要求' }) });

  return steps;
}

// Full demo: combines all scenarios
export function fullDemoScenario(): ScenarioStep[] {
  return [
    ...scenarioNormal(),
    ...scenarioBlocked(),
    ...scenarioWaitingInput(),
  ].sort((a, b) => a.delayMs - b.delayMs);
}
