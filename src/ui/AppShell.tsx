import { lazy, Suspense, useEffect } from 'react';
import { useUIStore } from '@/store/uiStore';
import { useOfficeStore } from '@/store/officeStore';
import { useEventStore } from '@/store/eventStore';
import { subscribe } from '@/core/event-bus';
import { applyTaskEvent, deriveAgentStatus } from '@/core/state-machine';
import { useCommanderStore } from '@/store/commanderStore';
import { Navigation } from './Navigation';
import { StatusBar } from './StatusBar';
import { SidePanel } from './SidePanel';
import { DemoControls } from './DemoControls';
import { GuidedDemoHud } from './GuidedDemoHud';
import { RuntimeModeSwitch } from './runtime/RuntimeModeSwitch';
import { OfficeScene } from '@/scene/OfficeScene';
import { OfficePresentationLayer } from './office/OfficePresentationLayer';
import { StudioOfficeShell } from './office/StudioOfficeShell';

const CalendarView = lazy(() => import('./dashboard/CalendarView').then((m) => ({ default: m.CalendarView })));
const TasksView = lazy(() => import('./dashboard/TasksView').then((m) => ({ default: m.TasksView })));
const LogsView = lazy(() => import('./dashboard/LogsView').then((m) => ({ default: m.LogsView })));
const FilesView = lazy(() => import('./dashboard/FilesView').then((m) => ({ default: m.FilesView })));
const CronJobsView = lazy(() => import('./dashboard/CronJobsView').then((m) => ({ default: m.CronJobsView })));
const GatewayStatus = lazy(() => import('./dashboard/GatewayStatus').then((m) => ({ default: m.GatewayStatus })));
const DailyReview = lazy(() => import('./dashboard/DailyReview').then((m) => ({ default: m.DailyReview })));
const RestView = lazy(() => import('./dashboard/RestView').then((m) => ({ default: m.RestView })));
const MigrationView = lazy(() => import('./dashboard/MigrationView').then((m) => ({ default: m.MigrationView })));
import { stopDemoEngine } from '@/demo/demoEngine';
import { dispatch } from '@/core/event-bus';
import { createMockRuntimeAdapter } from '@/runtime/mockRuntimeAdapter';
import { createLocalRuntimeAdapter } from '@/runtime/localRuntimeAdapter';
import { useRuntimeStore } from '@/store/runtimeStore';
import { useDashboardStore } from '@/store/dashboardStore';
import { runtimeEventToWorkbenchTaskStatus } from './dashboard/workbenchTesting';
import type { AgentStatus } from '@/core/types';

