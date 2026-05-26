import { describe, expect, it } from 'vitest';
import {
  buildSlotBounds,
  countBoundsOverlaps,
  estimateCenterCoverage,
  estimateSceneDensity,
  isCameraLookingAtPlatform,
} from './videoGradeCompositionTesting';
import {
  VIDEO_GRADE_CAMERA,
  VIDEO_GRADE_SAFE_ZONES,
  getVideoGradeCharacterSlots,
  getVideoGradeFurnitureSlots,
} from './videoGradeVisualSpec';

describe('video grade composition testing', () => {
  it('keeps normal mode under the density budget', () => {
    const density = estimateSceneDensity({
      furniture: getVideoGradeFurnitureSlots('normal'),
      characters: getVideoGradeCharacterSlots('normal'),
    });
    expect(density.furnitureCount).toBeLessThanOrEqual(24);
    expect(density.characterCount).toBeLessThanOrEqual(9);
    expect(density.totalVisualUnits).toBeLessThanOrEqual(38);
  });

  it('keeps essential desks from overlapping each other', () => {
    const bounds = buildSlotBounds(getVideoGradeFurnitureSlots('low'));
    expect(countBoundsOverlaps(bounds, 0.18)).toBe(0);
  });

  it('keeps the center office visible on desktop', () => {
    const coverage = estimateCenterCoverage({
      viewportWidth: 1366,
      viewportHeight: 768,
      leftRailWidth: 56,
      rightPanelWidth: 316,
      bottomBarHeight: 72,
    });
    expect(coverage.clearRatio).toBeGreaterThanOrEqual(VIDEO_GRADE_SAFE_ZONES.desktopCenterClearRatio);
  });

  it('keeps the center office visible on mobile', () => {
    const coverage = estimateCenterCoverage({
      viewportWidth: 390,
      viewportHeight: 844,
      leftRailWidth: 42,
      rightPanelWidth: 0,
      bottomBarHeight: 64,
    });
    expect(coverage.clearRatio).toBeGreaterThanOrEqual(0.72);
  });

  it('uses a camera aimed at the open platform center', () => {
    expect(isCameraLookingAtPlatform(VIDEO_GRADE_CAMERA)).toBe(true);
  });
});
