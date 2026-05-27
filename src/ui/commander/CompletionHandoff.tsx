import { useCommanderStore } from '@/store/commanderStore';
import { useUIStore } from '@/store/uiStore';
import { getCompletionHandoffActions } from './completionHandoffTesting';

export function CompletionHandoff() {
  const selectedMissionId = useCommanderStore((state) => state.selectedMissionId);
  const mission = useCommanderStore((state) =>
    selectedMissionId ? state.missions[selectedMissionId] : null,
  );
  const artifacts = useCommanderStore((state) => state.artifacts);
  const setActiveModule = useUIStore((state) => state.setActiveModule);

  const artifactCount = mission
    ? Object.values(artifacts).filter((artifact) => artifact.missionId === mission.id).length
    : 0;
  const completed = Boolean(
    mission?.status === 'completed'
      || (mission && mission.taskIds.length > 0 && mission.taskIds.every((taskId) => mission.tasks[taskId]?.status === 'completed')),
  );
  const actions = getCompletionHandoffActions({ completed, artifactCount });

  if (actions.length === 0) return null;

  return (
    <section className="commander-section completion-handoff">
      <header className="commander-section-title">
        <span>下一步</span>
        <span className="commander-pill">任务已收口</span>
      </header>
      <p>这轮任务已经完成。你可以检查产物、回放过程，或者继续安排下一轮。</p>
      <div className="completion-handoff-actions">
        {actions.map((action) => (
          <button key={action.id} type="button" className="workbench-chip" onClick={() => setActiveModule(action.moduleId)}>
            {action.label}
          </button>
        ))}
      </div>
    </section>
  );
}
