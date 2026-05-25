export interface ClawAssetDefinition {
  id: string;
  path: string;
  role: 'desk' | 'chair' | 'monitor' | 'plant' | 'lounge' | 'table' | 'lamp' | 'storage';
  scale: [number, number, number];
  tint?: string;
}

export const CLAW_FURNITURE_ASSETS: Record<string, ClawAssetDefinition> = {
  workerDesk: {
    id: 'workerDesk',
    path: '/office-assets/models/furniture/desk.glb',
    role: 'desk',
    scale: [1.5, 1.5, 1.5],
    tint: '#8b5e32',
  },
  mainDesk: {
    id: 'mainDesk',
    path: '/office-assets/models/furniture/deskCorner.glb',
    role: 'desk',
    scale: [1.8, 1.8, 1.8],
    tint: '#6b3c1a',
  },
  chair: {
    id: 'chair',
    path: '/office-assets/models/furniture/chairDesk.glb',
    role: 'chair',
    scale: [1.2, 1.2, 1.2],
  },
  monitor: {
    id: 'monitor',
    path: '/office-assets/models/furniture/computerScreen.glb',
    role: 'monitor',
    scale: [1.1, 1.1, 1.1],
  },
  plant: {
    id: 'plant',
    path: '/office-assets/models/furniture/pottedPlant.glb',
    role: 'plant',
    scale: [1.2, 1.8, 1.2],
  },
  floorLamp: {
    id: 'floorLamp',
    path: '/office-assets/models/furniture/lampRoundFloor.glb',
    role: 'lamp',
    scale: [1.2, 1.2, 1.2],
  },
  loungeSofa: {
    id: 'loungeSofa',
    path: '/office-assets/models/furniture/loungeSofa.glb',
    role: 'lounge',
    scale: [1.8, 1.8, 1.8],
  },
  coffeeTable: {
    id: 'coffeeTable',
    path: '/office-assets/models/furniture/tableCoffee.glb',
    role: 'table',
    scale: [2.4, 1.2, 1.6],
  },
};
