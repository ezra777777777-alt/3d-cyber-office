export type VisualDensityMode = 'low' | 'normal' | 'showcase';

export interface VisualDensityPreset {
  decorItemCount: number;
  deskPropsPerDesk: number;
  microProps: number;
  showDeskProps: boolean;
  showZoneProps: boolean;
  showPeripheralDecor: boolean;
  screenContent: boolean;  // keep for backward compat
  ambientMotion: boolean;  // keep for backward compat
  commanderEffects: boolean; // keep for backward compat
}

// low: 2 decor, 0 desk props, 0 micro
// normal: 5 decor, 1 desk prop, 0 micro
// showcase: 8 decor, 2 desk props, 4 micro
const DENSITY_PRESETS: Record<VisualDensityMode, VisualDensityPreset> = {
  low: {
    decorItemCount: 2,
    deskPropsPerDesk: 0,
    microProps: 0,
    showDeskProps: false,
    showZoneProps: false,
    showPeripheralDecor: false,
    screenContent: false,
    ambientMotion: false,
    commanderEffects: true,
  },
  normal: {
    decorItemCount: 5,
    deskPropsPerDesk: 1,
    microProps: 0,
    showDeskProps: true,
    showZoneProps: true,
    showPeripheralDecor: false,
    screenContent: true,
    ambientMotion: true,
    commanderEffects: true,
  },
  showcase: {
    decorItemCount: 8,
    deskPropsPerDesk: 2,
    microProps: 4,
    showDeskProps: true,
    showZoneProps: true,
    showPeripheralDecor: true,
    screenContent: true,
    ambientMotion: true,
    commanderEffects: true,
  },
};

export function getVisualDensityPreset(mode: VisualDensityMode): VisualDensityPreset {
  return DENSITY_PRESETS[mode];
}
