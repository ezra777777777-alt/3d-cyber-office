import { useCommanderStore } from '@/store/commanderStore';
import {
  getActiveWorkerAdapter,
  approveToolRequestWithAdapter,
  rejectToolRequestWithAdapter,
} from '@/ai/commanderRuntimeBridge';

const RISK_LABELS: Record<string, string> = {
  low: '低',
  medium: '中',
  high: '高',
  critical: '严重',
};

export function ApprovalInbox() {
  const approvals = useCommanderStore((state) => state.approvals);
  const resolveApproval = useCommanderStore((state) => state.resolveApproval);
  const workers = useCommanderStore((state) => state.workers);
  const missions = useCommanderStore((state) => state.missions);

  const allApprovals = Object.values(approvals);
  const sorted = [...allApprovals].sort(
    (a, b) => Number(a.status !== 'pending') - Number(b.status !== 'pending'),
  );

  if (sorted.length === 0) return null;

  const pendingCount = allApprovals.filter((a) => a.status === 'pending').length;

  return (
    <section className="commander-section">
      <header className="commander-section-title">
        <span>审批箱</span>
        <span
          className="commander-pill"
          style={
            pendingCount > 0
              ? { background: 'rgb(249 115 22 / 0.2)', color: 'rgb(249 115 22)' }
              : undefined
          }
        >
          {pendingCount > 0 ? `${pendingCount} 待审批` : `${sorted.length} 已处理`}
        </span>
      </header>
      {sorted.map((approval) => {
        const worker = workers.find((w) => w.id === approval.requestedByWorkerId);
        const mission = missions[approval.missionId];
        const task = mission?.tasks[approval.taskId];
        const isHighRisk = approval.risk === 'high' || approval.risk === 'critical';

        return (
          <div
            key={approval.id}
            className={`approval-card ${approval.status === 'pending' ? 'approval-card-pending' : ''}`}
          >
            <div className="approval-card-head">
              <strong>{approval.action}</strong>
              <span className={`approval-risk approval-risk-${approval.risk}`}>
                {RISK_LABELS[approval.risk] ?? approval.risk}
              </span>
            </div>
            <p>{approval.reason}</p>
            <div className="approval-meta">
              <small>目标：{approval.target}</small>
              <small>影响范围：{approval.impact}</small>
              <small>请求方：{worker?.name ?? approval.requestedByWorkerId}</small>
              {task && <small>关联任务：{task.title}</small>}
            </div>
            {approval.status === 'pending' && isHighRisk && (
              <p className="text-xs text-amber-300 mt-2">
                同意后才会继续执行；拒绝会阻塞该任务。
              </p>
            )}
            {approval.status === 'pending' && (
              <div className="approval-actions">
                <button
                  type="button"
                  className="approval-btn approval-btn-approve"
                  onClick={async () => {
                    resolveApproval(approval.id, 'approved', '已同意 — 继续执行。');
                    const adapter = getActiveWorkerAdapter();
                    if (adapter) {
                      await approveToolRequestWithAdapter(adapter, approval.id);
                    }
                  }}
                >
                  同意
                </button>
                <button
                  type="button"
                  className="approval-btn approval-btn-reject"
                  onClick={async () => {
                    const adapter = getActiveWorkerAdapter();
                    if (adapter) {
                      await rejectToolRequestWithAdapter(adapter, approval.id, '已拒绝 — 需修改后重新提交。');
                    }
                    resolveApproval(approval.id, 'rejected', '已拒绝 — 需修改后重新提交。');
                  }}
                >
                  拒绝
                </button>
              </div>
            )}
          </div>
        );
      })}
    </section>
  );
}
