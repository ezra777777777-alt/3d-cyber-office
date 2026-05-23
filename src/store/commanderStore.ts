import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  ApprovalRequest,
  ApprovalStatus,
  Artifact,
  CommanderMission,
  MissionStatus,
  MissionTaskStatus,
  OfficeEvent,
  WorkerProfile,
} from '@/core/types';
import { applyApprovalDecision } from '@/commander/commanderTesting';
import { createDemoMission, demoArtifacts, demoWorkers } from '@/data/demoCommander';

interface CommanderDraft {
  goal: string;
  materialNote: string;
  constraintsText: string;
}

interface CommanderState {
  workers: WorkerProfile[];
  missions: Record<string, CommanderMission>;
  selectedMissionId: string | null;
  approvals: Record<string, ApprovalRequest>;
  artifacts: Record<string, Artifact>;
  draft: CommanderDraft;
  setDraft: (patch: Partial<CommanderDraft>) => void;
  createMissionFromDraft: () => CommanderMission | null;
  selectMission: (missionId: string | null) => void;
  setMissionTaskStatus: (missionId: string, taskId: string, status: MissionTaskStatus) => void;
  setMissionStatus: (missionId: string, status: MissionStatus) => void;
  setMissionSummary: (missionId: string, summary: string) => void;
  requestApproval: (approval: ApprovalRequest) => void;
  resolveApproval: (approvalId: string, status: ApprovalStatus, note: string) => void;
  addArtifact: (artifact: Artifact) => void;
  ingestCommanderEvent: (event: OfficeEvent) => void;
  resetCommander: () => void;
}

const defaultDraft: CommanderDraft = {
  goal: 'Replicate the cyber office Commander loop from the reference video.',
  materialNote: 'Use the reviewed local video and current requirement documents.',
  constraintsText: 'Stay in Demo mode\nShow approvals before write actions\nLink artifacts to worker tasks',
};

function splitConstraints(value: string): string[] {
  return value
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean);
}

function statefulApprovalFromEvent(event: OfficeEvent): ApprovalRequest | null {
  if (!event.missionId || !event.approvalId || !event.taskId) return null;

  return {
    id: event.approvalId,
    missionId: event.missionId,
    taskId: String(event.payload.missionTaskId),
    officeTaskId: event.taskId,
    requestedByWorkerId: 'worker-builder',
    action: 'write workspace files',
    reason: String(event.payload.reason ?? 'Workspace write request'),
    target: 'src/ui/commander',
    impact: 'Create local Commander workflow components.',
    risk: 'medium',
    status: 'pending',
    requestedAt: event.occurredAt,
    resolvedAt: null,
    resolutionNote: null,
  };
}

function statefulArtifactFromEvent(event: OfficeEvent): Artifact | null {
  if (!event.missionId || !event.artifactId || !event.taskId) return null;

  return {
    id: event.artifactId,
    missionId: event.missionId,
    title: String(event.payload.title ?? event.artifactId),
    kind: 'notes',
    path: String(event.payload.path ?? 'workspace/unknown.md'),
    summary: 'Created by the Commander Demo scenario.',
    createdByWorkerId: 'worker-research',
    taskId: String(event.payload.missionTaskId),
    officeTaskId: event.taskId,
    previewable: true,
    workspaceBacked: false,
    createdAt: event.occurredAt,
  };
}

