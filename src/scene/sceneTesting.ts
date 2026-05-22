import type { Desk, OfficeLayout, SceneZone } from '@/core/types';

export function getNamedSceneZones(layout: OfficeLayout): SceneZone[] {
  return layout.zones;
}

export function getCommanderDesk(layout: OfficeLayout): Desk | undefined {
  return layout.desks.find((desk) => desk.isCommander);
}

export function countSemanticOfficeLandmarks(layout: OfficeLayout): number {
  return layout.zones.length + layout.desks.filter((desk) => desk.zone !== 'pending' && desk.zone !== 'completed').length;
}
