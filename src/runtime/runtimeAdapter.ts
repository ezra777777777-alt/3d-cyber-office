import type { NormalizedRuntimeEvent, RuntimeConnectionStatus } from './runtimeTypes';

export interface RuntimeAdapter {
  id: string;
  label: string;
  start: (emit: (event: NormalizedRuntimeEvent) => void) => Promise<void> | void;
  stop: () => Promise<void> | void;
  getStatus: () => RuntimeConnectionStatus;
}
