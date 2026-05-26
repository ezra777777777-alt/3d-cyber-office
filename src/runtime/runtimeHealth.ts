export interface RuntimeHealthSnapshot {
  ok: boolean;
  protocol: string;
  version: string;
  runtimeId: string;
  buildId?: string;
  pid?: number;
  startedAt?: string;
  sourceSignature?: string;
  activeMissionCount?: number;
  planner?: {
    provider?: string;
    modelName?: string | null;
    configured?: boolean;
    reason?: string;
  };
}

export interface RuntimeHealthView {
  label: string;
  staleWarning: string | null;
  detailRows: Array<{ label: string; value: string }>;
}

export interface RuntimeHealthExpectations {
  expectedBuildId?: string;
  expectedSourceSignature?: string;
}

function getDefaultSourceSignature() {
  return typeof __EXPECTED_RUNTIME_SOURCE_SIGNATURE__ === 'string'
    ? __EXPECTED_RUNTIME_SOURCE_SIGNATURE__
    : undefined;
}

export function buildRuntimeHealthView(
  endpoint: string,
  health: RuntimeHealthSnapshot | null,
  expectations: RuntimeHealthExpectations | string = {},
): RuntimeHealthView {
  const expected =
    typeof expectations === 'string'
      ? { expectedBuildId: expectations }
      : expectations;
  const expectedBuildId = expected.expectedBuildId ?? 'plan-28-runtime-usability';
  const expectedSourceSignature =
    expected.expectedSourceSignature ?? getDefaultSourceSignature();

  if (!health) {
    return {
      label: '未连接',
      staleWarning:
        '没有拿到 Runtime 健康信息。请确认 npm.cmd run runtime 正在项目根目录运行。',
      detailRows: [{ label: '端点', value: endpoint }],
    };
  }

  let staleWarning: string | null = null;
  if (health.buildId && health.buildId !== expectedBuildId) {
    staleWarning = `当前 Runtime buildId 是 ${health.buildId}，不是 ${expectedBuildId}。请重启本地 Runtime。`;
  } else if (
    expectedSourceSignature &&
    health.sourceSignature &&
    health.sourceSignature !== expectedSourceSignature
  ) {
    staleWarning = '当前 Runtime 源码签名与前端期望不一致。请重启本地 Runtime，确保端口没有被旧进程占用。';
  }

  return {
    label: health.ok ? '已连接' : '异常',
    staleWarning,
    detailRows: [
      { label: '端点', value: endpoint },
      { label: '协议', value: `${health.protocol}@${health.version}` },
      { label: 'Runtime', value: health.runtimeId },
      { label: 'Build', value: health.buildId || '未知' },
      { label: 'Source', value: health.sourceSignature || '未知' },
      { label: 'PID', value: health.pid ? String(health.pid) : '未知' },
      { label: '启动时间', value: health.startedAt || '未知' },
      { label: '任务数', value: String(health.activeMissionCount ?? 0) },
      { label: 'Planner', value: health.planner?.provider || '未知' },
    ],
  };
}
