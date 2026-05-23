import { describe, expect, it } from 'vitest';
import { defaultLayout } from '@/data/defaultLayout';
import {
  getCommanderFocalDesk,
  getCommanderWorkerDeskTargets,
  getDistanceBetweenDesks,
  hasCommanderFocalPriority,
} from './commanderVisualTesting';

describe('Commander visual scene metadata', () => {
  it('has a Commander focal desk with warmer accent priority', () => {
    const commander = getCommanderFocalDesk(defaultLayout);
    expect(commander).toMatchObject({
      id: 'desk-commander',
      isCommander: true,
      zone: 'commander',
    });
    expect(hasCommanderFocalPriority(defaultLayout)).toBe(true);
  });

  it('has worker desk targets that can be linked from Commander', () => {
    expect(getCommanderWorkerDeskTargets(defaultLayout).map((desk) => desk.id)).toEqual([
      'desk-a2',
      'desk-b1',
      'desk-b2',
    ]);
  });

  it('keeps Commander close enough to workers for visible mission links', () => {
    const commander = getCommanderFocalDesk(defaultLayout);
    const targets = getCommanderWorkerDeskTargets(defaultLayout);
    expect(commander).toBeDefined();
    for (const target of targets) {
      expect(getDistanceBetweenDesks(commander!, target)).toBeLessThanOrEqual(14);
    }
  });
});
