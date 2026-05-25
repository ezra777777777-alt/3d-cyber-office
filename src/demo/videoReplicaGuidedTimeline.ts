import { commanderFullScenario } from './commanderScenario';
import { getCinematicShot } from '@/scene/cinematicCameraPresets';
import type { GuidedCameraShot, GuidedDemoStep, GuidedStoryBeat } from './guidedDemoTypes';

function cameraCue(delayMs: number, beat: GuidedStoryBeat, shotId: string): GuidedDemoStep {
  const shot = getCinematicShot(shotId);
  return {
    delayMs,
    cue: {
      delayMs,
      kind: 'camera',
      beat,
      payload: { shot: shot as unknown as GuidedCameraShot, shotId },
    },
  };
}

function narrationCue(delayMs: number, beat: GuidedStoryBeat, title: string, body: string): GuidedDemoStep {
  return {
    delayMs,
    cue: { delayMs, kind: 'narration', beat, payload: { title, body } },
  };
}

function progressCue(delayMs: number, beat: GuidedStoryBeat, progress: number): GuidedDemoStep {
  return {
    delayMs,
    cue: { delayMs, kind: 'progress', beat, payload: { progress } },
  };
}

function commanderOpenCue(delayMs: number, beat: GuidedStoryBeat, open: boolean): GuidedDemoStep {
  return {
    delayMs,
    cue: { delayMs, kind: 'commander_open', beat, payload: { open } },
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

/**
 * Build a 6-stage video-replica guided timeline:
 *   intro-office → commander-console → worker-assignment →
 *   approval-focus → artifact-delivery → review-summary
 */
export function buildVideoReplicaGuidedTimeline(): GuidedDemoStep[] {
  const eventSteps = commanderFullScenario().map((step) => ({
    delayMs: step.delayMs + 4_200,
    event: step.event,
  }));

  const cueSteps: GuidedDemoStep[] = [
    // Stage 1: intro-office — show the full office
    cameraCue(0, 'overview', 'intro-office'),
    narrationCue(0, 'overview', '办公室总览', '这是一个把 AI 团队工作过程空间化的 3D 办公室。龙虾 Commander 在中央指挥台。'),
    commanderOpenCue(0, 'overview', true),
    progressCue(0, 'overview', 0.02),

    // Stage 2: commander-console — focus on Commander station
    cameraCue(2_200, 'commander', 'commander-console'),
    narrationCue(2_300, 'commander', '龙虾 Commander 指挥台', '用户把目标交给 Commander，它负责拆解为任务、分给对应 Worker。'),
    progressCue(2_400, 'commander', 0.12),

    // Stage 3: worker-assignment — show worker desk area
    narrationCue(3_600, 'goal', '目标进入系统', 'Commander 解读目标后创建任务图，逐项分给 Research、Build、Review Worker。'),
    progressCue(3_600, 'goal', 0.2),

    cameraCue(4_400, 'mission_graph', 'worker-assignment'),
    narrationCue(4_500, 'mission_graph', 'Worker 工位分配', '调研 Worker 先分析需求，构建 Worker 再执行实现，审阅 Worker 最后验证。'),
    taskCue(4_600, 'mission_graph', 'task-commander-build'),
    progressCue(4_600, 'mission_graph', 0.28),

    // Stage 4: approval-focus — approval gate
    cameraCue(7_200, 'approval', 'approval-focus'),
    narrationCue(7_300, 'approval', '审批闸门', '高风险写入操作需要用户审批。构建 Worker 暂停，等待你批准。'),
    progressCue(7_400, 'approval', 0.48),

    // Stage 5: artifact-delivery — artifact created
    cameraCue(11_200, 'delivery', 'artifact-delivery'),
    narrationCue(11_300, 'delivery', '产物交付', '审批通过后产物自动生成，进入 Files 和 Artifact 视图。'),
    moduleCue(11_600, 'delivery', 'files'),
    progressCue(11_600, 'delivery', 0.66),

    // Stage 6: review-summary — mission complete
    cameraCue(14_200, 'review', 'review-summary'),
    narrationCue(14_300, 'review', '审阅与总结', '审阅 Worker 检查所有交付物，Commander 汇总结果并生成复盘。'),
    progressCue(14_400, 'review', 0.82),

    moduleCue(16_200, 'summary', 'review'),
    narrationCue(16_300, 'summary', '导览完成', 'Commander 已完成全部 3 个任务，产出 2 个产物，1 个审批已处理。'),
    progressCue(16_400, 'summary', 1),
  ];

  return [...cueSteps, ...eventSteps].sort((a, b) => a.delayMs - b.delayMs);
}
