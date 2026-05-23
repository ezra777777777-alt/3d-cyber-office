# Persistence and Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the 3D Cyber Office safely exportable, importable, and verifiable across computers while keeping runtime secrets and machine-specific state out of migration packages.

**Architecture:** Add a small migration layer that gathers only approved local app state from existing Zustand/localStorage stores, serializes it into a versioned migration bundle, validates imports before writing them back, and exposes the flow through a Workbench settings/migration surface plus updated docs. Runtime credentials and live adapter state remain explicitly excluded and must be recreated on the target machine.

**Tech Stack:** React 18, TypeScript, Vite, Zustand, localStorage, JSON migration bundle, Vitest, Browser/Playwright QA.

---

## Prerequisites

Execute this plan after:

1. `docs/superpowers/plans/01-office-visual-fidelity.md`
2. `docs/superpowers/plans/02-workbench-fidelity.md`
3. `docs/superpowers/plans/03-commander-workflow.md`
4. `docs/superpowers/plans/04-runtime-adapter.md`

The first three plans create meaningful local state. The Runtime Adapter plan defines the secret/runtime boundary this plan must preserve.

## File Structure

### Files to create

| File | Responsibility |
| --- | --- |
| `src/migration/migrationTypes.ts` | Versioned export bundle types, allowed localStorage keys, migration section metadata. |
| `src/migration/migrationTesting.ts` | Pure helpers for bundle creation, validation, redaction, import planning, and restore checks. |
| `src/migration/migrationTesting.test.ts` | Focused tests for safe export/import behavior and secret exclusion. |
| `src/migration/exportBundle.ts` | Browser-safe export function that reads approved stores and returns downloadable JSON text. |
| `src/migration/importBundle.ts` | Browser-safe import function that validates a bundle and writes approved keys to localStorage. |
| `src/ui/dashboard/MigrationView.tsx` | Workbench UI for export, import preview, restore, and verification checklist. |
| `docs/migration/3d-cyber-office-data-migration.md` | Complete user-facing cross-device migration tutorial. |
| `docs/migration/migration-checklist.md` | Short checklist for repeating migrations without rereading the full guide. |

### Files to modify

| File | Responsibility of change |
| --- | --- |
| `src/core/types.ts` | Add migration bundle metadata types only if not kept entirely under `src/migration`. |
| `src/store/uiStore.ts` | Add `migration` module ID and keep persisted active module fallback compatible. |
| `src/ui/Navigation.tsx` | Add `Migration` navigation entry. |
| `src/ui/AppShell.tsx` | Route `migration` to `MigrationView`. |
| `src/store/officeStore.ts` | Export `OFFICE_STORAGE_KEY` and serialization helpers if they are currently private. |
| `src/store/dashboardStore.ts` | Export `DASHBOARD_STORAGE_KEY` and storage helper names if needed. |
| `src/store/commanderStore.ts` | Export `COMMANDER_STORAGE_KEY` and keep commander data included in migration. |
| `src/store/eventStore.ts` | Stay runtime/in-memory by default; expose only an optional recent-event export helper if product wants it. |
| `src/ui/dashboard/WorkbenchHeader.tsx` | Reuse existing header/source badge patterns if needed by `MigrationView`. |
| `docs/migration/README.md` | Replace old console-copy instructions with links to the new complete guide and checklist. |

## Scope Guard

This plan owns:

- Versioned export bundle format.
- Local-only data export/import.
- Import validation and dry-run preview.
- Secret redaction and runtime-state exclusion.
- Migration UI surface.
- Cross-device migration documentation.
- Restore verification checklist.

This plan does not own:

- Real cloud sync.
- Real runtime credential migration.
- Moving `node_modules`.
- Exporting browser cache.
- Exporting raw filesystem artifacts outside the project repo.
- Automatically installing Node.js or external runtimes on the target device.

## Migration Boundary

Migrated:

- UI preferences from `cyber-office-ui`.
- Office agents/tasks from `cyber-office-data`.
- Dashboard calendar/tasks/rest preferences from `cyber-office-dashboard`.
- Commander missions/approvals/artifacts/draft from `cyber-office-commander`.
- App version, export timestamp, and source machine notes.

Not migrated:

- Runtime tokens, API keys, passwords, browser cookies, authorization headers.
- `node_modules/`.
- Vite `dist/`.
- Browser HTTP cache.
- Live runtime connection state.
- Real local runtime process config beyond non-secret endpoint hints.

## Bundle Shape

