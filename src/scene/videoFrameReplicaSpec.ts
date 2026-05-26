import type { CameraPreset } from './firstScreenFidelity';

export type VideoFrameFurnitureKind =
  | 'commanderDesk'
  | 'workerDesk'
  | 'chair'
  | 'monitor'
  | 'plant'
  | 'lamp'
  | 'lounge'
  | 'panel'
  | 'water'
  | 'platform';

export interface VideoFrameFurnitureSlot {
  id: string;
  kind: VideoFrameFurnitureKind;
  assetId?: string;
  position: [number, number, number];
  rotationY: number;
  scale: [number, number, number];
  priority: 'essential' | 'normal' | 'showcase';
}

export interface VideoFrameAvatarSlot {
  id: string;
  deskId: string;
  position: [number, number, number];
  rotationY: number;
  role: 'commander' | 'worker';
}

export interface VideoFrameAmbientAvatarSlot {
  id: string;
  position: [number, number, number];
  rotationY: number;
  scale: number;
}

export const VIDEO_FRAME_PALETTE = {
  background: '#07111f',
  platform: '#f3efe6',
  floor: '#dcc8a2',
  floorLine: '#bda070',
  greenWall: '#173829',
  wallTrim: '#f1ead9',
  water: '#72d7ea',
  waterDark: '#2192aa',
  panel: '#070b12',
  panelBorder: '#243141',
  lobster: '#f05f4b',
  commanderBody: '#c5643f',
  workerBody: '#222832',
  workerHead: '#9a7358',
  chair: '#101319',
  statusCyan: '#25d9ff',
  statusAmber: '#f2b85f',
  statusGreen: '#65ef9a',
  statusRed: '#ff4f6d',
} as const;

export const VIDEO_FRAME_CAMERA: CameraPreset = {
  id: 'video-main-frame-camera',
  position: [8.6, 7.5, 10.8],
  target: [0.1, 0.68, -2.7],
  durationMs: 1100,
  fov: 38,
  minDistance: 5.2,
  maxDistance: 18,
};

export const VIDEO_FRAME_PLATFORM = {
  width: 18.4,
  depth: 13.6,
  floorWidth: 13.2,
  floorDepth: 10.1,
  hasCeiling: false,
  wallCount: 2,
} as const;

export const VIDEO_FRAME_EXPANSION_ZONES = {
  leftGarden: {
    id: 'left-garden-water-zone',
    position: [-6.8, 0, -4.65] as [number, number, number],
    size: [3.6, 2.4] as [number, number],
  },
  farWorkCluster: {
    id: 'far-rear-worker-cluster',
    position: [-1.9, 0, -4.85] as [number, number, number],
    size: [3.9, 1.8] as [number, number],
  },
  rightExtension: {
    id: 'right-platform-extension',
    position: [6.45, 0, -2.35] as [number, number, number],
    size: [2.8, 4.8] as [number, number],
  },
} as const;

export const VIDEO_FRAME_LANDMARKS = {
  blueInfoBoard: {
    id: 'blue-info-board',
    position: [-0.25, 0.92, -3.25] as [number, number, number],
    size: [1.55, 1.12, 0.08] as [number, number, number],
  },
  rearArch: {
    id: 'rear-green-arch',
    position: [1.18, 0, -4.86] as [number, number, number],
    width: 1.18,
    height: 1.35,
  },
} as const;

export const VIDEO_FRAME_AVATAR = {
  headShape: 'box',
  bodyShape: 'box',
  height: 0.74,
  chairRequired: true,
  realisticLobsterBodyAllowed: false,
  groundGlowAllowed: false,
  paleSkinToneAllowed: false,
} as const;

export const VIDEO_FRAME_SLOTS = {
  commander: {
    id: 'commander-avatar',
    deskId: 'desk-commander',
    position: [2.95, 0, -4.05] as [number, number, number],
    rotationY: Math.PI,
    role: 'commander' as const,
  },
  workers: [
    { id: 'worker-left-front', deskId: 'desk-a2', position: [-3.35, 0, -1.18] as [number, number, number], rotationY: -0.24, role: 'worker' as const },
    { id: 'worker-mid-front', deskId: 'desk-b1', position: [-0.95, 0, -0.78] as [number, number, number], rotationY: -0.04, role: 'worker' as const },
    { id: 'worker-right-front', deskId: 'desk-b2', position: [2.55, 0, -1.26] as [number, number, number], rotationY: 0.2, role: 'worker' as const },
    { id: 'worker-right-back', deskId: 'desk-done', position: [4.9, 0, -2.95] as [number, number, number], rotationY: 0.55, role: 'worker' as const },
  ],
} as const;

export const VIDEO_FRAME_AMBIENT_AVATARS: VideoFrameAmbientAvatarSlot[] = [
  { id: 'ambient-far-left', position: [-2.62, 0, -4.33], rotationY: Math.PI, scale: 0.62 },
  { id: 'ambient-far-mid', position: [-0.9, 0, -4.2], rotationY: Math.PI, scale: 0.6 },
  { id: 'ambient-right-side', position: [5.25, 0, -3.58], rotationY: 0.54, scale: 0.68 },
  { id: 'ambient-right-rear', position: [5.85, 0, -3.82], rotationY: 0.72, scale: 0.58 },
];

