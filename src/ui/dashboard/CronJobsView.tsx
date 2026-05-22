import { demoCronJobs } from '@/data/demoSchedules';
import { useOfficeStore } from '@/store/officeStore';
import { useUIStore } from '@/store/uiStore';

const RESULT_COLORS: Record<string, string> = {
  success: '#00e676',
  failed: '#ff3366',
  running: '#00f0ff',
  pending: '#8888aa',
};

export function CronJobsView() {
  const getAgent = useOfficeStore((s) => s.getAgent);
  const selectAgent = useUIStore((s) => s.selectAgent);

  return (
    <div className="p-6 h-full overflow-y-auto">
      <h2 className="text-lg font-semibold text-cyber-accent mb-4">Cron Jobs</h2>

      <div className="grid gap-3">
        {demoCronJobs.map((job) => {
          const agent = job.agentId ? getAgent(job.agentId) : undefined;
          return (
            <div
              key={job.id}
              className="cyber-panel p-4 cursor-pointer hover:border-cyber-accent/40 transition-colors"
              onClick={() => {
                if (job.agentId) selectAgent(job.agentId);
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-white">{job.name}</h3>
                <span className="text-xs px-2 py-0.5 rounded border" style={{ color: RESULT_COLORS[job.lastResult], borderColor: RESULT_COLORS[job.lastResult] + '44' }}>
                  {job.lastResult.toUpperCase()}
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span className="font-mono">Schedule: {job.schedule}</span>
                <span>Next: {new Date(job.nextRun).toLocaleString('zh-CN')}</span>
                {agent && (
                  <span className="text-cyber-accent">Agent: {agent.name}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {demoCronJobs.length === 0 && (
        <div className="text-gray-600 text-sm text-center py-12">No cron jobs</div>
      )}
    </div>
  );
}
