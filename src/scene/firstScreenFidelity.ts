export interface CameraPreset {
  id: string;
  position: [number, number, number];
  target: [number, number, number];
  durationMs: number;
  fov?: number;
  minDistance?: number;
  maxDistance?: number;
}

export const FIRST_SCREEN_CAMERA: CameraPreset = {
  id: 'first-screen-office-showcase',
  position: [6.2, 6.4, 8.8],
  target: [0, 0.85, -2.4],
  durationMs: 900,
  fov: 42,
  minDistance: 5.5,
  maxDistance: 18,
};

export const CLAW_FIRST_SCREEN_CAMERA: CameraPreset = {
  id: 'video-main-frame-camera',
  position: [8.6, 7.5, 10.8],
  target: [0.1, 0.68, -2.7],
  durationMs: 1100,
  fov: 38,
  minDistance: 5.2,
  maxDistance: 18,
};

export const FIRST_SCREEN_SAFE_ZONES = {
  desktop: {
    sceneMinWidthRatio: 0.62,
    commanderPanelMaxWidth: 320,
    bottomHudMaxHeight: 92,
  },
  mobile: {
    sceneMinHeight: 280,
    commanderPanelMaxHeightRatio: 0.52,
    bottomHudMaxHeight: 96,
  },
} as const;

export const FIRST_SCREEN_VISUAL_THRESHOLDS = {
  maxNearBlackRatio: 0.35,
  minAverageRgb: 32,
  minVisibleScenePixelsDesktop: 260_000,
  minVisibleScenePixelsMobile: 80_000,
} as const;

export function isCameraPresetValid(preset: CameraPreset): boolean {
  return (
    preset.position.length === 3 &&
    preset.target.length === 3 &&
    preset.position.every(Number.isFinite) &&
    preset.target.every(Number.isFinite) &&
    preset.durationMs > 0
  );
}

export function isSafeZoneReasonable(zone: {
  sceneMinWidthRatio?: number;
  sceneMinHeight?: number;
  commanderPanelMaxWidth?: number;
  commanderPanelMaxHeightRatio?: number;
  bottomHudMaxHeight: number;
}): boolean {
  if (zone.sceneMinWidthRatio !== undefined && zone.sceneMinWidthRatio < 0.55) return false;
  if (zone.sceneMinHeight !== undefined && zone.sceneMinHeight < 240) return false;
  if (zone.commanderPanelMaxWidth !== undefined && zone.commanderPanelMaxWidth > 360) return false;
  if (zone.commanderPanelMaxHeightRatio !== undefined && zone.commanderPanelMaxHeightRatio > 0.62) return false;
  return zone.bottomHudMaxHeight <= 120;
}
