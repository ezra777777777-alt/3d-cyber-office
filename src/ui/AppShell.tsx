import { useEffect, useRef } from 'react';
import { useUIStore } from '@/store/uiStore';
import { useOfficeStore } from '@/store/officeStore';
import { useEventStore } from '@/store/eventStore';
import { subscribe } from '@/core/event-bus';
import { applyTaskEvent, deriveAgentStatus } from '@/core/state-machine';
import { Navigation } from './Navigation';
import { StatusBar } from './StatusBar';
import { SidePanel } from './SidePanel';
import { EventFeed } from './EventFeed';
import { DemoControls } from './DemoControls';
import { OfficeScene } from '@/scene/OfficeScene';
import { CalendarView } from './dashboard/CalendarView';
import { LogsView } from './dashboard/LogsView';
import { FilesView } from './dashboard/FilesView';
import { CronJobsView } from './dashboard/CronJobsView';
import { GatewayStatus } from './dashboard/GatewayStatus';
import { DailyReview } from './dashboard/DailyReview';
import { startDemoEngine, stopDemoEngine } from '@/demo/demoEngine';
import { fullDemoScenario } from '@/demo/scenarios';
import type { AgentStatus } from '@/core/types';

export function AppShell() {
  const activeModule = useUIStore((s) => s.activeModule);
  const demoRunning = useUIStore((s) => s.demoRunning);
  const demoPaused = useUIStore((s) => s.demoPaused);
  const setDemoRunning = useUIStore((s) => s.setDemoRunning);
  const engineRef = useRef(false);

  // Subscribe to event bus on mount
  useEffect(() => {
    const unsub = subscribe((event) => {
      useEventStore.getState().addEvent(event);
      const store = useOfficeStore.getState();

      if (event.type === 'office.demo_reset') {
        useEventStore.getState().clear();
        store.reset();
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
    if (demoRunning && !engineRef.current) {
      engineRef.current = true;
      startDemoEngine(fullDemoScenario());
    }
    if (!demoRunning) {
      stopDemoEngine();
      engineRef.current = false;
    }
  }, [demoRunning]);

  return (
    <div className="w-full h-full flex flex-col bg-cyber-dark">
      <Navigation />
      <StatusBar />
      <div className="flex-1 flex relative overflow-hidden">
        {/* Main content area */}
        <div className="flex-1 relative">
          {activeModule === 'office' ? (
            <OfficeScene />
          ) : activeModule === 'calendar' ? (
            <CalendarView />
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
          ) : (
            <OfficeScene />
          )}

          {/* SidePanel visible in all modules when selection exists */}
          <div className="absolute top-2 right-2 z-10">
            <SidePanel />
          </div>
          {/* Event feed & demo controls always visible in office mode */}
          {activeModule === 'office' && (
            <div className="absolute bottom-2 left-2 right-2 z-10 flex gap-2">
              <div className="flex-1">
                <EventFeed />
              </div>
              <div className="w-48">
                <DemoControls />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
