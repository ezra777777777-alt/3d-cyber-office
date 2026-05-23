import type { OfficeEvent } from '@/core/types';
import type { GuidedCameraShot, GuidedDemoCue, GuidedDemoStep } from './guidedDemoTypes';
import { dispatch } from '@/core/event-bus';
import { useUIStore } from '@/store/uiStore';

interface ScheduledStep {
  delayMs: number;
  event?: OfficeEvent;
  cue?: GuidedDemoCue;
  fired: boolean;
}

let rafId: number | null = null;
let scheduledSteps: ScheduledStep[] = [];
let startTimestamp = 0;
let pauseStartTime = 0;
let pauseAccumulated = 0;

export function startDemoEngine(scenarioSteps: GuidedDemoStep[] | { delayMs: number; event: OfficeEvent }[]) {
  stopDemoEngine();

  scheduledSteps = scenarioSteps.map((s) => ({ ...s, fired: false }));
  startTimestamp = performance.now();
  pauseStartTime = 0;
  pauseAccumulated = 0;

  rafId = requestAnimationFrame(tick);
}

export function stopDemoEngine() {
  if (rafId !== null) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
  scheduledSteps = [];
  startTimestamp = 0;
  pauseStartTime = 0;
  pauseAccumulated = 0;
}

export function getPauseState(): { paused: boolean; progress: number } {
  if (scheduledSteps.length === 0) return { paused: false, progress: 0 };
  const now = pauseStartTime > 0 ? pauseStartTime : performance.now();
  const elapsed = now - startTimestamp - pauseAccumulated;
  const totalMs = Math.max(...scheduledSteps.map((s) => s.delayMs));
  return {
    paused: pauseStartTime > 0,
    progress: Math.min(elapsed / totalMs, 1),
  };
}

function applyGuidedCue(cue: GuidedDemoCue): void {
  const ui = useUIStore.getState();
  if (cue.kind === 'camera') {
    ui.setGuidedCameraShot(cue.payload.shot as GuidedCameraShot);
  }
  if (cue.kind === 'narration') {
    ui.setGuidedNarration(String(cue.payload.title ?? ''), String(cue.payload.body ?? ''));
  }
  if (cue.kind === 'module') {
    ui.setActiveModule(String(cue.payload.module ?? 'office'));
  }
  if (cue.kind === 'select_task') {
    ui.selectTask(String(cue.payload.taskId ?? ''));
  }
  if (cue.kind === 'select_agent') {
    ui.selectAgent(String(cue.payload.agentId ?? ''));
  }
  if (cue.kind === 'commander_open') {
    ui.setCommanderOpen(Boolean(cue.payload.open));
  }
  if (cue.kind === 'progress') {
    const progress = Number(cue.payload.progress ?? 0);
    ui.setGuidedProgress(Math.max(0, Math.min(1, progress)));
  }
}

function tick() {
  const uiState = useUIStore.getState();

  if (!uiState.demoRunning) {
    rafId = null;
    scheduledSteps = [];
    useUIStore.getState().clearGuidedDemo();
    return;
  }

  // Pause: record pause-start and spin without dispatching
  if (uiState.demoPaused) {
    if (pauseStartTime === 0) pauseStartTime = performance.now();
    rafId = requestAnimationFrame(tick);
    return;
  }

  // Just resumed: accumulate paused duration
  if (pauseStartTime > 0) {
    pauseAccumulated += performance.now() - pauseStartTime;
    pauseStartTime = 0;
  }

  const elapsed = performance.now() - startTimestamp - pauseAccumulated;

  for (const step of scheduledSteps) {
    if (!step.fired && elapsed >= step.delayMs) {
      step.fired = true;
      if (step.event) dispatch(step.event);
      if (step.cue) applyGuidedCue(step.cue);
    }
  }

  if (scheduledSteps.every((step) => step.fired)) {
    rafId = null;
    setTimeout(() => {
      const ui = useUIStore.getState();
      ui.setDemoRunning(false);
    }, 0);
    return;
  }

  rafId = requestAnimationFrame(tick);
}