```ts
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

export interface MigrationSection {
  key: MigrationStorageKey;
  label: string;
  included: boolean;
  value: unknown;
  warning?: string;
}

export type MigrationStorageKey =
  | 'cyber-office-ui'
  | 'cyber-office-data'
  | 'cyber-office-dashboard'
  | 'cyber-office-commander';
```

## Task 1: Define Migration Bundle Types and Pure Safety Tests

**Files:**
- Create: `src/migration/migrationTypes.ts`
- Create: `src/migration/migrationTesting.ts`
- Create: `src/migration/migrationTesting.test.ts`

- [ ] **Step 1: Write failing tests for bundle safety**

Create `src/migration/migrationTesting.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  buildMigrationBundle,
  findSecretLikeKeys,
  getImportPlan,
  validateMigrationBundle,
} from './migrationTesting';

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
});
```

- [ ] **Step 2: Run the focused test to verify it fails**

Run:

```powershell
npm run test -- src/migration/migrationTesting.test.ts
```

Expected: FAIL because `src/migration/*` does not exist yet.

- [ ] **Step 3: Add migration types**

Create `src/migration/migrationTypes.ts`:

```ts
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
}
```

- [ ] **Step 4: Add pure helper implementations**

Create `src/migration/migrationTesting.ts`:

```ts
import {
  MIGRATION_SCHEMA_VERSION,
  MIGRATION_STORAGE_KEYS,
  type MigrationBuildContext,
  type MigrationBundle,
  type MigrationImportPlan,
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
  };
}
```

- [ ] **Step 5: Run focused tests and build**

Run:

```powershell
npm run test -- src/migration/migrationTesting.test.ts
npm run build
```

Expected: migration tests PASS and production build PASS.

- [ ] **Step 6: Commit**

```powershell
git add src/migration/migrationTypes.ts src/migration/migrationTesting.ts src/migration/migrationTesting.test.ts
git commit -m "feat: define migration bundle safety"
```

## Task 2: Add Browser Export and Import Functions

**Files:**
- Create: `src/migration/exportBundle.ts`
- Create: `src/migration/importBundle.ts`
- Modify: `src/migration/migrationTesting.test.ts`

- [ ] **Step 1: Add failing tests for import serialization**

Append to `src/migration/migrationTesting.test.ts`:

```ts
import { parseMigrationBundleText } from './importBundle';

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
```

- [ ] **Step 2: Run the focused test**

Run:

```powershell
npm run test -- src/migration/migrationTesting.test.ts
```

Expected: FAIL because `parseMigrationBundleText` does not exist yet.

- [ ] **Step 3: Implement export function**

Create `src/migration/exportBundle.ts`:

```ts
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
```

- [ ] **Step 4: Implement import parsing and applying**

Create `src/migration/importBundle.ts`:

```ts
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
```

- [ ] **Step 5: Run tests and build**

Run:

```powershell
npm run test -- src/migration/migrationTesting.test.ts
npm run build
```

Expected: tests PASS and build PASS.

- [ ] **Step 6: Commit**

```powershell
git add src/migration/exportBundle.ts src/migration/importBundle.ts src/migration/migrationTesting.test.ts
git commit -m "feat: add migration export import helpers"
```

## Task 3: Add Migration Workbench UI

**Files:**
- Create: `src/ui/dashboard/MigrationView.tsx`
- Modify: `src/store/uiStore.ts`
- Modify: `src/ui/Navigation.tsx`
- Modify: `src/ui/AppShell.tsx`
- Modify: `src/index.css`

- [ ] **Step 1: Add the module ID**

Modify `src/store/uiStore.ts` so `ModuleId` includes:

```ts
| 'migration'
```

Keep persisted old values safe by falling back to `office` when an unknown module is loaded.

- [ ] **Step 2: Add navigation entry**

Modify `src/ui/Navigation.tsx`:

```ts
{ id: 'migration', label: 'Migration' },
```

Do not clear selected Agent/Task when switching modules.

- [ ] **Step 3: Create MigrationView**

Create `src/ui/dashboard/MigrationView.tsx`:

