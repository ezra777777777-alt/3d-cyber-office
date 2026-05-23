import type {
  ApprovalRequest,
  ApprovalStatus,
  CommanderMission,
  MissionTask,
} from '@/core/types';

function getDepth(mission: CommanderMission, task: MissionTask, seen = new Set<string>()): number {
  if (task.dependencyIds.length === 0) return 0;
  if (seen.has(task.id)) return 0;
  seen.add(task.id);

  return Math.max(
    ...task.dependencyIds.map((dependencyId) => {
      const dependency = mission.tasks[dependencyId];
      return dependency ? getDepth(mission, dependency, new Set(seen)) + 1 : 0;
    }),
  );
}

export function buildMissionLanes(mission: CommanderMission): MissionTask[][] {
  const lanes = new Map<number, MissionTask[]>();

  for (const taskId of mission.taskIds) {
    const task = mission.tasks[taskId];
    if (!task) continue;
    const depth = getDepth(mission, task);
    lanes.set(depth, [...(lanes.get(depth) ?? []), task]);
  }

  return [...lanes.entries()]
    .sort(([left], [right]) => left - right)
    .map(([, tasks]) => tasks);
}

export function getReadyMissionTaskIds(mission: CommanderMission): string[] {
  return mission.taskIds.filter((taskId) => {
    const task = mission.tasks[taskId];
    if (!task || task.status !== 'assigned') return false;

    return task.dependencyIds.every((dependencyId) => mission.tasks[dependencyId]?.status === 'completed');
  });
}

export function applyApprovalDecision(
  mission: CommanderMission,
  approval: ApprovalRequest,
  status: ApprovalStatus,
): CommanderMission {
  const task = mission.tasks[approval.taskId];
  if (!task) return mission;

  const nextTaskStatus = status === 'approved' ? 'running' : 'blocked';
  const nextMissionStatus = status === 'approved' ? 'running' : 'blocked';

  return {
    ...mission,
    status: nextMissionStatus,
    tasks: {
      ...mission.tasks,
      [task.id]: {
        ...task,
        status: nextTaskStatus,
      },
    },
  };
}

export function summarizeMission(
  mission: CommanderMission,
  approvals: ApprovalRequest[],
  deliveredArtifactIds: string[],
) {
  const tasks = mission.taskIds.map((taskId) => mission.tasks[taskId]).filter(Boolean);

  return {
    taskCount: tasks.length,
    completedCount: tasks.filter((task) => task.status === 'completed').length,
    blockedCount: tasks.filter((task) => task.status === 'blocked').length,
    pendingApprovalCount: approvals.filter((approval) => approval.status === 'pending').length,
    deliveredArtifactIds,
  };
}
