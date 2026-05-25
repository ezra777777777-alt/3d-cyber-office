import { describe, expect, it } from 'vitest';
import { buildCommanderExperienceState } from './commanderExperience';
import type { ApprovalRequest, Artifact, CommanderMission } from '@/core/types';

function makeMission(overrides: Partial<CommanderMission> = {}): CommanderMission {
  return {
    id: 'mission-1',
    title: '复刻视频工作流',
    originalGoal: '复刻视频里的办公室工作流',
    materialNote: '',
    constraints: [],
    status: 'running',
    createdAt: '2026-05-23T00:00:00Z',
    updatedAt: '2026-05-23T00:00:00Z',
    summary: null,
    taskIds: [],
    tasks: {},
    ...overrides,
  };
}

function makeApproval(
  id: string,
  missionId: string,
  taskId: string,
  status: 'pending' | 'approved' | 'rejected' = 'pending',
): ApprovalRequest {
  return {
    id,
    missionId,
    taskId,
    officeTaskId: `office-${taskId}`,
    requestedByWorkerId: 'worker-builder',
    action: 'write_file',
    reason: '需要生成 Commander UI 改动',
    target: 'src/ui/commander',
    impact: '会修改项目源码',
    risk: 'high',
    status,
    requestedAt: '2026-05-23T00:00:00Z',
    resolvedAt: null,
    resolutionNote: null,
  };
}

function makeArtifact(id: string, missionId: string, taskId: string): Artifact {
  return {
    id,
    missionId,
    title: `产物 ${id}`,
    kind: 'patch',
    path: `workspace/${id}.patch`,
    summary: '自动生成的补丁',
    createdByWorkerId: 'worker-builder',
    taskId,
    officeTaskId: `office-${taskId}`,
    previewable: false,
    workspaceBacked: true,
    createdAt: '2026-05-23T00:00:00Z',
  };
}

