import { describe, expect, it } from 'vitest';
import { CLAW_OFFICE_CAMERA, CLAW_OFFICE_LAYOUT, getMainAgentPlacement, getWorkerPlacements } from './clawOfficeLayout';

describe('Claw3D-style office layout', () => {
  it('has a main lobster desk and at least three worker desks', () => {
    expect(getMainAgentPlacement()).toMatchObject({ id: 'main-lobster-desk', priority: 1 });
    expect(getWorkerPlacements()).toHaveLength(3);
  });

  it('uses a video-like camera angle', () => {
    expect(CLAW_OFFICE_CAMERA.position[1]).toBeGreaterThan(6);
    expect(CLAW_OFFICE_CAMERA.position[2]).toBeGreaterThan(8);
    expect(CLAW_OFFICE_CAMERA.target[2]).toBeLessThan(0);
  });

  it('keeps the scene populated without reverting to clutter', () => {
    expect(CLAW_OFFICE_LAYOUT.length).toBeGreaterThanOrEqual(8);
    expect(CLAW_OFFICE_LAYOUT.length).toBeLessThanOrEqual(18);
  });
});
