import { useMemo, useState } from 'react';
import { createMigrationExportText, downloadMigrationText } from '@/migration/exportBundle';
import { applyMigrationImportPlan, parseMigrationBundleText } from '@/migration/importBundle';
import { getRestoreChecklistStatus } from '@/migration/migrationTesting';
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

  const restoreItems = useMemo(() => {
    if (!importPlan?.bundle) return [];
    return getRestoreChecklistStatus(importPlan.bundle);
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
          {restoreItems.length > 0 && (
            <div className="mt-3 flex flex-col gap-1">
              {restoreItems.map((item) => (
                <div key={item.key} className={item.ready ? 'text-cyber-success' : 'text-cyber-warning'}>
                  {item.ready ? 'PASS' : 'CHECK'} {item.label}
                </div>
              ))}
            </div>
          )}
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
