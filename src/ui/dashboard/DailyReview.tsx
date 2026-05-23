import { useMemo } from 'react';
import { demoReviews } from '@/data/demoSchedules';
import { useOfficeStore } from '@/store/officeStore';
import { useUIStore } from '@/store/uiStore';
import { useDashboardStore } from '@/store/dashboardStore';
import { useCommanderStore } from '@/store/commanderStore';
import { useRuntimeStore } from '@/store/runtimeStore';
import { getLatestReview } from './workbenchTesting';
import { summarizeReviewInputs } from './workbenchProjection';
import { WorkbenchHeader, SourceBadge } from './WorkbenchHeader';

export function DailyReview() {
  const getTask = useOfficeStore((s) => s.getTask);
  const tasks = useOfficeStore((s) => s.tasks);
  const selectTask = useUIStore((s) => s.selectTask);
  const setActiveModule = useUIStore((s) => s.setActiveModule);
  const setSelectedFile = useDashboardStore((s) => s.setSelectedFile);
  const reviewScope = useDashboardStore((s) => s.reviewScope);
  const setReviewScope = useDashboardStore((s) => s.setReviewScope);
  const calendarItems = useDashboardStore((s) => s.calendarItems);
  const runtimeDiagnostics = useRuntimeStore((s) => s.diagnostics);
  const selectedMissionId = useCommanderStore((s) => s.selectedMissionId);
  const missions = useCommanderStore((s) => s.missions);

  const latest = useMemo(() => getLatestReview(demoReviews), []);
  const history = useMemo(() => demoReviews.filter((r) => r.id !== latest?.id), [latest]);

  const officeTaskStats = useMemo(() => {
    const taskList = Object.values(tasks);
    return {
      completedTasks: taskList.filter((t) => t.status === 'completed').length,
      blockedTasks: taskList.filter((t) => t.status === 'blocked' || t.status === 'failed').length,
    };
  }, [tasks]);

  const calendarDone = useMemo(
    () => calendarItems.filter((item) => item.completed).length,
    [calendarItems],
  );

  const runtimeWarnings = useMemo(
    () => runtimeDiagnostics.filter((d) => d.severity === 'warn' || d.severity === 'error').length,
    [runtimeDiagnostics],
  );

  const mission = selectedMissionId ? missions[selectedMissionId] : undefined;

  const summary = summarizeReviewInputs({
    completedTasks: officeTaskStats.completedTasks,
    blockedTasks: officeTaskStats.blockedTasks,
    artifacts: mission ? mission.taskIds.length : 0,
    runtimeWarnings,
  });

  return (
    <div className="workbench-page">
      <WorkbenchHeader title="每日复盘" subtitle="汇总完成、阻塞、产物和下一步建议。" />

      {/* Review scope tabs */}
      <div className="workbench-filter-row mb-3">
        {(['today', 'mission', 'runtime'] as const).map((scope) => (
          <button
            key={scope}
            className={reviewScope === scope ? 'cyber-btn text-xs' : 'workbench-chip'}
            onClick={() => setReviewScope(scope)}
          >
            {scope === 'today' ? '今日汇总' : scope === 'mission' ? '任务组' : '运行时'}
          </button>
        ))}
      </div>

      {/* Summary card from projection */}
      <div className={`cyber-panel p-4 mb-4 ${summary.health === 'needs_attention' ? 'border-[#f0a500]/40' : 'border-[#00e676]/30'}`}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-cyber-accent">汇总评估</h3>
          <span
            className="text-xs px-2 py-0.5 rounded border"
            style={{
              color: summary.health === 'healthy' ? '#00e676' : '#f0a500',
              borderColor: summary.health === 'healthy' ? '#00e67644' : '#f0a50044',
            }}
          >
            {summary.health === 'healthy' ? '健康' : '需关注'}
          </span>
        </div>

        <div className="space-y-2">
          <div className="text-sm text-white">{summary.headline}</div>
          {reviewScope === 'today' && (
            <div className="text-xs text-gray-400">
              日程完成：{calendarDone}/{calendarItems.length} 项
            </div>
          )}
          <div className="text-sm text-cyber-accent border-l-2 border-cyber-accent pl-3">
            {summary.nextAction}
          </div>
        </div>
      </div>

      {reviewScope === 'mission' && mission && (
        <div className="cyber-panel p-4 mb-4">
          <h3 className="text-sm font-medium text-white mb-2">任务组：{mission.title}</h3>
          <div className="space-y-1">
            {mission.taskIds.map((tid) => {
              const mt = mission.tasks[tid];
              return mt ? (
                <div key={tid} className="flex items-center gap-2 text-xs text-gray-400">
                  <span className={mt.status === 'completed' ? 'text-[#00e676]' : 'text-gray-500'}>
                    {mt.status === 'completed' ? '✓' : '○'}
                  </span>
                  <span>{mt.title}</span>
                  <span className="text-gray-600">{mt.status}</span>
                </div>
              ) : null;
            })}
          </div>
        </div>
      )}

      {reviewScope === 'runtime' && (
        <div className="cyber-panel p-4 mb-4">
          <h3 className="text-sm font-medium text-white mb-2">Runtime 诊断</h3>
          {runtimeDiagnostics.length === 0 ? (
            <div className="text-xs text-gray-500">无诊断问题</div>
          ) : (
            <div className="space-y-1">
              {runtimeDiagnostics.map((d) => (
                <div key={d.id} className="text-xs text-gray-400">
                  <span
                    className="px-1.5 py-0.5 rounded border"
                    style={{
                      color: d.severity === 'error' ? '#ff3366' : '#f0a500',
                      borderColor: d.severity === 'error' ? '#ff336644' : '#f0a50044',
                    }}
                  >
                    {d.severity}
                  </span>
                  <span className="ml-2">{d.detail}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Latest review from demo data */}
      {latest && (
        <div className="cyber-panel p-4 mb-4 border-cyber-accent/30">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-cyber-accent">最新 — {latest.date}</h3>
            <SourceBadge source={latest.source} />
          </div>

          <div className="space-y-3">
            <div>
              <div className="text-xs text-gray-500 mb-1">今日完成</div>
              <div className="text-sm text-cyber-success border-l-2 border-cyber-success pl-3">
                {latest.completed}
              </div>
            </div>

            <div>
              <div className="text-xs text-gray-500 mb-1">不足</div>
              <div className="text-sm text-cyber-warning border-l-2 border-cyber-warning pl-3">
                {latest.shortcomings}
              </div>
            </div>

            <div>
              <div className="text-xs text-gray-500 mb-1">明日建议</div>
              <div className="text-sm text-cyber-accent border-l-2 border-cyber-accent pl-3">
                {latest.suggestions}
              </div>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {latest.relatedTaskIds.map((tid) => {
              const task = getTask(tid);
              return (
                <button key={tid} onClick={() => selectTask(tid)} className="cyber-btn text-xs">
                  Task: {task ? task.title.slice(0, 30) : tid}
                </button>
              );
            })}
            {latest.relatedFileIds.map((fid) => (
              <button
                key={fid}
                onClick={() => {
                  setSelectedFile(fid);
                  setActiveModule('files');
                }}
                className="cyber-btn text-xs"
              >
                File: {fid}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Historical reviews */}
      {history.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-2">历史复盘</h3>
          <div className="space-y-3">
            {history.map((review) => (
              <div key={review.id} className="cyber-panel p-4 opacity-75">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-white">复盘 — {review.date}</h3>
                  <SourceBadge source={review.source} />
                </div>

                <div className="space-y-2">
                  <div>
                    <div className="text-xs text-gray-500 mb-0.5">已完成</div>
                    <div className="text-sm text-cyber-success border-l-2 border-cyber-success pl-3">
                      {review.completed}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-gray-500 mb-0.5">不足</div>
                    <div className="text-sm text-cyber-warning border-l-2 border-cyber-warning pl-3">
                      {review.shortcomings}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-gray-500 mb-0.5">建议</div>
                    <div className="text-sm text-cyber-accent border-l-2 border-cyber-accent pl-3">
                      {review.suggestions}
                    </div>
                  </div>
                </div>

                {review.relatedTaskIds.length > 0 && (
                  <div className="flex gap-2 flex-wrap mt-2">
                    {review.relatedTaskIds.map((tid) => {
                      const task = getTask(tid);
                      return (
                        <button key={tid} onClick={() => selectTask(tid)} className="cyber-btn text-xs">
                          {task ? task.title.slice(0, 30) : tid}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {demoReviews.length === 0 && (
        <div className="text-gray-600 text-sm text-center py-12">暂无复盘记录</div>
      )}
    </div>
  );
}
