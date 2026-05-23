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
  connected: '已连接',
  connecting: '连接中',
  disconnected: '已断开',
  error: '错误',
  protocol_mismatch: '协议不匹配',
  idle: '待机',
  degraded: '性能降级',
};

function gatewayAdvice(status: string, mode: string): string {
  if (status === 'protocol_mismatch') return '这是受保护的占位连接。接入真实 OpenClaw 服务前不会要求输入 token。';
  if (status === 'connected') return 'Runtime 正在通过事件边界同步到办公室。';
  if (status === 'connecting') return '正在建立连接，请观察心跳和诊断。';
  if (mode === 'mock') return 'Mock Runtime 用于验证事件边界与 UI 响应。';
  if (status === 'error' || status === 'disconnected') return '连接已中断。可切换到 Mock 模式验证事件流。';
  return '可切换到 Mock 模式验证事件流。';
}

export function GatewayStatus() {
  const runtimeMode = useRuntimeStore((s) => s.mode);
  const runtimeStatus = useRuntimeStore((s) => s.status);
  const runtimeDiagnostics = useRuntimeStore((s) => s.diagnostics);
  const lastHeartbeatAt = useRuntimeStore((s) => s.lastHeartbeatAt);
  const rawEventCount = useRuntimeStore((s) => s.rawEvents.length);
  const runtimeEndpoint = useRuntimeStore((s) => s.endpoint);

  const advice = gatewayAdvice(runtimeStatus, runtimeMode);

  return (
    <div className="workbench-page">
      <WorkbenchHeader title="网关诊断" subtitle="检查 Runtime 模式、协议和原始事件。" />

      <div className="grid gap-3">
        {/* Runtime controller card */}
        <div className="cyber-panel p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-medium text-white">运行时控制器</h3>
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

          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mb-3">
            <span>模式：{runtimeMode}</span>
            {runtimeMode === 'connected' && <span>端点：{runtimeEndpoint}</span>}
            {lastHeartbeatAt && (
              <span>上次心跳：{new Date(lastHeartbeatAt).toLocaleTimeString('zh-CN')}</span>
            )}
            <span>原始事件：{rawEventCount}</span>
            <span>诊断：{runtimeDiagnostics.length}</span>
          </div>

          <div
            className="text-xs rounded p-2 border"
            style={{
              color: STATUS_COLORS[runtimeStatus] || '#8888aa',
              borderColor: (STATUS_COLORS[runtimeStatus] || '#8888aa') + '44',
              backgroundColor: (STATUS_COLORS[runtimeStatus] || '#8888aa') + '08',
            }}
          >
            {advice}
          </div>

          {runtimeMode === 'connected' && (
            <div className="mt-2 text-xs text-[#f0a500] border border-[#f0a500]/30 rounded p-2 bg-[#f0a500]/5">
              占位连接，不会请求凭据。当前真实适配器尚未接入 OpenClaw 服务。
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
              <span className="font-mono">协议：{gw.protocol}</span>
              <span>上次心跳：{new Date(gw.lastHeartbeat).toLocaleString('zh-CN')}</span>
              <span>{gw.message}</span>
            </div>
            {gw.diagnostics.length > 0 && <GatewayDiagnosticsView diagnostics={gw.diagnostics} />}
          </div>
        ))}

        {demoGateways.length === 0 && (
          <div className="text-gray-600 text-sm text-center py-4">暂无演示网关</div>
        )}

        {/* Commander Adapter section */}
        <section className="cyber-panel p-3">
          <h3 className="text-sm font-semibold text-white">Commander Adapter</h3>
          <p className="text-sm text-gray-400">
            真实 AI Commander 当前为受保护占位。系统不会在浏览器里请求、保存或迁移任何 token。
          </p>
          <p className="text-xs text-amber-300 mt-2">
            接入真实 Runtime 时，请通过外部安全服务提供事件流，不要把供应商 SDK 直接放进前端。
          </p>
        </section>

        <RuntimeEventInspector />
      </div>
    </div>
  );
}
