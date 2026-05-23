import { mockRuntimeEvents } from '@/data/mockRuntimeEvents';
import { normalizeRuntimeEvent } from './normalizeRuntimeEvent';
import type { RuntimeAdapter } from './runtimeAdapter';
import type { NormalizedRuntimeEvent, RuntimeConnectionStatus } from './runtimeTypes';
import { dedupeRuntimeMessages, sortRuntimeMessages } from './runtimeTesting';

export function createMockRuntimeAdapter(delayMs = 450): RuntimeAdapter {
  let status: RuntimeConnectionStatus = 'idle';
  const timers: number[] = [];

  return {
    id: 'mock-runtime',
    label: 'Mock Runtime',
    getStatus: () => status,
    start: (emit: (event: NormalizedRuntimeEvent) => void) => {
      status = 'connected';
      const messages = dedupeRuntimeMessages(sortRuntimeMessages(mockRuntimeEvents));
      messages.forEach((message, index) => {
        const timer = window.setTimeout(() => emit(normalizeRuntimeEvent(message)), index * delayMs);
        timers.push(timer);
      });
    },
    stop: () => {
      status = 'disconnected';
      while (timers.length) {
        const timer = timers.pop();
        if (timer !== undefined) window.clearTimeout(timer);
      }
    },
  };
}
