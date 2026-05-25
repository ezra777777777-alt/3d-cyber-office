import { describe, expect, it } from 'vitest';
import { CLAW_FURNITURE_ASSETS } from './clawAssets';

describe('Claw3D furniture asset registry', () => {
  it('contains the minimum assets needed for video-like office composition', () => {
    expect(Object.keys(CLAW_FURNITURE_ASSETS).sort()).toEqual([
      'chair',
      'coffeeTable',
      'floorLamp',
      'loungeSofa',
      'mainDesk',
      'monitor',
      'plant',
      'workerDesk',
    ]);
  });

  it('uses public office asset paths', () => {
    for (const asset of Object.values(CLAW_FURNITURE_ASSETS)) {
      expect(asset.path).toMatch(/^\/office-assets\/models\/furniture\/.+\.glb$/);
    }
  });
});
