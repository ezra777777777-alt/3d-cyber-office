import { describe, expect, it } from 'vitest';
import { buildVideoReplicaGuidedTimeline } from './videoReplicaGuidedTimeline';

describe('video replica guided timeline', () => {
  it('starts with office intro and ends with review summary', () => {
    const timeline = buildVideoReplicaGuidedTimeline();
    const firstCameraCue = timeline.find((s) => s.cue?.kind === 'camera');
    const cameraCues = timeline.filter((s) => s.cue?.kind === 'camera');
    const lastCameraCue = cameraCues[cameraCues.length - 1];
    expect(firstCameraCue?.cue?.payload.shotId).toBe('intro-office');
    expect(lastCameraCue?.cue?.payload.shotId).toBe('review-summary');
  });

  it('covers mission, assignment, approval, artifact, and review events', () => {
    const types = buildVideoReplicaGuidedTimeline()
      .filter((s) => s.event)
      .map((s) => s.event!.type);
    expect(types).toContain('task.assigned');
    expect(types).toContain('approval.requested');
    expect(types).toContain('artifact.created');
    expect(types).toContain('commander.summary_ready');
  });

  it('has camera cues for every major video stage', () => {
    const stages = buildVideoReplicaGuidedTimeline()
      .filter((s) => s.cue?.kind === 'camera')
      .map((s) => s.cue!.payload.shotId);

    expect(stages).toEqual([
      'intro-office',
      'commander-console',
      'worker-assignment',
      'approval-focus',
      'artifact-delivery',
      'review-summary',
    ]);
  });

  it('has narration for every stage', () => {
    const narrations = buildVideoReplicaGuidedTimeline()
      .filter((s) => s.cue?.kind === 'narration');

    expect(narrations.length).toBeGreaterThanOrEqual(6);
    for (const step of narrations) {
      expect(typeof step.cue!.payload.title).toBe('string');
      expect((step.cue!.payload.title as string).length).toBeGreaterThan(0);
    }
  });

  it('has all steps sorted by delayMs', () => {
    const timeline = buildVideoReplicaGuidedTimeline();
    for (let i = 1; i < timeline.length; i++) {
      expect(timeline[i].delayMs).toBeGreaterThanOrEqual(timeline[i - 1].delayMs);
    }
  });
});
