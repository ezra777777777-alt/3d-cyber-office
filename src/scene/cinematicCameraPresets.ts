import type { CameraPreset } from './firstScreenFidelity';
import { FIRST_SCREEN_CAMERA } from './firstScreenFidelity';

export type CinematicShotId =
  | 'intro-office'
  | 'commander-console'
  | 'worker-assignment'
  | 'approval-focus'
  | 'artifact-delivery'
  | 'review-summary';

export interface CinematicCameraShot extends CameraPreset {
  id: CinematicShotId;
  label: string;
}

export const CINEMATIC_CAMERA_SHOTS: CinematicCameraShot[] = [
  {
    ...FIRST_SCREEN_CAMERA,
    id: 'intro-office',
    label: '办公室总览',
  },
  {
    id: 'commander-console',
    label: '龙虾 Commander 指挥台',
    position: [0, 5.2, 4.2],
    target: [0, 0.85, -4.25],
    durationMs: 1300,
  },
  {
    id: 'worker-assignment',
    label: 'Worker 工位分配',
    position: [5.5, 5.4, 6.2],
    target: [0, 0.85, -1.55],
    durationMs: 1500,
  },
  {
    id: 'approval-focus',
    label: '审批请求',
    position: [0, 4.8, 5.2],
    target: [0, 0.85, -2.4],
    durationMs: 1200,
  },
  {
    id: 'artifact-delivery',
    label: '产物交付',
    position: [6.2, 5.1, 4.8],
    target: [5.95, 0.8, 2.9],
    durationMs: 1400,
  },
  {
    id: 'review-summary',
    label: '复盘总结',
    position: [6.2, 6.4, 8.8],
    target: [0, 0.85, -2.4],
    durationMs: 1600,
  },
];

export function getCinematicShotIds(): CinematicShotId[] {
  return CINEMATIC_CAMERA_SHOTS.map((shot) => shot.id);
}

export function getCinematicShot(id: string): CinematicCameraShot {
  return CINEMATIC_CAMERA_SHOTS.find((shot) => shot.id === id) ?? CINEMATIC_CAMERA_SHOTS[0];
}
