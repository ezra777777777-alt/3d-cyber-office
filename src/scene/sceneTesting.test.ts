import { describe, expect, it } from 'vitest';
import { defaultLayout } from '@/data/defaultLayout';
import { countSemanticOfficeLandmarks, getCommanderDesk, getNamedSceneZones } from './sceneTesting';

describe('office scene metadata', () => {
  it('exposes the named zones required by the office overview', () => {
    expect(getNamedSceneZones(defaultLayout).map((zone) => zone.id)).toEqual([
      'commander',
      'workers',
      'intake',
      'delivery',
      'collaboration',
      'diagnostics',
      'rest',
    ]);
  });

  it('marks one workstation as the commander focal desk', () => {
    expect(getCommanderDesk(defaultLayout)).toMatchObject({
      id: 'desk-commander',
      zone: 'commander',
      label: 'Lobster Command',
      isCommander: true,
    });
  });

  it('keeps all overview zone labels inside the room bounds', () => {
    const [width, , depth] = defaultLayout.roomSize;

    for (const zone of getNamedSceneZones(defaultLayout)) {
      expect(Math.abs(zone.position[0])).toBeLessThanOrEqual(width / 2);
      expect(Math.abs(zone.position[2])).toBeLessThanOrEqual(depth / 2);
      expect(zone.label.length).toBeGreaterThan(0);
      expect(zone.subtitle.length).toBeGreaterThan(0);
    }
  });

  it('keeps enough semantic landmarks for the overview camera', () => {
    expect(countSemanticOfficeLandmarks(defaultLayout)).toBeGreaterThanOrEqual(11);
  });
});
