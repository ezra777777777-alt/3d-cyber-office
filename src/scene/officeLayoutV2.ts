export type LayoutAnchorKind =
  | 'commander'
  | 'worker'
  | 'delivery'
  | 'review'
  | 'gateway'
  | 'rest'
  | 'background';

export interface LayoutAnchor {
  id: string;
  kind: LayoutAnchorKind;
  label: string;
  position: [number, number, number];
  rotationY: number;
  priority: number;
}

export const OFFICE_LAYOUT_V2 = {
  camera: {
    defaultPosition: [6.2, 6.4, 8.8] as [number, number, number],
    defaultTarget: [0, 0.85, -2.4] as [number, number, number],
    minDistance: 5.5,
    maxDistance: 18,
    firstScreenMustInclude: [
      'commander-stage',
      'worker-research',
      'worker-build',
      'worker-review',
    ],
  },
  anchors: [
    {
      id: 'commander-stage',
      kind: 'commander' as const,
      label: '龙虾指挥台',
      position: [0, 0, -4.25] as [number, number, number],
      rotationY: 0,
      priority: 1,
    },
    {
      id: 'worker-research',
      kind: 'worker' as const,
      label: '研究 Worker',
      position: [-3.25, 0, -1.55] as [number, number, number],
      rotationY: -0.28,
      priority: 2,
    },
    {
      id: 'worker-build',
      kind: 'worker' as const,
      label: '构建 Worker',
      position: [0, 0, -1.05] as [number, number, number],
      rotationY: 0,
      priority: 2,
    },
    {
      id: 'worker-review',
      kind: 'worker' as const,
      label: '复核 Worker',
      position: [3.25, 0, -1.55] as [number, number, number],
      rotationY: 0.28,
      priority: 2,
    },
    {
      id: 'delivery-rail',
      kind: 'delivery' as const,
      label: '交付轨道',
      position: [5.95, 0, 2.9] as [number, number, number],
      rotationY: -0.38,
      priority: 4,
    },
    {
      id: 'review-wall',
      kind: 'review' as const,
      label: '复盘墙',
      position: [-5.95, 0, 2.9] as [number, number, number],
      rotationY: 0.38,
      priority: 4,
    },
    {
      id: 'gateway-console',
      kind: 'gateway' as const,
      label: '网关监控',
      position: [-7.15, 0, -1.1] as [number, number, number],
      rotationY: 1.12,
      priority: 5,
    },
    {
      id: 'rest-corner',
      kind: 'rest' as const,
      label: '休息角',
      position: [7.1, 0, -0.9] as [number, number, number],
      rotationY: -1.05,
      priority: 5,
    },
  ] satisfies LayoutAnchor[],
} as const;

export function getCommanderAnchor(): LayoutAnchor {
  return OFFICE_LAYOUT_V2.anchors.find((anchor) => anchor.kind === 'commander')!;
}

export function getCoreWorkerAnchors(): LayoutAnchor[] {
  return OFFICE_LAYOUT_V2.anchors.filter((anchor) => anchor.kind === 'worker');
}

export function getPeripheralZoneAnchors(): LayoutAnchor[] {
  return OFFICE_LAYOUT_V2.anchors.filter((anchor) => anchor.priority >= 4);
}

export function isWorkerArcFacingCommander(workers: LayoutAnchor[], commander: LayoutAnchor): boolean {
  if (workers.length < 3) return false;
  const xPositions = workers.map((worker) => worker.position[0]);
  const zPositions = workers.map((worker) => worker.position[2]);
  const hasLeftCenterRight = Math.min(...xPositions) < -2 && Math.max(...xPositions) > 2;
  const workersInFrontOfCommander = zPositions.every((z) => z > commander.position[2]);
  const centerWorkerClosestToViewer = workers.some((worker) => Math.abs(worker.position[0]) < 0.5 && worker.position[2] > -1.4);
  return hasLeftCenterRight && workersInFrontOfCommander && centerWorkerClosestToViewer;
}
