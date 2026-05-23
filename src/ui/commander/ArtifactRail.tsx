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

  const mission = selectedMissionId ? missions[selectedMissionId] : undefined;

  const relevantIds = mission
    ? mission.taskIds.flatMap((taskId) => mission.tasks[taskId]?.artifactIds ?? [])
    : Object.keys(artifacts);

  const items = relevantIds
    .map((id) => artifacts[id])
    .filter(Boolean);

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
          return (
            <div key={artifact.id} className={`artifact-card ${mission ? 'artifact-card-delivered' : ''}`}>
              <div className="artifact-card-head">
                <strong>{artifact.title}</strong>
                <span className="artifact-kind">{kindLabels[artifact.kind] ?? artifact.kind}</span>
              </div>
              <p>{artifact.summary}</p>
              <small>{artifact.path}</small>
              <div className="artifact-meta">
                <span>{worker?.name ?? artifact.createdByWorkerId}</span>
              </div>
              <button
                className="cyber-btn text-xs mt-2"
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
