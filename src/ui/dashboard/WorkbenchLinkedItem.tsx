import { useUIStore } from '@/store/uiStore';
import { useDashboardStore } from '@/store/dashboardStore';
import type { WorkbenchLink } from './workbenchProjection';

export function WorkbenchLinkedItem({ link }: { link: WorkbenchLink }) {
  const setActiveModule = useUIStore((state) => state.setActiveModule);
  const selectTask = useUIStore((state) => state.selectTask);
  const selectMissionTask = useUIStore((state) => state.selectMissionTask);

  return (
    <button
      type="button"
      className="workbench-linked-item"
      onClick={() => {
        setActiveModule(link.module);
        if (link.kind === 'office_task') selectTask(link.id);
        if (link.kind === 'mission_task') selectMissionTask(link.id);
        if (link.kind === 'artifact') useDashboardStore.getState().setSelectedArtifactId(link.id);
        if (link.kind === 'runtime_diagnostic') useDashboardStore.getState().setSelectedRuntimeDiagnosticId(link.id);
      }}
    >
      <span>{link.label}</span>
      <small>{link.kind}</small>
    </button>
  );
}
