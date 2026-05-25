import { describe, expect, it } from 'vitest';
import {
  FIRST_SCREEN_CAMERA,
  FIRST_SCREEN_SAFE_ZONES,
  FIRST_SCREEN_VISUAL_THRESHOLDS,
  isCameraPresetValid,
  isSafeZoneReasonable,
} from './firstScreenFidelity';

describe('first-screen fidelity config', () => {
  it('uses a valid camera that can see commander and worker areas', () => {
    expect(isCameraPresetValid(FIRST_SCREEN_CAMERA)).toBe(true);
    expect(FIRST_SCREEN_CAMERA.position[1]).toBeGreaterThanOrEqual(5);
    expect(FIRST_SCREEN_CAMERA.position[2]).toBeGreaterThanOrEqual(7);
  });

  it('uses a video-style three-quarter camera instead of a debug top view', () => {
    expect(FIRST_SCREEN_CAMERA.position).toEqual([6.2, 6.4, 8.8]);
    expect(FIRST_SCREEN_CAMERA.target).toEqual([0, 0.85, -2.4]);
    expect(FIRST_SCREEN_CAMERA.position[1]).toBeLessThan(8);
    expect(FIRST_SCREEN_CAMERA.position[2]).toBeGreaterThan(7);
  });

  it('keeps office overlays from claiming the whole viewport', () => {
    expect(isSafeZoneReasonable(FIRST_SCREEN_SAFE_ZONES.desktop)).toBe(true);
    expect(FIRST_SCREEN_SAFE_ZONES.desktop.sceneMinWidthRatio).toBeGreaterThanOrEqual(0.62);
    expect(FIRST_SCREEN_SAFE_ZONES.mobile.sceneMinHeight).toBeGreaterThanOrEqual(280);
  });

  it('requires a visibly non-black 3D area in screenshot QA', () => {
    expect(FIRST_SCREEN_VISUAL_THRESHOLDS.maxNearBlackRatio).toBeLessThanOrEqual(0.35);
    expect(FIRST_SCREEN_VISUAL_THRESHOLDS.minAverageRgb).toBeGreaterThanOrEqual(32);
  });
});
