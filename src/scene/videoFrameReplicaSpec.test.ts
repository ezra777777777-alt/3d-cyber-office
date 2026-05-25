import { describe, expect, it } from 'vitest';
import {
  VIDEO_FRAME_CAMERA,
  VIDEO_FRAME_PALETTE,
  VIDEO_FRAME_PLATFORM,
  VIDEO_FRAME_AVATAR,
  VIDEO_FRAME_SLOTS,
  getVideoFrameWorkerSlots,
  getVideoFrameFurnitureSlots,
} from './videoFrameReplicaSpec';

describe('video frame replica spec', () => {
  it('uses the video office palette: dark shell, warm floor, green board, cyan water', () => {
    expect(VIDEO_FRAME_PALETTE.background).toBe('#07111f');
    expect(VIDEO_FRAME_PALETTE.platform).toBe('#f3efe6');
    expect(VIDEO_FRAME_PALETTE.floor).toBe('#dcc8a2');
    expect(VIDEO_FRAME_PALETTE.greenWall).toBe('#173829');
    expect(VIDEO_FRAME_PALETTE.water).toBe('#72d7ea');
  });

  it('frames the office like the main video reference frame', () => {
    expect(VIDEO_FRAME_CAMERA.position[1]).toBeGreaterThanOrEqual(6.4);
    expect(VIDEO_FRAME_CAMERA.position[2]).toBeGreaterThanOrEqual(8.5);
    expect(VIDEO_FRAME_CAMERA.target[2]).toBeLessThan(-2.6);
    expect(VIDEO_FRAME_CAMERA.fov).toBeLessThanOrEqual(40);
  });

  it('uses an open platform instead of a closed box room', () => {
    expect(VIDEO_FRAME_PLATFORM.width).toBeGreaterThanOrEqual(18);
    expect(VIDEO_FRAME_PLATFORM.depth).toBeGreaterThanOrEqual(13);
    expect(VIDEO_FRAME_PLATFORM.floorWidth).toBeGreaterThanOrEqual(12.5);
    expect(VIDEO_FRAME_PLATFORM.floorDepth).toBeGreaterThanOrEqual(9.5);
    expect(VIDEO_FRAME_PLATFORM.hasCeiling).toBe(false);
    expect(VIDEO_FRAME_PLATFORM.wallCount).toBeLessThanOrEqual(2);
  });

  it('keeps avatars tiny, blocky, and seated like the video', () => {
    expect(VIDEO_FRAME_AVATAR.headShape).toBe('box');
    expect(VIDEO_FRAME_AVATAR.bodyShape).toBe('box');
    expect(VIDEO_FRAME_AVATAR.height).toBeLessThanOrEqual(0.88);
    expect(VIDEO_FRAME_AVATAR.chairRequired).toBe(true);
    expect(VIDEO_FRAME_AVATAR.realisticLobsterBodyAllowed).toBe(false);
  });

  it('places commander and workers in video-like zones', () => {
    expect(VIDEO_FRAME_SLOTS.commander.position[2]).toBeLessThan(-3.6);
    const workers = getVideoFrameWorkerSlots();
    expect(workers).toHaveLength(4);
    expect(workers.every((slot) => slot.position[2] > -3.4)).toBe(true);
    expect(workers.some((slot) => slot.position[0] < -2)).toBe(true);
    expect(workers.some((slot) => slot.position[0] > 2)).toBe(true);
  });

  it('keeps furniture density controlled', () => {
    const furniture = getVideoFrameFurnitureSlots('normal');
    expect(furniture.length).toBeGreaterThanOrEqual(16);
    expect(furniture.length).toBeLessThanOrEqual(24);
  });

  it('models the larger office island zones visible in the video', async () => {
    const mod = await import('./videoFrameReplicaSpec');
    expect(mod.VIDEO_FRAME_EXPANSION_ZONES.leftGarden.position[0]).toBeLessThan(-5);
    expect(mod.VIDEO_FRAME_EXPANSION_ZONES.farWorkCluster.position[2]).toBeLessThan(-4);
    expect(mod.VIDEO_FRAME_EXPANSION_ZONES.rightExtension.position[0]).toBeGreaterThan(5);
  });
});