export const VIDEO_FRAME_FURNITURE: VideoFrameFurnitureSlot[] = [
  { id: 'commander-desk', kind: 'commanderDesk', assetId: 'mainDesk', position: [2.95, 0, -4.72], rotationY: Math.PI, scale: [1.32, 1.32, 1.32], priority: 'essential' },
  { id: 'commander-monitor', kind: 'monitor', assetId: 'monitor', position: [2.95, 0.74, -5.12], rotationY: Math.PI, scale: [0.95, 0.95, 0.95], priority: 'essential' },
  { id: 'desk-left-front', kind: 'workerDesk', assetId: 'workerDesk', position: [-3.35, 0, -1.85], rotationY: -0.24, scale: [1.02, 1.02, 1.02], priority: 'essential' },
  { id: 'desk-mid-front', kind: 'workerDesk', assetId: 'workerDesk', position: [-0.95, 0, -1.45], rotationY: -0.04, scale: [1.02, 1.02, 1.02], priority: 'essential' },
  { id: 'desk-right-front', kind: 'workerDesk', assetId: 'workerDesk', position: [2.55, 0, -1.92], rotationY: 0.2, scale: [1.02, 1.02, 1.02], priority: 'essential' },
  { id: 'desk-right-back', kind: 'workerDesk', assetId: 'workerDesk', position: [4.9, 0, -3.6], rotationY: 0.55, scale: [0.94, 0.94, 0.94], priority: 'essential' },
  { id: 'monitor-left-front', kind: 'monitor', assetId: 'monitor', position: [-3.35, 0.72, -2.18], rotationY: -0.24, scale: [0.82, 0.82, 0.82], priority: 'normal' },
  { id: 'monitor-mid-front', kind: 'monitor', assetId: 'monitor', position: [-0.95, 0.72, -1.78], rotationY: -0.04, scale: [0.82, 0.82, 0.82], priority: 'normal' },
  { id: 'monitor-right-front', kind: 'monitor', assetId: 'monitor', position: [2.55, 0.72, -2.25], rotationY: 0.2, scale: [0.82, 0.82, 0.82], priority: 'normal' },
  { id: 'plant-left', kind: 'plant', assetId: 'plant', position: [-5.9, 0, -3.65], rotationY: 0.2, scale: [0.78, 1.05, 0.78], priority: 'normal' },
  { id: 'plant-right', kind: 'plant', assetId: 'plant', position: [6.1, 0, -4.1], rotationY: -0.1, scale: [0.78, 1.05, 0.78], priority: 'normal' },
  { id: 'lounge-table', kind: 'lounge', assetId: 'coffeeTable', position: [0.35, 0, 1.45], rotationY: 0.08, scale: [0.76, 0.76, 0.76], priority: 'normal' },
  { id: 'floor-lamp-left', kind: 'lamp', assetId: 'floorLamp', position: [-1.65, 0, 1.2], rotationY: 0, scale: [0.62, 0.62, 0.62], priority: 'normal' },
  { id: 'far-desk-left', kind: 'workerDesk', assetId: 'workerDesk', position: [-2.65, 0, -4.82], rotationY: Math.PI * 0.98, scale: [0.72, 0.72, 0.72], priority: 'normal' },
  { id: 'far-desk-right', kind: 'workerDesk', assetId: 'workerDesk', position: [-0.9, 0, -4.72], rotationY: Math.PI * 0.98, scale: [0.72, 0.72, 0.72], priority: 'normal' },
  { id: 'far-monitor-left', kind: 'monitor', assetId: 'monitor', position: [-2.65, 0.52, -5.02], rotationY: Math.PI, scale: [0.56, 0.56, 0.56], priority: 'normal' },
  { id: 'far-monitor-right', kind: 'monitor', assetId: 'monitor', position: [-0.9, 0.52, -4.92], rotationY: Math.PI, scale: [0.56, 0.56, 0.56], priority: 'normal' },
  { id: 'garden-plant-a', kind: 'plant', assetId: 'plant', position: [-7.15, 0, -5.15], rotationY: 0.2, scale: [0.68, 0.92, 0.68], priority: 'normal' },
  { id: 'garden-plant-b', kind: 'plant', assetId: 'plant', position: [-6.25, 0, -4.25], rotationY: -0.25, scale: [0.6, 0.82, 0.6], priority: 'normal' },
  { id: 'floor-lamp-right', kind: 'lamp', assetId: 'floorLamp', position: [4.35, 0, 0.2], rotationY: 0, scale: [0.62, 0.62, 0.62], priority: 'showcase' },
];

export function getVideoFrameWorkerSlots() {
  return [...VIDEO_FRAME_SLOTS.workers];
}

export function getVideoFrameAvatarSlots() {
  return [VIDEO_FRAME_SLOTS.commander, ...VIDEO_FRAME_SLOTS.workers];
}

export function getVideoFrameAmbientAvatarSlots() {
  return [...VIDEO_FRAME_AMBIENT_AVATARS];
}

export function getVideoFrameFurnitureSlots(mode: 'low' | 'normal' | 'showcase') {
  if (mode === 'low') return VIDEO_FRAME_FURNITURE.filter((slot) => slot.priority === 'essential');
  if (mode === 'normal') return VIDEO_FRAME_FURNITURE.filter((slot) => slot.priority !== 'showcase');
  return [...VIDEO_FRAME_FURNITURE];
}
