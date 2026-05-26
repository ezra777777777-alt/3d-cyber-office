import { useCommanderStore } from '@/store/commanderStore';
import { useUIStore } from '@/store/uiStore';
import { useDashboardStore } from '@/store/dashboardStore';

const kindLabels: Record<string, string> = {
  notes: '笔记',
  patch: '补丁',
  review: '审查',
  report: '报告',
};

export function ArtifactRail() {
  const artifacts = useCommanderStore((state) => state.artifacts);
  const selectedMissionId = useCommanderStore((state) => state.selectedMissionId);
  const missions = useCommanderStore((state) => state.missions);
  const workers = useCommanderStore((state) => state.workers);
  const approvals = useCommanderStore((state) => state.approvals);

  const mission = selectedMissionId ? missions[selectedMissionId] : undefined;
  const relevantIds = mission
    ? mission.taskIds.flatMap((taskId) => mission.tasks[taskId]?.artifactIds ?? [])
    : Object.keys(artifacts);
  const items = relevantIds.map((id) => artifacts[id]).filter(Boolean);

  if (items.length === 0) return null;

  return (
    <section className="commander-section">
      <header className="commander-section-title">
        <span>产物</span>
        <span className="commander-pill">{items.length} 项</span>
      </header>
      <div className="artifact-rail">
        {items.map((artifact) => {
          const worker = workers.find((w) => w.id === artifact.createdByWorkerId);
          const task = mission?.tasks[artifact.taskId];
          const linkedApproval = task?.approvalId ? approvals[task.approvalId] : undefined;
          const approvalLabel = linkedApproval
            ? linkedApproval.status === 'approved'
              ? '已批准'
              : linkedApproval.status === 'rejected'
                ? '已拒绝'
                : '待审批'
            : null;
          return (
            <div key={artifact.id} className={`artifact-card ${mission ? 'artifact-card-delivered' : ''}`}>
              <div className="artifact-card-head">
                <strong>{artifact.title}</strong>
                <span className="artifact-kind">{kindLabels[artifact.kind] ?? artifact.kind}</span>
              </div>
              <p>{artifact.summary}</p>
              {artifact.workspaceBacked && <small>{artifact.path}</small>}
              <div className="artifact-meta">
                <span>{worker?.name ?? artifact.createdByWorkerId}</span>
                {task && <span className="artifact-task-source">任务：{task.title}</span>}
                <span>{artifact.previewable ? '可预览' : '仅路径'}</span>
                {approvalLabel && (
                  <span className={`artifact-approval-label artifact-approval-${linkedApproval!.status}`}>
                    {approvalLabel}
                  </span>
                )}
                <span className="artifact-delivered-label">
                  {artifact.workspaceBacked ? 'Runtime 文件' : 'Commander 产物'}
                </span>
              </div>
              <button
                className="cyber-btn mt-2 text-xs"
                onClick={() => {
                  useUIStore.getState().setActiveModule('files');
                  useDashboardStore.getState().setSelectedArtifactId(artifact.id);
                }}
              >
                查看文件
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
