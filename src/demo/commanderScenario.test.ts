import { describe, it, expect } from 'vitest';
import { commanderFullScenario, commanderApprovedDeliveryScenario } from './commanderScenario';

describe('commanderFullScenario', () => {
  it('produces events with Commander metadata', () => {
    const steps = commanderFullScenario();
    expect(steps.length).toBeGreaterThan(10);

    for (const step of steps) {
      expect(step.event.missionId).toBe('mission-demo-video');
      expect(step.event.source).toBe('demo');
    }
  });

  it('includes research, build, and review phases in order', () => {
    const steps = commanderFullScenario();
    const types = steps.map((s) => s.event.type);

    const researchIdx = types.indexOf('task.assigned');
    const buildIdx = types.indexOf('task.assigned', researchIdx + 1);
    const reviewIdx = types.indexOf('task.assigned', buildIdx + 1);

    expect(researchIdx).toBeGreaterThan(-1);
    expect(buildIdx).toBeGreaterThan(researchIdx);
    expect(reviewIdx).toBeGreaterThan(buildIdx);
  });

  it('includes an approval request for the build phase', () => {
    const steps = commanderFullScenario();
    const approval = steps.find((s) => s.event.type === 'approval.requested');
    expect(approval).toBeDefined();
    expect(approval!.event.approvalId).toBe('approval-write-commander-ui');
    expect(approval!.event.payload.missionTaskId).toBe('build-office-loop');
  });

  it('includes artifact creation events with correct mission task IDs', () => {
    const steps = commanderFullScenario();
    const artifacts = steps.filter((s) => s.event.type === 'artifact.created');
    expect(artifacts.length).toBeGreaterThanOrEqual(2);

    const ids = artifacts.map((a) => a.event.artifactId);
    expect(ids).toContain('artifact-research-notes');
    expect(ids).toContain('artifact-review-summary');

    const researchArtifact = artifacts.find((a) => a.event.artifactId === 'artifact-research-notes');
    expect(researchArtifact!.event.payload.missionTaskId).toBe('research-reference');

    const reviewArtifact = artifacts.find((a) => a.event.artifactId === 'artifact-review-summary');
    expect(reviewArtifact!.event.payload.missionTaskId).toBe('review-delivery');
  });

  it('ends with a commander summary ready event', () => {
    const steps = commanderFullScenario();
    const last = steps[steps.length - 1];
    expect(last.event.type).toBe('commander.summary_ready');
    expect(last.event.payload.missionStatus).toBe('completed');
  });

  it('has monotonically increasing delays', () => {
    const steps = commanderFullScenario();
    for (let i = 1; i < steps.length; i++) {
      expect(steps[i].delayMs).toBeGreaterThanOrEqual(steps[i - 1].delayMs);
    }
  });
});

describe('commanderApprovedDeliveryScenario', () => {
  it('includes an approval.resolved event before build completion', () => {
    const steps = commanderApprovedDeliveryScenario();
    const resolvedIdx = steps.findIndex((s) => s.event.type === 'approval.resolved');
    const completedIdx = steps.findIndex(
      (s) =>
        s.event.type === 'task.completed' &&
        s.event.payload.missionTaskId === 'build-office-loop',
    );

    expect(resolvedIdx).toBeGreaterThan(-1);
    expect(completedIdx).toBeGreaterThan(resolvedIdx);
  });

  it('produces a completed mission summary', () => {
    const steps = commanderApprovedDeliveryScenario();
    const summary = steps.find((s) => s.event.type === 'commander.summary_ready');
    expect(summary).toBeDefined();
    expect(summary!.event.payload.missionStatus).toBe('completed');
  });

  it('carries Commander metadata on all events', () => {
    const steps = commanderApprovedDeliveryScenario();
    for (const step of steps) {
      expect(step.event.missionId).toBe('mission-demo-video');
      expect(step.event.source).toBe('demo');
    }
  });

  it('completes all three tasks including research', () => {
    const steps = commanderApprovedDeliveryScenario();
    const completed = steps.filter(
      (s) => s.event.type === 'task.completed',
    );
    const completedTaskIds = completed.map((s) => s.event.payload.missionTaskId);
    expect(completedTaskIds).toContain('research-reference');
    expect(completedTaskIds).toContain('build-office-loop');
    expect(completedTaskIds).toContain('review-delivery');
  });

  it('links both artifacts to the correct mission tasks', () => {
    const steps = commanderApprovedDeliveryScenario();
    const artifacts = steps.filter((s) => s.event.type === 'artifact.created');
    expect(artifacts).toHaveLength(2);

    const buildArtifact = artifacts.find((a) => a.event.artifactId === 'artifact-commander-patch');
    expect(buildArtifact).toBeDefined();
    expect(buildArtifact!.event.payload.missionTaskId).toBe('build-office-loop');

    const reviewArtifact = artifacts.find((a) => a.event.artifactId === 'artifact-review-summary');
    expect(reviewArtifact).toBeDefined();
    expect(reviewArtifact!.event.payload.missionTaskId).toBe('review-delivery');
  });
});