```tsx
import { useMemo, useState } from 'react';
import { createMigrationExportText, downloadMigrationText } from '@/migration/exportBundle';
import { applyMigrationImportPlan, parseMigrationBundleText } from '@/migration/importBundle';
import type { MigrationImportPlan } from '@/migration/migrationTypes';
import { WorkbenchHeader } from './WorkbenchHeader';

export function MigrationView() {
  const [exportText, setExportText] = useState('');
  const [secretWarnings, setSecretWarnings] = useState<string[]>([]);
  const [importText, setImportText] = useState('');
  const [importPlan, setImportPlan] = useState<MigrationImportPlan | null>(null);
  const [status, setStatus] = useState('');

  const importSummary = useMemo(() => {
    if (!importPlan) return 'No import file previewed.';
    if (!importPlan.valid) return importPlan.errors.join(' ');
    return `${importPlan.writes.length} sections ready to restore.`;
  }, [importPlan]);

  function handleExport() {
    const result = createMigrationExportText();
    setExportText(result.text);
    setSecretWarnings(result.secretLikeKeys);
    setStatus(`Export ready: ${result.filename}`);
  }

  function handleDownload() {
    const result = createMigrationExportText();
    downloadMigrationText(result.filename, result.text);
    setStatus(`Downloaded ${result.filename}`);
  }

  function handlePreviewImport() {
    const plan = parseMigrationBundleText(importText);
    setImportPlan(plan);
    setStatus(plan.valid ? 'Import preview is valid.' : 'Import preview failed.');
  }

  function handleApplyImport() {
    if (!importPlan) return;
    applyMigrationImportPlan(importPlan);
    setStatus('Import applied. Refresh the page to load restored state.');
  }

  return (
    <div className="workbench-page">
      <WorkbenchHeader title="Migration" subtitle="Export local office state and restore it on another computer." />

      <div className="migration-grid">
        <section className="cyber-panel p-4">
          <h3 className="text-sm font-medium text-white">Export package</h3>
          <p className="mt-2 text-xs leading-5 text-gray-400">
            Includes UI, office, dashboard, and Commander local state. Runtime secrets are not exported.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" className="cyber-btn text-xs" onClick={handleExport}>Preview JSON</button>
            <button type="button" className="cyber-btn text-xs" onClick={handleDownload}>Download JSON</button>
          </div>
          {secretWarnings.length > 0 && (
            <div className="mt-3 rounded border border-cyber-warning/40 p-3 text-xs text-cyber-warning">
              Secret-like keys were detected outside the migration bundle: {secretWarnings.join(', ')}
            </div>
          )}
          <textarea className="migration-textarea" value={exportText} readOnly />
        </section>

        <section className="cyber-panel p-4">
          <h3 className="text-sm font-medium text-white">Import package</h3>
          <p className="mt-2 text-xs leading-5 text-gray-400">
            Paste a migration JSON package, preview the writes, then apply. Refresh after import.
          </p>
          <textarea className="migration-textarea" value={importText} onChange={(event) => setImportText(event.target.value)} />
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" className="cyber-btn text-xs" onClick={handlePreviewImport}>Preview Import</button>
            <button type="button" className="cyber-btn text-xs" disabled={!importPlan?.valid} onClick={handleApplyImport}>Apply Import</button>
          </div>
          <div className="mt-3 text-xs text-gray-400">{importSummary}</div>
          {importPlan?.warnings.map((warning) => (
            <div key={warning} className="mt-2 text-xs text-cyber-warning">{warning}</div>
          ))}
        </section>
      </div>

      <section className="cyber-panel mt-4 p-4">
        <h3 className="text-sm font-medium text-white">Restore verification</h3>
        <ul className="migration-checklist">
          <li>Open Office and confirm Agents, selected task, and Commander panel render.</li>
          <li>Open Calendar and confirm plan progress/stages are restored.</li>
          <li>Open Tasks and Files and confirm selected workbench data exists.</li>
          <li>Run Commander Demo or Approved Delivery to confirm demo runtime still works.</li>
          <li>Reconnect external runtime credentials manually on the target machine.</li>
        </ul>
      </section>

      {status && <div className="mt-3 text-xs text-cyber-accent">{status}</div>}
    </div>
  );
}
```

- [ ] **Step 4: Route MigrationView**

Modify `src/ui/AppShell.tsx`:

```tsx
import { MigrationView } from './dashboard/MigrationView';
```

Add branch:

```tsx
) : activeModule === 'migration' ? (
  <MigrationView />
)
```

- [ ] **Step 5: Add migration styles**

Append to `src/index.css`:

```css
.migration-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}

.migration-textarea {
  margin-top: 0.75rem;
  min-height: 16rem;
  width: 100%;
  resize: vertical;
  border: 1px solid rgba(0, 240, 255, 0.18);
  background: rgba(6, 12, 25, 0.86);
  padding: 0.75rem;
  color: #dcefff;
  font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
  font-size: 0.72rem;
  outline: none;
}

.migration-checklist {
  display: grid;
  gap: 0.45rem;
  margin-top: 0.75rem;
  color: #9db4c8;
  font-size: 0.78rem;
  line-height: 1.5;
}

@media (max-width: 760px) {
  .migration-grid {
    grid-template-columns: 1fr;
  }
}
```

