import { buildMigrationBundle, findSecretLikeKeys } from './migrationTesting';

function readAllowedStorage(storage: Storage): Record<string, unknown> {
  const values: Record<string, unknown> = {};
  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index);
    if (!key) continue;
    const raw = storage.getItem(key);
    if (raw === null) continue;
    try {
      values[key] = JSON.parse(raw);
    } catch {
      values[key] = raw;
    }
  }
  return values;
}

export function createMigrationExportText(storage: Storage = window.localStorage): {
  filename: string;
  text: string;
  secretLikeKeys: string[];
} {
  const snapshot = readAllowedStorage(storage);
  const bundle = buildMigrationBundle(snapshot, {
    origin: window.location.origin,
    userAgent: window.navigator.userAgent,
    now: new Date().toISOString(),
  });

  return {
    filename: `3d-cyber-office-migration-${bundle.exportedAt.slice(0, 10)}.json`,
    text: JSON.stringify(bundle, null, 2),
    secretLikeKeys: findSecretLikeKeys(snapshot),
  };
}

export function downloadMigrationText(filename: string, text: string): void {
  const blob = new Blob([text], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