describe('buildCommanderExperienceState', () => {
  it('asks for a goal when no mission exists', () => {
    const state = buildCommanderExperienceState(undefined, {}, {});
    expect(state).toMatchObject({
      stage: 'idle',
      headline: '等待下达目标',
      nextAction: expect.stringContaining('输入目标后'),
    });
    expect(state.highlightTaskIds).toEqual([]);
    expect(state.highlightWorkerIds).toEqual([]);
  });

  it('returns planning when mission has only planned tasks', () => {
    const mission = makeMission({
      taskIds: ['task-plan'],
      tasks: {
        'task-plan': {
          id: 'task-plan',
          title: '规划阶段',
          summary: '',
          status: 'planned',
          workerId: 'worker-builder',
          officeTaskId: 'office-plan',
          dependencyIds: [],
          expectedArtifactIds: [],
          risk: 'low',
          approvalId: null,
          artifactIds: [],
        },
      },
    });
    const state = buildCommanderExperienceState(mission, {}, {});
    expect(state.stage).toBe('planning');
    expect(state.headline).toContain('等待执行');
  });

  it('prioritizes pending approval', () => {
    const mission = makeMission({
      taskIds: ['task-build'],
      tasks: {
        'task-build': {
          id: 'task-build',
          title: '构建 Commander 闭环',
          summary: '生成审批和产物',
          status: 'approval_required',
          workerId: 'worker-builder',
          officeTaskId: 'office-build',
          dependencyIds: [],
          expectedArtifactIds: [],
          risk: 'high',
          approvalId: 'approval-1',
          artifactIds: [],
        },
      },
    });
    const approvals: Record<string, ApprovalRequest> = {
      'approval-1': makeApproval('approval-1', 'mission-1', 'task-build'),
    };
    const state = buildCommanderExperienceState(mission, approvals, {});
    expect(state.stage).toBe('approval');
    expect(state.highlightTaskIds).toEqual(['task-build']);
    expect(state.highlightWorkerIds).toEqual(['worker-builder']);
  });

  it('returns blocked when mission has blocked tasks and no pending approvals', () => {
    const mission = makeMission({
      status: 'blocked',
      taskIds: ['task-blocked'],
      tasks: {
        'task-blocked': {
          id: 'task-blocked',
          title: '被阻塞的任务',
          summary: '',
          status: 'blocked',
          workerId: 'worker-builder',
          officeTaskId: 'office-blocked',
          dependencyIds: [],
          expectedArtifactIds: [],
          risk: 'medium',
          approvalId: null,
          artifactIds: [],
        },
      },
    });
    const state = buildCommanderExperienceState(mission, {}, {});
    expect(state.stage).toBe('blocked');
    expect(state.headline).toContain('暂停');
  });

  it('returns completed when all tasks done', () => {
    const mission = makeMission({
      status: 'completed',
      taskIds: ['task-done'],
      tasks: {
        'task-done': {
          id: 'task-done',
          title: '已完成任务',
          summary: '',
          status: 'completed',
          workerId: 'worker-builder',
          officeTaskId: 'office-done',
          dependencyIds: [],
          expectedArtifactIds: [],
          risk: 'low',
          approvalId: null,
          artifactIds: ['artifact-1'],
        },
      },
    });
    const artifacts: Record<string, Artifact> = {
      'artifact-1': makeArtifact('artifact-1', 'mission-1', 'task-done'),
    };
    const state = buildCommanderExperienceState(mission, {}, artifacts);
    expect(state.stage).toBe('completed');
    expect(state.nextAction).toContain('产出');
    expect(state.artifactIds).toEqual(['artifact-1']);
  });

  it('returns delivering when some tasks completed and some still running', () => {
    const mission = makeMission({
      taskIds: ['task-done', 'task-running'],
      tasks: {
        'task-done': {
          id: 'task-done',
          title: '已完成任务',
          summary: '',
          status: 'completed',
          workerId: 'worker-reviewer',
          officeTaskId: 'office-done',
          dependencyIds: [],
          expectedArtifactIds: [],
          risk: 'low',
          approvalId: null,
          artifactIds: ['artifact-1'],
        },
        'task-running': {
          id: 'task-running',
          title: '进行中任务',
          summary: '',
          status: 'running',
          workerId: 'worker-builder',
          officeTaskId: 'office-running',
          dependencyIds: ['task-done'],
          expectedArtifactIds: [],
          risk: 'medium',
          approvalId: null,
          artifactIds: [],
        },
      },
    });
    const artifacts: Record<string, Artifact> = {
      'artifact-1': makeArtifact('artifact-1', 'mission-1', 'task-done'),
    };
    const state = buildCommanderExperienceState(mission, {}, artifacts);
    expect(state.stage).toBe('delivering');
    expect(state.highlightTaskIds).toEqual(['task-running']);
    expect(state.highlightWorkerIds).toEqual(['worker-builder']);
  });

  it('returns working when tasks are actively running', () => {
    const mission = makeMission({
      taskIds: ['task-active'],
      tasks: {
        'task-active': {
          id: 'task-active',
          title: '执行中任务',
          summary: '',
          status: 'running',
          workerId: 'worker-builder',
          officeTaskId: 'office-active',
          dependencyIds: [],
          expectedArtifactIds: [],
          risk: 'medium',
          approvalId: null,
          artifactIds: [],
        },
      },
    });
    const state = buildCommanderExperienceState(mission, {}, {});
    expect(state.stage).toBe('working');
    expect(state.highlightTaskIds).toEqual(['task-active']);
  });

  it('approval takes priority over blocked tasks', () => {
    const mission = makeMission({
      taskIds: ['task-approval', 'task-blocked'],
      tasks: {
        'task-approval': {
          id: 'task-approval',
          title: '需要审批',
          summary: '',
          status: 'approval_required',
          workerId: 'worker-builder',
          officeTaskId: 'office-approval',
          dependencyIds: [],
          expectedArtifactIds: [],
          risk: 'high',
          approvalId: 'approval-1',
          artifactIds: [],
        },
        'task-blocked': {
          id: 'task-blocked',
          title: '已阻塞',
          summary: '',
          status: 'blocked',
          workerId: 'worker-reviewer',
          officeTaskId: 'office-blocked',
          dependencyIds: [],
          expectedArtifactIds: [],
          risk: 'medium',
          approvalId: null,
          artifactIds: [],
        },
      },
    });
    const approvals: Record<string, ApprovalRequest> = {
      'approval-1': makeApproval('approval-1', 'mission-1', 'task-approval'),
    };
    const state = buildCommanderExperienceState(mission, approvals, {});
    expect(state.stage).toBe('approval');
  });
});
