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

const LABELS: Record<MigrationStorageKey, string> = {
  'cyber-office-ui': 'UI preferences',
  'cyber-office-data': 'Office agents and tasks',
  'cyber-office-dashboard': 'Workbench dashboard state',
  'cyber-office-commander': 'Commander missions and artifacts',
};

const SECRET_KEY_PATTERN = /token|secret|password|api[_-]?key|authorization|cookie/i;

export function findSecretLikeKeys(storage: Record<string, unknown>): string[] {
  return Object.keys(storage).filter((key) => SECRET_KEY_PATTERN.test(key));
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
      serializedValue: JSON.stringify(section.value),
    }));

  return {
    valid: true,
    errors: [],
    warnings: validation.warnings,
    writes,
    bundle,
  };
}

export interface RestoreChecklistItem {
  key: string;
  label: string;
  ready: boolean;
}

export function getRestoreChecklistStatus(bundle: MigrationBundle): RestoreChecklistItem[] {
  const byKey = new Map<string, MigrationSection>(bundle.sections.map((section) => [section.key, section]));
  return [
    { key: 'ui', label: 'UI preferences restored', ready: Boolean(byKey.get('cyber-office-ui')?.included) },
    { key: 'office', label: 'Office Agents and Tasks restored', ready: Boolean(byKey.get('cyber-office-data')?.included) },
    { key: 'dashboard', label: 'Workbench dashboard state restored', ready: Boolean(byKey.get('cyber-office-dashboard')?.included) },
    { key: 'commander', label: 'Commander missions restored', ready: Boolean(byKey.get('cyber-office-commander')?.included) },
  ];
}
