import { useDashboardStore } from '@/store/dashboardStore';
import { useOfficeStore } from '@/store/officeStore';
import { useUIStore } from '@/store/uiStore';
import { filterWorkbenchTasks } from './workbenchTesting';
import { SourceBadge, WorkbenchHeader } from './WorkbenchHeader';

const STATUS_FILTERS = ['all', 'today', 'todo', 'running', 'blocked', 'completed'] as const;
const SOURCE_FILTERS = ['all', 'demo', 'local', 'runtime', 'cron', 'google_tasks'] as const;

export function TasksView() {
  const tasks = useDashboardStore((state) => state.workbenchTasks);
  const statusFilter = useDashboardStore((state) => state.taskStatusFilter);
  const sourceFilter = useDashboardStore((state) => state.taskSourceFilter);
  const setStatusFilter = useDashboardStore((state) => state.setTaskStatusFilter);
  const setSourceFilter = useDashboardStore((state) => state.setTaskSourceFilter);
  const selectTask = useUIStore((state) => state.selectTask);
  const selectAgent = useUIStore((state) => state.selectAgent);
  const getTask = useOfficeStore((state) => state.getTask);
  const filtered = filterWorkbenchTasks(tasks, statusFilter, sourceFilter);

  return (
    <div className="workbench-page">
      <WorkbenchHeader title="Tasks" subtitle="External lists and office tasks share one workbench view." />
      <div className="workbench-filter-row">
        {STATUS_FILTERS.map((filter) => (
          <button key={filter} className={statusFilter === filter ? 'cyber-btn text-xs' : 'workbench-chip'} onClick={() => setStatusFilter(filter)}>
            {filter}
          </button>
        ))}
      </div>
      <div className="workbench-filter-row">
        {SOURCE_FILTERS.map((filter) => (
          <button key={filter} className={sourceFilter === filter ? 'cyber-btn text-xs' : 'workbench-chip'} onClick={() => setSourceFilter(filter)}>
            {filter.replace('_', ' ')}
          </button>
        ))}
      </div>
      <div className="grid gap-3">
        {filtered.map((task) => {
          const officeTask = task.officeTaskId ? getTask(task.officeTaskId) : undefined;
          return (
            <article key={task.id} className="cyber-panel p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h3 className="text-sm font-medium text-white">{task.title}</h3>
                  <p className="mt-1 text-xs text-gray-500">{task.summary}</p>
                </div>
                <SourceBadge source={task.source} />
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-gray-400">
                <span>{task.status}</span>
                <span>{task.priority}</span>
                <span>{task.dueLabel}</span>
                {officeTask ? <button className="cyber-btn text-xs" onClick={() => selectTask(officeTask.id)}>Task detail</button> : null}
                {task.agentId ? <button className="cyber-btn text-xs" onClick={() => selectAgent(task.agentId!)}>Agent</button> : null}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
