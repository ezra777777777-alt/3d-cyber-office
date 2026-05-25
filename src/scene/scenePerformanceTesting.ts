import type { VisualDensityPreset } from './visualDensityConfig';

export interface DecorBudget {
  decorItemCount: number;
  screenContentCount: number;
  deskPropCount: number;
}

export function estimateDecorBudget(preset: VisualDensityPreset): DecorBudget {
  return {
    decorItemCount: preset.decorItemCount,
    screenContentCount: preset.screenContent ? 8 : 0,
    deskPropCount: preset.showDeskProps ? 6 : 0,
  };
}
