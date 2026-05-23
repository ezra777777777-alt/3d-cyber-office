import type { CommanderMission, WorkerProfile } from '@/core/types';

export function WorkerRoster({
  workers,
  mission,
}: {
  workers: WorkerProfile[];
  mission: CommanderMission | undefined;
}) {
  return (
    <section className="commander-section">
      <header className="commander-section-title">
        <span>Worker registry</span>
        <span className="commander-pill">{workers.length} profiles</span>
      </header>
      <div className="worker-roster">
        {workers.map((worker) => {
          const assignedCount = mission
            ? mission.taskIds.filter((taskId) => mission.tasks[taskId]?.workerId === worker.id).length
            : 0;

          return (
            <article key={worker.id} className="worker-card">
              <div className="worker-card-head">
                <strong>{worker.name}</strong>
                <span>{worker.status}</span>
              </div>
              <p>{worker.capabilities.join(' / ')}</p>
              <small>{worker.tools.join(' | ')}</small>
              <b>{assignedCount} mission tasks</b>
            </article>
          );
        })}
      </div>
    </section>
  );
}
