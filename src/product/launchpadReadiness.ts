import type { RuntimeConnectionStatus, RuntimeMode } from '@/runtime/runtimeTypes';
import type { ModuleId } from '@/i18n/zh';

export type LaunchpadStepId =
  | 'start-runtime'
  | 'connect-runtime'
  | 'plan-mission'
  | 'approve-risk'
  | 'inspect-results';

export type LaunchpadStepState = 'locked' | 'action' | 'ready' | 'done';
export type LaunchpadPrimaryStatus = 'blocked' | 'ready' | 'action' | 'complete';

export interface LaunchpadInput {
  runtimeStatus: RuntimeConnectionStatus;
  runtimeMode: RuntimeMode;
  hasMission: boolean;
  hasPendingApproval: boolean;
  hasCompletedMission: boolean;
  artifactCount: number;
}

export interface LaunchpadAction {
  label: string;
  moduleId: ModuleId;
}

export interface LaunchpadStep {
  id: LaunchpadStepId;
  state: LaunchpadStepState;
}

export interface LaunchpadReadiness {
  primaryStatus: LaunchpadPrimaryStatus;
  primaryTitle: string;
  primaryBody: string;
  primaryAction: LaunchpadAction;
  steps: LaunchpadStep[];
}

function isRuntimeConnected(input: LaunchpadInput): boolean {
  return input.runtimeMode === 'connected' && input.runtimeStatus === 'connected';
}

export function deriveLaunchpadReadiness(input: LaunchpadInput): LaunchpadReadiness {
  const runtimeConnected = isRuntimeConnected(input);

  if (!runtimeConnected) {
    return {
      primaryStatus: 'blocked',
      primaryTitle: '先启动本地 Runtime',
      primaryBody: '办公室还没有连上本地任务进程。启动 Runtime 后，龙虾 Commander 才能调度 Worker。',
      primaryAction: { label: '打开网关', moduleId: 'gateway' },
      steps: [
        { id: 'start-runtime', state: 'action' },
        { id: 'connect-runtime', state: 'locked' },
        { id: 'plan-mission', state: 'locked' },
        { id: 'approve-risk', state: 'locked' },
        { id: 'inspect-results', state: 'locked' },
      ],
    };
  }

  if (input.hasPendingApproval) {
    return {
      primaryStatus: 'action',
      primaryTitle: '有动作等待审批',
      primaryBody: 'Worker 已暂停在安全边界前。请先确认影响范围，再决定是否放行。',
      primaryAction: { label: '去审批', moduleId: 'office' },
      steps: [
        { id: 'start-runtime', state: 'done' },
        { id: 'connect-runtime', state: 'done' },
        { id: 'plan-mission', state: 'done' },
        { id: 'approve-risk', state: 'action' },
        { id: 'inspect-results', state: 'locked' },
      ],
    };
  }

  if (input.hasCompletedMission && input.artifactCount > 0) {
    return {
      primaryStatus: 'complete',
      primaryTitle: '这轮任务已经留下产物',
      primaryBody: '可以打开历史回放、查看产物，或者基于模板开始下一轮任务。',
      primaryAction: { label: '查看历史', moduleId: 'history' },
      steps: [
        { id: 'start-runtime', state: 'done' },
        { id: 'connect-runtime', state: 'done' },
        { id: 'plan-mission', state: 'done' },
        { id: 'approve-risk', state: 'done' },
        { id: 'inspect-results', state: 'done' },
      ],
    };
  }

  return {
    primaryStatus: 'ready',
    primaryTitle: input.hasMission ? '任务正在推进' : '可以下达第一个任务',
    primaryBody: input.hasMission
      ? '继续观察 Commander、日志和任务状态，必要时处理审批。'
      : '选择一个模板，或者直接告诉龙虾 Commander 你想完成什么。',
    primaryAction: { label: input.hasMission ? '回到办公室' : '开始下达任务', moduleId: 'office' },
    steps: [
      { id: 'start-runtime', state: 'done' },
      { id: 'connect-runtime', state: 'done' },
      { id: 'plan-mission', state: input.hasMission ? 'done' : 'action' },
      { id: 'approve-risk', state: input.hasMission ? 'ready' : 'locked' },
      { id: 'inspect-results', state: input.hasCompletedMission ? 'ready' : 'locked' },
    ],
  };
}
