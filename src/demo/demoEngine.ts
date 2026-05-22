import type { OfficeEvent } from '@/core/types';
import { dispatch } from '@/core/event-bus';
import { useUIStore } from '@/store/uiStore';

interface ScheduledEvent {
  delayMs: number;
  event: OfficeEvent;
  fired: boolean;
}

let rafId: number | null = null;
let scheduledEvents: ScheduledEvent[] = [];
let startTimestamp = 0;
let pauseStartTime = 0;
let pauseAccumulated = 0;

export function startDemoEngine(scenarioSteps: { delayMs: number; event: OfficeEvent }[]) {
  stopDemoEngine();

  scheduledEvents = scenarioSteps.map((s) => ({ ...s, fired: false }));
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
  scheduledEvents = [];
  startTimestamp = 0;
  pauseStartTime = 0;
  pauseAccumulated = 0;
}

export function getPauseState(): { paused: boolean; progress: number } {
  if (scheduledEvents.length === 0) return { paused: false, progress: 0 };
  const elapsed = Date.now() - startTimestamp - pauseAccumulated;
  const totalMs = Math.max(...scheduledEvents.map((s) => s.delayMs));
  return {
    paused: pauseStartTime > 0,
    progress: Math.min(elapsed / totalMs, 1),
  };
}

function tick() {
  const uiState = useUIStore.getState();

  if (!uiState.demoRunning) {
    rafId = null;
    scheduledEvents = [];
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

  for (const se of scheduledEvents) {
    if (!se.fired && elapsed >= se.delayMs) {
      se.fired = true;
      dispatch(se.event);
    }
  }

  if (scheduledEvents.every((e) => e.fired)) {
    rafId = null;
    // Let the React effect pick this up on next frame
    setTimeout(() => useUIStore.getState().setDemoRunning(false), 0);
    return;
  }

  rafId = requestAnimationFrame(tick);
}