export const useCommanderStore = create<CommanderState>()(
  persist(
    (set, get) => ({
      workers: demoWorkers,
      missions: {},
      selectedMissionId: null,
      approvals: {},
      artifacts: Object.fromEntries(demoArtifacts.map((artifact) => [artifact.id, artifact])),
      draft: defaultDraft,
      setDraft: (patch) => set((state) => ({ draft: { ...state.draft, ...patch } })),
      createMissionFromDraft: () => {
        const { draft } = get();
        if (!draft.goal.trim()) return null;

        const mission = createDemoMission(
          draft.goal.trim(),
          draft.materialNote.trim(),
          splitConstraints(draft.constraintsText),
        );

        set((state) => ({
          missions: { ...state.missions, [mission.id]: mission },
          selectedMissionId: mission.id,
        }));

        return mission;
      },
      selectMission: (selectedMissionId) => set({ selectedMissionId }),
      setMissionTaskStatus: (missionId, taskId, status) =>
        set((state) => {
          const mission = state.missions[missionId];
          const task = mission?.tasks[taskId];
          if (!mission || !task) return state;

          return {
            missions: {
              ...state.missions,
              [mission.id]: {
                ...mission,
                updatedAt: new Date().toISOString(),
                tasks: {
                  ...mission.tasks,
                  [task.id]: { ...task, status },
                },
              },
            },
          };
        }),
      setMissionStatus: (missionId, status) =>
        set((state) => {
          const mission = state.missions[missionId];
          if (!mission) return state;
          return {
            missions: {
              ...state.missions,
              [mission.id]: {
                ...mission,
                status,
                updatedAt: new Date().toISOString(),
              },
            },
          };
        }),
      setMissionSummary: (missionId, summary) =>
        set((state) => {
          const mission = state.missions[missionId];
          if (!mission) return state;
          return {
            missions: {
              ...state.missions,
              [mission.id]: {
                ...mission,
                summary,
                updatedAt: new Date().toISOString(),
              },
            },
          };
        }),
      requestApproval: (approval) =>
        set((state) => ({
          approvals: { ...state.approvals, [approval.id]: approval },
        })),
      resolveApproval: (approvalId, status, note) =>
        set((state) => {
          const approval = state.approvals[approvalId];
          const mission = approval ? state.missions[approval.missionId] : undefined;
          if (!approval || !mission) return state;

          return {
            approvals: {
              ...state.approvals,
              [approval.id]: {
                ...approval,
                status,
                resolvedAt: new Date().toISOString(),
                resolutionNote: note,
              },
            },
            missions: {
              ...state.missions,
              [mission.id]: applyApprovalDecision(mission, approval, status),
            },
          };
        }),
      addArtifact: (artifact) =>
        set((state) => {
          const mission = state.missions[artifact.missionId];
          const task = mission?.tasks[artifact.taskId];

          return {
            artifacts: { ...state.artifacts, [artifact.id]: artifact },
            missions:
              mission && task
                ? {
                    ...state.missions,
                    [mission.id]: {
                      ...mission,
                      tasks: {
                        ...mission.tasks,
                        [task.id]: {
                          ...task,
                          artifactIds: [...task.artifactIds, artifact.id],
                        },
                      },
                    },
                  }
                : state.missions,
          };
        }),
      ingestCommanderEvent: (event) => {
        if (!event.missionId) return;

        if (event.type === 'commander.summary_ready') {
          get().setMissionSummary(event.missionId, String(event.payload.message ?? 'Mission update ready.'));
          if (event.payload.missionStatus === 'completed') {
            get().setMissionStatus(event.missionId, 'completed');
          }
          return;
        }

        const taskId = event.payload.missionTaskId as string | undefined;
        if (!taskId) return;

        if (event.type === 'task.assigned') {
          get().setMissionTaskStatus(event.missionId, taskId, 'assigned');
        }
        if (event.type === 'task.started') {
          get().setMissionTaskStatus(event.missionId, taskId, 'running');
        }
        if (event.type === 'task.waiting_input') {
          get().setMissionTaskStatus(event.missionId, taskId, 'waiting_input');
        }
        if (event.type === 'task.blocked') {
          get().setMissionTaskStatus(event.missionId, taskId, 'blocked');
        }
        if (event.type === 'task.completed') {
          get().setMissionTaskStatus(event.missionId, taskId, 'completed');
        }
        if (event.type === 'approval.requested' && event.approvalId) {
          const approval = statefulApprovalFromEvent(event);
          if (approval) get().requestApproval(approval);
          get().setMissionTaskStatus(event.missionId, taskId, 'approval_required');
        }
        if (event.type === 'artifact.created' && event.artifactId) {
          const artifact = statefulArtifactFromEvent(event);
          if (artifact) get().addArtifact(artifact);
        }
      },
      resetCommander: () =>
        set({
          missions: {},
          selectedMissionId: null,
          approvals: {},
          artifacts: Object.fromEntries(demoArtifacts.map((artifact) => [artifact.id, artifact])),
          draft: defaultDraft,
        }),
    }),
    {
      name: 'cyber-office-commander',
      partialize: (state) => ({
        missions: state.missions,
        selectedMissionId: state.selectedMissionId,
        approvals: state.approvals,
        artifacts: state.artifacts,
        draft: state.draft,
      }),
    },
  ),
);
