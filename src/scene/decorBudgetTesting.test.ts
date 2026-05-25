import { describe, expect, it } from 'vitest';
import { getVisualDensityPreset } from './visualDensityConfig';

describe('Plan 18 decor budget', () => {
  it('keeps normal mode visually quiet', () => {
    const cfg = getVisualDensityPreset('normal');
    expect(cfg.decorItemCount).toBeLessThanOrEqual(5);
    expect(cfg.deskPropsPerDesk).toBeLessThanOrEqual(1);
    expect(cfg.microProps).toBe(0);
  });

  it('keeps showcase mode controlled instead of cluttered', () => {
    const cfg = getVisualDensityPreset('showcase');
    expect(cfg.decorItemCount).toBeLessThanOrEqual(8);
    expect(cfg.deskPropsPerDesk).toBeLessThanOrEqual(2);
    expect(cfg.microProps).toBeLessThanOrEqual(4);
  });

  it('keeps low mode suitable for mobile and QA', () => {
    const cfg = getVisualDensityPreset('low');
    expect(cfg.decorItemCount).toBeLessThanOrEqual(2);
    expect(cfg.deskPropsPerDesk).toBe(0);
    expect(cfg.microProps).toBe(0);
  });
});