- [ ] **Step 6: Run tests and build**

Run:

```powershell
npm run test
npm run build
```

Expected: all tests PASS and build PASS.

- [ ] **Step 7: Commit**

```powershell
git add src/store/uiStore.ts src/ui/Navigation.tsx src/ui/AppShell.tsx src/ui/dashboard/MigrationView.tsx src/index.css
git commit -m "feat: add migration workbench"
```

## Task 4: Add Restore Verification and Data Provenance Tests

**Files:**
- Modify: `src/migration/migrationTesting.ts`
- Modify: `src/migration/migrationTesting.test.ts`
- Modify: `src/ui/dashboard/MigrationView.tsx`

- [ ] **Step 1: Add failing restore checklist helper tests**

Append to `src/migration/migrationTesting.test.ts`:

```ts
import { getRestoreChecklistStatus } from './migrationTesting';

it('reports restore checklist status from imported sections', () => {
  const bundle = buildMigrationBundle(storage, {
    origin: 'http://127.0.0.1:5173',
    userAgent: 'vitest',
    now: '2026-05-23T00:00:00.000Z',
  });

  expect(getRestoreChecklistStatus(bundle).every((item) => item.ready)).toBe(true);
});
```

- [ ] **Step 2: Run focused test**

Run:

```powershell
npm run test -- src/migration/migrationTesting.test.ts
```

Expected: FAIL because `getRestoreChecklistStatus` is missing.

- [ ] **Step 3: Implement checklist status helper**

Append to `src/migration/migrationTesting.ts`:

```ts
import type { MigrationSection } from './migrationTypes';

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
```

- [ ] **Step 4: Show import checklist in MigrationView**

After a valid import preview, render `getRestoreChecklistStatus(parsedBundle)` if the parsed bundle is available. If `parseMigrationBundleText` currently returns only a plan, add `bundle?: MigrationBundle` to the plan shape or keep a separate parsed bundle state in `MigrationView`.

Use this UI shape:

```tsx
{restoreItems.map((item) => (
  <div key={item.key} className={item.ready ? 'text-cyber-success' : 'text-cyber-warning'}>
    {item.ready ? 'PASS' : 'CHECK'} {item.label}
  </div>
))}
```

- [ ] **Step 5: Run tests and build**

Run:

```powershell
npm run test -- src/migration/migrationTesting.test.ts
npm run build
```

Expected: tests PASS and build PASS.

- [ ] **Step 6: Commit**

```powershell
git add src/migration/migrationTesting.ts src/migration/migrationTesting.test.ts src/ui/dashboard/MigrationView.tsx
git commit -m "feat: add migration restore checks"
```

## Task 5: Write Complete Migration Documentation

**Files:**
- Create: `docs/migration/3d-cyber-office-data-migration.md`
- Create: `docs/migration/migration-checklist.md`
- Modify: `docs/migration/README.md`

- [ ] **Step 1: Create the complete migration guide**

Create `docs/migration/3d-cyber-office-data-migration.md`:

```md
# 3D Cyber Office Data Migration Guide

## What This Moves

This guide moves local browser state and project source code for the 3D Cyber Office.

Migrated:

- UI preferences.
- Office Agents and Tasks.
- Workbench Calendar, Tasks, Files, Review, Rest preferences.
- Commander missions, approvals, artifacts, and draft text.
- Project source code when copied through git or a zip archive.

Not migrated:

- Runtime tokens.
- API keys.
- Passwords.
- Browser cookies.
- `node_modules/`.
- `dist/`.
- Browser cache.
- Live runtime process state.

## Source Computer Steps

1. Open the app.
2. Open `Migration`.
3. Click `Preview JSON`.
4. Confirm no secret-like keys are included in the bundle.
5. Click `Download JSON`.
6. Copy the project source code through git or a zip archive.
7. Copy the downloaded migration JSON to the target computer.

## Target Computer Steps

1. Install Node.js 18 or newer.
2. Copy or clone the project.
3. Run `npm install`.
4. Run `npm run dev`.
5. Open the printed Vite URL.
6. Open `Migration`.
7. Paste the migration JSON into `Import package`.
8. Click `Preview Import`.
9. Confirm the preview shows the expected sections.
10. Click `Apply Import`.
11. Refresh the browser page.

## Verification

After refresh:

1. Open `Office`.
2. Confirm the office loads and Commander is visible.
3. Open `Calendar`.
4. Confirm plan progress and stage completion survived.
5. Open `Tasks`.
6. Confirm local and runtime-demo task cards exist.
7. Open `Files`.
8. Confirm file previews still show demo artifact metadata.
9. Open `Review`.
10. Confirm related task/file links still navigate.
11. Run `Commander Demo` or `Approved Delivery`.
12. Confirm EventFeed and Commander summary update.

## Runtime Reconnection

Runtime credentials are never exported. On the target computer:

1. Install or start the local runtime process.
2. Recreate tokens or API keys through that runtime's own secure setup.
3. Open Gateway or Runtime mode.
4. Confirm heartbeat and protocol diagnostics.

## Rollback

To undo an imported browser state:

1. Open browser DevTools.
2. Clear site data for the Vite origin.
3. Refresh the page.
4. The app will return to default demo state.
```

