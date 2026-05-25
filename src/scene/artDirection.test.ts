import { describe, expect, it } from 'vitest';
import {
  ART_DIRECTION,
  countFirstScreenNoiseUnits,
  getVisualPriorityRank,
  isAllowedFirstScreenProp,
} from './artDirection';

describe('Plan 18 art direction', () => {
  it('keeps the first screen focused on commander and workers', () => {
    expect(getVisualPriorityRank('commander')).toBe(1);
    expect(getVisualPriorityRank('worker-pod')).toBe(2);
    expect(getVisualPriorityRank('task-flow')).toBe(3);
    expect(getVisualPriorityRank('desk-prop')).toBeGreaterThan(3);
  });

  it('uses a bright office palette with limited accent colors', () => {
    expect(ART_DIRECTION.palette.background).toBe('#e7f4ff');
    expect(ART_DIRECTION.palette.floor).toBe('#7f93a8');
    expect(ART_DIRECTION.palette.commanderAccent).toBe('#ff6b4a');
    expect(ART_DIRECTION.palette.workerAccent).toBe('#24c6dc');
    expect(ART_DIRECTION.palette.accentCount).toBeLessThanOrEqual(4);
  });

  it('enforces a real clutter budget by visual mode', () => {
    expect(ART_DIRECTION.noiseBudget.low.microProps).toBe(0);
    expect(ART_DIRECTION.noiseBudget.normal.microProps).toBe(0);
    expect(ART_DIRECTION.noiseBudget.showcase.microProps).toBeLessThanOrEqual(4);
    expect(countFirstScreenNoiseUnits('normal')).toBeLessThanOrEqual(12);
  });

  it('rejects decorative props that do not explain office work', () => {
    expect(isAllowedFirstScreenProp('status-light')).toBe(true);
    expect(isAllowedFirstScreenProp('task-board')).toBe(true);
    expect(isAllowedFirstScreenProp('random-cube-stack')).toBe(false);
    expect(isAllowedFirstScreenProp('tiny-table-clutter')).toBe(false);
  });
});
