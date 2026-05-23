import type { PlannedMissionTask, ToolRequest, WorkerExecutionAdapter, WorkerExecutionEvent } from './commanderAdapterTypes';

function now(offsetMs = 0): string {
  return new Date(Date.now() + offsetMs).toISOString();
}

export function createMockWorkerExecutionAdapter(): WorkerExecutionAdapter {
  let pendingRequest: ToolRequest | null = null;

  return {
    mode: 'mock_ai',
    getStatus: () => (pendingRequest ? 'approval_required' : 'idle'),
    async startMission(missionId: string, tasks: PlannedMissionTask[]): Promise<WorkerExecutionEvent[]> {
      const buildTask = tasks.find((task) => task.role === 'builder');
      pendingRequest = buildTask
        ? {
            id: `approval-${missionId}-${buildTask.id}`,
            missionId,
            missionTaskId: buildTask.id,
            officeTaskId: `task-${buildTask.id}`,
            requestedByWorkerId: 'worker-builder',
            kind: 'write_file',
            target: 'src/',
            reason: '构建 Worker 需要写入本地项目文件。',
            impact: '会修改前端实现并生成补丁产物。',
            risk: 'high',
          }
        : null;

      return tasks.flatMap((task, index) => {
        const workerId =
          task.role === 'researcher'
            ? 'worker-research'
            : task.role === 'builder'
              ? 'worker-builder'
              : 'worker-review';
        const officeTaskId = `task-${task.id}`;
        const base = index * 500;
        const started: WorkerExecutionEvent = {
          id: `${missionId}-${task.id}-started`,
          missionId,
          missionTaskId: task.id,
          officeTaskId,
          workerId,
          type: 'worker.task_started',
          message: `${task.title}开始执行`,
          occurredAt: now(base),
        };
        if (task.role === 'builder' && pendingRequest) {
          return [
            started,
            {
              id: pendingRequest.id,
              missionId,
              missionTaskId: task.id,
              officeTaskId,
              workerId,
              type: 'worker.tool_requested',
              message: pendingRequest.reason,
              occurredAt: now(base + 200),
              payload: { toolRequest: pendingRequest },
            },
          ];
        }
        return [
          started,
          {
            id: `${missionId}-${task.id}-completed`,
            missionId,
            missionTaskId: task.id,
            officeTaskId,
            workerId,
            type: 'worker.task_completed',
            message: `${task.title}已完成`,
            occurredAt: now(base + 300),
          },
        ];
      });
    },
    async approveToolRequest(requestId: string): Promise<WorkerExecutionEvent[]> {
      if (!pendingRequest || pendingRequest.id !== requestId) return [];
      const request = pendingRequest;
      pendingRequest = null;
      return [
        {
          id: `${request.id}-artifact`,
          missionId: request.missionId,
          missionTaskId: request.missionTaskId,
          officeTaskId: request.officeTaskId,
          workerId: request.requestedByWorkerId,
          type: 'worker.artifact_created',
          message: '审批通过，已生成构建产物。',
          occurredAt: now(100),
          payload: { artifactId: `artifact-${request.missionTaskId}`, title: 'Mock AI 构建产物' },
        },
        {
          id: `${request.id}-completed`,
          missionId: request.missionId,
          missionTaskId: request.missionTaskId,
          officeTaskId: request.officeTaskId,
          workerId: request.requestedByWorkerId,
          type: 'worker.task_completed',
          message: '构建 Worker 已完成。',
          occurredAt: now(200),
        },
      ];
    },
    async rejectToolRequest(requestId: string, reason: string): Promise<WorkerExecutionEvent[]> {
      if (!pendingRequest || pendingRequest.id !== requestId) return [];
      const request = pendingRequest;
      pendingRequest = null;
      return [
        {
          id: `${request.id}-blocked`,
          missionId: request.missionId,
          missionTaskId: request.missionTaskId,
          officeTaskId: request.officeTaskId,
          workerId: request.requestedByWorkerId,
          type: 'worker.task_blocked',
          message: `审批拒绝：${reason}`,
          occurredAt: now(100),
        },
      ];
    },
  };
}
