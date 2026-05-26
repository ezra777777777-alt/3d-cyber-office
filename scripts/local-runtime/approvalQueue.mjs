export function createApprovalQueue() {
  const approvals = new Map();

  function requestApproval(input) {
    const approvalId = `approval-${input.missionId}-${Date.now()}`;
    const approval = {
      approvalId,
      missionId: input.missionId,
      taskId: input.taskId,
      officeTaskId: input.officeTaskId,
      workerId: input.workerId,
      toolName: input.toolName,
      target: input.target,
      reason: input.reason,
      impact: input.impact,
      risk: input.risk || 'high',
      status: 'pending',
      action: input.action,
      requestedAt: new Date().toISOString(),
      resolvedAt: null,
    };
    approvals.set(approvalId, approval);
    return approval;
  }

  function getApproval(approvalId) {
    return approvals.get(approvalId) || null;
  }

  function resolveApproval(approvalId, resolution) {
    const approval = approvals.get(approvalId);
    if (!approval) return { approval: null, action: null };
    if (approval.status !== 'pending') return { approval, action: null };

    approval.status = resolution;
    approval.resolvedAt = new Date().toISOString();
    return {
      approval,
      action: resolution === 'approved' ? approval.action : null,
    };
  }

  return {
    requestApproval,
    getApproval,
    resolveApproval,
  };
}
