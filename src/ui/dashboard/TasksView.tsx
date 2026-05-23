import { useMemo, useState } from 'react';
import { useDashboardStore } from '@/store/dashboardStore';
import { useOfficeStore } from '@/store/officeStore';
import { useUIStore } from '@/store/uiStore';
import { filterWorkbenchTasks } from './workbenchTesting';
import { orderWorkbenchTasks } from './workbenchProjection';
import { nextActionForStatus } from './workbenchCopy';
import { SourceBadge, WorkbenchHeader } from './WorkbenchHeader';

const STATUS_FILTERS = [
  { key: 'all', label: '全部' },
  { key: 'today', label: '今日' },
  { key: 'todo', label: '计划' },
  { key: 'running', label: '进行中' },
  { key: 'blocked', label: '阻塞' },
  { key: 'completed', label: '已完成' },
] as const;

const SOURCE_FILTERS = [
  { key: 'all', label: '全部来源' },
  { key: 'demo', label: '演示' },
  { key: 'local', label: '本地' },
  { key: 'runtime', label: '运行时' },
  { key: 'cron', label: '定时' },
  { key: 'google_tasks', label: 'Google Tasks' },
] as const;

export function TasksView() {
  const tasks = useDashboardStore((state) => state.workbenchTasks);
  const statusFilter = useDashboardStore((state) => state.taskStatusFilter);
  const sourceFilter = useDashboardStore((state) => state.taskSourceFilter);
  const setStatusFilter = useDashboardStore((state) => state.setTaskStatusFilter);
  const setSourceFilter = useDashboardStore((state) => state.setTaskSourceFilter);
  const selectTask = useUIStore((state) => state.selectTask);
  const selectAgent = useUIStore((state) => state.selectAgent);
  const getTask = useOfficeStore((state) => state.getTask);
  const taskDependencyExpanded = useDashboardStore((state) => state.taskDependencyExpanded);
  const setTaskDependencyExpanded = useDashboardStore((state) => state.setTaskDependencyExpanded);
  const [showCompleted, setShowCompleted] = useState(false);

  const ordered = useMemo(() => {
    const filtered = filterWorkbenchTasks(tasks, statusFilter, sourceFilter);
    return orderWorkbenchTasks(filtered);
  }, [tasks, statusFilter, sourceFilter]);

  const activeTasks = useMemo(() => ordered.filter((t) => t.status !== 'completed'), [ordered]);
  const completedTasks = useMemo(() => ordered.filter((t) => t.status === 'completed'), [ordered]);

  const displayed = showCompleted ? ordered : activeTasks;

  return (
    <div className="workbench-page">
      <WorkbenchHeader title="任务台" subtitle="追踪任务状态、依赖、阻塞和来源。" />
      <div className="workbench-filter-row">
        {STATUS_FILTERS.map(({ key, label }) => (
          <button
            key={key}
            className={statusFilter === key ? 'cyber-btn text-xs' : 'workbench-chip'}
            onClick={() => setStatusFilter(key as typeof statusFilter)}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="workbench-filter-row">
        {SOURCE_FILTERS.map(({ key, label }) => (
          <button
            key={key}
            className={sourceFilter === key ? 'cyber-btn text-xs' : 'workbench-chip'}
            onClick={() => setSourceFilter(key as typeof sourceFilter)}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="grid gap-3">
        {displayed.map((task) => {
          const officeTask = task.officeTaskId ? getTask(task.officeTaskId) : undefined;
          const isBlocked = task.status === 'blocked';
          const nextAction = nextActionForStatus(task.status);

          return (
            <article
              key={task.id}
              className={`cyber-panel p-4 ${isBlocked ? 'border-red-500/40' : ''}`}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h3 className="text-sm font-medium text-white">{task.title}</h3>
                  <p className="mt-1 text-xs text-gray-500">{task.summary}</p>
                </div>
                <SourceBadge source={task.source} />
              </div>

              {task.dependencyIds && task.dependencyIds.length > 0 && (
                <div className="mt-2">
                  {taskDependencyExpanded[task.id] ? (
                    <div className="flex flex-wrap items-center gap-1">
                      {task.dependencyIds.map((depId) => (
                        <span key={depId} className="text-[11px] px-2 py-0.5 rounded border border-cyber-border text-gray-400">
                          依赖 {depId}
                        </span>
                      ))}
                      <button
                        className="text-[10px] text-gray-500 hover:text-gray-300 ml-1"
                        onClick={() => setTaskDependencyExpanded(task.id, false)}
                      >
                        收起
                      </button>
                    </div>
                  ) : (
                    <button
                      className="text-[11px] px-2 py-0.5 rounded border border-cyber-border text-gray-400 hover:text-white"
                      onClick={() => setTaskDependencyExpanded(task.id, true)}
                    >
                      依赖 ({task.dependencyIds.length})
                    </button>
                  )}
                </div>
              )}

              {isBlocked && (
                <p className="mt-2 text-xs text-amber-300">{nextAction}</p>
              )}

              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-gray-400">
                <span>{task.status}</span>
                <span>{task.priority}</span>
                <span>{task.dueLabel}</span>
                {officeTask ? (
                  <button className="cyber-btn text-xs" onClick={() => selectTask(officeTask.id)}>
                    任务详情
                  </button>
                ) : null}
                {task.agentId ? (
                  <button className="cyber-btn text-xs" onClick={() => selectAgent(task.agentId!)}>
                    Agent
                  </button>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>

      {completedTasks.length > 0 && (
        <div className="mt-4">
          <button
            className="cyber-btn text-xs"
            onClick={() => setShowCompleted(!showCompleted)}
          >
            {showCompleted ? '折叠' : '展开'} 已完成 ({completedTasks.length})
          </button>
          {!showCompleted && (
            <span className="ml-2 text-xs text-gray-600">
              隐藏了 {completedTasks.length} 项已完成任务
            </span>
          )}
        </div>
      )}

      {ordered.length === 0 && (
        <div className="text-gray-600 text-sm text-center py-12">暂无匹配任务</div>
      )}
    </div>
  );
}
