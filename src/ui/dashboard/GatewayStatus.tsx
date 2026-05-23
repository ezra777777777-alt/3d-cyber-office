import { demoGateways } from '@/data/demoSchedules';
import { useRuntimeStore } from '@/store/runtimeStore';
import { WorkbenchHeader, SourceBadge } from './WorkbenchHeader';
import { GatewayDiagnosticsView } from './GatewayDiagnostics';
import { RuntimeEventInspector } from '../runtime/RuntimeEventInspector';

const STATUS_COLORS: Record<string, string> = {
  connected: '#00e676',
  connecting: '#f0a500',
  disconnected: '#ff3366',
  error: '#ff3366',
  protocol_mismatch: '#f0a500',
  idle: '#8888aa',
  degraded: '#f0a500',
};

const STATUS_LABELS: Record<string, string> = {
  connected: 'Connected',
  connecting: 'Connecting',
  disconnected: 'Disconnected',
  error: 'Error',
  protocol_mismatch: 'Protocol Mismatch',
  idle: 'Idle',
  degraded: 'Degraded',
};

export function GatewayStatus() {
  const runtimeMode = useRuntimeStore((s) => s.mode);
  const runtimeStatus = useRuntimeStore((s) => s.status);
  const runtimeDiagnostics = useRuntimeStore((s) => s.diagnostics);
  const lastHeartbeatAt = useRuntimeStore((s) => s.lastHeartbeatAt);
  const rawEventCount = useRuntimeStore((s) => s.rawEvents.length);
  const runtimeEndpoint = useRuntimeStore((s) => s.endpoint);

  return (
    <div className="workbench-page">
      <WorkbenchHeader title="Gateway / Runtime" subtitle="API connections, protocol status, and runtime diagnostics." />

      <div className="grid gap-3">
        {/* Runtime controller card */}
        <div className="cyber-panel p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-medium text-white">Runtime Controller</h3>
              <SourceBadge source={runtimeMode === 'mock' ? 'runtime' : 'demo'} />
            </div>
            <div className="flex items-center gap-2">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: STATUS_COLORS[runtimeStatus] || '#8888aa' }}
              />
              <span className="text-xs" style={{ color: STATUS_COLORS[runtimeStatus] || '#8888aa' }}>
                {STATUS_LABELS[runtimeStatus] || runtimeStatus}
              </span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
            <span>Mode: {runtimeMode}</span>
            {runtimeMode === 'connected' && <span>Endpoint: {runtimeEndpoint}</span>}
            {lastHeartbeatAt && (
              <span>Last heartbeat: {new Date(lastHeartbeatAt).toLocaleTimeString('zh-CN')}</span>
            )}
            <span>Raw events: {rawEventCount}</span>
            <span>Diag: {runtimeDiagnostics.length}</span>
          </div>
          {runtimeMode === 'connected' && (
            <div className="mt-2 text-xs text-[#f0a500] border border-[#f0a500]/30 rounded p-2 bg-[#f0a500]/5">
              Connected mode is a guarded placeholder. Secrets must be provided through a local runtime process, not localStorage.
            </div>
          )}
          {runtimeDiagnostics.length > 0 && <GatewayDiagnosticsView diagnostics={runtimeDiagnostics} />}
        </div>

        {/* Demo gateway reference cards */}
        {demoGateways.map((gw) => (
          <div key={gw.id} className="cyber-panel p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-medium text-white">{gw.name}</h3>
                <SourceBadge source={gw.source} />
              </div>
              <div className="flex items-center gap-2">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: STATUS_COLORS[gw.status] || '#8888aa' }}
                />
                <span className="text-xs" style={{ color: STATUS_COLORS[gw.status] || '#8888aa' }}>
                  {STATUS_LABELS[gw.status] || gw.status}
                </span>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
              <span className="font-mono">Protocol: {gw.protocol}</span>
              <span>Last heartbeat: {new Date(gw.lastHeartbeat).toLocaleString('zh-CN')}</span>
              <span>{gw.message}</span>
            </div>
            {gw.diagnostics.length > 0 && <GatewayDiagnosticsView diagnostics={gw.diagnostics} />}
          </div>
        ))}

        {demoGateways.length === 0 && (
          <div className="text-gray-600 text-sm text-center py-4">No demo gateways configured</div>
        )}

        <RuntimeEventInspector />
      </div>
    </div>
  );
}
