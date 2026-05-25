import { useCommanderStore } from '@/store/commanderStore';
import { summarizeMission } from '@/commander/commanderTesting';
import { buildCommanderExperienceState } from '@/commander/commanderExperience';

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
  const experience = buildCommanderExperienceState(mission, approvals, artifacts);

  const statusLabels: Record<string, string> = {
    draft: '草稿',
    planned: '已规划',
    running: '执行中',
    waiting_input: '等待输入',
    approval_required: '等待审批',
    blocked: '阻塞',
    completed: '已完成',
  };

  return (
    <section className="commander-section">
      <header className="commander-section-title">
        <span>任务总结</span>
        <span className={`commander-pill ${mission.status === 'completed' ? 'commander-pill-done' : ''}`}>
          {statusLabels[mission.status] ?? mission.status}
        </span>
      </header>
      <p className="mission-summary-text">
        {experience.nextAction}
      </p>
      <div className="mission-summary-grid">
        <div className="summary-stat">
          <span className="summary-stat-value">{summary.completedCount}/{summary.taskCount}</span>
          <span className="summary-stat-label">任务完成</span>
        </div>
        <div className="summary-stat">
          <span className="summary-stat-value">{summary.deliveredArtifactIds.length}</span>
          <span className="summary-stat-label">产物</span>
        </div>
        <div className="summary-stat">
          <span className="summary-stat-value">{summary.pendingApprovalCount}</span>
          <span className="summary-stat-label">待审批</span>
        </div>
        <div className="summary-stat">
          <span className="summary-stat-value">{summary.blockedCount}</span>
          <span className="summary-stat-label">阻塞</span>
        </div>
      </div>
      {mission.constraints.length > 0 && (
        <div className="mission-constraints">
          <small>约束：</small>
          {mission.constraints.map((c, i) => (
            <span key={i} className="constraint-tag">{c}</span>
          ))}
        </div>
      )}
    </section>
  );
}
