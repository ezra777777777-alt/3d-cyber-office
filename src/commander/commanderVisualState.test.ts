import { describe, expect, it } from 'vitest';
import type { ApprovalRequest, CommanderMission, WorkerProfile } from '@/core/types';
import {
  buildCommanderVisualState,
  countMissionArtifacts,
  getCommanderTone,
  getMissionWorkerLinks,
} from './commanderVisualState';

const workers: WorkerProfile[] = [
  {
    id: 'worker-research',
    name: '调研 Worker',
    role: 'researcher',
    capabilities: ['research'],
    tools: ['browser'],
    workspace: 'Research Bay',
    deskId: 'desk-a2',
    runtimeRef: null,
    status: 'idle',
    lastSeenAt: '2026-05-23T00:00:00.000Z',
  },
  {
    id: 'worker-builder',
    name: '构建 Worker',
    role: 'builder',
    capabilities: ['code'],
    tools: ['filesystem'],
    workspace: 'Build Bay',
    deskId: 'desk-b1',
    runtimeRef: null,
    status: 'idle',
    lastSeenAt: '2026-05-23T00:00:00.000Z',
  },
  {
    id: 'worker-review',
    name: '审阅 Worker',
    role: 'reviewer',
    capabilities: ['review'],
    tools: ['tests'],
    workspace: 'Review Bay',
    deskId: 'desk-b2',
    runtimeRef: null,
    status: 'idle',
    lastSeenAt: '2026-05-23T00:00:00.000Z',
  },
];

const mission: CommanderMission = {
  id: 'mission-001',
  title: '复刻 Commander 工作流',
  originalGoal: '完整复刻视频里的龙虾指挥流程',
  materialNote: '使用本地需求文档',
  constraints: ['保留审批'],
  status: 'running',
  createdAt: '2026-05-23T00:00:00.000Z',
  updatedAt: '2026-05-23T00:01:00.000Z',
  summary: null,
  taskIds: ['research', 'build', 'review'],
  tasks: {
    research: {
      id: 'research',
      title: '调研参考流程',
      summary: '提取 Commander 模式',
      status: 'completed',
      workerId: 'worker-research',
      officeTaskId: 'task-research',
      dependencyIds: [],
      expectedArtifactIds: [],
      risk: 'low',
      approvalId: null,
      artifactIds: ['artifact-research'],
    },
    build: {
      id: 'build',
      title: '构建指挥台视觉',
      summary: '强化 3D Commander',
      status: 'approval_required',
      workerId: 'worker-builder',
      officeTaskId: 'task-build',
      dependencyIds: ['research'],
      expectedArtifactIds: [],
      risk: 'medium',
      approvalId: 'approval-build',
      artifactIds: [],
    },
    review: {
      id: 'review',
      title: '审阅交付',
      summary: '检查状态联动',
      status: 'planned',
      workerId: 'worker-review',
      officeTaskId: 'task-review',
      dependencyIds: ['build'],
      expectedArtifactIds: [],
      risk: 'low',
      approvalId: null,
      artifactIds: [],
    },
  },
};

const approvals: Record<string, ApprovalRequest> = {
  'approval-build': {
    id: 'approval-build',
    missionId: 'mission-001',
    taskId: 'build',
    officeTaskId: 'task-build',
    requestedByWorkerId: 'worker-builder',
    action: 'write files',
    reason: '需要修改 Commander 视觉组件',
    target: 'src/scene',
    impact: '更新 3D 指挥台',
    risk: 'medium',
    status: 'pending',
    requestedAt: '2026-05-23T00:02:00.000Z',
    resolvedAt: null,
    resolutionNote: null,
  },
};

describe('Commander visual state', () => {
  it('prioritizes pending approvals as the Commander tone', () => {
    expect(getCommanderTone(mission, approvals)).toBe('approval');
  });

  it('counts mission artifacts from task artifact ids', () => {
    expect(countMissionArtifacts(mission)).toBe(1);
  });

  it('builds worker link targets for non-planned mission tasks with known desks', () => {
    expect(getMissionWorkerLinks(mission, workers)).toEqual([
      { missionTaskId: 'research', workerId: 'worker-research', deskId: 'desk-a2', status: 'completed' },
      { missionTaskId: 'build', workerId: 'worker-builder', deskId: 'desk-b1', status: 'approval_required' },
    ]);
  });

  it('derives the full visual state summary', () => {
    expect(buildCommanderVisualState(mission, approvals, workers)).toMatchObject({
      tone: 'approval',
      missionId: 'mission-001',
      missionTitle: '复刻 Commander 工作流',
      totalTasks: 3,
      activeTasks: 1,
      blockedTasks: 0,
      completedTasks: 1,
      pendingApprovals: 1,
      artifactCount: 1,
    });
  });

  it('returns idle state when no mission is selected', () => {
    expect(buildCommanderVisualState(undefined, {}, workers)).toMatchObject({
      tone: 'idle',
      missionId: null,
      missionTitle: '等待任务',
      totalTasks: 0,
      pendingApprovals: 0,
      artifactCount: 0,
      linkTargets: [],
    });
  });
});
