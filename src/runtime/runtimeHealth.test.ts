import { describe, expect, it } from 'vitest';
import { buildRuntimeHealthView } from './runtimeHealth';

describe('buildRuntimeHealthView', () => {
  it('explains missing runtime health', () => {
    const view = buildRuntimeHealthView('http://127.0.0.1:8765', null);
    expect(view.label).toBe('未连接');
    expect(view.staleWarning).toContain('npm.cmd run runtime');
  });

  it('warns when build id is stale', () => {
    const view = buildRuntimeHealthView('http://127.0.0.1:8765', {
      ok: true,
      protocol: 'openclaw-local',
      version: '0.1.0',
      runtimeId: 'local-runtime-dev',
      buildId: 'old-build',
    });
    expect(view.staleWarning).toContain('请重启本地 Runtime');
  });

  it('warns when source signature is stale even if build id matches', () => {
    const view = buildRuntimeHealthView(
      'http://127.0.0.1:8765',
      {
        ok: true,
        protocol: 'openclaw-local',
        version: '0.1.0',
        runtimeId: 'local-runtime-dev',
        buildId: 'plan-28-runtime-usability',
        sourceSignature: 'old-source',
      },
      {
        expectedBuildId: 'plan-28-runtime-usability',
        expectedSourceSignature: 'current-source',
      },
    );
    expect(view.staleWarning).toContain('Runtime 源码签名');
  });

  it('shows connected details for current runtime', () => {
    const view = buildRuntimeHealthView('http://127.0.0.1:8765', {
      ok: true,
      protocol: 'openclaw-local',
      version: '0.1.0',
      runtimeId: 'local-runtime-dev',
      buildId: 'plan-28-runtime-usability',
      pid: 123,
      activeMissionCount: 2,
      planner: { provider: 'mock' },
    });
    expect(view.label).toBe('已连接');
    expect(view.staleWarning).toBeNull();
    expect(view.detailRows.find((row) => row.label === 'PID')?.value).toBe('123');
  });
});
