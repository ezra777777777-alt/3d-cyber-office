import type { CommanderMission, WorkerProfile } from '@/core/types';
import { useCommanderStore } from '@/store/commanderStore';

export function WorkerRoster({
  workers,
  mission,
}: {
  workers: WorkerProfile[];
  mission: CommanderMission | undefined;
}) {
  const adapterMode = useCommanderStore((state) => state.adapterMode);

  return (
    <section className="commander-section">
      <header className="commander-section-title">
        <span>Worker 团队</span>
        <span className="commander-pill">{workers.length} 人</span>
      </header>
      <div className="worker-roster">
        {workers.map((worker) => {
          const assignedCount = mission
            ? mission.taskIds.filter((taskId) => mission.tasks[taskId]?.workerId === worker.id).length
            : 0;
          const isBlocked = worker.status === 'blocked';

          return (
            <article key={worker.id} className={`worker-card worker-card-${worker.status}`}>
              <div className="worker-card-head">
                <strong>{worker.name}</strong>
                <span>{worker.status}</span>
              </div>
              <p>{worker.capabilities.join(' / ')}</p>
              <small>{worker.tools.join(' | ')}</small>
              <small>{worker.workspace} · {worker.deskId}</small>
              {worker.runtimeRef && (
                <small className="text-gray-500">Runtime：{worker.runtimeRef}</small>
              )}
              <small className="text-gray-600">
                模式：{adapterMode} · 最后活跃：{new Date(worker.lastSeenAt).toLocaleDateString('zh-CN')}
              </small>
              {isBlocked && (
                <span className="text-xs text-[#ff3366] border border-[#ff3366]/30 rounded px-1.5 py-0.5">
                  等待人工处理
                </span>
              )}
              <b>任务数：{assignedCount}</b>
            </article>
          );
        })}
      </div>
    </section>
  );
}