- [ ] **Step 2: Create short checklist**

Create `docs/migration/migration-checklist.md`:

```md
# Migration Checklist

- [ ] Source app opens successfully.
- [ ] Migration JSON downloaded from `Migration`.
- [ ] Project source copied or cloned to target machine.
- [ ] `npm install` completed on target.
- [ ] `npm run dev` starts on target.
- [ ] Migration JSON preview is valid.
- [ ] Import applied.
- [ ] Browser refreshed.
- [ ] Office loads.
- [ ] Calendar progress restored.
- [ ] Commander mission state restored.
- [ ] Demo still runs.
- [ ] Runtime credentials recreated manually if needed.
```

- [ ] **Step 3: Replace old README with index**

Modify `docs/migration/README.md`:

```md
# 3D Cyber Office Migration

Use these documents:

- `docs/migration/3d-cyber-office-data-migration.md` for the full cross-device migration procedure.
- `docs/migration/migration-checklist.md` for a short repeatable checklist.

The app's `Migration` workbench module can export and import local browser state. Runtime secrets are not migrated.
```

- [ ] **Step 4: Commit docs**

```powershell
git add docs/migration/README.md docs/migration/3d-cyber-office-data-migration.md docs/migration/migration-checklist.md
git commit -m "docs: add migration guide"
```

## Task 6: Browser QA the Migration Workflow

**Files:**
- Modify only files owned by this plan if QA finds defects.

- [ ] **Step 1: Start the local app**

Run:

```powershell
npm run dev
```

Expected: Vite prints a local URL.

- [ ] **Step 2: Verify migration module navigation**

In Browser:

1. Open the app.
2. Click `Migration`.
3. Confirm the page renders.
4. Confirm export and import panels are visible.
5. Confirm no console errors.

- [ ] **Step 3: Verify export preview**

In Browser:

1. Click `Preview JSON`.
2. Confirm the textarea includes `"app": "3d-cyber-office"`.
3. Confirm the JSON contains the four approved storage keys only.
4. Confirm no token, secret, password, API key, authorization, or cookie value appears.

- [ ] **Step 4: Verify import preview**

In Browser:

1. Copy the export JSON.
2. Paste it into the import textarea.
3. Click `Preview Import`.
4. Confirm the preview says four sections are ready to restore.
5. Confirm invalid JSON produces an error message and disables `Apply Import`.

- [ ] **Step 5: Verify apply and refresh**

In Browser:

1. Click `Apply Import`.
2. Refresh.
3. Confirm Office, Calendar, Tasks, Files, Review, and Commander still render.
4. Run `Approved Delivery`.
5. Confirm `3/3 Tasks done` and artifacts still display.

- [ ] **Step 6: Verify narrow layout**

At 390px width:

1. Open `Migration`.
2. Confirm export/import panels stack vertically.
3. Confirm textareas do not create horizontal overflow.
4. Confirm buttons remain clickable.

- [ ] **Step 7: Run final verification**

Run:

```powershell
npm run test
npm run build
```

Expected: all tests PASS and production build PASS.

- [ ] **Step 8: Commit QA fixes**

```powershell
git add src docs/migration
git commit -m "test: verify migration workflow"
```

## Plan Self-Review Checklist

Before execution is considered ready:

- [ ] Migration bundle is versioned.
- [ ] Only approved local app storage keys are exported.
- [ ] Secret-like keys are detected and excluded.
- [ ] Import has a preview step before writing localStorage.
- [ ] Migration UI has export, download, import preview, and apply controls.
- [ ] Runtime credentials and live connection state are explicitly excluded.
- [ ] Docs explain source computer, target computer, verification, runtime reconnection, and rollback.
- [ ] Browser QA covers desktop and 390px mobile.
- [ ] Final verification includes `npm run test` and `npm run build`.

