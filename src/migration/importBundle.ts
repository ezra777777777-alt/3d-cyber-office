import type { MigrationBundle, MigrationImportPlan } from './migrationTypes';
import { getImportPlan, validateMigrationBundle } from './migrationTesting';

export function parseMigrationBundleText(text: string): MigrationImportPlan {
  try {
    const parsed = JSON.parse(text) as MigrationBundle;
    const validation = validateMigrationBundle(parsed);
    if (!validation.valid) {
      return { valid: false, errors: validation.errors, warnings: validation.warnings, writes: [] };
    }
    return getImportPlan(parsed);
  } catch {
    return { valid: false, errors: ['Migration file is not valid JSON.'], warnings: [], writes: [] };
  }
}

export function applyMigrationImportPlan(plan: MigrationImportPlan, storage: Storage = window.localStorage): void {
  if (!plan.valid) {
    throw new Error(plan.errors.join('\n') || 'Migration import plan is invalid.');
  }

  for (const write of plan.writes) {
    storage.setItem(write.key, write.serializedValue);
  }
}
