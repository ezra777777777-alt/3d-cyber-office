import type { RuntimeAdapter } from './runtimeAdapter';
import type { RuntimeConnectionStatus } from './runtimeTypes';

export interface OpenClawAdapterConfig {
  endpoint: string;
  protocol: 'openclaw';
  version: string;
}

export function createOpenClawAdapter(config: OpenClawAdapterConfig): RuntimeAdapter {
  let status: RuntimeConnectionStatus = 'idle';

  return {
    id: 'openclaw-runtime',
    label: 'OpenClaw Runtime',
    getStatus: () => status,
    start: (_emit) => {
      status = 'protocol_mismatch';
      console.warn('[Runtime] Real OpenClaw adapter is a guarded placeholder.', config);
    },
    stop: () => {
      status = 'disconnected';
    },
  };
}
