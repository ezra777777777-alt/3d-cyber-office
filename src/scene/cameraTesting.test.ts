import { describe, expect, it } from 'vitest';
import { OFFICE_OVERVIEW_CAMERA } from './CameraController';

describe('office overview camera', () => {
  it('keeps a high oblique overview for the office shell', () => {
    expect(OFFICE_OVERVIEW_CAMERA.position[1]).toBeGreaterThanOrEqual(5);
    expect(OFFICE_OVERVIEW_CAMERA.position[2]).toBeGreaterThanOrEqual(7);
    expect(OFFICE_OVERVIEW_CAMERA.target).toHaveLength(3);
    expect(OFFICE_OVERVIEW_CAMERA.target[1]).toBeGreaterThanOrEqual(0);
  });
});
