import { useState, useMemo } from 'react';
import { demoCronJobs } from '@/data/demoSchedules';
import { useOfficeStore } from '@/store/officeStore';
import { useUIStore } from '@/store/uiStore';
import { filterCronJobs } from './workbenchTesting';
import type { CronJob } from '@/core/types';
import { WorkbenchHeader } from './WorkbenchHeader';

const RESULT_COLORS: Record<string, string> = {
  success: '#00e676',
  failed: '#ff3366',
  running: '#00f0ff',
  pending: '#8888aa',
};

const RESULT_FILTERS = ['all', 'success', 'failed', 'running', 'pending'] as const;

export function CronJobsView() {
  const [resultFilter, setResultFilter] = useState<CronJob['lastResult'] | 'all'>('all');
  const getAgent = useOfficeStore((s) => s.getAgent);
  const getTask = useOfficeStore((s) => s.getTask);
  const selectAgent = useUIStore((s) => s.selectAgent);
  const selectTask = useUIStore((s) => s.selectTask);

  const filtered = useMemo(() => filterCronJobs(demoCronJobs, resultFilter), [resultFilter]);

  return (
    <div className="workbench-page">
      <WorkbenchHeader title="Cron Jobs" subtitle="Scheduled jobs with run history and office task links." />

      <div className="workbench-filter-row">
        {RESULT_FILTERS.map((f) => (
          <button
            key={f}
            className={resultFilter === f ? 'cyber-btn text-xs' : 'workbench-chip'}
            onClick={() => setResultFilter(f)}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="grid gap-3">
        {filtered.map((job) => {
          const agent = job.agentId ? getAgent(job.agentId) : undefined;
          const linkedTask = job.linkedTaskId ? getTask(job.linkedTaskId) : undefined;
          return (
            <div key={job.id} className="cyber-panel p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-medium text-white">{job.name}</h3>
                  {!job.enabled && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded border border-gray-700 text-gray-500">Disabled</span>
                  )}
                </div>
                <span
                  className="text-xs px-2 py-0.5 rounded border"
                  style={{ color: RESULT_COLORS[job.lastResult], borderColor: RESULT_COLORS[job.lastResult] + '44' }}
                >
                  {job.lastResult.toUpperCase()}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mb-2">
                <span className="font-mono">Schedule: {job.schedule}</span>
                <span>Next: {job.nextRun === '—' ? '—' : new Date(job.nextRun).toLocaleString('zh-CN')}</span>
                {agent && (
                  <button className="cyber-btn text-xs" onClick={() => selectAgent(job.agentId!)}>
                    Agent: {agent.name}
                  </button>
                )}
                {linkedTask && (
                  <button className="cyber-btn text-xs" onClick={() => selectTask(job.linkedTaskId!)}>
                    Task: {linkedTask.title.slice(0, 20)}
                  </button>
                )}
              </div>
              {job.runs.length > 0 && (
                <div className="mt-2 border-t border-cyber-border pt-2">
                  <div className="text-[10px] text-gray-600 mb-1">Recent runs</div>
                  <div className="space-y-1">
                    {job.runs.slice(0, 3).map((run) => (
                      <div key={run.id} className="flex items-center gap-3 text-[10px] text-gray-400">
                        <span className="font-mono w-16">{new Date(run.startedAt).toLocaleTimeString('zh-CN')}</span>
                        <span style={{ color: RESULT_COLORS[run.result] }}>{run.result}</span>
                        <span>{run.durationMs}ms</span>
                        <span className="truncate">{run.message}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-gray-600 text-sm text-center py-12">No cron jobs match filter</div>
      )}
    </div>
  );
}
