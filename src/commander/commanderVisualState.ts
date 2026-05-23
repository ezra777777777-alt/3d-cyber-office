import type {
  ApprovalRequest,
  CommanderMission,
  MissionTask,
  MissionTaskStatus,
  WorkerProfile,
} from '@/core/types';

export type CommanderVisualTone =
  | 'idle'
  | 'planning'
  | 'running'
  | 'approval'
  | 'blocked'
  | 'completed';

export interface CommanderLinkTarget {
  missionTaskId: string;
  workerId: string;
  deskId: string;
  status: MissionTaskStatus;
}

export interface CommanderVisualState {
  tone: CommanderVisualTone;
  missionId: string | null;
  missionTitle: string;
  totalTasks: number;
  activeTasks: number;
  blockedTasks: number;
  completedTasks: number;
  pendingApprovals: number;
  artifactCount: number;
  linkTargets: CommanderLinkTarget[];
}

function missionTasks(mission: CommanderMission): MissionTask[] {
  return mission.taskIds
    .map((taskId) => mission.tasks[taskId])
    .filter(Boolean);
}

export function countPendingApprovals(
  mission: CommanderMission | undefined,
  approvals: Record<string, ApprovalRequest>,
): number {
  if (!mission) return 0;
  return Object.values(approvals).filter(
    (approval) => approval.missionId === mission.id && approval.status === 'pending',
  ).length;
}

export function countMissionArtifacts(mission: CommanderMission | undefined): number {
  if (!mission) return 0;
  return missionTasks(mission).reduce((total, task) => total + task.artifactIds.length, 0);
}

export function getCommanderTone(
  mission: CommanderMission | undefined,
  approvals: Record<string, ApprovalRequest>,
): CommanderVisualTone {
  if (!mission) return 'idle';
  if (countPendingApprovals(mission, approvals) > 0) return 'approval';

  const tasks = missionTasks(mission);
  if (tasks.some((task) => task.status === 'blocked' || task.status === 'failed')) return 'blocked';
  if (mission.status === 'completed') return 'completed';
  if (tasks.some((task) => ['assigned', 'running', 'waiting_input', 'approval_required'].includes(task.status))) {
    return 'running';
  }
  return 'planning';
}

export function getMissionWorkerLinks(
  mission: CommanderMission | undefined,
  workers: WorkerProfile[],
): CommanderLinkTarget[] {
  if (!mission) return [];
  const workerById = new Map(workers.map((worker) => [worker.id, worker]));
  return missionTasks(mission)
    .filter((task) => task.status !== 'planned')
    .map((task) => {
      const worker = workerById.get(task.workerId);
      if (!worker) return null;
      return {
        missionTaskId: task.id,
        workerId: task.workerId,
        deskId: worker.deskId,
        status: task.status,
      };
    })
    .filter((target): target is CommanderLinkTarget => Boolean(target));
}

export function buildCommanderVisualState(
  mission: CommanderMission | undefined,
  approvals: Record<string, ApprovalRequest>,
  workers: WorkerProfile[],
): CommanderVisualState {
  if (!mission) {
    return {
      tone: 'idle',
      missionId: null,
      missionTitle: '等待任务',
      totalTasks: 0,
      activeTasks: 0,
      blockedTasks: 0,
      completedTasks: 0,
      pendingApprovals: 0,
      artifactCount: 0,
      linkTargets: [],
    };
  }

  const tasks = missionTasks(mission);
  return {
    tone: getCommanderTone(mission, approvals),
    missionId: mission.id,
    missionTitle: mission.title,
    totalTasks: tasks.length,
    activeTasks: tasks.filter((task) => ['assigned', 'running', 'waiting_input', 'approval_required'].includes(task.status)).length,
    blockedTasks: tasks.filter((task) => task.status === 'blocked' || task.status === 'failed').length,
    completedTasks: tasks.filter((task) => task.status === 'completed').length,
    pendingApprovals: countPendingApprovals(mission, approvals),
    artifactCount: countMissionArtifacts(mission),
    linkTargets: getMissionWorkerLinks(mission, workers),
  };
}
