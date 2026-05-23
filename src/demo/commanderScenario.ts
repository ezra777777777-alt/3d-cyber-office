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
      p(taskId, { reason: 'Write Commander React components and tests.', missionTaskId: taskId }),
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
    event: createEvent('task.created', RESEARCH_TASK, null, p('research-reference', { title: 'Research the reference workflow', summary: 'Extract Commander, worker, approval, and artifact expectations.' }), commanderMeta),
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
    event: createEvent('task.started', RESEARCH_TASK, RESEARCH_AGENT, p('research-reference', { message: 'Reading reference video notes and requirements...' }), commanderMeta),
  });
  t += 1500;
  steps.push({
    delayMs: t,
    event: createEvent('task.progress', RESEARCH_TASK, RESEARCH_AGENT, p('research-reference', { message: 'Extracting Commander workflow patterns', progress: 0.5 }), commanderMeta),
  });
  t += 1500;
  steps.push({
    delayMs: t,
    event: createEvent('task.completed', RESEARCH_TASK, RESEARCH_AGENT, p('research-reference', { message: 'Research complete', outputSummary: 'Identified 4 worker roles, 3 dependency stages, approval gate, and artifact delivery.' }), commanderMeta),
  });
  t += 300;
  steps.push(
    artifactStep(t, 'artifact-research-notes', 'task-commander-research', 'research-reference', RESEARCH_AGENT, 'Commander workflow notes', 'docs/research/commander-workflow-notes.md'),
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
    event: createEvent('task.started', BUILD_TASK, BUILD_AGENT, p('build-office-loop', { message: 'Creating Commander UI components...' }), commanderMeta),
  });
  t += 1500;
  steps.push({
    delayMs: t,
    event: createEvent('task.progress', BUILD_TASK, BUILD_AGENT, p('build-office-loop', { message: 'Building CommanderDock, MissionGraph, WorkerRoster', progress: 0.4 }), commanderMeta),
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
    event: createEvent('task.started', REVIEW_TASK, REVIEW_AGENT, p('review-delivery', { message: 'Reviewing delivered artifacts...' }), commanderMeta),
  });
  t += 1500;
  steps.push({
    delayMs: t,
    event: createEvent('task.progress', REVIEW_TASK, REVIEW_AGENT, p('review-delivery', { message: 'Checking research notes and build output', progress: 0.5 }), commanderMeta),
  });
  t += 1000;
  steps.push({
    delayMs: t,
    event: createEvent('task.completed', REVIEW_TASK, REVIEW_AGENT, p('review-delivery', { message: 'Review complete', outputSummary: 'Research notes, build patch, and Commander UI all verified.' }), commanderMeta),
  });
  t += 200;
  steps.push(
    artifactStep(t, 'artifact-review-summary', 'task-commander-review', 'review-delivery', REVIEW_AGENT, 'Review summary report', 'docs/review/commander-review.md'),
  );

  // ── Commander summary ──
  t += 800;
  steps.push({
    delayMs: t,
    event: createEvent(
      'commander.summary_ready',
      null,
      null,
      { message: 'Mission complete: 3 tasks delivered, 2 artifacts created, 1 approval resolved.', missionStatus: 'completed' },
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
    event: createEvent('task.started', RESEARCH_TASK, RESEARCH_AGENT, p('research-reference', { message: 'Research already completed.' }), commanderMeta),
  });
  t += 300;
  steps.push({
    delayMs: t,
    event: createEvent('task.completed', RESEARCH_TASK, RESEARCH_AGENT, p('research-reference', { message: 'Research was done earlier.', outputSummary: 'Reference material ready.' }), commanderMeta),
  });

  // Build phase with approval pre-resolved
  t += 500;
  steps.push({
    delayMs: t,
    event: createEvent('task.created', BUILD_TASK, null, p('build-office-loop', { title: 'Build the Commander loop', summary: 'Create mission graph, approval flow, and linked artifacts.' }), commanderMeta),
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
    event: createEvent('task.started', BUILD_TASK, BUILD_AGENT, p('build-office-loop', { message: 'Executing approved build...' }), commanderMeta),
  });
  t += 1200;
  steps.push({
    delayMs: t,
    event: createEvent('approval.requested', BUILD_TASK, BUILD_AGENT, p('build-office-loop', { reason: 'Write Commander React components.' }), { ...commanderMeta, approvalId: 'approval-write-commander-ui' }),
  });
  t += 800;
  steps.push({
    delayMs: t,
    event: createEvent('approval.resolved', BUILD_TASK, BUILD_AGENT, { resolution: 'approved', note: 'Approved — proceed with write.' }, { ...commanderMeta, approvalId: 'approval-write-commander-ui' }),
  });
  t += 1200;
  steps.push({
    delayMs: t,
    event: createEvent('task.completed', BUILD_TASK, BUILD_AGENT, p('build-office-loop', { message: 'Build complete', outputSummary: 'Commander UI components delivered.' }), commanderMeta),
  });
  t += 200;
  steps.push(
    artifactStep(t, 'artifact-commander-patch', 'task-commander-build', 'build-office-loop', BUILD_AGENT, 'Commander UI patch', 'src/ui/commander/components.patch'),
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
    event: createEvent('task.started', REVIEW_TASK, REVIEW_AGENT, p('review-delivery', { message: 'Reviewing approved build output...' }), commanderMeta),
  });
  t += 1200;
  steps.push({
    delayMs: t,
    event: createEvent('task.completed', REVIEW_TASK, REVIEW_AGENT, p('review-delivery', { message: 'Review passed', outputSummary: 'All artifacts verified.' }), commanderMeta),
  });
  t += 200;
  steps.push(
    artifactStep(t, 'artifact-review-summary', 'task-commander-review', 'review-delivery', REVIEW_AGENT, 'Review summary report', 'docs/review/commander-review.md'),
  );
  t += 300;
  steps.push({
    delayMs: t,
    event: createEvent(
      'commander.summary_ready',
      null,
      null,
      { message: 'Approved delivery complete. Build and review passed.', missionStatus: 'completed' },
      commanderMeta,
    ),
  });

  return steps;
}
