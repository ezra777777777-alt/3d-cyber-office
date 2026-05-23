import { describe, expect, it } from 'vitest';
import {
  classifyToolRisk,
  hasSecretLikeValue,
  isValidPlannerResult,
  normalizeWorkerEvent,
} from './commanderAdapterTesting';
import { createMockCommanderPlanner } from './mockCommanderPlanner';
import { createMockWorkerExecutionAdapter } from './mockWorkerExecutionAdapter';
import { createGuardedRealCommanderPlanner } from './guardedRealCommanderAdapter';

describe('real AI commander adapter contract', () => {
  it('classifies high-risk tool actions that must require approval', () => {
    expect(classifyToolRisk({ kind: 'write_file', target: 'src/App.tsx' })).toBe('high');
    expect(classifyToolRisk({ kind: 'delete_file', target: 'src/App.tsx' })).toBe('critical');
    expect(classifyToolRisk({ kind: 'run_command', target: 'npm run build' })).toBe('high');
    expect(classifyToolRisk({ kind: 'read_context', target: 'docs/spec.md' })).toBe('low');
  });

  it('rejects planner results without research build and review tasks', () => {
    expect(isValidPlannerResult({
      missionTitle: '复刻办公室',
      tasks: [
        { id: 'research', role: 'researcher', title: '调研', summary: '调研参考', risk: 'low' },
        { id: 'build', role: 'builder', title: '构建', summary: '实现功能', risk: 'medium' },
        { id: 'review', role: 'reviewer', title: '审查', summary: '验证交付', risk: 'low' },
      ],
    })).toBe(true);

    expect(isValidPlannerResult({
      missionTitle: '坏计划',
      tasks: [{ id: 'build', role: 'builder', title: '直接构建', summary: '跳过调研', risk: 'medium' }],
    })).toBe(false);
  });

  it('detects secret-like payload values before persistence or migration', () => {
    expect(hasSecretLikeValue({ token: 'sk-live-1234567890' })).toBe(true);
    expect(hasSecretLikeValue({ authorization: 'Bearer abc.def.ghi' })).toBe(true);
    expect(hasSecretLikeValue({ note: '普通任务说明' })).toBe(false);
  });

  it('normalizes worker execution events into office events', () => {
    expect(normalizeWorkerEvent({
      id: 'worker-event-1',
      missionId: 'mission-1',
      missionTaskId: 'build',
      officeTaskId: 'task-build',
      workerId: 'worker-builder',
      type: 'worker.task_started',
      message: '开始构建',
      occurredAt: '2026-05-23T00:00:00.000Z',
    })).toMatchObject({
      type: 'task.started',
      taskId: 'task-build',
      agentId: 'worker-builder',
      missionId: 'mission-1',
      payload: {
        missionTaskId: 'build',
        message: '开始构建',
      },
    });
  });

  it('mock planner creates research build and review tasks from a user goal', async () => {
    const planner = createMockCommanderPlanner();
    const result = await planner.plan({
      goal: '复刻视频办公室',
      materialNote: '参考现有需求文档',
      constraintsText: '需要审批',
      requestedAt: '2026-05-23T00:00:00.000Z',
    });
    expect(result.tasks.map((task) => task.role)).toEqual(['researcher', 'builder', 'reviewer']);
  });

  it('mock worker execution pauses build on a tool approval request', async () => {
    const planner = createMockCommanderPlanner();
    const worker = createMockWorkerExecutionAdapter();
    const plan = await planner.plan({
      goal: '复刻视频办公室',
      materialNote: '',
      constraintsText: '',
      requestedAt: '2026-05-23T00:00:00.000Z',
    });
    const events = await worker.startMission('mission-1', plan.tasks);
    expect(events.map((event) => event.type)).toContain('worker.tool_requested');
    expect(worker.getStatus()).toBe('approval_required');
  });

  it('guarded real planner refuses execution without requesting credentials', async () => {
    const planner = createGuardedRealCommanderPlanner();
    await expect(planner.plan({
      goal: '真实执行',
      materialNote: '',
      constraintsText: '',
      requestedAt: '2026-05-23T00:00:00.000Z',
    })).rejects.toThrow('受保护占位');
    expect(planner.getStatus()).toBe('guarded');
  });
});
