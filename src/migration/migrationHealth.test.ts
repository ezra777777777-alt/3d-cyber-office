import { describe, expect, it } from 'vitest';
import {
  checkMigrationBundleHealth,
  countPersistedRecords,
  createMigrationCoverageSummary,
} from './migrationHealth';

describe('migration health checks', () => {
  it('counts persisted records by approved storage key', () => {
    expect(
      countPersistedRecords({
        'cyber-office-ui': { activeModule: 'office' },
        'cyber-office-data': { agents: [{ id: 'agent-1' }], tasks: [{ id: 'task-1' }] },
        'cyber-office-dashboard': { calendarItems: [{ id: 'cal-1' }], workbenchTasks: [{ id: 'wb-1' }] },
        'cyber-office-commander': { missions: { 'mission-1': {} }, artifacts: { 'artifact-1': {} } },
      }),
    ).toEqual({
      ui: 1,
      agents: 1,
      tasks: 1,
      calendarItems: 1,
      workbenchTasks: 1,
      missions: 1,
      artifacts: 1,
    });
  });

  it('reports missing recommended state without failing the import', () => {
    const health = checkMigrationBundleHealth({
      schemaVersion: 1,
      exportedAt: '2026-05-23T00:00:00.000Z',
      app: '3d-cyber-office',
      storage: {
        'cyber-office-ui': { activeModule: 'office' },
      },
    });

    expect(health.status).toBe('warning');
    expect(health.warnings).toContain('缺少 office 数据，导入后将使用默认 Agent 和任务。');
  });

  it('blocks bundles with secret-like values', () => {
    const health = checkMigrationBundleHealth({
      schemaVersion: 1,
      exportedAt: '2026-05-23T00:00:00.000Z',
      app: '3d-cyber-office',
      storage: {
        'cyber-office-ui': { authorization: 'Bearer abc.def.ghi' },
      },
    });

    expect(health.status).toBe('blocked');
    expect(health.errors[0]).toContain('疑似敏感凭据');
  });

  it('creates a Chinese coverage summary for the migration UI', () => {
    expect(
      createMigrationCoverageSummary({
        ui: 1,
        agents: 4,
        tasks: 12,
        calendarItems: 3,
        workbenchTasks: 5,
        missions: 1,
        artifacts: 2,
      }),
    ).toContain('Agent 4 个');
  });
});