export function AppShell() {
  const activeModule = useUIStore((s) => s.activeModule);
  const demoRunning = useUIStore((s) => s.demoRunning);
  const demoPaused = useUIStore((s) => s.demoPaused);
  const setDemoRunning = useUIStore((s) => s.setDemoRunning);
  const officeVisualStyle = useUIStore((s) => s.officeVisualStyle);

  // Subscribe to event bus on mount
  useEffect(() => {
    const unsub = subscribe((event) => {
      useEventStore.getState().addEvent(event);
      const store = useOfficeStore.getState();

      if (event.type === 'office.demo_reset') {
        useEventStore.getState().clear();
        store.reset();
        useCommanderStore.getState().resetCommander();
        return;
      }

      if (event.taskId) {
        const task = store.getTask(event.taskId);
        if (task) {
          const newStatus = applyTaskEvent(task, event.type);
          if (newStatus) {
            store.upsertTask({
              ...task,
              status: newStatus,
              assignedAgentId: event.agentId || task.assignedAgentId,
              updatedAt: event.occurredAt,
              outputSummary: (event.payload.outputSummary as string) || task.outputSummary,
              errorSummary: (event.payload.errorSummary as string) || task.errorSummary,
            });

            if (event.agentId) {
              const agent = store.getAgent(event.agentId);
              if (agent) {
                store.upsertAgent({
                  ...agent,
                  status: deriveAgentStatus(newStatus),
                  currentTaskId: event.taskId,
                  lastActiveAt: event.occurredAt,
                });
              }
            }
          }
        } else {
          // Create task from event
          store.upsertTask({
            id: event.taskId,
            title: (event.payload.title as string) || event.taskId,
            summary: (event.payload.summary as string) || '',
            status: 'created',
            assignedAgentId: event.agentId,
            createdAt: event.occurredAt,
            updatedAt: event.occurredAt,
            outputSummary: (event.payload.outputSummary as string) || null,
            errorSummary: (event.payload.errorSummary as string) || null,
          });
        }
      }

      if (event.type === 'agent.status_changed' && event.agentId) {
        const agent = store.getAgent(event.agentId);
        if (agent && event.payload.status) {
          store.upsertAgent({
            ...agent,
            status: event.payload.status as AgentStatus,
            lastActiveAt: event.occurredAt,
          });
        }
      }

      // Commander event projection
      if (event.missionId) {
        useCommanderStore.getState().ingestCommanderEvent(event);
      }

      // Auto-resolve approval if scenario fires approval.resolved
      if (event.type === 'approval.resolved' && event.approvalId) {
        const resolution = String(event.payload.resolution ?? 'approved');
        const note = String(event.payload.note ?? 'Resolved via demo.');
        useCommanderStore.getState().resolveApproval(
          event.approvalId,
          resolution as 'approved' | 'rejected',
          note,
        );
      }

      // Runtime event → workbench task projection
      if (event.source === 'runtime' && event.taskId) {
        const status = runtimeEventToWorkbenchTaskStatus(event.type);
        if (status) {
          const hasTitle = typeof event.payload.title === 'string';
          const hasSummary = typeof event.payload.summary === 'string';
          const dashboardStore = useDashboardStore.getState();
          dashboardStore.upsertRuntimeWorkbenchTask({
            id: `wb-runtime-${event.taskId}`,
            ...(hasTitle ? { title: event.payload.title as string } : {}),
            status,
            source: 'runtime',
            officeTaskId: event.taskId,
            agentId: event.agentId,
            dueLabel: 'Runtime',
            priority: status === 'blocked' ? 'high' : 'medium',
            ...(hasSummary ? { summary: event.payload.summary as string } : {}),
          });
        }
      }

      // User actions (completion, stage toggle, etc.)
      if (event.type === 'user.action') {
        if (event.payload.action === 'complete' && event.taskId) {
          const task = store.getTask(event.taskId);
          if (task) {
            store.upsertTask({
              ...task,
              status: 'completed',
              updatedAt: event.occurredAt,
              outputSummary: `User marked as complete: ${event.payload.title || event.taskId}`,
            });
            if (task.assignedAgentId) {
              const agent = store.getAgent(task.assignedAgentId);
              if (agent) {
                store.upsertAgent({
                  ...agent,
                  status: 'idle',
                  currentTaskId: null,
                  lastActiveAt: event.occurredAt,
                });
              }
            }
          }
        }
      }
    });
    return unsub;
  }, []);

  // Run demo engine when demoRunning changes
  useEffect(() => {
    if (!demoRunning) {
      stopDemoEngine();
    }
  }, [demoRunning]);

  // Start runtime adapter when mode switches
  const runtimeMode = useRuntimeStore((s) => s.mode);
  const runtimeEndpoint = useRuntimeStore((s) => s.endpoint);
  useEffect(() => {
    if (runtimeMode === 'demo' || runtimeMode === 'offline' || runtimeMode === 'error') return;

    const runtimeStore = useRuntimeStore.getState();
    let adapter;

    if (runtimeMode === 'mock') {
      adapter = createMockRuntimeAdapter();
    } else if (runtimeMode === 'connected') {
      adapter = createLocalRuntimeAdapter({ endpoint: runtimeEndpoint });
    } else {
      return;
    }

    runtimeStore.setStatus('connecting');
    adapter.start((normalized) => {
      runtimeStore.addRawEvent(normalized.raw);
      runtimeStore.addDiagnostics(normalized.diagnostics);
      if (normalized.event?.type === 'runtime.heartbeat') {
        runtimeStore.setLastHeartbeatAt(normalized.event.occurredAt);
      }
      if (normalized.event) dispatch(normalized.event);
      runtimeStore.setStatus(adapter.getStatus());
    });
    // Capture synchronous status change (e.g., protocol_mismatch from connected mode placeholder)
    runtimeStore.setStatus(adapter.getStatus());

    return () => {
      adapter.stop();
      runtimeStore.setStatus(adapter.getStatus());
    };
  }, [runtimeMode, runtimeEndpoint]);

  return (
    <div className="w-full h-full flex flex-col bg-cyber-dark">
      <Navigation />
      <StatusBar />
      <div className="flex items-center px-4 py-1 border-b border-cyber-border bg-cyber-dark/60">
        <RuntimeModeSwitch />
      </div>
      <div className="flex-1 flex relative overflow-hidden">
        {activeModule === 'office' ? (
          <div className="flex-1 relative office-stage">
            <OfficeScene />
            {officeVisualStyle === 'claw3d' ? <StudioOfficeShell /> : <OfficePresentationLayer />}
          </div>
        ) : (
          /* Workbench: SidePanel docks on the right (desktop), overlays on narrow screens */
          <div className="flex-1 flex min-h-0">
            <div className="flex-1 min-w-0 overflow-hidden">
              <Suspense fallback={<div className="p-4 text-sm text-gray-400">正在加载工作台...</div>}>
                {activeModule === 'calendar' ? (
                  <CalendarView />
                ) : activeModule === 'tasks' ? (
                  <TasksView />
                ) : activeModule === 'logs' ? (
                  <LogsView />
                ) : activeModule === 'files' ? (
                  <FilesView />
                ) : activeModule === 'cronjobs' ? (
                  <CronJobsView />
                ) : activeModule === 'gateway' ? (
                  <GatewayStatus />
                ) : activeModule === 'review' ? (
                  <DailyReview />
                ) : activeModule === 'rest' ? (
                  <RestView />
                ) : activeModule === 'migration' ? (
                  <MigrationView />
                ) : (
                  <OfficeScene />
                )}
              </Suspense>
            </div>
            <div className="max-sm:absolute max-sm:right-0 max-sm:top-0 max-sm:z-30 max-sm:h-full max-sm:overflow-y-auto">
              <SidePanel />
            </div>
          </div>
        )}
        {/* HUD and controls persist across module switches */}
        <div className="absolute left-2 top-20 z-20 pointer-events-none max-w-[22rem]">
          <GuidedDemoHud />
        </div>
        <div className="absolute bottom-2 right-2 z-30 pointer-events-auto">
          <DemoControls />
        </div>
      </div>
    </div>
  );
}
