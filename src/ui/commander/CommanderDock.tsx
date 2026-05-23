import { useCommanderStore } from '@/store/commanderStore';
import { useUIStore } from '@/store/uiStore';
import { buildCommanderVisualState } from '@/commander/commanderVisualState';
import { CommanderComposer } from './CommanderComposer';
import { RealModeNotice } from './RealModeNotice';
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
  const approvals = useCommanderStore((state) => state.approvals);

  const visualState = buildCommanderVisualState(mission, approvals, workers);

  return (
    <aside className={`commander-dock commander-tone-${visualState.tone} ${commanderOpen ? 'is-open' : 'is-collapsed'}`}>
      <button
        type="button"
        className="commander-toggle"
        onClick={() => setCommanderOpen(!commanderOpen)}
      >
        {commanderOpen ? '收起 Commander' : '龙虾 Commander'}
      </button>
      {commanderOpen && (
        <div className="commander-scroll">
          <div className="commander-hero">
            <div>
              <span className="commander-hero-kicker">任务指挥中心</span>
              <h2>龙虾 Commander</h2>
            </div>
            <span className="commander-hero-status">{visualState.missionTitle}</span>
          </div>
          <CommanderComposer />
          <RealModeNotice />
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
