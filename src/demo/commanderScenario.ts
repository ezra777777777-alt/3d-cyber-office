import type { ScenarioStep } from './scenarios';
import { createEvent } from '@/core/event-bus';

const MISSION_ID = 'mission-demo-video';
const RESEARCH_TASK = 'task-commander-research';
const BUILD_TASK = 'task-commander-build';
const REVIEW_TASK = 'task-commander-review';
const RESEARCH_AGENT = 'agent-writer';
const BUILD_AGENT = 'agent-coder';
const REVIEW_AGENT = 'agent-coordinator';

const commanderMeta = {
  source: 'demo' as const,
  missionId: MISSION_ID,
};

function p(taskId: string, extra: Record<string, unknown>) {
  return { missionTaskId: taskId, ...extra };
}

function approvalRequestStep(delayMs: number, approvalId: string, taskId: string, agentId: string) {
  return {
    delayMs,
    event: createEvent(
      'approval.requested',
      BUILD_TASK,
      agentId,
      p(taskId, { reason: '写入 Commander React 组件与测试文件。', missionTaskId: taskId }),
      { ...commanderMeta, approvalId },
    ),
  };
}

function artifactStep(
  delayMs: number,
  artifactId: string,
  officeTaskId: string,
  missionTaskId: string,
  agentId: string,
  title: string,
  path: string,
) {
  return {
    delayMs,
    event: createEvent(
      'artifact.created',
      officeTaskId,
      agentId,
      { missionTaskId, title, path },
      { ...commanderMeta, artifactId },
    ),
  };
}

export function commanderFullScenario(): ScenarioStep[] {
  const steps: ScenarioStep[] = [];
  let t = 0;

  // ── Research phase ──
  steps.push({
    delayMs: t,
    event: createEvent('task.created', RESEARCH_TASK, null, p('research-reference', { title: '调研参考工作流', summary: '提取 Commander、Worker、审批和产物需求。' }), commanderMeta),
  });
  t += 800;
  steps.push({
    delayMs: t,
    event: createEvent('task.planned', RESEARCH_TASK, null, p('research-reference', {}), commanderMeta),
  });
  t += 500;
  steps.push({
    delayMs: t,
    event: createEvent('task.assigned', RESEARCH_TASK, RESEARCH_AGENT, p('research-reference', {}), commanderMeta),
  });
  t += 600;
  steps.push({
    delayMs: t,
    event: createEvent('task.started', RESEARCH_TASK, RESEARCH_AGENT, p('research-reference', { message: '正在阅读参考视频笔记与需求文档…' }), commanderMeta),
  });
  t += 1500;
  steps.push({
    delayMs: t,
    event: createEvent('task.progress', RESEARCH_TASK, RESEARCH_AGENT, p('research-reference', { message: '正在提取 Commander 工作流模式', progress: 0.5 }), commanderMeta),
  });
  t += 1500;
  steps.push({
    delayMs: t,
    event: createEvent('task.completed', RESEARCH_TASK, RESEARCH_AGENT, p('research-reference', { message: '调研完成', outputSummary: '已识别 4 个 Worker 角色、3 个依赖阶段、审批门禁与产物交付流程。' }), commanderMeta),
  });
  t += 300;
  steps.push(
    artifactStep(t, 'artifact-research-notes', 'task-commander-research', 'research-reference', RESEARCH_AGENT, 'Commander 工作流笔记', 'docs/research/commander-workflow-notes.md'),
  );

  // ── Build phase (with approval gate) ──
  t += 1200;
  steps.push({
    delayMs: t,
    event: createEvent('task.assigned', BUILD_TASK, BUILD_AGENT, p('build-office-loop', {}), commanderMeta),
  });
  t += 500;
  steps.push({
    delayMs: t,
    event: createEvent('task.started', BUILD_TASK, BUILD_AGENT, p('build-office-loop', { message: '正在创建 Commander UI 组件…' }), commanderMeta),
  });
  t += 1500;
  steps.push({
    delayMs: t,
    event: createEvent('task.progress', BUILD_TASK, BUILD_AGENT, p('build-office-loop', { message: '正在构建 CommanderDock、MissionGraph、WorkerRoster', progress: 0.4 }), commanderMeta),
  });
  t += 1000;
  steps.push(
    approvalRequestStep(t, 'approval-write-commander-ui', 'build-office-loop', BUILD_AGENT),
  );
  // Build pauses waiting for approval — resolved via user interaction in ApprovalInbox, not auto

  // ── Review phase (starts after build, triggered by approval resolution) ──
  t += 3000;
  steps.push({
    delayMs: t,
    event: createEvent('task.assigned', REVIEW_TASK, REVIEW_AGENT, p('review-delivery', {}), commanderMeta),
  });
  t += 500;
  steps.push({
    delayMs: t,
    event: createEvent('task.started', REVIEW_TASK, REVIEW_AGENT, p('review-delivery', { message: '正在审查已交付的产物…' }), commanderMeta),
  });
  t += 1500;
  steps.push({
    delayMs: t,
    event: createEvent('task.progress', REVIEW_TASK, REVIEW_AGENT, p('review-delivery', { message: '正在检查调研笔记与构建产物', progress: 0.5 }), commanderMeta),
  });
  t += 1000;
  steps.push({
    delayMs: t,
    event: createEvent('task.completed', REVIEW_TASK, REVIEW_AGENT, p('review-delivery', { message: '审查完成', outputSummary: '调研笔记、构建补丁与 Commander UI 均已验证通过。' }), commanderMeta),
  });
  t += 200;
  steps.push(
    artifactStep(t, 'artifact-review-summary', 'task-commander-review', 'review-delivery', REVIEW_AGENT, '审查总结报告', 'docs/review/commander-review.md'),
  );

  // ── Commander summary ──
  t += 800;
  steps.push({
    delayMs: t,
    event: createEvent(
      'commander.summary_ready',
      null,
      null,
      { message: '任务完成：3 个任务已交付，2 个产物已创建，1 个审批已解决。', missionStatus: 'completed' },
      commanderMeta,
    ),
  });

  return steps;
}

