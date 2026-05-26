import { describe, expect, it } from 'vitest';
import {
  agentStatusLabels,
  eventTypeLabels,
  moduleLabels,
  moduleShortLabels,
  runtimeModeLabels,
  runtimeStatusLabels,
  taskStatusLabels,
} from './zh';
import {
  findMissingLabels,
  findOverlongMobileLabels,
  getKnownModuleIds,
  hasChineseText,
} from './i18nTesting';

describe('Chinese UI labels', () => {
  it('covers every navigation module with Chinese labels', () => {
    expect(getKnownModuleIds()).toEqual([
      'office',
      'calendar',
      'tasks',
      'logs',
      'files',
      'cronjobs',
      'gateway',
      'review',
      'rest',
      'migration',
      'history',
    ]);
    expect(findMissingLabels(moduleLabels, getKnownModuleIds())).toEqual([]);
    expect(Object.values(moduleLabels).every(hasChineseText)).toBe(true);
  });

  it('keeps mobile navigation labels short enough for 390px viewports', () => {
    expect(findOverlongMobileLabels(moduleShortLabels, 4)).toEqual([]);
  });

  it('covers common task and agent states', () => {
    expect(taskStatusLabels.completed).toBe('已完成');
    expect(taskStatusLabels.blocked).toBe('阻塞');
    expect(agentStatusLabels.working).toBe('工作中');
    expect(agentStatusLabels.idle).toBe('空闲');
  });

  it('covers runtime labels without changing runtime IDs', () => {
    expect(runtimeModeLabels.connected).toBe('本地 Runtime');
    expect(runtimeStatusLabels.protocol_mismatch).toBe('协议不匹配');
  });

  it('keeps event type labels user readable while preserving event type keys', () => {
    expect(eventTypeLabels['approval.requested']).toBe('请求审批');
    expect(eventTypeLabels['artifact.created']).toBe('产物生成');
  });
});
