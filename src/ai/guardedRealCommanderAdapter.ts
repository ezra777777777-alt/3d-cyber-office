import type {
  CommanderGoalInput,
  CommanderPlannerAdapter,
  CommanderPlannerResult,
  PlannedMissionTask,
  WorkerExecutionAdapter,
  WorkerExecutionEvent,
} from './commanderAdapterTypes';

export function createGuardedRealCommanderPlanner(): CommanderPlannerAdapter {
  return {
    mode: 'guarded_real',
    getStatus: () => 'guarded',
    async plan(_input: CommanderGoalInput): Promise<CommanderPlannerResult> {
      throw new Error('真实 AI Commander Adapter 尚未连接。当前为受保护占位，不会请求或保存任何凭据。');
    },
  };
}

export function createGuardedRealWorkerExecutionAdapter(): WorkerExecutionAdapter {
  return {
    mode: 'guarded_real',
    getStatus: () => 'guarded',
    async startMission(_missionId: string, _tasks: PlannedMissionTask[]): Promise<WorkerExecutionEvent[]> {
      throw new Error('真实 Worker Runtime 尚未连接。请先接入外部安全 Runtime 服务。');
    },
    async approveToolRequest(_requestId: string): Promise<WorkerExecutionEvent[]> {
      throw new Error('真实工具执行尚未启用。');
    },
    async rejectToolRequest(_requestId: string, _reason: string): Promise<WorkerExecutionEvent[]> {
      return [];
    },
  };
}
