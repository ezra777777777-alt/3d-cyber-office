import { describe, expect, it } from 'vitest';
import {
  VIDEO_GRADE_CAMERA,
  VIDEO_GRADE_CHARACTER_RULES,
  VIDEO_GRADE_DENSITY,
  VIDEO_GRADE_PALETTE,
  VIDEO_GRADE_PLATFORM,
  VIDEO_GRADE_SAFE_ZONES,
  getVideoGradeCharacterSlots,
  getVideoGradeFurnitureSlots,
} from './videoGradeVisualSpec';

describe('video grade visual spec', () => {
  it('uses the required video-grade palette', () => {
    expect(VIDEO_GRADE_PALETTE.background).toBe('#07111f');
    expect(VIDEO_GRADE_PALETTE.floor).toBe('#d8bd8b');
    expect(VIDEO_GRADE_PALETTE.greenWall).toBe('#173829');
    expect(VIDEO_GRADE_PALETTE.water).toBe('#72d7ea');
    expect(VIDEO_GRADE_PALETTE.commanderRed).toBe('#e85f46');
  });

  it('keeps the office large and open', () => {
    expect(VIDEO_GRADE_PLATFORM.width).toBeGreaterThanOrEqual(20);
    expect(VIDEO_GRADE_PLATFORM.depth).toBeGreaterThanOrEqual(14);
    expect(VIDEO_GRADE_PLATFORM.floorWidth).toBeGreaterThanOrEqual(14);
    expect(VIDEO_GRADE_PLATFORM.floorDepth).toBeGreaterThanOrEqual(10);
    expect(VIDEO_GRADE_PLATFORM.hasCeiling).toBe(false);
  });

  it('frames a video-like wide first screen', () => {
    expect(VIDEO_GRADE_CAMERA.position[1]).toBeGreaterThanOrEqual(6.8);
    expect(VIDEO_GRADE_CAMERA.position[2]).toBeGreaterThanOrEqual(10);
    expect(VIDEO_GRADE_CAMERA.target[2]).toBeLessThan(-2.6);
    expect(VIDEO_GRADE_CAMERA.fov).toBeLessThanOrEqual(39);
  });

  it('protects the center safe zone from overlays', () => {
    expect(VIDEO_GRADE_SAFE_ZONES.desktopCenterClearRatio).toBeGreaterThanOrEqual(0.6);
    expect(VIDEO_GRADE_SAFE_ZONES.mobileRightPanelDefaultCollapsed).toBe(true);
  });

  it('keeps characters small, seated, and non-creepy', () => {
    expect(VIDEO_GRADE_CHARACTER_RULES.minHeight).toBeGreaterThanOrEqual(0.58);
    expect(VIDEO_GRADE_CHARACTER_RULES.maxHeight).toBeLessThanOrEqual(0.82);
    expect(VIDEO_GRADE_CHARACTER_RULES.seatedOnly).toBe(true);
    expect(VIDEO_GRADE_CHARACTER_RULES.roundCapsuleBodyAllowed).toBe(false);
    expect(VIDEO_GRADE_CHARACTER_RULES.faceEyesAllowed).toBe(false);
    expect(VIDEO_GRADE_CHARACTER_RULES.groundGlowAllowed).toBe(false);
    expect(VIDEO_GRADE_CHARACTER_RULES.realisticAnimalBodyAllowed).toBe(false);
  });

  it('places one commander, four primary workers, and background workers', () => {
    const slots = getVideoGradeCharacterSlots();
    expect(slots.filter((slot) => slot.role === 'commander')).toHaveLength(1);
    expect(slots.filter((slot) => slot.role === 'worker' && slot.priority === 'essential')).toHaveLength(4);
    expect(slots.filter((slot) => slot.priority === 'normal').length).toBeGreaterThanOrEqual(3);
  });

  it('keeps density controlled by visual mode', () => {
    expect(getVideoGradeFurnitureSlots('low').length).toBeLessThan(getVideoGradeFurnitureSlots('normal').length);
    expect(getVideoGradeFurnitureSlots('normal').length).toBeLessThanOrEqual(VIDEO_GRADE_DENSITY.normal.maxFurniture);
    expect(getVideoGradeFurnitureSlots('showcase').length).toBeLessThanOrEqual(VIDEO_GRADE_DENSITY.showcase.maxFurniture);
  });

  it('keeps the Commander behind the worker row and makes the office deeper', () => {
    const furniture = getVideoGradeFurnitureSlots('normal');
    const commanderDesk = furniture.find((slot) => slot.id === 'commander-desk');
    const frontDesks = furniture.filter((slot) => slot.kind === 'workerDesk' && slot.position[2] > -3);
    const rearDesks = furniture.filter((slot) => slot.kind === 'workerDesk' && slot.position[2] < -4);
    expect(commanderDesk?.position[2]).toBeLessThan(-4.5);
    expect(frontDesks.length).toBeGreaterThanOrEqual(3);
    expect(rearDesks.length).toBeGreaterThanOrEqual(2);
  });

  it('forbids the visual patterns users rejected', () => {
    expect(VIDEO_GRADE_CHARACTER_RULES.roundCapsuleBodyAllowed).toBe(false);
    expect(VIDEO_GRADE_CHARACTER_RULES.faceEyesAllowed).toBe(false);
    expect(VIDEO_GRADE_CHARACTER_RULES.groundGlowAllowed).toBe(false);
    expect(VIDEO_GRADE_CHARACTER_RULES.realisticAnimalBodyAllowed).toBe(false);
  });
});
