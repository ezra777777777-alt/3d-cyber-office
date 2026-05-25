export type ClawZoneKind = 'main-agent' | 'worker' | 'lounge' | 'plant' | 'wall' | 'water' | 'utility';

export interface ClawPlacement {
  id: string;
  kind: ClawZoneKind;
  assetId?: string;
  position: [number, number, number];
  rotationY: number;
  priority: number;
}

export const CLAW_OFFICE_CAMERA = {
  position: [7.8, 7.4, 9.6] as [number, number, number],
  target: [0.6, 0.8, -2.2] as [number, number, number],
  fov: 40,
};

export const CLAW_OFFICE_LAYOUT: ClawPlacement[] = [
  { id: 'main-lobster-desk', kind: 'main-agent', assetId: 'mainDesk', position: [2.9, 0, -4.2], rotationY: Math.PI, priority: 1 },
  { id: 'worker-desk-left', kind: 'worker', assetId: 'workerDesk', position: [-3.7, 0, -2.0], rotationY: -0.2, priority: 2 },
  { id: 'worker-desk-center', kind: 'worker', assetId: 'workerDesk', position: [-0.8, 0, -1.35], rotationY: 0.05, priority: 2 },
  { id: 'worker-desk-right', kind: 'worker', assetId: 'workerDesk', position: [3.5, 0, -1.0], rotationY: 0.35, priority: 2 },
  { id: 'foreground-lounge', kind: 'lounge', assetId: 'coffeeTable', position: [0.6, 0, 2.4], rotationY: 0.12, priority: 3 },
  { id: 'left-plant', kind: 'plant', assetId: 'plant', position: [-6.2, 0, -3.4], rotationY: 0, priority: 4 },
  { id: 'right-plant', kind: 'plant', assetId: 'plant', position: [6.0, 0, -3.7], rotationY: 0, priority: 4 },
  { id: 'floor-lamp', kind: 'utility', assetId: 'floorLamp', position: [2.3, 0, 1.65], rotationY: 0, priority: 4 },
];

export function getMainAgentPlacement() {
  return CLAW_OFFICE_LAYOUT.find((item) => item.kind === 'main-agent');
}

export function getWorkerPlacements() {
  return CLAW_OFFICE_LAYOUT.filter((item) => item.kind === 'worker');
}
