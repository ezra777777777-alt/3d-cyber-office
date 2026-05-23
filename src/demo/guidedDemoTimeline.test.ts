import { describe, expect, it } from 'vitest';
import { buildGuidedDemoTimeline, guidedCameraShots } from './guidedDemoTimeline';
import {
  getCueKinds,
  getGuidedStoryBeats,
  getTimelineDuration,
  hasOrderedStoryBeats,
  validateCameraShotCoverage,
} from './guidedDemoTesting';

describe('video guided demo timeline', () => {
  it('contains all required video-style story beats in order', () => {
    const timeline = buildGuidedDemoTimeline();
    expect(hasOrderedStoryBeats(getGuidedStoryBeats(timeline))).toBe(true);
  });

  it('contains camera, narration, module, selection, and Commander cues', () => {
    const cueKinds = getCueKinds(buildGuidedDemoTimeline());
    expect(cueKinds).toContain('camera');
    expect(cueKinds).toContain('narration');
    expect(cueKinds).toContain('module');
    expect(cueKinds).toContain('select_task');
    expect(cueKinds).toContain('commander_open');
  });

  it('has camera shots for overview, Commander, workers, approval, delivery, and review', () => {
    expect(validateCameraShotCoverage(guidedCameraShots)).toEqual([]);
  });

  it('runs long enough to feel like a guided video but short enough for QA', () => {
    const duration = getTimelineDuration(buildGuidedDemoTimeline());
    expect(duration).toBeGreaterThanOrEqual(18_000);
    expect(duration).toBeLessThanOrEqual(45_000);
  });

  it('includes Commander mission events and final summary', () => {
    const eventTypes = buildGuidedDemoTimeline()
      .map((step) => step.event?.type)
      .filter(Boolean);
    expect(eventTypes).toContain('approval.requested');
    expect(eventTypes).toContain('approval.resolved');
    expect(eventTypes).toContain('artifact.created');
    expect(eventTypes).toContain('commander.summary_ready');
  });
});
