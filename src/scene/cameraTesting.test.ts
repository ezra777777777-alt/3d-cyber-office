import { describe, expect, it } from 'vitest';
import { OFFICE_OVERVIEW_CAMERA } from './CameraController';

describe('office overview camera', () => {
  it('keeps a high oblique overview for the office shell', () => {
    expect(OFFICE_OVERVIEW_CAMERA.position[1]).toBeGreaterThan(10);
    expect(OFFICE_OVERVIEW_CAMERA.target).toEqual([0, 0, 0]);
  });
});
