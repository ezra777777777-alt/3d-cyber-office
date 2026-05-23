export const MIGRATION_SCHEMA_VERSION = 1;

export const MIGRATION_STORAGE_KEYS = [
  'cyber-office-ui',
  'cyber-office-data',
  'cyber-office-dashboard',
  'cyber-office-commander',
] as const;

export type MigrationStorageKey = (typeof MIGRATION_STORAGE_KEYS)[number];

export interface MigrationSection {
  key: MigrationStorageKey;
  label: string;
  included: boolean;
  value: unknown;
  warning?: string;
}

export interface MigrationBundle {
  schemaVersion: 1;
  app: '3d-cyber-office';
  exportedAt: string;
  exportedBy: 'browser';
  source: {
    origin: string;
    userAgent: string;
  };
  sections: MigrationSection[];
}

export interface MigrationBuildContext {
  origin: string;
  userAgent: string;
  now: string;
}

export interface MigrationValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface MigrationWrite {
  key: MigrationStorageKey;
  serializedValue: string;
}

export interface MigrationImportPlan {
  valid: boolean;
  errors: string[];
  warnings: string[];
  writes: MigrationWrite[];
  bundle?: MigrationBundle;
}
