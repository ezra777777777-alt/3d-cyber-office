import {
  MIGRATION_SCHEMA_VERSION,
  MIGRATION_STORAGE_KEYS,
  type MigrationBuildContext,
  type MigrationBundle,
  type MigrationImportPlan,
  type MigrationSection,
  type MigrationStorageKey,
  type MigrationValidationResult,
} from './migrationTypes';
import { hasSecretLikeContent } from './migrationHealth';

const LABELS: Record<MigrationStorageKey, string> = {
  'cyber-office-ui': 'UI 偏好设置',
  'cyber-office-data': '办公室 Agent 与任务',
  'cyber-office-dashboard': '工作台仪表盘状态',
  'cyber-office-commander': 'Commander 任务与产物',
};

const SECRET_KEY_PATTERN = /token|secret|password|api[_-]?key|authorization|cookie/i;

export function findSecretLikeKeys(storage: Record<string, unknown>): string[] {
  const suspects = Object.keys(storage).filter((key) => SECRET_KEY_PATTERN.test(key));
  for (const key of MIGRATION_STORAGE_KEYS) {
    if (storage[key] !== undefined && storage[key] !== null && hasSecretLikeContent(storage[key])) {
      suspects.push(`${key}（值含疑似凭据）`);
    }
  }
  return suspects;
}

export function buildMigrationBundle(
  storage: Record<string, unknown>,
  context: MigrationBuildContext,
): MigrationBundle {
  return {
    schemaVersion: MIGRATION_SCHEMA_VERSION,
    app: '3d-cyber-office',
    exportedAt: context.now,
    exportedBy: 'browser',
    source: {
      origin: context.origin,
      userAgent: context.userAgent,
    },
    sections: MIGRATION_STORAGE_KEYS.map((key) => ({
      key,
      label: LABELS[key],
      included: Object.prototype.hasOwnProperty.call(storage, key),
      value: storage[key] ?? null,
    })),
  };
}

export function validateMigrationBundle(bundle: unknown): MigrationValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!bundle || typeof bundle !== 'object') {
    return { valid: false, errors: ['Bundle must be an object.'], warnings };
  }

  const candidate = bundle as Partial<MigrationBundle>;
  if (candidate.app !== '3d-cyber-office') errors.push('Bundle app must be 3d-cyber-office.');
  if (candidate.schemaVersion !== MIGRATION_SCHEMA_VERSION) errors.push('Unsupported migration schema version.');
  if (!Array.isArray(candidate.sections)) errors.push('Bundle sections must be an array.');

  if (Array.isArray(candidate.sections)) {
    for (const section of candidate.sections) {
      if (!MIGRATION_STORAGE_KEYS.includes(section.key)) {
        warnings.push(`Ignoring unsupported storage key: ${String(section.key)}`);
      }
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}

export function getImportPlan(bundle: MigrationBundle): MigrationImportPlan {
  const validation = validateMigrationBundle(bundle);
  if (!validation.valid) {
    return { valid: false, errors: validation.errors, warnings: validation.warnings, writes: [] };
  }

  const writes = bundle.sections
    .filter((section) => section.included && MIGRATION_STORAGE_KEYS.includes(section.key))
    .map((section) => ({
      key: section.key,
      serializedValue: JSON.stringify(sanitizeSectionValue(section.key, section.value)),
    }));

  return {
    valid: true,
    errors: [],
    warnings: validation.warnings,
    writes,
    bundle,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function sanitizeSectionValue(key: MigrationStorageKey, value: unknown): unknown {
  if (key !== 'cyber-office-ui') return value;
  if (!isRecord(value)) return value;

  const next: Record<string, unknown> = { ...value };
  delete next.commanderOpen;

  if (isRecord(next.state)) {
    const state = { ...next.state };
    delete state.commanderOpen;
    next.state = state;
  }

  return next;
}

export interface RestoreChecklistItem {
  key: string;
  label: string;
  ready: boolean;
}

export function getRestoreChecklistStatus(bundle: MigrationBundle): RestoreChecklistItem[] {
  const byKey = new Map<string, MigrationSection>(bundle.sections.map((section) => [section.key, section]));
  return [
    { key: 'ui', label: 'UI 偏好设置已恢复', ready: Boolean(byKey.get('cyber-office-ui')?.included) },
    { key: 'office', label: '办公室 Agent 与任务已恢复', ready: Boolean(byKey.get('cyber-office-data')?.included) },
    { key: 'dashboard', label: '工作台仪表盘状态已恢复', ready: Boolean(byKey.get('cyber-office-dashboard')?.included) },
    { key: 'commander', label: 'Commander 任务已恢复', ready: Boolean(byKey.get('cyber-office-commander')?.included) },
  ];
}
