import { useState } from 'react';
import { useCommanderStore } from '@/store/commanderStore';
import { useRuntimeStore } from '@/store/runtimeStore';
import { resolveLocalRuntimeApproval } from '@/runtime/localRuntimeApproval';
import {
  getActiveWorkerAdapter,
  approveToolRequestWithAdapter,
  rejectToolRequestWithAdapter,
} from '@/ai/commanderRuntimeBridge';
import type { WorkerExecutionAdapter } from '@/ai/commanderAdapterTypes';

type ApprovalResolution = 'approved' | 'rejected';

interface ApprovalDecisionInput {
  approvalId: string;
  resolution: ApprovalResolution;
  localNote: string;
  runtimeNote: string;
}

interface ApprovalDecisionDeps {
  syncRuntimeApproval: (
    approvalId: string,
    resolution: ApprovalResolution,
    note: string,
  ) => Promise<void>;
  getAdapter: () => WorkerExecutionAdapter | null;
  approveWithAdapter: (adapter: WorkerExecutionAdapter, approvalId: string) => Promise<unknown>;
  rejectWithAdapter: (
    adapter: WorkerExecutionAdapter,
    approvalId: string,
    note: string,
  ) => Promise<unknown>;
  resolveApproval: (approvalId: string, resolution: ApprovalResolution, note: string) => void;
}

export async function resolveApprovalDecision(
  deps: ApprovalDecisionDeps,
  input: ApprovalDecisionInput,
) {
  await deps.syncRuntimeApproval(input.approvalId, input.resolution, input.runtimeNote);

  const adapter = deps.getAdapter();
  if (adapter) {
    if (input.resolution === 'approved') {
      await deps.approveWithAdapter(adapter, input.approvalId);
    } else {
      await deps.rejectWithAdapter(adapter, input.approvalId, input.localNote);
    }
  }

  deps.resolveApproval(input.approvalId, input.resolution, input.localNote);
}

const RISK_LABELS: Record<string, string> = {
  low: '低',
  medium: '中',
  high: '高',
  critical: '严重',
};

const RESOLUTION_META: Record<string, { label: string; className: string }> = {
  pending: { label: '待审批', className: 'approval-status-pending' },
  approved: { label: '已同意', className: 'approval-status-approved' },
  rejected: { label: '已拒绝', className: 'approval-status-rejected' },
};

export function ApprovalInbox() {
  const approvals = useCommanderStore((state) => state.approvals);
  const resolveApproval = useCommanderStore((state) => state.resolveApproval);
  const workers = useCommanderStore((state) => state.workers);
  const missions = useCommanderStore((state) => state.missions);

  const [pendingApprovalId, setPendingApprovalId] = useState<string | null>(null);
  const [approvalError, setApprovalError] = useState<string | null>(null);

  const allApprovals = Object.values(approvals);
  const sorted = [...allApprovals].sort(
    (a, b) => Number(a.status !== 'pending') - Number(b.status !== 'pending'),
  );

  if (sorted.length === 0) {
    if (approvalError) setApprovalError(null);
    return null;
  }

  const pendingCount = allApprovals.filter((approval) => approval.status === 'pending').length;

  async function syncRuntimeApproval(approvalId: string, resolution: ApprovalResolution, note: string) {
    const runtimeStore = useRuntimeStore.getState();
    if (runtimeStore.mode !== 'connected') return;

    await resolveLocalRuntimeApproval({
      endpoint: runtimeStore.endpoint,
      approvalId,
      resolution,
      note,
    });
  }

  async function decideApproval(approvalId: string, resolution: ApprovalResolution, note: string) {
    setPendingApprovalId(approvalId);
    setApprovalError(null);
    try {
      await resolveApprovalDecision(
        {
          syncRuntimeApproval,
          getAdapter: getActiveWorkerAdapter,
          approveWithAdapter: approveToolRequestWithAdapter,
          rejectWithAdapter: rejectToolRequestWithAdapter,
          resolveApproval,
        },
        {
          approvalId,
          resolution,
          localNote: note,
          runtimeNote: note,
        },
      );
    } catch (error) {
      setApprovalError(error instanceof Error ? error.message : '审批操作失败');
    } finally {
      setPendingApprovalId(null);
    }
  }

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
      {approvalError && (
        <div className="approval-error-banner">
          <span>{approvalError}</span>
          <button type="button" className="approval-error-dismiss" onClick={() => setApprovalError(null)}>
            x
          </button>
        </div>
      )}
      {sorted.map((approval) => {
        const worker = workers.find((item) => item.id === approval.requestedByWorkerId);
        const mission = missions[approval.missionId];
        const task = mission?.tasks[approval.taskId];
        const isHighRisk = approval.risk === 'high' || approval.risk === 'critical';
        const isPending = approval.status === 'pending';
        const isBusy = pendingApprovalId === approval.id;
        const resolutionMeta = RESOLUTION_META[approval.status] ?? RESOLUTION_META.pending;

        return (
          <div
            key={approval.id}
            className={`approval-card ${isPending ? 'approval-card-pending' : ''}`}
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
            {!isPending && (
              <div className={`approval-resolution ${resolutionMeta.className}`}>
                状态：{resolutionMeta.label}
                {approval.resolutionNote && <span> — {approval.resolutionNote}</span>}
              </div>
            )}
            {isPending && isHighRisk && (
              <p className="text-xs text-amber-300 mt-2">
                同意后才会继续执行；拒绝会阻塞该任务。
              </p>
            )}
            {isPending && (
              <div className="approval-actions">
                <button
                  type="button"
                  className="approval-btn approval-btn-approve"
                  disabled={isBusy}
                  onClick={() => decideApproval(approval.id, 'approved', '已同意，继续执行。')}
                >
                  {isBusy ? '处理中...' : '同意'}
                </button>
                <button
                  type="button"
                  className="approval-btn approval-btn-reject"
                  disabled={isBusy}
                  onClick={() => decideApproval(approval.id, 'rejected', '已拒绝，需要修改后重新提交。')}
                >
                  {isBusy ? '处理中...' : '拒绝'}
                </button>
              </div>
            )}
          </div>
        );
      })}
    </section>
  );
}
