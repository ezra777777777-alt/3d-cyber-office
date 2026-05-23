import { buildCommanderVisualState } from '@/commander/commanderVisualState';
import { useCommanderStore } from '@/store/commanderStore';
import { useOfficeStore } from '@/store/officeStore';
import { CommanderCommandRing } from './CommanderCommandRing';
import { CommanderStatusBoard } from './CommanderStatusBoard';
import { MissionLinkLines } from './MissionLinkLines';

export function CommanderVisualLayer() {
  const selectedMissionId = useCommanderStore((state) => state.selectedMissionId);
  const missions = useCommanderStore((state) => state.missions);
  const approvals = useCommanderStore((state) => state.approvals);
  const workers = useCommanderStore((state) => state.workers);
  const desks = useOfficeStore((state) => state.desks);

  const mission = selectedMissionId ? missions[selectedMissionId] : undefined;
  const visualState = buildCommanderVisualState(mission, approvals, workers);
  const commanderDesk = desks.find((desk) => desk.isCommander);

  if (!commanderDesk) return null;

  return (
    <group>
      <CommanderCommandRing
        tone={visualState.tone}
        activeTasks={visualState.activeTasks}
        pendingApprovals={visualState.pendingApprovals}
      />
      <CommanderStatusBoard state={visualState} />
      <MissionLinkLines commanderDesk={commanderDesk} desks={desks} links={visualState.linkTargets} />
    </group>
  );
}
