import { demoGateways } from '@/data/demoSchedules';
import { useRuntimeStore } from '@/store/runtimeStore';
import { buildRuntimeHealthView } from '@/runtime/runtimeHealth';
import { runtimeModeLabels } from '@/i18n/zh';
import { readableRuntimeState, runtimeReadinessCopy } from '@/i18n/productCopy';
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

function gatewayAdvice(status: string, mode: string): string {
  if (status === 'connected') return '现在可以回到办公室，让 Commander 下达任务。';
  if (status === 'connecting') return '正在建立连接，请确认 npm.cmd run runtime 已启动。';
  if (mode === 'mock') return 'Mock Runtime 用于验证事件边界和 UI 响应，不会触碰真实文件。';
  if (status === 'error' || status === 'disconnected') {
    return `${runtimeReadinessCopy.disconnected.body} 命令：${runtimeReadinessCopy.disconnected.command}`;
  }
  if (status === 'protocol_mismatch') return runtimeReadinessCopy.protocolMismatch.body;
  if (status === 'degraded') return 'Runtime 仍可响应，但诊断信息提示当前状态不完整。请检查日志后再继续真实任务。';
  return '可以切换到 Mock 或本地 Runtime 模式验证事件流。';
}

export function GatewayStatus() {
  const runtimeMode = useRuntimeStore((s) => s.mode);
  const runtimeStatus = useRuntimeStore((s) => s.status);
  const runtimeDiagnostics = useRuntimeStore((s) => s.diagnostics);
  const lastHeartbeatAt = useRuntimeStore((s) => s.lastHeartbeatAt);
  const rawEventCount = useRuntimeStore((s) => s.rawEvents.length);
  const runtimeEndpoint = useRuntimeStore((s) => s.endpoint);
  const setRuntimeEndpoint = useRuntimeStore((s) => s.setEndpoint);
  const refreshHealth = useRuntimeStore((s) => s.refreshHealth);
  const runtimeHealth = useRuntimeStore((s) => s.health);
  const healthView = buildRuntimeHealthView(runtimeEndpoint, runtimeHealth);

  const advice = gatewayAdvice(runtimeStatus, runtimeMode);
  const statusColor = STATUS_COLORS[runtimeStatus] || '#8888aa';

  return (
    <div className="workbench-page">
      <WorkbenchHeader title="网关诊断" subtitle="检查 Runtime 模式、协议、健康信息和原始事件。" />

      <div className="grid gap-3">
        <div className="cyber-panel p-4">
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-medium text-white">运行时控制器</h3>
              <SourceBadge source={runtimeMode === 'mock' ? 'runtime' : 'demo'} />
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: statusColor }} />
              <span className="text-xs" style={{ color: statusColor }}>
                {readableRuntimeState(runtimeStatus)}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mb-3">
            <span>模式：{runtimeModeLabels[runtimeMode]}</span>
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
              color: statusColor,
              borderColor: `${statusColor}44`,
              backgroundColor: `${statusColor}08`,
            }}
          >
            <strong>{readableRuntimeState(runtimeStatus)}</strong>
            <span className="block mt-1 text-gray-300">{advice}</span>
          </div>

          {runtimeMode === 'connected' && runtimeStatus !== 'connected' && (
            <div className="mt-2 text-xs text-amber-300 border border-amber-300/30 rounded p-2 bg-amber-300/5">
              请先在项目根目录运行：<code className="font-mono">npm.cmd run runtime</code>
            </div>
          )}

          {runtimeDiagnostics.length > 0 && <GatewayDiagnosticsView diagnostics={runtimeDiagnostics} />}
        </div>

        <div className="cyber-panel p-3">
          <div className="text-xs text-gray-400 mb-2">本地 Runtime 端点</div>
          <div className="flex gap-2 max-sm:flex-col">
            <input
              className="cyber-input flex-1"
              value={runtimeEndpoint}
              onChange={(event) => setRuntimeEndpoint(event.target.value)}
              aria-label="Runtime endpoint"
            />
            <button className="cyber-btn" type="button" onClick={refreshHealth}>
              检查连接
            </button>
          </div>
          {healthView.staleWarning && (
            <div className="mt-2 text-xs text-amber-300 border border-amber-400/30 rounded p-2">
              {healthView.staleWarning}
            </div>
          )}
          <div className="grid grid-cols-2 max-sm:grid-cols-1 gap-2 mt-3 text-xs">
            {healthView.detailRows.map((row) => (
              <div
                key={row.label}
                className="flex justify-between gap-3 border border-white/10 rounded px-2 py-1"
              >
                <span className="text-gray-500">{row.label}</span>
                <span className="text-gray-200 font-mono text-right break-all">{row.value}</span>
              </div>
            ))}
          </div>
          <div className="mt-2 text-xs text-gray-400 leading-relaxed">
            如果端口被旧进程占用，请先结束旧的 node 进程，或设置环境变量换端口：
            <code className="font-mono">
              {' '}
              $env:LOCAL_RUNTIME_PORT=&quot;19765&quot;; npm.cmd run runtime
            </code>
          </div>
        </div>

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
                  {readableRuntimeState(gw.status)}
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

        <section className="cyber-panel p-3">
          <h3 className="text-sm font-semibold text-white">Commander Adapter</h3>
          <p className="text-sm text-gray-400">
            真实 AI Commander 当前是受保护占位。系统不会在浏览器里请求、保存或迁移任何 token。
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
