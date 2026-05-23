import { useMemo } from 'react';
import { demoReviews } from '@/data/demoSchedules';
import { useOfficeStore } from '@/store/officeStore';
import { useUIStore } from '@/store/uiStore';
import { useDashboardStore } from '@/store/dashboardStore';
import { getLatestReview } from './workbenchTesting';
import { WorkbenchHeader, SourceBadge } from './WorkbenchHeader';

export function DailyReview() {
  const getTask = useOfficeStore((s) => s.getTask);
  const selectTask = useUIStore((s) => s.selectTask);
  const setActiveModule = useUIStore((s) => s.setActiveModule);
  const setSelectedFile = useDashboardStore((s) => s.setSelectedFile);

  const latest = useMemo(() => getLatestReview(demoReviews), []);
  const history = useMemo(() => demoReviews.filter((r) => r.id !== latest?.id), [latest]);

  return (
    <div className="workbench-page">
      <WorkbenchHeader title="Review / Evolution" subtitle="Daily retrospectives linked to task and file evidence." />

      {latest && (
        <div className="cyber-panel p-4 mb-4 border-cyber-accent/30">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-cyber-accent">Latest — {latest.date}</h3>
            <SourceBadge source={latest.source} />
          </div>

          <div className="space-y-3">
            <div>
              <div className="text-xs text-gray-500 mb-1">Completed</div>
              <div className="text-sm text-cyber-success border-l-2 border-cyber-success pl-3">
                {latest.completed}
              </div>
            </div>

            <div>
              <div className="text-xs text-gray-500 mb-1">Shortcomings</div>
              <div className="text-sm text-cyber-warning border-l-2 border-cyber-warning pl-3">
                {latest.shortcomings}
              </div>
            </div>

            <div>
              <div className="text-xs text-gray-500 mb-1">Suggestions</div>
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
          <h3 className="text-sm font-medium text-gray-500 mb-2">Earlier Reviews</h3>
          <div className="space-y-3">
            {history.map((review) => (
              <div key={review.id} className="cyber-panel p-4 opacity-75">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-white">Review — {review.date}</h3>
                  <SourceBadge source={review.source} />
                </div>

                <div className="space-y-2">
                  <div>
                    <div className="text-xs text-gray-500 mb-0.5">Completed</div>
                    <div className="text-sm text-cyber-success border-l-2 border-cyber-success pl-3">
                      {review.completed}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-gray-500 mb-0.5">Shortcomings</div>
                    <div className="text-sm text-cyber-warning border-l-2 border-cyber-warning pl-3">
                      {review.shortcomings}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-gray-500 mb-0.5">Suggestions</div>
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
        <div className="text-gray-600 text-sm text-center py-12">No reviews yet</div>
      )}
    </div>
  );
}
