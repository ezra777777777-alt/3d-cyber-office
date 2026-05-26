import type { CameraPreset } from './firstScreenFidelity';

export type VideoGradePriority = 'essential' | 'normal' | 'showcase';
export type VideoGradeFurnitureKind =
  | 'commanderDesk'
  | 'workerDesk'
  | 'chair'
  | 'monitor'
  | 'plant'
  | 'lamp'
  | 'lounge'
  | 'panel'
  | 'water'
  | 'platform'
  | 'statusBoard';

export interface VideoGradeFurnitureSlot {
  id: string;
  kind: VideoGradeFurnitureKind;
  assetId?: string;
  position: [number, number, number];
  rotationY: number;
  scale: [number, number, number];
  priority: VideoGradePriority;
}

export interface VideoGradeCharacterSlot {
  id: string;
  deskId: string;
  role: 'commander' | 'worker';
  priority: VideoGradePriority;
  position: [number, number, number];
  rotationY: number;
  scale: number;
}

export const VIDEO_GRADE_PALETTE = {
  background: '#07111f',
  shellPanel: '#090f18',
  platform: '#f3efe6',
  platformEdge: '#b59461',
  floor: '#d8bd8b',
  floorLine: '#a98756',
  greenWall: '#173829',
  wallTrim: '#f1ead9',
  boardBlue: '#1f5f86',
  water: '#72d7ea',
  waterDark: '#2192aa',
  chair: '#11151d',
  workerHead: '#8a684f',
  workerBody: '#202833',
  workerArm: '#171f29',
  commanderRed: '#e85f46',
  commanderDarkRed: '#8f3028',
  statusCyan: '#25d9ff',
  statusAmber: '#f2b85f',
  statusGreen: '#65ef9a',
  statusRed: '#ff4f6d',
  statusMagenta: '#ff83d1',
} as const;

export const VIDEO_GRADE_CAMERA: CameraPreset = {
  id: 'video-grade-v2-main-camera',
  position: [9.2, 7.2, 11.4],
  target: [0.15, 0.72, -2.95],
  durationMs: 1100,
  fov: 37,
  minDistance: 5.4,
  maxDistance: 19,
};

export const VIDEO_GRADE_PLATFORM = {
  width: 20.4,
  depth: 14.8,
  floorWidth: 14.6,
  floorDepth: 10.8,
  rearWallWidth: 9.4,
  rearWallHeight: 2.56,
  hasCeiling: false,
} as const;

export const VIDEO_GRADE_SAFE_ZONES = {
  desktopCenterClearRatio: 0.62,
  mobileRightPanelDefaultCollapsed: true,
  leftRailWidthPx: 56,
  rightPanelMaxWidthPx: 316,
  bottomBarMaxWidthPx: 380,
} as const;

export const VIDEO_GRADE_CHARACTER_RULES = {
  minHeight: 0.58,
  maxHeight: 0.82,
  seatedOnly: true,
  roundCapsuleBodyAllowed: false,
  faceEyesAllowed: false,
  groundGlowAllowed: false,
  realisticAnimalBodyAllowed: false,
} as const;

export const VIDEO_GRADE_DENSITY = {
  low: { maxFurniture: 10, maxCharacters: 5 },
  normal: { maxFurniture: 24, maxCharacters: 9 },
  showcase: { maxFurniture: 32, maxCharacters: 10 },
} as const;

export const VIDEO_GRADE_CHARACTER_SLOTS: VideoGradeCharacterSlot[] = [
  { id: 'commander', deskId: 'desk-commander', role: 'commander', priority: 'essential', position: [3.15, 0, -4.18], rotationY: Math.PI, scale: 1 },
  { id: 'worker-left-front', deskId: 'desk-a2', role: 'worker', priority: 'essential', position: [-3.65, 0, -1.08], rotationY: -0.28, scale: 1 },
  { id: 'worker-mid-front', deskId: 'desk-b1', role: 'worker', priority: 'essential', position: [-1.08, 0, -0.72], rotationY: -0.05, scale: 1 },
  { id: 'worker-right-front', deskId: 'desk-b2', role: 'worker', priority: 'essential', position: [2.44, 0, -1.18], rotationY: 0.22, scale: 1 },
  { id: 'worker-right-back', deskId: 'desk-done', role: 'worker', priority: 'essential', position: [5.18, 0, -3.12], rotationY: 0.58, scale: 0.92 },
  { id: 'ambient-left-rear', deskId: 'ambient-left-rear', role: 'worker', priority: 'normal', position: [-3.0, 0, -4.52], rotationY: Math.PI, scale: 0.72 },
  { id: 'ambient-mid-rear', deskId: 'ambient-mid-rear', role: 'worker', priority: 'normal', position: [-1.08, 0, -4.42], rotationY: Math.PI, scale: 0.7 },
  { id: 'ambient-right-side', deskId: 'ambient-right-side', role: 'worker', priority: 'normal', position: [5.72, 0, -3.8], rotationY: 0.66, scale: 0.72 },
];

