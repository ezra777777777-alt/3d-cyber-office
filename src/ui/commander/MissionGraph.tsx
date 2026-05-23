import { buildMissionLanes } from '@/commander/commanderTesting';
import type { CommanderMission } from '@/core/types';
import { useUIStore } from '@/store/uiStore';

const statusLabels: Record<string, string> = {
  planned: '已规划',
  assigned: '已分配',
  running: '运行中',
  waiting_input: '等待输入',
  approval_required: '等待审批',
  blocked: '阻塞',
  failed: '失败',
  completed: '已完成',
};

export function MissionGraph({ mission }: { mission: CommanderMission }) {
  const selectTask = useUIStore((state) => state.selectTask);
  const selectMissionTask = useUIStore((state) => state.selectMissionTask);

  return (
    <section className="commander-section">
      <header className="commander-section-title">
        <span>任务图</span>
        <span className="commander-pill">{mission.title}</span>
      </header>
      <div className="mission-graph mission-graph-linked">
        {buildMissionLanes(mission).map((lane, laneIndex) => (
          <div key={laneIndex} className="mission-lane">
            {lane.map((task) => (
              <button
                key={task.id}
                type="button"
                className={`mission-node mission-node-${task.status}`}
                data-status={task.status}
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
