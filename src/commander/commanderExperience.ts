import type { ApprovalRequest, Artifact, CommanderMission, MissionTask } from '@/core/types';

export type CommanderExperienceStage =
  | 'idle'
  | 'planning'
  | 'working'
  | 'approval'
  | 'delivering'
  | 'completed'
  | 'blocked';

export interface CommanderExperienceState {
  stage: CommanderExperienceStage;
  headline: string;
  nextAction: string;
  highlightTaskIds: string[];
  highlightWorkerIds: string[];
  artifactIds: string[];
}

function missionTasks(mission: CommanderMission): MissionTask[] {
  return mission.taskIds.map((id) => mission.tasks[id]).filter(Boolean);
}

function countPendingApprovals(
  mission: CommanderMission,
  approvals: Record<string, ApprovalRequest>,
): number {
  return Object.values(approvals).filter(
    (a) => a.missionId === mission.id && a.status === 'pending',
  ).length;
}

function getHighlightWorkerIds(
  mission: CommanderMission,
  highlightTaskIds: string[],
): string[] {
  const workers = new Set<string>();
  for (const taskId of highlightTaskIds) {
    const task = mission.tasks[taskId];
    if (task) workers.add(task.workerId);
  }
  return [...workers];
}

export function buildCommanderExperienceState(
  mission: CommanderMission | undefined,
  approvals: Record<string, ApprovalRequest>,
  artifacts: Record<string, Artifact>,
): CommanderExperienceState {
  if (!mission) {
    return {
      stage: 'idle',
      headline: '等待下达目标',
      nextAction: '输入目标后，Commander 会拆解任务并分配 Worker。',
      highlightTaskIds: [],
      highlightWorkerIds: [],
      artifactIds: [],
    };
  }

  const tasks = missionTasks(mission);
  const pendingCount = countPendingApprovals(mission, approvals);
  const missionArtifacts = Object.values(artifacts).filter((a) => a.missionId === mission.id);
  const artifactIds = missionArtifacts.map((a) => a.id);
  const blockedTasks = tasks.filter((t) => t.status === 'blocked' || t.status === 'failed');
  const completedTasks = tasks.filter((t) => t.status === 'completed');
  const activeTasks = tasks.filter((t) =>
    ['assigned', 'running', 'waiting_input', 'approval_required'].includes(t.status),
  );
  const plannedTasks = tasks.filter((t) => t.status === 'planned');

  // Stage: approval has highest priority
  if (pendingCount > 0) {
    const highlightTaskIds = Object.values(approvals)
      .filter((a) => a.missionId === mission.id && a.status === 'pending')
      .map((a) => a.taskId);
    return {
      stage: 'approval',
      headline: `有 ${pendingCount} 项审批需要你的决定`,
      nextAction: '同意或拒绝审批后，Worker 将继续执行。高风险操作请仔细确认影响范围。',
      highlightTaskIds,
      highlightWorkerIds: getHighlightWorkerIds(mission, highlightTaskIds),
      artifactIds,
    };
  }

  // Stage: blocked
  if (blockedTasks.length > 0) {
    const highlightTaskIds = blockedTasks.map((t) => t.id);
    return {
      stage: 'blocked',
      headline: '任务已暂停',
      nextAction: '原因是审批被拒绝或 Worker 遇到阻塞。请调整目标后重新规划。',
      highlightTaskIds,
      highlightWorkerIds: getHighlightWorkerIds(mission, highlightTaskIds),
      artifactIds,
    };
  }

  // Stage: completed
  if (completedTasks.length === tasks.length && tasks.length > 0) {
    const totalSteps = tasks.length;
    const artifactCount = artifactIds.length;
    const hasPending = pendingCount === 0;
    const riskSuffix = hasPending ? '当前没有待审批风险。' : '';
    return {
      stage: 'completed',
      headline: '所有任务已完成',
      nextAction: `本次任务共拆成 ${totalSteps} 个步骤，已完成 ${completedTasks.length} 个，产出 ${artifactCount} 个可查看产物。${riskSuffix}`,
      highlightTaskIds: [],
      highlightWorkerIds: [],
      artifactIds,
    };
  }

  // Stage: delivering (some completed, some still running, artifacts appearing)
  if (completedTasks.length > 0 && (activeTasks.length > 0 || plannedTasks.length > 0)) {
    const highlightTaskIds = activeTasks.map((t) => t.id);
    return {
      stage: 'delivering',
      headline: 'Worker 正在交付产物',
      nextAction: `已完成 ${completedTasks.length}/${tasks.length} 个任务，${artifactIds.length} 个产物已生成。继续等待剩余任务完成。`,
      highlightTaskIds,
      highlightWorkerIds: getHighlightWorkerIds(mission, highlightTaskIds),
      artifactIds,
    };
  }

  // Stage: working
  if (activeTasks.length > 0) {
    const highlightTaskIds = activeTasks.map((t) => t.id);
    return {
      stage: 'working',
      headline: 'Worker 团队正在执行任务',
      nextAction: `${activeTasks.length} 个任务正在执行中。等待 Worker 完成或请求审批。`,
      highlightTaskIds,
      highlightWorkerIds: getHighlightWorkerIds(mission, highlightTaskIds),
      artifactIds,
    };
  }

  // Stage: planning
  return {
    stage: 'planning',
    headline: '任务已规划，等待执行',
    nextAction: 'Commander 已将目标拆解为子任务。Worker 即将开始执行。',
    highlightTaskIds: plannedTasks.map((t) => t.id),
    highlightWorkerIds: [],
    artifactIds,
  };
}
