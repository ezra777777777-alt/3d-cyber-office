export type VisualMode = 'low' | 'normal' | 'showcase';

export type FirstScreenVisualRole =
  | 'commander'
  | 'worker-pod'
  | 'task-flow'
  | 'office-shell'
  | 'desk-prop'
  | 'background-decor';

export type FirstScreenProp =
  | 'status-light'
  | 'task-board'
  | 'monitor'
  | 'command-ring'
  | 'delivery-rail'
  | 'random-cube-stack'
  | 'tiny-table-clutter';

export const ART_DIRECTION = {
  palette: {
    background: '#e7f4ff',
    floor: '#7f93a8',
    wall: '#aebfd0',
    commanderAccent: '#ff6b4a',
    workerAccent: '#24c6dc',
    reviewAccent: '#8ad36d',
    warningAccent: '#f2b84b',
    neutralDark: '#273447',
    neutralSoft: '#d8e5ef',
    accentCount: 4,
  },
  material: {
    matteOfficeRoughness: 0.72,
    screenEmissiveIntensity: 0.9,
    statusEmissiveIntensity: 1.35,
    commanderGlowIntensity: 1.65,
  },
  shapeLanguage: {
    commander: 'wide-lobster-command-pod',
    worker: 'rounded-ai-assistant-pod',
    desk: 'clean-low-poly-workstation',
    taskFlow: 'thin-directional-light-lines',
  },
  noiseBudget: {
    low: { deskPropsPerActiveDesk: 0, sceneDecor: 2, microProps: 0 },
    normal: { deskPropsPerActiveDesk: 1, sceneDecor: 5, microProps: 0 },
    showcase: { deskPropsPerActiveDesk: 2, sceneDecor: 8, microProps: 4 },
  },
} as const;

const priorityRanks: Record<FirstScreenVisualRole, number> = {
  commander: 1,
  'worker-pod': 2,
  'task-flow': 3,
  'office-shell': 4,
  'desk-prop': 5,
  'background-decor': 6,
};

const allowedProps: Record<FirstScreenProp, boolean> = {
  'status-light': true,
  'task-board': true,
  monitor: true,
  'command-ring': true,
  'delivery-rail': true,
  'random-cube-stack': false,
  'tiny-table-clutter': false,
};

export function getVisualPriorityRank(role: FirstScreenVisualRole): number {
  return priorityRanks[role];
}

export function isAllowedFirstScreenProp(prop: FirstScreenProp): boolean {
  return allowedProps[prop];
}

export function countFirstScreenNoiseUnits(mode: VisualMode): number {
  const budget = ART_DIRECTION.noiseBudget[mode];
  const activeDeskEstimate = mode === 'showcase' ? 5 : 4;
  return budget.sceneDecor + budget.microProps + budget.deskPropsPerActiveDesk * activeDeskEstimate;
}
