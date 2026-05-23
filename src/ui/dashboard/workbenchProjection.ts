export type ProjectedTaskStatus =
  | 'blocked'
  | 'approval_required'
  | 'running'
  | 'waiting_input'
  | 'assigned'
  | 'completed'
  | 'planned'
  | string;

export interface ProjectedWorkbenchTask {
  id: string;
  title: string;
  status: ProjectedTaskStatus;
  priority?: 'low' | 'medium' | 'high';
}

export interface MinimalMissionTask {
  id: string;
  title: string;
  status: ProjectedTaskStatus;
  officeTaskId: string;
  artifactIds: string[];
}

export interface MinimalMission {
  id: string;
  title: string;
  taskIds: string[];
  tasks: Record<string, MinimalMissionTask>;
}

export interface MinimalApproval {
  id: string;
  status: 'pending' | 'approved' | 'rejected';
  taskId: string;
}

export interface MinimalRuntimeDiagnostic {
  id: string;
  severity: 'info' | 'warning' | 'error';
  message: string;
}

export interface BuildWorkbenchContextInput {
  mission?: MinimalMission;
  selectedTaskId: string | null;
  selectedMissionTaskId: string | null;
  selectedArtifactId: string | null;
  approvals: MinimalApproval[];
  runtimeDiagnostics: MinimalRuntimeDiagnostic[];
}

export interface WorkbenchLink {
  kind: 'office_task' | 'mission_task' | 'artifact' | 'runtime_diagnostic';
  id: string;
  label: string;
  module: 'tasks' | 'files' | 'gateway';
}

export interface WorkbenchContext {
  missionId: string | null;
  missionTitle: string | null;
  selectedTaskId: string | null;
  selectedMissionTaskId: string | null;
  selectedArtifactId: string | null;
  activeLinks: WorkbenchLink[];
  blockedCount: number;
  pendingApprovalCount: number;
  artifactCount: number;
  runtimeWarningCount: number;
}

const STATUS_RANK: Record<string, number> = {
  blocked: 0,
  failed: 0,
  approval_required: 1,
  waiting_input: 2,
  running: 3,
  assigned: 4,
  planned: 5,
  completed: 6,
};

export function orderWorkbenchTasks<T extends ProjectedWorkbenchTask>(tasks: T[]): T[] {
  return [...tasks].sort((a, b) => {
    const statusDelta = (STATUS_RANK[a.status] ?? 9) - (STATUS_RANK[b.status] ?? 9);
    if (statusDelta !== 0) return statusDelta;
    const priorityRank = { high: 0, medium: 1, low: 2 };
    return (priorityRank[a.priority ?? 'medium'] ?? 1) - (priorityRank[b.priority ?? 'medium'] ?? 1);
  });
}

export function buildWorkbenchContext(input: BuildWorkbenchContextInput): WorkbenchContext {
  const missionTasks = input.mission
    ? input.mission.taskIds.map((id) => input.mission!.tasks[id]).filter(Boolean)
    : [];
  const artifactIds = missionTasks.flatMap((task) => task.artifactIds);
  const links: WorkbenchLink[] = [];

  if (input.selectedTaskId) {
    links.push({ kind: 'office_task', id: input.selectedTaskId, label: input.selectedTaskId, module: 'tasks' });
  }
  if (input.selectedMissionTaskId) {
    links.push({ kind: 'mission_task', id: input.selectedMissionTaskId, label: input.selectedMissionTaskId, module: 'tasks' });
  }
  if (input.selectedArtifactId) {
    links.push({ kind: 'artifact', id: input.selectedArtifactId, label: input.selectedArtifactId, module: 'files' });
  }
  for (const diagnostic of input.runtimeDiagnostics.filter((item) => item.severity !== 'info')) {
    links.push({ kind: 'runtime_diagnostic', id: diagnostic.id, label: diagnostic.message, module: 'gateway' });
  }

  return {
    missionId: input.mission?.id ?? null,
    missionTitle: input.mission?.title ?? null,
    selectedTaskId: input.selectedTaskId,
    selectedMissionTaskId: input.selectedMissionTaskId,
    selectedArtifactId: input.selectedArtifactId,
    activeLinks: links,
    blockedCount: missionTasks.filter((task) => task.status === 'blocked' || task.status === 'failed').length,
    pendingApprovalCount: input.approvals.filter((approval) => approval.status === 'pending').length,
    artifactCount: artifactIds.length,
    runtimeWarningCount: input.runtimeDiagnostics.filter((item) => item.severity === 'warning' || item.severity === 'error').length,
  };
}

export function summarizeReviewInputs(input: {
  completedTasks: number;
  blockedTasks: number;
  artifacts: number;
  runtimeWarnings: number;
}) {
  if (input.blockedTasks > 0 || input.runtimeWarnings > 0) {
    return {
      health: 'needs_attention' as const,
      headline: `今日完成 ${input.completedTasks} 项，仍有 ${input.blockedTasks} 项阻塞`,
      nextAction: '优先处理阻塞任务，并检查 Runtime 诊断。',
    };
  }
  return {
    health: 'healthy' as const,
    headline: `今日完成 ${input.completedTasks} 项，交付 ${input.artifacts} 个产物`,
    nextAction: '可以进入复盘并规划下一轮任务。',
  };
}
