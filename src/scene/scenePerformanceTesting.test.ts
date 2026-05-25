import { describe, expect, it } from 'vitest';
import { getVisualDensityPreset } from './visualDensityConfig';
import { estimateDecorBudget } from './scenePerformanceTesting';

describe('scene visual density', () => {
  it('keeps low mode below normal decorative budget', () => {
    expect(estimateDecorBudget(getVisualDensityPreset('low')).decorItemCount).toBeLessThan(
      estimateDecorBudget(getVisualDensityPreset('normal')).decorItemCount,
    );
  });

  it('keeps normal mode dense enough for office fidelity', () => {
    expect(estimateDecorBudget(getVisualDensityPreset('normal')).screenContentCount).toBeGreaterThanOrEqual(6);
  });

  it('showcase mode has more decor than normal', () => {
    expect(estimateDecorBudget(getVisualDensityPreset('showcase')).decorItemCount).toBeGreaterThan(
      estimateDecorBudget(getVisualDensityPreset('normal')).decorItemCount,
    );
  });
});