export function commanderApprovedDeliveryScenario(): ScenarioStep[] {
  const steps: ScenarioStep[] = [];
  let t = 0;

  // Research already done before this scenario starts
  steps.push({
    delayMs: t,
    event: createEvent('task.started', RESEARCH_TASK, RESEARCH_AGENT, p('research-reference', { message: '调研已在先前完成。' }), commanderMeta),
  });
  t += 300;
  steps.push({
    delayMs: t,
    event: createEvent('task.completed', RESEARCH_TASK, RESEARCH_AGENT, p('research-reference', { message: '调研已提前完成。', outputSummary: '参考资料已就绪。' }), commanderMeta),
  });

  // Build phase with approval pre-resolved
  t += 500;
  steps.push({
    delayMs: t,
    event: createEvent('task.created', BUILD_TASK, null, p('build-office-loop', { title: '构建 Commander 指挥闭环', summary: '创建任务图、审批流和关联产物。' }), commanderMeta),
  });
  t += 500;
  steps.push({
    delayMs: t,
    event: createEvent('task.planned', BUILD_TASK, null, p('build-office-loop', {}), commanderMeta),
  });
  t += 400;
  steps.push({
    delayMs: t,
    event: createEvent('task.assigned', BUILD_TASK, BUILD_AGENT, p('build-office-loop', {}), commanderMeta),
  });
  t += 300;
  steps.push({
    delayMs: t,
    event: createEvent('task.started', BUILD_TASK, BUILD_AGENT, p('build-office-loop', { message: '正在执行已审批的构建…' }), commanderMeta),
  });
  t += 1200;
  steps.push({
    delayMs: t,
    event: createEvent('approval.requested', BUILD_TASK, BUILD_AGENT, p('build-office-loop', { reason: '写入 Commander React 组件。' }), { ...commanderMeta, approvalId: 'approval-write-commander-ui' }),
  });
  t += 800;
  steps.push({
    delayMs: t,
    event: createEvent('approval.resolved', BUILD_TASK, BUILD_AGENT, { resolution: 'approved', note: '已批准 — 可以继续写入。' }, { ...commanderMeta, approvalId: 'approval-write-commander-ui' }),
  });
  t += 1200;
  steps.push({
    delayMs: t,
    event: createEvent('task.completed', BUILD_TASK, BUILD_AGENT, p('build-office-loop', { message: '构建完成', outputSummary: 'Commander UI 组件已交付。' }), commanderMeta),
  });
  t += 200;
  steps.push(
    artifactStep(t, 'artifact-commander-patch', 'task-commander-build', 'build-office-loop', BUILD_AGENT, 'Commander UI 补丁', 'src/ui/commander/components.patch'),
  );

  // Review
  t += 600;
  steps.push({
    delayMs: t,
    event: createEvent('task.assigned', REVIEW_TASK, REVIEW_AGENT, p('review-delivery', {}), commanderMeta),
  });
  t += 400;
  steps.push({
    delayMs: t,
    event: createEvent('task.started', REVIEW_TASK, REVIEW_AGENT, p('review-delivery', { message: '正在审查已审批的构建产物…' }), commanderMeta),
  });
  t += 1200;
  steps.push({
    delayMs: t,
    event: createEvent('task.completed', REVIEW_TASK, REVIEW_AGENT, p('review-delivery', { message: '审查通过', outputSummary: '所有产物已验证。' }), commanderMeta),
  });
  t += 200;
  steps.push(
    artifactStep(t, 'artifact-review-summary', 'task-commander-review', 'review-delivery', REVIEW_AGENT, '审查总结报告', 'docs/review/commander-review.md'),
  );
  t += 300;
  steps.push({
    delayMs: t,
    event: createEvent(
      'commander.summary_ready',
      null,
      null,
      { message: '审批交付完成。构建与审查均已通过。', missionStatus: 'completed' },
      commanderMeta,
    ),
  });

  return steps;
}
