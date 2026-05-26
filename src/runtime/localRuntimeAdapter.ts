import { normalizeRuntimeEvent } from './normalizeRuntimeEvent';
import type { RuntimeAdapter } from './runtimeAdapter';
import type { NormalizedRuntimeEvent, RuntimeConnectionStatus, RuntimeRawMessage } from './runtimeTypes';
import { buildLocalRuntimeUrl, buildRuntimeConnectionDiagnostic } from './localRuntimeTesting';

export interface LocalRuntimeAdapterConfig {
  endpoint: string;
}

export function createLocalRuntimeAdapter(config: LocalRuntimeAdapterConfig): RuntimeAdapter {
  let status: RuntimeConnectionStatus = 'idle';
  let source: EventSource | null = null;

  return {
    id: 'local-runtime',
    label: 'Local Runtime',
    getStatus: () => status,
    start: (emit: (event: NormalizedRuntimeEvent) => void) => {
      if (typeof window === 'undefined') {
        status = 'error';
        return;
      }

      status = 'connecting';
      const url = buildLocalRuntimeUrl(config.endpoint, '/events');
      source = new EventSource(url);

      source.addEventListener('open', () => {
        status = 'connected';
      });

      source.addEventListener('runtime-message', (message) => {
        try {
          const raw = JSON.parse((message as MessageEvent).data) as RuntimeRawMessage;
          status = 'connected';
          emit(normalizeRuntimeEvent(raw));
        } catch (error) {
          status = 'degraded';
          const detail = error instanceof Error ? error.message : 'Malformed SSE payload';
          emit({
            raw: {
              runtimeEventId: `local-runtime-malformed-${Date.now()}`,
              protocol: 'openclaw-local',
              version: '0.1.0',
              type: 'runtime.adapter_error',
              occurredAt: new Date().toISOString(),
              workerId: null,
              taskId: null,
              missionId: null,
              payload: { message: detail },
            },
            event: null,
            diagnostics: [buildRuntimeConnectionDiagnostic(config.endpoint, detail)],
          });
        }
      });

      source.addEventListener('error', () => {
        status = 'disconnected';
        emit({
          raw: {
            runtimeEventId: `local-runtime-disconnect-${Date.now()}`,
            protocol: 'openclaw-local',
            version: '0.1.0',
            type: 'runtime.adapter_error',
            occurredAt: new Date().toISOString(),
            workerId: null,
            taskId: null,
            missionId: null,
            payload: { message: 'Local Runtime connection failed' },
          },
          event: null,
          diagnostics: [buildRuntimeConnectionDiagnostic(config.endpoint, 'Connection failed')],
        });
      });
    },
    stop: () => {
      source?.close();
      source = null;
      status = 'disconnected';
    },
  };
}
