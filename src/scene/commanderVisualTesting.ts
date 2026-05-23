import type { Desk, OfficeLayout } from '@/core/types';

export function getCommanderFocalDesk(layout: OfficeLayout): Desk | undefined {
  return layout.desks.find((desk) => desk.isCommander);
}

export function getCommanderWorkerDeskTargets(layout: OfficeLayout): Desk[] {
  return layout.desks.filter((desk) => desk.zone === 'workstation');
}

export function getDistanceBetweenDesks(a: Desk, b: Desk): number {
  const dx = a.position[0] - b.position[0];
  const dz = a.position[2] - b.position[2];
  return Math.sqrt(dx * dx + dz * dz);
}

export function hasCommanderFocalPriority(layout: OfficeLayout): boolean {
  const commander = getCommanderFocalDesk(layout);
  const workers = getCommanderWorkerDeskTargets(layout);
  return Boolean(commander && commander.label.length > 0 && workers.length >= 3);
}
