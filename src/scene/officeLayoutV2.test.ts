import { describe, expect, it } from 'vitest';
import {
  OFFICE_LAYOUT_V2,
  getCommanderAnchor,
  getCoreWorkerAnchors,
  getPeripheralZoneAnchors,
  isWorkerArcFacingCommander,
} from './officeLayoutV2';

describe('Plan 18 office layout V2', () => {
  it('places commander as the first-screen focal anchor', () => {
    const commander = getCommanderAnchor();
    expect(commander.id).toBe('commander-stage');
    expect(commander.priority).toBe(1);
    expect(Math.abs(commander.position[0])).toBeLessThanOrEqual(0.8);
    expect(commander.position[2]).toBeLessThanOrEqual(-2.8);
  });

  it('arranges core workers in a clean arc around the commander', () => {
    const workers = getCoreWorkerAnchors();
    expect(workers).toHaveLength(3);
    expect(workers.map((worker) => worker.priority)).toEqual([2, 2, 2]);
    expect(isWorkerArcFacingCommander(workers, getCommanderAnchor())).toBe(true);
  });

  it('keeps peripheral zones away from the first-screen focal lane', () => {
    const peripheral = getPeripheralZoneAnchors();
    expect(peripheral.every((zone) => zone.priority >= 4)).toBe(true);
    expect(peripheral.every((zone) => Math.abs(zone.position[0]) >= 4 || zone.position[2] >= 2.5)).toBe(true);
  });

  it('defines a default camera that can see commander and all workers', () => {
    expect(OFFICE_LAYOUT_V2.camera.defaultPosition).toEqual([6.2, 6.4, 8.8]);
    expect(OFFICE_LAYOUT_V2.camera.defaultTarget).toEqual([0, 0.85, -2.4]);
    expect(OFFICE_LAYOUT_V2.camera.firstScreenMustInclude).toEqual([
      'commander-stage',
      'worker-research',
      'worker-build',
      'worker-review',
    ]);
  });
});
