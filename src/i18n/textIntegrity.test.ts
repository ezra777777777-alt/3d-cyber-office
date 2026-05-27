import { describe, expect, it } from 'vitest';
import {
  actionLabels,
  agentStatusLabels,
  eventTypeLabels,
  moduleLabels,
  moduleShortLabels,
  runtimeModeLabels,
  runtimeStatusLabels,
  taskStatusLabels,
} from './zh';

const MOJIBAKE_PATTERN = /[鍔鏃浠鏂瀹缃澶杩鍘鎺瑙绛閿鐢娑鎿搴棰妯婕绂宸]/;

function collectValues(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (!value || typeof value !== 'object') return [];
  return Object.values(value as Record<string, unknown>).flatMap(collectValues);
}

describe('Chinese text integrity', () => {
  it('keeps central UI labels readable instead of mojibake', () => {
    const allLabels = [
      moduleLabels,
      moduleShortLabels,
      taskStatusLabels,
      agentStatusLabels,
      runtimeModeLabels,
      runtimeStatusLabels,
      eventTypeLabels,
      actionLabels,
    ].flatMap(collectValues);

    const corrupted = allLabels.filter((label) => MOJIBAKE_PATTERN.test(label));

    expect(corrupted).toEqual([]);
  });

  it('contains expected core Chinese navigation labels', () => {
    const labels = moduleLabels as Record<string, string>;
    expect(labels.launchpad).toBe('开始');
    expect(labels.office).toBe('办公室');
    expect(labels.history).toBe('历史');
    expect(labels.gateway).toBe('网关');
    expect(labels.migration).toBe('迁移');
  });
});
