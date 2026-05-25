import { describe, expect, it } from 'vitest';
import {
  CINEMATIC_CAMERA_SHOTS,
  getCinematicShot,
  getCinematicShotIds,
} from './cinematicCameraPresets';

describe('cinematic camera presets', () => {
  it('defines the full video replica shot list', () => {
    expect(getCinematicShotIds()).toEqual([
      'intro-office',
      'commander-console',
      'worker-assignment',
      'approval-focus',
      'artifact-delivery',
      'review-summary',
    ]);
  });

  it('keeps every shot valid and smooth enough to read', () => {
    for (const shot of CINEMATIC_CAMERA_SHOTS) {
      expect(shot.position).toHaveLength(3);
      expect(shot.target).toHaveLength(3);
      expect(shot.durationMs).toBeGreaterThanOrEqual(900);
      expect(shot.durationMs).toBeLessThanOrEqual(2600);
    }
  });

  it('returns a fallback intro shot for unknown IDs', () => {
    expect(getCinematicShot('missing').id).toBe('intro-office');
  });
});
