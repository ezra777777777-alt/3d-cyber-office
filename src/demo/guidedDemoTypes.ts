import type { OfficeEvent } from '@/core/types';

export type GuidedCueKind =
  | 'camera'
  | 'narration'
  | 'module'
  | 'select_task'
  | 'select_agent'
  | 'commander_open'
  | 'progress';

export type GuidedStoryBeat =
  | 'overview'
  | 'commander'
  | 'goal'
  | 'mission_graph'
  | 'research'
  | 'build'
  | 'approval'
  | 'delivery'
  | 'review'
  | 'workbench'
  | 'gateway'
  | 'summary';

export interface GuidedCameraShot {
  id: string;
  label: string;
  position: [number, number, number];
  target: [number, number, number];
  durationMs: number;
}

export interface GuidedDemoCue {
  delayMs: number;
  kind: GuidedCueKind;
  beat?: GuidedStoryBeat;
  payload: Record<string, unknown>;
}

export interface GuidedDemoStep {
  delayMs: number;
  event?: OfficeEvent;
  cue?: GuidedDemoCue;
}
