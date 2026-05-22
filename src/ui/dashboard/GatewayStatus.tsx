import { demoGateways } from '@/data/demoSchedules';

const STATUS_COLORS: Record<string, string> = {
  connected: '#00e676',
  disconnected: '#ff3366',
  error: '#f0a500',
};

const STATUS_LABELS: Record<string, string> = {
  connected: 'Connected',
  disconnected: 'Disconnected',
  error: 'Error',
};

export function GatewayStatus() {
  return (
    <div className="p-6 h-full overflow-y-auto">
      <h2 className="text-lg font-semibold text-cyber-accent mb-4">Gateway Status</h2>

      <div className="grid gap-3">
        {demoGateways.map((gw) => (
          <div key={gw.id} className="cyber-panel p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-white">{gw.name}</h3>
              <div className="flex items-center gap-2">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: STATUS_COLORS[gw.status] }}
                />
                <span className="text-xs" style={{ color: STATUS_COLORS[gw.status] }}>
                  {STATUS_LABELS[gw.status]}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span>Last heartbeat: {new Date(gw.lastHeartbeat).toLocaleString('zh-CN')}</span>
              <span>{gw.message}</span>
            </div>
          </div>
        ))}
      </div>

      {demoGateways.length === 0 && (
        <div className="text-gray-600 text-sm text-center py-12">No gateways configured</div>
      )}
    </div>
  );
}
