import { describe, expect, it } from 'vitest';
import type { ApprovalRequest, CommanderMission } from '@/core/types';
import {
  applyApprovalDecision,
  buildMissionLanes,
  getReadyMissionTaskIds,
  summarizeMission,
} from './commanderTesting';

const mission: CommanderMission = {
  id: 'mission-demo',
  title: 'Replicate the cyber office workflow',
  originalGoal: 'Research the reference, build the office, and review the result.',
  materialNote: 'Use the existing local video notes.',
  constraints: ['Stay in Demo mode', 'Keep outputs linked'],
  status: 'running',
  createdAt: '2026-05-22T09:00:00.000Z',
  updatedAt: '2026-05-22T09:10:00.000Z',
  summary: null,
  taskIds: ['research', 'build', 'review'],
  tasks: {
    research: {
      id: 'research',
      title: 'Extract workflow requirements',
      summary: 'Collect the control-loop requirements.',
      status: 'completed',
      workerId: 'worker-research',
      officeTaskId: 'task-research',
      dependencyIds: [],
      expectedArtifactIds: ['artifact-notes'],
      risk: 'low',
      approvalId: null,
      artifactIds: ['artifact-notes'],
    },
    build: {
      id: 'build',
      title: 'Build Commander UI',
      summary: 'Create graph and approval surfaces.',
      status: 'assigned',
      workerId: 'worker-builder',
      officeTaskId: 'task-build',
      dependencyIds: ['research'],
      expectedArtifactIds: ['artifact-patch'],
      risk: 'medium',
      approvalId: 'approval-write',
      artifactIds: [],
    },
    review: {
      id: 'review',
      title: 'Review linked outputs',
      summary: 'Check result and summarize gaps.',
      status: 'planned',
      workerId: 'worker-reviewer',
      officeTaskId: 'task-review',
      dependencyIds: ['build'],
      expectedArtifactIds: ['artifact-review'],
      risk: 'low',
      approvalId: null,
      artifactIds: [],
    },
  },
};

const approval: ApprovalRequest = {
  id: 'approval-write',
  missionId: mission.id,
  taskId: 'build',
  officeTaskId: 'task-build',
  requestedByWorkerId: 'worker-builder',
  action: 'write workspace files',
  reason: 'Build task must update React source files.',
  target: 'src/ui/commander',
  impact: 'Creates Commander UI components.',
  risk: 'medium',
  status: 'pending',
  requestedAt: '2026-05-22T09:04:00.000Z',
  resolvedAt: null,
  resolutionNote: null,
};

describe('Commander workflow helpers', () => {
  it('groups mission tasks by dependency depth', () => {
    expect(buildMissionLanes(mission).map((lane) => lane.map((task) => task.id))).toEqual([
      ['research'],
      ['build'],
      ['review'],
    ]);
  });

  it('returns dependency-satisfied tasks that are ready for execution', () => {
    expect(getReadyMissionTaskIds(mission)).toEqual(['build']);
  });

  it('rejects approval into a blocked mission task state', () => {
    expect(applyApprovalDecision(mission, approval, 'rejected').tasks.build.status).toBe('blocked');
  });

  it('summarizes delivered artifacts and open risks', () => {
    expect(summarizeMission(mission, [approval], ['artifact-notes'])).toMatchObject({
      completedCount: 1,
      pendingApprovalCount: 1,
      deliveredArtifactIds: ['artifact-notes'],
    });
  });
});