export const VIDEO_GRADE_FURNITURE_SLOTS: VideoGradeFurnitureSlot[] = [
  { id: 'commander-desk', kind: 'commanderDesk', assetId: 'mainDesk', position: [3.15, 0, -4.88], rotationY: Math.PI, scale: [1.36, 1.36, 1.36], priority: 'essential' },
  { id: 'commander-monitor', kind: 'monitor', assetId: 'monitor', position: [3.15, 0.76, -5.26], rotationY: Math.PI, scale: [0.98, 0.98, 0.98], priority: 'essential' },
  { id: 'commander-status-board', kind: 'statusBoard', position: [4.18, 1.08, -5.12], rotationY: Math.PI * 0.92, scale: [1, 1, 1], priority: 'normal' },
  { id: 'desk-left-front', kind: 'workerDesk', assetId: 'workerDesk', position: [-3.65, 0, -1.82], rotationY: -0.28, scale: [1.04, 1.04, 1.04], priority: 'essential' },
  { id: 'desk-mid-front', kind: 'workerDesk', assetId: 'workerDesk', position: [-1.08, 0, -1.42], rotationY: -0.05, scale: [1.04, 1.04, 1.04], priority: 'essential' },
  { id: 'desk-right-front', kind: 'workerDesk', assetId: 'workerDesk', position: [2.44, 0, -1.9], rotationY: 0.22, scale: [1.04, 1.04, 1.04], priority: 'essential' },
  { id: 'desk-right-back', kind: 'workerDesk', assetId: 'workerDesk', position: [5.18, 0, -3.75], rotationY: 0.58, scale: [0.94, 0.94, 0.94], priority: 'essential' },
  { id: 'monitor-left-front', kind: 'monitor', assetId: 'monitor', position: [-3.65, 0.72, -2.14], rotationY: -0.28, scale: [0.82, 0.82, 0.82], priority: 'normal' },
  { id: 'monitor-mid-front', kind: 'monitor', assetId: 'monitor', position: [-1.08, 0.72, -1.74], rotationY: -0.05, scale: [0.82, 0.82, 0.82], priority: 'normal' },
  { id: 'monitor-right-front', kind: 'monitor', assetId: 'monitor', position: [2.44, 0.72, -2.22], rotationY: 0.22, scale: [0.82, 0.82, 0.82], priority: 'normal' },
  { id: 'far-desk-left', kind: 'workerDesk', assetId: 'workerDesk', position: [-3.0, 0, -4.98], rotationY: Math.PI, scale: [0.72, 0.72, 0.72], priority: 'normal' },
  { id: 'far-desk-mid', kind: 'workerDesk', assetId: 'workerDesk', position: [-1.08, 0, -4.88], rotationY: Math.PI, scale: [0.72, 0.72, 0.72], priority: 'normal' },
  { id: 'far-monitor-left', kind: 'monitor', assetId: 'monitor', position: [-3.0, 0.52, -5.18], rotationY: Math.PI, scale: [0.56, 0.56, 0.56], priority: 'normal' },
  { id: 'far-monitor-mid', kind: 'monitor', assetId: 'monitor', position: [-1.08, 0.52, -5.08], rotationY: Math.PI, scale: [0.56, 0.56, 0.56], priority: 'normal' },
  { id: 'plant-left-water', kind: 'plant', assetId: 'plant', position: [-7.4, 0, -5.25], rotationY: 0.2, scale: [0.72, 0.94, 0.72], priority: 'normal' },
  { id: 'plant-right-wall', kind: 'plant', assetId: 'plant', position: [6.5, 0, -4.35], rotationY: -0.1, scale: [0.74, 0.98, 0.74], priority: 'normal' },
  { id: 'floor-lamp-left', kind: 'lamp', assetId: 'floorLamp', position: [-1.8, 0, 1.16], rotationY: 0, scale: [0.62, 0.62, 0.62], priority: 'normal' },
  { id: 'lounge-table', kind: 'lounge', assetId: 'coffeeTable', position: [0.2, 0, 1.52], rotationY: 0.08, scale: [0.76, 0.76, 0.76], priority: 'showcase' },
  { id: 'floor-lamp-right', kind: 'lamp', assetId: 'floorLamp', position: [4.5, 0, 0.24], rotationY: 0, scale: [0.62, 0.62, 0.62], priority: 'showcase' },
];

export function getVideoGradeFurnitureSlots(mode: 'low' | 'normal' | 'showcase') {
  if (mode === 'low') return VIDEO_GRADE_FURNITURE_SLOTS.filter((slot) => slot.priority === 'essential');
  if (mode === 'normal') return VIDEO_GRADE_FURNITURE_SLOTS.filter((slot) => slot.priority !== 'showcase');
  return [...VIDEO_GRADE_FURNITURE_SLOTS];
}

export function getVideoGradeCharacterSlots(mode: 'low' | 'normal' | 'showcase' = 'normal') {
  if (mode === 'low') return VIDEO_GRADE_CHARACTER_SLOTS.filter((slot) => slot.priority === 'essential');
  if (mode === 'normal') return VIDEO_GRADE_CHARACTER_SLOTS.filter((slot) => slot.priority !== 'showcase');
  return [...VIDEO_GRADE_CHARACTER_SLOTS];
}
