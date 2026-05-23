import { commanderApprovedDeliveryScenario } from './commanderScenario';
import type { GuidedCameraShot, GuidedDemoCue, GuidedDemoStep, GuidedStoryBeat } from './guidedDemoTypes';

export const guidedCameraShots: GuidedCameraShot[] = [
  { id: 'overview', label: '办公室总览', position: [5, 9, 11], target: [0, 0, -1], durationMs: 1400 },
  { id: 'commander', label: '龙虾 Commander', position: [-3.8, 4.2, 2.6], target: [-6.2, 1.0, -3.8], durationMs: 1300 },
  { id: 'workers', label: 'Worker 工位', position: [2.5, 4.8, 2.8], target: [2.1, 0.9, -4], durationMs: 1300 },
  { id: 'approval', label: '审批闸门', position: [-1.8, 5.2, 5.6], target: [-1.8, 0.9, -3.9], durationMs: 1200 },
  { id: 'delivery', label: '交付产物', position: [7.2, 4.4, 7.0], target: [5.8, 0.8, 4.1], durationMs: 1200 },
  { id: 'review', label: '复盘与审阅', position: [1.8, 5.0, 6.8], target: [0, 0.8, 1.5], durationMs: 1200 },
];

function cameraCue(delayMs: number, beat: GuidedStoryBeat, shotId: string): GuidedDemoStep {
  const shot = guidedCameraShots.find((item) => item.id === shotId);
  if (!shot) throw new Error(`Missing guided camera shot: ${shotId}`);
  return {
    delayMs,
    cue: { delayMs, kind: 'camera', beat, payload: { shot } },
  };
}

function narrationCue(delayMs: number, beat: GuidedStoryBeat, title: string, body: string): GuidedDemoStep {
  return {
    delayMs,
    cue: { delayMs, kind: 'narration', beat, payload: { title, body } },
  };
}

function moduleCue(delayMs: number, beat: GuidedStoryBeat, module: string): GuidedDemoStep {
  return {
    delayMs,
    cue: { delayMs, kind: 'module', beat, payload: { module } },
  };
}

function taskCue(delayMs: number, beat: GuidedStoryBeat, taskId: string): GuidedDemoStep {
  return {
    delayMs,
    cue: { delayMs, kind: 'select_task', beat, payload: { taskId } },
  };
}

function commanderOpenCue(delayMs: number, beat: GuidedStoryBeat, open: boolean): GuidedDemoStep {
  return {
    delayMs,
    cue: { delayMs, kind: 'commander_open', beat, payload: { open } },
  };
}

function progressCue(delayMs: number, beat: GuidedStoryBeat, progress: number): GuidedDemoStep {
  return {
    delayMs,
    cue: { delayMs, kind: 'progress', beat, payload: { progress } },
  };
}

export function buildGuidedDemoTimeline(): GuidedDemoStep[] {
  const eventSteps = commanderApprovedDeliveryScenario().map((step) => ({
    delayMs: step.delayMs + 4_200,
    event: step.event,
  }));

  const cueSteps: GuidedDemoStep[] = [
    cameraCue(0, 'overview', 'overview'),
    narrationCue(0, 'overview', '办公室总览', '这是一个把 AI 团队工作过程空间化的 3D 办公室。'),
    moduleCue(0, 'overview', 'office'),
    progressCue(0, 'overview', 0.02),

    cameraCue(1_800, 'commander', 'commander'),
    commanderOpenCue(1_900, 'commander', true),
    narrationCue(2_000, 'commander', '龙虾 Commander', '用户把目标交给 Commander，它负责拆解、分配、审批和汇总。'),
    progressCue(2_000, 'commander', 0.12),

    narrationCue(3_200, 'goal', '目标进入系统', '导览会用一条完整任务链展示 Research、Build、Review 和交付。'),
    progressCue(3_200, 'goal', 0.18),

    narrationCue(4_200, 'mission_graph', '任务图生成', 'Commander 创建任务图，并把不同节点分给 Worker。'),
    taskCue(4_300, 'mission_graph', 'task-commander-build'),
    progressCue(4_400, 'mission_graph', 0.26),

    cameraCue(6_100, 'research', 'workers'),
    narrationCue(6_200, 'research', '调研 Worker', '调研任务先完成，为后续构建提供上下文。'),
    taskCue(6_300, 'research', 'task-commander-research'),
    progressCue(6_400, 'research', 0.36),

    narrationCue(8_500, 'build', '构建 Worker', '构建 Worker 开始执行已经通过审批的实现任务。'),
    taskCue(8_600, 'build', 'task-commander-build'),
    progressCue(8_700, 'build', 0.48),

    cameraCue(10_800, 'approval', 'approval'),
    narrationCue(10_900, 'approval', '审批闸门', '涉及写入和高风险动作时，系统会把审批显式交还给用户。'),
    progressCue(11_000, 'approval', 0.58),

    cameraCue(14_200, 'delivery', 'delivery'),
    narrationCue(14_300, 'delivery', '产物交付', '审批通过后，构建产物会进入文件和 Artifact 视图。'),
    moduleCue(14_600, 'delivery', 'files'),
    progressCue(14_600, 'delivery', 0.7),

    cameraCue(17_200, 'review', 'review'),
    narrationCue(17_300, 'review', '审阅 Worker', '审阅 Worker 检查交付物，并把结果回流到总结。'),
    taskCue(17_400, 'review', 'task-commander-review'),
    progressCue(17_500, 'review', 0.8),

    moduleCue(20_200, 'workbench', 'review'),
    narrationCue(20_300, 'workbench', '工作台联动', '日程、任务、文件、日志和复盘都围绕同一条任务链更新。'),
    progressCue(20_300, 'workbench', 0.88),

    moduleCue(22_200, 'gateway', 'gateway'),
    narrationCue(22_300, 'gateway', '运行时边界', '真实 Runtime 和 Mock Runtime 通过同一事件边界进入办公室。'),
    progressCue(22_300, 'gateway', 0.94),

    moduleCue(24_500, 'summary', 'office'),
    cameraCue(24_600, 'summary', 'overview'),
    narrationCue(24_700, 'summary', '导览完成', 'Commander 汇总结果，办公室回到总览视角。'),
    progressCue(24_700, 'summary', 1),
  ];

  return [...cueSteps, ...eventSteps].sort((a, b) => a.delayMs - b.delayMs);
}
