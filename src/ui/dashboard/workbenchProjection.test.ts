import { describe, expect, it } from 'vitest';
import { buildWorkbenchContext, orderWorkbenchTasks, summarizeReviewInputs } from './workbenchProjection';

describe('workbench projection', () => {
  it('puts blocked and approval-required tasks before ordinary running tasks', () => {
    const tasks = orderWorkbenchTasks([
      { id: 'task-running', status: 'running', priority: 'medium', title: '运行任务' },
      { id: 'task-blocked', status: 'blocked', priority: 'high', title: '阻塞任务' },
      { id: 'task-approval', status: 'approval_required', priority: 'high', title: '审批任务' },
    ]);

    expect(tasks.map((task) => task.id)).toEqual(['task-blocked', 'task-approval', 'task-running']);
  });

  it('builds a context strip from mission, selected task, artifacts, approvals, and diagnostics', () => {
    const context = buildWorkbenchContext({
      mission: {
        id: 'mission-1',
        title: '复刻视频工作流',
        taskIds: ['research', 'build'],
        tasks: {
          research: { id: 'research', title: '调研', status: 'completed', officeTaskId: 'task-research', artifactIds: ['artifact-a'] },
          build: { id: 'build', title: '构建', status: 'approval_required', officeTaskId: 'task-build', artifactIds: [] },
        },
      },
      selectedTaskId: 'task-build',
      selectedMissionTaskId: 'build',
      selectedArtifactId: 'artifact-a',
      approvals: [{ id: 'approval-1', status: 'pending', taskId: 'build' }],
      runtimeDiagnostics: [{ id: 'diag-1', severity: 'warning', message: '协议不匹配' }],
    });

    expect(context).toMatchObject({
      missionId: 'mission-1',
      missionTitle: '复刻视频工作流',
      selectedTaskId: 'task-build',
      selectedMissionTaskId: 'build',
      selectedArtifactId: 'artifact-a',
      pendingApprovalCount: 1,
      artifactCount: 1,
      runtimeWarningCount: 1,
    });
  });

  it('summarizes review inputs from completed, blocked, artifact, and runtime counts', () => {
    expect(summarizeReviewInputs({
      completedTasks: 3,
      blockedTasks: 1,
      artifacts: 2,
      runtimeWarnings: 1,
    })).toEqual({
      health: 'needs_attention',
      headline: '今日完成 3 项，仍有 1 项阻塞',
      nextAction: '优先处理阻塞任务，并检查 Runtime 诊断。',
    });
  });
});
