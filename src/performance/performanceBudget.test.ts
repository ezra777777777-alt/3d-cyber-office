import { describe, expect, it } from 'vitest';
import { classifyChunkBudget, summarizeBundleBudget } from './performanceBudget';

describe('performance budget', () => {
  it('warns when an initial app chunk exceeds the target budget', () => {
    expect(classifyChunkBudget({ name: 'index.js', sizeKb: 1240, kind: 'initial' })).toBe('over_budget');
  });

  it('accepts separated vendor chunks when app entry is smaller', () => {
    expect(
      summarizeBundleBudget([
        { name: 'app.js', sizeKb: 420, kind: 'initial' },
        { name: 'vendor-three.js', sizeKb: 760, kind: 'vendor' },
        { name: 'dashboard.js', sizeKb: 180, kind: 'lazy' },
      ]),
    ).toMatchObject({
      status: 'ok',
      overBudget: [],
    });
  });

  it('warns for lazy chunks above 250 kB', () => {
    expect(classifyChunkBudget({ name: 'dashboard.js', sizeKb: 300, kind: 'lazy' })).toBe('warning');
  });
});
