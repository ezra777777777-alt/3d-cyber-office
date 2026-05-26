import { describe, expect, it } from 'vitest';
import {
  VIDEO_FRAME_CAMERA,
  VIDEO_FRAME_PALETTE,
  VIDEO_FRAME_PLATFORM,
  getVideoFrameFurnitureSlots,
} from './videoFrameReplicaSpec';

describe('video frame replica compatibility spec', () => {
  it('re-exports the Plan 32 visual target through legacy names', () => {
    expect(VIDEO_FRAME_PALETTE.background).toBe('#07111f');
    expect(VIDEO_FRAME_PALETTE.floor).toBe('#d8bd8b');
    expect(VIDEO_FRAME_PLATFORM.width).toBeGreaterThanOrEqual(20);
    expect(VIDEO_FRAME_CAMERA.fov).toBeLessThanOrEqual(39);
    expect(getVideoFrameFurnitureSlots('normal').length).toBeGreaterThan(10);
  });
});
