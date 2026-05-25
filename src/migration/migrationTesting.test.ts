import { describe, expect, it } from 'vitest';
import {
  buildMigrationBundle,
  findSecretLikeKeys,
  getImportPlan,
  getRestoreChecklistStatus,
  validateMigrationBundle,
} from './migrationTesting';
import { parseMigrationBundleText } from './importBundle';

const storage = {
  'cyber-office-ui': { state: { activeModule: 'office', commanderOpen: true } },
  'cyber-office-data': { agents: [['agent-1', { id: 'agent-1' }]], tasks: [] },
  'cyber-office-dashboard': { calendarItems: [], restMuted: false },
  'cyber-office-commander': { missions: {}, approvals: {}, artifacts: {} },
  'runtime-token': 'do-not-export',
  'openai_api_key': 'secret',
};

describe('migration bundle safety', () => {
  it('exports only approved local app storage keys', () => {
    const bundle = buildMigrationBundle(storage, {
      origin: 'http://127.0.0.1:5173',
      userAgent: 'vitest',
      now: '2026-05-23T00:00:00.000Z',
    });

    expect(bundle.sections.map((section) => section.key)).toEqual([
      'cyber-office-ui',
      'cyber-office-data',
      'cyber-office-dashboard',
      'cyber-office-commander',
    ]);
  });

  it('detects secret-like keys before export', () => {
    expect(findSecretLikeKeys(storage)).toEqual(['runtime-token', 'openai_api_key']);
  });

  it('validates supported bundle schema before import', () => {
    const bundle = buildMigrationBundle(storage, {
      origin: 'http://127.0.0.1:5173',
      userAgent: 'vitest',
      now: '2026-05-23T00:00:00.000Z',
    });

    expect(validateMigrationBundle(bundle)).toMatchObject({ valid: true });
  });

  it('creates an import plan without writing storage', () => {
    const bundle = buildMigrationBundle(storage, {
      origin: 'http://127.0.0.1:5173',
      userAgent: 'vitest',
      now: '2026-05-23T00:00:00.000Z',
    });

    expect(getImportPlan(bundle).writes.map((write) => write.key)).toEqual([
      'cyber-office-ui',
      'cyber-office-data',
      'cyber-office-dashboard',
      'cyber-office-commander',
    ]);
  });

  it('drops stale commanderOpen from UI import writes', () => {
    const bundle = buildMigrationBundle(storage, {
      origin: 'http://127.0.0.1:5173',
      userAgent: 'vitest',
      now: '2026-05-23T00:00:00.000Z',
    });

    const uiWrite = getImportPlan(bundle).writes.find((write) => write.key === 'cyber-office-ui');
    expect(uiWrite).toBeDefined();
    expect(JSON.parse(uiWrite!.serializedValue)).toEqual({
      state: { activeModule: 'office' },
    });
  });

  it('parses exported bundle text for import preview', () => {
    const bundle = buildMigrationBundle(storage, {
      origin: 'http://127.0.0.1:5173',
      userAgent: 'vitest',
      now: '2026-05-23T00:00:00.000Z',
    });

    expect(parseMigrationBundleText(JSON.stringify(bundle)).valid).toBe(true);
  });

  it('rejects invalid JSON before import', () => {
    expect(parseMigrationBundleText('{broken').valid).toBe(false);
  });

  it('reports restore checklist status from imported sections', () => {
    const bundle = buildMigrationBundle(storage, {
      origin: 'http://127.0.0.1:5173',
      userAgent: 'vitest',
      now: '2026-05-23T00:00:00.000Z',
    });

    expect(getRestoreChecklistStatus(bundle).every((item) => item.ready)).toBe(true);
  });
});
