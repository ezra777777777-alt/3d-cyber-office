import { describe, expect, it } from 'vitest';
import {
  commanderModeCopy,
  firstRunCopy,
  missionTemplateCopy,
  readableRuntimeState,
  runtimeReadinessCopy,
} from './productCopy';

describe('product copy', () => {
  it('contains first-run steps in the expected order', () => {
    expect(firstRunCopy.steps.map((step) => step.id)).toEqual([
      'start-runtime',
      'connect-runtime',
      'plan-mission',
      'approve-risk',
      'inspect-results',
    ]);
  });

  it('uses readable Chinese for runtime readiness states', () => {
    expect(runtimeReadinessCopy.disconnected.title).toBe('还没连接本地 Runtime');
    expect(runtimeReadinessCopy.connected.title).toBe('Runtime 已连接');
    expect(runtimeReadinessCopy.approvalRequired.title).toBe('等待你审批');
  });

  it('provides at least three mission template labels', () => {
    expect(missionTemplateCopy).toHaveLength(3);
    expect(missionTemplateCopy.map((template) => template.id)).toEqual([
      'project-health-check',
      'release-summary',
      'feature-plan',
    ]);
  });

  it('uses product-safe adapter mode names', () => {
    expect(commanderModeCopy.local_runtime).toBe('本地 Runtime');
    expect(commanderModeCopy.guarded_real).toBe('真实接入占位');
  });

  it('formats runtime status in product language', () => {
    expect(readableRuntimeState('connected')).toBe('Runtime 已连接');
    expect(readableRuntimeState('disconnected')).toBe('Runtime 未连接');
    expect(readableRuntimeState('protocol_mismatch')).toBe('Runtime 协议不匹配');
  });
});
