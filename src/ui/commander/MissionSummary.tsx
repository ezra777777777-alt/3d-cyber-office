import { useCommanderStore } from '@/store/commanderStore';
import { summarizeMission } from '@/commander/commanderTesting';

export function MissionSummary() {
  const selectedMissionId = useCommanderStore((state) => state.selectedMissionId);
  const missions = useCommanderStore((state) => state.missions);
  const approvals = useCommanderStore((state) => state.approvals);
  const artifacts = useCommanderStore((state) => state.artifacts);

  const mission = selectedMissionId ? missions[selectedMissionId] : undefined;
  if (!mission) return null;

  const approvalList = Object.values(approvals).filter(
    (a) => a.missionId === mission.id,
  );
  const deliveredIds = mission.taskIds.flatMap(
    (taskId) => mission.tasks[taskId]?.artifactIds ?? [],
  );

  const summary = summarizeMission(mission, approvalList, deliveredIds);

  return (
    <section className="commander-section">
      <header className="commander-section-title">
        <span>Mission status</span>
        <span className={`commander-pill ${mission.status === 'completed' ? 'commander-pill-done' : ''}`}>
          {mission.status}
        </span>
      </header>
      {mission.summary && <p className="mission-summary-text">{mission.summary}</p>}
      <div className="mission-summary-grid">
        <div className="summary-stat">
          <span className="summary-stat-value">{summary.completedCount}/{summary.taskCount}</span>
          <span className="summary-stat-label">Tasks done</span>
        </div>
        <div className="summary-stat">
          <span className="summary-stat-value">{summary.deliveredArtifactIds.length}</span>
          <span className="summary-stat-label">Artifacts</span>
        </div>
        <div className="summary-stat">
          <span className="summary-stat-value">{summary.pendingApprovalCount}</span>
          <span className="summary-stat-label">Pending approvals</span>
        </div>
        <div className="summary-stat">
          <span className="summary-stat-value">{summary.blockedCount}</span>
          <span className="summary-stat-label">Blocked</span>
        </div>
      </div>
      {mission.constraints.length > 0 && (
        <div className="mission-constraints">
          <small>Constraints:</small>
          {mission.constraints.map((c, i) => (
            <span key={i} className="constraint-tag">{c}</span>
          ))}
        </div>
      )}
    </section>
  );
}
