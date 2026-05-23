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

const CRON_CATEGORIES: Record<string, string> = {
  review: '复盘',
  health: 'Runtime 健康检查',
  artifact_collect: '产物整理',
};

const CRON_ACTIONS = {
  retry: '下次自动重试',
  logs: '查看相关日志',
  healthy: '运行正常',
};

function categoryForName(name: string): string {
  if (name.includes('复盘') || name.includes('Review')) return 'review';
  if (name.includes('健康') || name.includes('Health') || name.includes('heartbeat')) return 'health';
  return 'artifact_collect';
}

export function CronJobsView() {
  const [resultFilter, setResultFilter] = useState<CronJob['lastResult'] | 'all'>('all');
  const getAgent = useOfficeStore((s) => s.getAgent);
  const getTask = useOfficeStore((s) => s.getTask);
  const selectAgent = useUIStore((s) => s.selectAgent);
  const selectTask = useUIStore((s) => s.selectTask);
  const setActiveModule = useUIStore((s) => s.setActiveModule);

  const filtered = useMemo(() => filterCronJobs(demoCronJobs, resultFilter), [resultFilter]);

  return (
    <div className="workbench-page">
      <WorkbenchHeader title="定时任务" subtitle="查看自动检查、复盘和失败重试。" />

      <div className="workbench-filter-row">
        {RESULT_FILTERS.map((f) => (
          <button
            key={f}
            className={resultFilter === f ? 'cyber-btn text-xs' : 'workbench-chip'}
            onClick={() => setResultFilter(f)}
          >
            {f === 'all' ? '全部' : f}
          </button>
        ))}
      </div>

      <div className="grid gap-3">
        {filtered.map((job) => {
          const agent = job.agentId ? getAgent(job.agentId) : undefined;
          const linkedTask = job.linkedTaskId ? getTask(job.linkedTaskId) : undefined;
          const category = categoryForName(job.name);
          const hasFailure = job.lastResult === 'failed' || job.runs.some((r) => r.result === 'failed');

          return (
            <div key={job.id} className="cyber-panel p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-medium text-white">{job.name}</h3>
                  {!job.enabled && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded border border-gray-700 text-gray-500">已禁用</span>
                  )}
                  <span className="text-[10px] px-1.5 py-0.5 rounded border border-cyber-border text-gray-500">
                    {CRON_CATEGORIES[category] ?? '通用'}
                  </span>
                </div>
                <span
                  className="text-xs px-2 py-0.5 rounded border"
                  style={{ color: RESULT_COLORS[job.lastResult], borderColor: RESULT_COLORS[job.lastResult] + '44' }}
                >
                  {job.lastResult.toUpperCase()}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mb-2">
                <span className="font-mono">调度：{job.schedule}</span>
                <span>下次：{job.nextRun === '—' ? '—' : new Date(job.nextRun).toLocaleString('zh-CN')}</span>
                {agent && (
                  <button className="cyber-btn text-xs" onClick={() => selectAgent(job.agentId!)}>
                    Agent：{agent.name}
                  </button>
                )}
                {linkedTask && (
                  <button className="cyber-btn text-xs" onClick={() => selectTask(job.linkedTaskId!)}>
                    任务：{linkedTask.title.slice(0, 20)}
                  </button>
                )}
              </div>

              {hasFailure && (
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-xs text-[#ff3366]">{CRON_ACTIONS.retry}</span>
                  <button
                    className="cyber-btn text-xs"
                    onClick={() => setActiveModule('logs')}
                  >
                    {CRON_ACTIONS.logs}
                  </button>
                </div>
              )}

              {!hasFailure && job.lastResult === 'success' && (
                <div className="mt-2 text-xs text-[#00e676]">{CRON_ACTIONS.healthy}</div>
              )}

              {job.runs.length > 0 && (
                <div className="mt-2 border-t border-cyber-border pt-2">
                  <div className="text-[10px] text-gray-600 mb-1">最近执行</div>
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
        <div className="text-gray-600 text-sm text-center py-12">无匹配的定时任务</div>
      )}
    </div>
  );
}
