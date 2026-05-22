import { demoReviews } from '@/data/demoSchedules';
import { useOfficeStore } from '@/store/officeStore';
import { useUIStore } from '@/store/uiStore';

export function DailyReview() {
  const getTask = useOfficeStore((s) => s.getTask);
  const selectTask = useUIStore((s) => s.selectTask);

  return (
    <div className="p-6 h-full overflow-y-auto">
      <h2 className="text-lg font-semibold text-cyber-accent mb-4">Daily Review</h2>

      <div className="space-y-4">
        {demoReviews.map((review) => (
          <div key={review.id} className="cyber-panel p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-white">Review — {review.date}</h3>
            </div>

            <div>
              <div className="text-xs text-gray-500 mb-1">Completed</div>
              <div className="text-sm text-cyber-success border-l-2 border-cyber-success pl-3">
                {review.completed}
              </div>
            </div>

            <div>
              <div className="text-xs text-gray-500 mb-1">Shortcomings</div>
              <div className="text-sm text-cyber-warning border-l-2 border-cyber-warning pl-3">
                {review.shortcomings}
              </div>
            </div>

            <div>
              <div className="text-xs text-gray-500 mb-1">Suggestions</div>
              <div className="text-sm text-cyber-accent border-l-2 border-cyber-accent pl-3">
                {review.suggestions}
              </div>
            </div>

            {review.relatedTaskIds.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {review.relatedTaskIds.map((tid) => {
                  const task = getTask(tid);
                  return (
                    <button
                      key={tid}
                      onClick={() => selectTask(tid)}
                      className="text-xs cyber-btn"
                    >
                      {task ? task.title.slice(0, 30) : tid}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>

      {demoReviews.length === 0 && (
        <div className="text-gray-600 text-sm text-center py-12">No reviews yet</div>
      )}
    </div>
  );
}
