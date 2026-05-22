import { useOfficeStore } from '@/store/officeStore';
import { useUIStore } from '@/store/uiStore';
import { useDashboardStore } from '@/store/dashboardStore';
import { dispatch, createEvent } from '@/core/event-bus';

const TYPE_COLORS: Record<string, string> = {
  meeting: '#b347ea',
  task: '#00f0ff',
  plan: '#00e676',
  review: '#f0a500',
};

export function CalendarView() {
  const getTask = useOfficeStore((s) => s.getTask);
  const selectTask = useUIStore((s) => s.selectTask);
  const selectAgent = useUIStore((s) => s.selectAgent);
  const items = useDashboardStore((s) => s.calendarItems);
  const toggleStage = useDashboardStore((s) => s.toggleStage);
  const markComplete = useDashboardStore((s) => s.markComplete);

  function handleComplete(itemId: string, taskId: string | null, title: string) {
    markComplete(itemId);
    dispatch(
      createEvent('user.action', taskId || null, null, {
        action: 'complete',
        itemId,
        title,
      }),
    );
  }

  function handleStage(itemId: string, taskId: string | null, title: string, stageIdx: number, stageLabel: string) {
    toggleStage(itemId, stageIdx);
    // After toggle, compute new progress from store
    const updated = useDashboardStore.getState().calendarItems.find((i) => i.id === itemId);
    dispatch(
      createEvent('user.action', taskId || null, null, {
        action: 'stage_toggle',
        itemId,
        title,
        stage: stageLabel,
        progress: updated?.progress ?? 0,
      }),
    );
  }

  return (
    <div className="p-6 h-full overflow-y-auto">
      <h2 className="text-lg font-semibold text-cyber-accent mb-4">Calendar / Plan</h2>
      <p className="text-gray-500 text-xs mb-4">
        {new Date().toLocaleDateString('zh-CN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
      </p>

      <div className="space-y-3">
        {items.map((item) => {
          const task = item.taskId ? getTask(item.taskId) : undefined;
          const hasProgress = item.progress !== undefined && item.progress < 1;
          const hasStages = item.stages && item.stages.length > 0;
          const allStagesDone = hasStages && item.stages!.every((s) => s.done);

          return (
            <div
              key={item.id}
              className={`cyber-panel p-3 transition-colors ${
                task ? 'cursor-pointer hover:border-cyber-accent/40' : ''
              } ${item.completed ? 'opacity-60' : ''}`}
              onClick={() => {
                if (task?.assignedAgentId) selectAgent(task.assignedAgentId);
                else if (item.taskId) selectTask(item.taskId);
              }}
            >
              <div className="flex items-start gap-3">
                <div className="text-xs font-mono text-gray-500 w-14 pt-0.5">{item.time}</div>
                <div
                  className="w-1 h-5 rounded-full mt-0.5 flex-shrink-0"
                  style={{ backgroundColor: TYPE_COLORS[item.type] }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-sm ${item.completed ? 'text-gray-500 line-through' : 'text-white'}`}
                    >
                      {item.title}
                    </span>
                    {item.completed && (
                      <span className="text-xs text-cyber-success border border-cyber-success/30 rounded px-1">
                        Done
                      </span>
                    )}
                    {!item.completed && allStagesDone && (
                      <span className="text-xs text-cyber-warning border border-cyber-warning/30 rounded px-1">
                        Stages done
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-500 capitalize">{item.type}</span>
                    {task && <span className="text-xs text-cyber-accent">{task.status}</span>}
                  </div>

                  {/* Progress bar */}
                  {item.progress !== undefined && (
                    <div className="mt-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-500">Progress</span>
                        <span className="text-xs text-gray-400">{Math.round(item.progress * 100)}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-cyber-dark overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${item.progress * 100}%`,
                            backgroundColor: item.completed ? '#00e676' : TYPE_COLORS[item.type],
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Stages */}
                  {hasStages && (
                    <div className="mt-2 space-y-1">
                      {item.stages!.map((stage, si) => (
                        <div
                          key={si}
                          className="flex items-center gap-2 text-xs cursor-pointer hover:text-white transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStage(item.id, item.taskId, item.title, si, stage.label);
                          }}
                        >
                          <span
                            className="w-4 h-4 rounded border flex items-center justify-center flex-shrink-0"
                            style={{
                              borderColor: stage.done ? '#00e676' : '#444466',
                              backgroundColor: stage.done ? '#00e67622' : 'transparent',
                              color: stage.done ? '#00e676' : 'transparent',
                            }}
                          >
                            {stage.done ? '✓' : ''}
                          </span>
                          <span className={stage.done ? 'text-gray-500 line-through' : 'text-gray-400'}>
                            {stage.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Complete button */}
                  {!item.completed && (hasProgress || hasStages) && (
                    <button
                      className="mt-2 cyber-btn text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleComplete(item.id, item.taskId, item.title);
                      }}
                    >
                      Mark Complete
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {items.length === 0 && (
        <div className="text-gray-600 text-sm text-center py-12">No schedule items</div>
      )}
    </div>
  );
}
