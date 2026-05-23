import { useCommanderStore } from '@/store/commanderStore';

export function ApprovalInbox() {
  const approvals = useCommanderStore((state) => state.approvals);
  const resolveApproval = useCommanderStore((state) => state.resolveApproval);
  const workers = useCommanderStore((state) => state.workers);
  const missions = useCommanderStore((state) => state.missions);

  const pending = Object.values(approvals).filter((a) => a.status === 'pending');

  if (pending.length === 0) return null;

  return (
    <section className="commander-section">
      <header className="commander-section-title">
        <span>Approval inbox</span>
        <span className="commander-pill" style={{ background: 'rgb(249 115 22 / 0.2)', color: 'rgb(249 115 22)' }}>
          {pending.length} pending
        </span>
      </header>
      {pending.map((approval) => {
        const worker = workers.find((w) => w.id === approval.requestedByWorkerId);
        const mission = missions[approval.missionId];
        const task = mission?.tasks[approval.taskId];

        return (
          <div key={approval.id} className="approval-card">
            <div className="approval-card-head">
              <strong>{approval.action}</strong>
              <span className={`approval-risk approval-risk-${approval.risk}`}>{approval.risk}</span>
            </div>
            <p>{approval.reason}</p>
            <div className="approval-meta">
              <small>Target: {approval.target}</small>
              <small>Impact: {approval.impact}</small>
              <small>By: {worker?.name ?? approval.requestedByWorkerId}</small>
              {task && <small>Task: {task.title}</small>}
            </div>
            <div className="approval-actions">
              <button
                type="button"
                className="approval-btn approval-btn-approve"
                onClick={() => resolveApproval(approval.id, 'approved', 'Approved — proceed.')}
              >
                Approve
              </button>
              <button
                type="button"
                className="approval-btn approval-btn-reject"
                onClick={() => resolveApproval(approval.id, 'rejected', 'Rejected — needs revision.')}
              >
                Reject
              </button>
            </div>
          </div>
        );
      })}
    </section>
  );
}
