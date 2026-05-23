import { describe, expect, it } from 'vitest';
import { brightOfficeTheme } from './sceneVisualTheme';
import {
  getHexBrightness,
  isBrighterThan,
  isWarmCommanderAccent,
  getBrightnessCheckResults,
} from './sceneVisualTesting';

describe('bright office visual theme', () => {
  it('makes the office background, floor, and walls brighter than the old scene', () => {
    const results = getBrightnessCheckResults();
    expect(results.background).toBe(true);
    expect(results.floor).toBe(true);
    expect(results.wall).toBe(true);
  });

  it('keeps enough light in the scene for first-eye readability', () => {
    expect(brightOfficeTheme.ambientIntensity).toBeGreaterThanOrEqual(1);
    expect(brightOfficeTheme.keyLightIntensity).toBeGreaterThan(1);
    expect(brightOfficeTheme.fogNear).toBeGreaterThanOrEqual(28);
  });

  it('keeps Commander warmer and more visually emphasized than worker accents', () => {
    expect(
      isWarmCommanderAccent(brightOfficeTheme.commanderAccent, brightOfficeTheme.workerAccent),
    ).toBe(true);
    expect(getHexBrightness(brightOfficeTheme.commanderGlow)).toBeGreaterThan(
      getHexBrightness(brightOfficeTheme.commanderAccent),
    );
  });

  it('rejects the old dark background as not brighter than the new one', () => {
    expect(isBrighterThan('#1e1e35', brightOfficeTheme.background)).toBe(false);
  });

  it('rejects the old dark floor as not brighter than the new one', () => {
    expect(isBrighterThan('#2a2a38', brightOfficeTheme.floor)).toBe(false);
  });
});
