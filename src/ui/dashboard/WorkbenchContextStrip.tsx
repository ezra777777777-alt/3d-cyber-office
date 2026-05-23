import type { WorkbenchContext } from './workbenchProjection';
import { WorkbenchLinkedItem } from './WorkbenchLinkedItem';

export function WorkbenchContextStrip({ context }: { context: WorkbenchContext }) {
  if (!context.missionId && context.activeLinks.length === 0) return null;

  return (
    <section className="workbench-context-strip">
      <div>
        <span className="workbench-context-kicker">当前工作链</span>
        <strong>{context.missionTitle ?? '暂无 Commander 任务'}</strong>
      </div>
      <div className="workbench-context-stats">
        <span>审批 {context.pendingApprovalCount}</span>
        <span>产物 {context.artifactCount}</span>
        <span>诊断 {context.runtimeWarningCount}</span>
      </div>
      <div className="workbench-context-links">
        {context.activeLinks.map((link) => (
          <WorkbenchLinkedItem key={`${link.kind}-${link.id}`} link={link} />
        ))}
      </div>
    </section>
  );
}
