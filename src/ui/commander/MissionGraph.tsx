import { buildMissionLanes } from '@/commander/commanderTesting';
import type { CommanderMission } from '@/core/types';
import { useUIStore } from '@/store/uiStore';

const statusLabels: Record<string, string> = {
  planned: 'Planned',
  assigned: 'Assigned',
  running: 'Running',
  waiting_input: 'Needs input',
  approval_required: 'Approval',
  blocked: 'Blocked',
  failed: 'Failed',
  completed: 'Done',
};

export function MissionGraph({ mission }: { mission: CommanderMission }) {
  const selectTask = useUIStore((state) => state.selectTask);
  const selectMissionTask = useUIStore((state) => state.selectMissionTask);

  return (
    <section className="commander-section">
      <header className="commander-section-title">
        <span>{mission.title}</span>
        <span className="commander-pill">{mission.status}</span>
      </header>
      <div className="mission-graph">
        {buildMissionLanes(mission).map((lane, laneIndex) => (
          <div key={laneIndex} className="mission-lane">
            {lane.map((task) => (
              <button
                key={task.id}
                type="button"
                className={`mission-node mission-node-${task.status}`}
                onClick={() => {
                  selectMissionTask(task.id);
                  selectTask(task.officeTaskId);
                }}
              >
                <span className="mission-node-status">{statusLabels[task.status] || task.status}</span>
                <strong>{task.title}</strong>
                <span>{task.summary}</span>
                <small>{task.workerId}</small>
              </button>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
