import { useMemo, type ReactNode } from 'react';
import type { WorkbenchSource } from '@/core/types';
import { useCommanderStore } from '@/store/commanderStore';
import { useRuntimeStore } from '@/store/runtimeStore';
import { useUIStore } from '@/store/uiStore';
import { useDashboardStore } from '@/store/dashboardStore';
import { buildWorkbenchContext } from './workbenchProjection';
import type { MinimalRuntimeDiagnostic } from './workbenchProjection';
import { WorkbenchContextStrip } from './WorkbenchContextStrip';

const SOURCE_LABELS: Record<WorkbenchSource, string> = {
  demo: '演示',
  local: '本地',
  runtime: '运行时',
  cron: '定时',
  google_tasks: 'Google Tasks',
  system: '系统',
  user: '用户',
  ai_adapter: 'AI Adapter',
};

export function SourceBadge({ source }: { source: WorkbenchSource }) {
  return (
    <span className="rounded border border-cyber-border bg-cyber-panel px-2 py-0.5 text-[11px] text-gray-300">
      {SOURCE_LABELS[source]}
    </span>
  );
}

function useWorkbenchContext() {
  const selectedMissionId = useCommanderStore((state) => state.selectedMissionId);
  const mission = useCommanderStore((state) =>
    selectedMissionId ? state.missions[selectedMissionId] : undefined,
  );
  const approvals = useCommanderStore((state) => Object.values(state.approvals));
  const runtimeDiagnostics = useRuntimeStore((state) => state.diagnostics);
  const selectedTaskId = useUIStore((state) => state.selectedTaskId);
  const selectedMissionTaskId = useUIStore((state) => state.selectedMissionTaskId);
  const selectedArtifactId = useDashboardStore((state) => state.selectedArtifactId);

  return useMemo(() => {
    const mappedDiagnostics: MinimalRuntimeDiagnostic[] = runtimeDiagnostics.map((d) => ({
      id: d.id,
      severity: d.severity === 'warn' ? 'warning' : d.severity === 'success' ? 'info' : d.severity,
      message: d.detail,
    }));

    return buildWorkbenchContext({
      mission: mission
        ? {
            id: mission.id,
            title: mission.title,
            taskIds: mission.taskIds,
            tasks: mission.tasks,
          }
        : undefined,
      selectedTaskId,
      selectedMissionTaskId,
      selectedArtifactId,
      approvals,
      runtimeDiagnostics: mappedDiagnostics,
    });
  }, [mission, selectedTaskId, selectedMissionTaskId, selectedArtifactId, approvals, runtimeDiagnostics]);
}

export function WorkbenchHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle: string;
  actions?: ReactNode;
}) {
  const context = useWorkbenchContext();

  return (
    <header className="workbench-header">
      <div>
        <h2 className="text-lg font-semibold text-cyber-accent">{title}</h2>
        <p className="text-xs text-gray-500">{subtitle}</p>
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      <WorkbenchContextStrip context={context} />
    </header>
  );
}
