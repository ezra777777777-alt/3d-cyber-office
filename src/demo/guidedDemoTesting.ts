import type { GuidedCameraShot, GuidedCueKind, GuidedDemoStep, GuidedStoryBeat } from './guidedDemoTypes';

const REQUIRED_BEATS: GuidedStoryBeat[] = [
  'overview',
  'commander',
  'goal',
  'mission_graph',
  'research',
  'build',
  'approval',
  'delivery',
  'review',
  'workbench',
  'gateway',
  'summary',
];

const REQUIRED_CAMERA_SHOTS = ['overview', 'commander', 'workers', 'approval', 'delivery', 'review'];

export function getTimelineDuration(timeline: GuidedDemoStep[]): number {
  return timeline.reduce((max, step) => Math.max(max, step.delayMs), 0);
}

export function getCueKinds(timeline: GuidedDemoStep[]): GuidedCueKind[] {
  return Array.from(
    new Set(
      timeline
        .map((step) => step.cue?.kind)
        .filter((kind): kind is GuidedCueKind => Boolean(kind)),
    ),
  );
}

export function getGuidedStoryBeats(timeline: GuidedDemoStep[]): GuidedStoryBeat[] {
  return timeline
    .map((step) => step.cue?.beat)
    .filter((beat): beat is GuidedStoryBeat => Boolean(beat));
}

export function hasOrderedStoryBeats(beats: GuidedStoryBeat[]): boolean {
  let searchIndex = 0;
  for (const beat of REQUIRED_BEATS) {
    const foundIndex = beats.indexOf(beat, searchIndex);
    if (foundIndex === -1) return false;
    searchIndex = foundIndex + 1;
  }
  return true;
}

export function validateCameraShotCoverage(shots: GuidedCameraShot[]): string[] {
  const ids = new Set(shots.map((shot) => shot.id));
  return REQUIRED_CAMERA_SHOTS.filter((id) => !ids.has(id));
}
