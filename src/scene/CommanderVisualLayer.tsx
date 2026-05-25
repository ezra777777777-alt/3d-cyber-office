import { buildCommanderVisualState } from '@/commander/commanderVisualState';
import { buildCommanderExperienceState } from '@/commander/commanderExperience';
import { useCommanderStore } from '@/store/commanderStore';
import { useOfficeStore } from '@/store/officeStore';
import { CommanderCommandRing } from './CommanderCommandRing';
import { CommanderStatusBoard } from './CommanderStatusBoard';
import { MissionLinkLines } from './MissionLinkLines';
import { CommanderActivityPulse } from './CommanderActivityPulse';

export function CommanderVisualLayer() {
  const selectedMissionId = useCommanderStore((state) => state.selectedMissionId);
  const missions = useCommanderStore((state) => state.missions);
  const approvals = useCommanderStore((state) => state.approvals);
  const artifacts = useCommanderStore((state) => state.artifacts);
  const workers = useCommanderStore((state) => state.workers);
  const desks = useOfficeStore((state) => state.desks);

  const mission = selectedMissionId ? missions[selectedMissionId] : undefined;
  const visualState = buildCommanderVisualState(mission, approvals, workers);
  const experienceState = buildCommanderExperienceState(mission, approvals, artifacts);
  const commanderDesk = desks.find((desk) => desk.isCommander);
  const workerDesks = desks.filter((desk) => desk.zone === 'workstation');

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
      <CommanderActivityPulse
        stage={experienceState.stage}
        commanderDesk={commanderDesk}
        workerDesks={workerDesks}
        highlightWorkerIds={experienceState.highlightWorkerIds}
        workers={workers}
      />
    </group>
  );
}
