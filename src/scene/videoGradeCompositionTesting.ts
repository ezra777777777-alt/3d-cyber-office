import type { CameraPreset } from './firstScreenFidelity';
import type { VideoGradeCharacterSlot, VideoGradeFurnitureSlot } from './videoGradeVisualSpec';

export interface SlotBounds {
  id: string;
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

export function buildSlotBounds(slots: VideoGradeFurnitureSlot[]): SlotBounds[] {
  return slots
    .filter((slot) => slot.kind === 'commanderDesk' || slot.kind === 'workerDesk')
    .map((slot) => {
      const width = slot.kind === 'commanderDesk' ? 1.55 * slot.scale[0] : 1.15 * slot.scale[0];
      const depth = slot.kind === 'commanderDesk' ? 0.9 * slot.scale[2] : 0.82 * slot.scale[2];
      return {
        id: slot.id,
        minX: slot.position[0] - width / 2,
        maxX: slot.position[0] + width / 2,
        minZ: slot.position[2] - depth / 2,
        maxZ: slot.position[2] + depth / 2,
      };
    });
}

export function countBoundsOverlaps(bounds: SlotBounds[], padding = 0) {
  let count = 0;
  for (let i = 0; i < bounds.length; i += 1) {
    for (let j = i + 1; j < bounds.length; j += 1) {
      const a = bounds[i];
      const b = bounds[j];
      const overlap =
        a.minX - padding < b.maxX &&
        a.maxX + padding > b.minX &&
        a.minZ - padding < b.maxZ &&
        a.maxZ + padding > b.minZ;
      if (overlap) count += 1;
    }
  }
  return count;
}

export function estimateSceneDensity(input: {
  furniture: VideoGradeFurnitureSlot[];
  characters: VideoGradeCharacterSlot[];
}) {
  const furnitureCount = input.furniture.length;
  const characterCount = input.characters.length;
  const totalVisualUnits = furnitureCount + characterCount * 1.5;
  return { furnitureCount, characterCount, totalVisualUnits };
}

export function estimateCenterCoverage(input: {
  viewportWidth: number;
  viewportHeight: number;
  leftRailWidth: number;
  rightPanelWidth: number;
  bottomBarHeight: number;
}) {
  const totalArea = input.viewportWidth * input.viewportHeight;
  const coveredArea =
    input.leftRailWidth * input.viewportHeight +
    input.rightPanelWidth * input.viewportHeight +
    input.bottomBarHeight * input.viewportWidth;
  const clearRatio = Math.max(0, 1 - coveredArea / totalArea);
  return { clearRatio };
}

export function isCameraLookingAtPlatform(camera: CameraPreset) {
  const [, y, z] = camera.position;
  const [tx, ty, tz] = camera.target;
  return y >= 6.5 && z >= 9.5 && Math.abs(tx) <= 0.75 && ty >= 0.45 && ty <= 1.2 && tz <= -2.4;
}
