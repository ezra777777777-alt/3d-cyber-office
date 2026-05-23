import { useCommanderStore } from '@/store/commanderStore';
import { useUIStore } from '@/store/uiStore';
import { CommanderComposer } from './CommanderComposer';
import { MissionGraph } from './MissionGraph';
import { WorkerRoster } from './WorkerRoster';
import { ApprovalInbox } from './ApprovalInbox';
import { ArtifactRail } from './ArtifactRail';
import { MissionSummary } from './MissionSummary';

export function CommanderDock() {
  const commanderOpen = useUIStore((state) => state.commanderOpen);
  const setCommanderOpen = useUIStore((state) => state.setCommanderOpen);
  const selectedMissionId = useCommanderStore((state) => state.selectedMissionId);
  const mission = useCommanderStore((state) =>
    selectedMissionId ? state.missions[selectedMissionId] : undefined,
  );
  const workers = useCommanderStore((state) => state.workers);

  return (
    <aside className={`commander-dock ${commanderOpen ? 'is-open' : 'is-collapsed'}`}>
      <button
        type="button"
        className="commander-toggle"
        onClick={() => setCommanderOpen(!commanderOpen)}
      >
        {commanderOpen ? 'Hide Commander' : 'Commander'}
      </button>
      {commanderOpen && (
        <div className="commander-scroll">
          <CommanderComposer />
          {mission && (
            <>
              <MissionSummary />
              <ApprovalInbox />
              <MissionGraph mission={mission} />
              <ArtifactRail />
            </>
          )}
          <WorkerRoster workers={workers} mission={mission} />
        </div>
      )}
    </aside>
  );
}
