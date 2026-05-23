import { useMemo, useState } from 'react';
import { createMigrationExportText, downloadMigrationText } from '@/migration/exportBundle';
import { applyMigrationImportPlan, parseMigrationBundleText } from '@/migration/importBundle';
import { getRestoreChecklistStatus } from '@/migration/migrationTesting';
import { checkMigrationBundleHealth } from '@/migration/migrationHealth';
import type { MigrationHealthResult } from '@/migration/migrationHealth';
import type { MigrationImportPlan } from '@/migration/migrationTypes';
import { WorkbenchHeader } from './WorkbenchHeader';
import { MigrationHealthPanel } from './MigrationHealthPanel';

export function MigrationView() {
  const [exportText, setExportText] = useState('');
  const [secretWarnings, setSecretWarnings] = useState<string[]>([]);
  const [importText, setImportText] = useState('');
  const [importPlan, setImportPlan] = useState<MigrationImportPlan | null>(null);
  const [status, setStatus] = useState('');
  const [health, setHealth] = useState<MigrationHealthResult | null>(null);

  const importSummary = useMemo(() => {
    if (!importPlan) return '尚未预览导入文件。';
    if (!importPlan.valid) return importPlan.errors.join(' ');
    return `${importPlan.writes.length} 个分区已就绪，可恢复。`;
  }, [importPlan]);

  const restoreItems = useMemo(() => {
    if (!importPlan?.bundle) return [];
    return getRestoreChecklistStatus(importPlan.bundle);
  }, [importPlan]);

  function handleExport() {
    const result = createMigrationExportText();
    setExportText(result.text);
    setSecretWarnings(result.secretLikeKeys);
    setStatus(`导出就绪：${result.filename}`);
    try {
      const bundle = JSON.parse(result.text);
      setHealth(checkMigrationBundleHealth({ ...bundle, storage: Object.fromEntries(bundle.sections.map((s: any) => [s.key, s.value])) }));
    } catch {
      setHealth(null);
    }
  }

  function handleDownload() {
    const result = createMigrationExportText();
    downloadMigrationText(result.filename, result.text);
    setStatus(`已下载 ${result.filename}`);
  }

  function handlePreviewImport() {
    const plan = parseMigrationBundleText(importText);
    setImportPlan(plan);
    setStatus(plan.valid ? '导入预览有效。' : '导入预览失败。');
    if (plan.bundle) {
      const storage = Object.fromEntries(plan.bundle.sections.map((s) => [s.key, s.value]));
      setHealth(checkMigrationBundleHealth({ ...plan.bundle, storage }));
    } else {
      setHealth(null);
    }
  }

  function handleApplyImport() {
    if (!importPlan) return;
    applyMigrationImportPlan(importPlan);
    setStatus('导入已应用。刷新页面以加载恢复的状态。');
  }

  return (
    <div className="workbench-page">
      <WorkbenchHeader title="迁移" subtitle="导出本地办公室状态，在另一台电脑上恢复。" />

      <div className="migration-grid">
        <section className="cyber-panel p-4">
          <h3 className="text-sm font-medium text-white">导出数据包</h3>
          <p className="mt-2 text-xs leading-5 text-gray-400">
            包含 UI、办公室、仪表盘和 Commander 本地状态。运行时的密钥不会导出。
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" className="cyber-btn text-xs" onClick={handleExport}>预览 JSON</button>
            <button type="button" className="cyber-btn text-xs" onClick={handleDownload}>下载 JSON</button>
          </div>
          {secretWarnings.length > 0 && (
            <div className="mt-3 rounded border border-cyber-warning/40 p-3 text-xs text-cyber-warning">
              检测到迁移数据包外存在疑似密钥的键：{secretWarnings.join(', ')}
            </div>
          )}
          <textarea className="migration-textarea" value={exportText} readOnly />
        </section>

        <section className="cyber-panel p-4">
          <h3 className="text-sm font-medium text-white">导入数据包</h3>
          <p className="mt-2 text-xs leading-5 text-gray-400">
            粘贴迁移 JSON 包，预览写入内容，然后应用。导入后需刷新页面。
          </p>
          <textarea className="migration-textarea" value={importText} onChange={(event) => setImportText(event.target.value)} />
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" className="cyber-btn text-xs" onClick={handlePreviewImport}>预览导入</button>
            <button type="button" className="cyber-btn text-xs" disabled={!importPlan?.valid || health?.status === 'blocked'} onClick={handleApplyImport}>应用导入</button>
          </div>
          <div className="mt-3 text-xs text-gray-400">{importSummary}</div>
          <p className="text-xs text-gray-500 mt-2">
            Runtime 凭据不会进入迁移包。换电脑后请在外部 Runtime 里重新配置真实服务。
          </p>
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

      <div className="mt-4">
        <MigrationHealthPanel health={health} />
      </div>

      <section className="cyber-panel mt-4 p-4">
        <h3 className="text-sm font-medium text-white">恢复验证</h3>
        <ul className="migration-checklist">
          <li>打开办公室，确认 Agent、选中任务与 Commander 面板正常渲染。</li>
          <li>打开日程，确认计划进度与阶段已恢复。</li>
          <li>打开任务与文件，确认工作台数据存在。</li>
          <li>运行 Commander 演示或审批交付，确认演示仍可正常运转。</li>
          <li>在目标机器上手动重新连接外部运行时凭据。</li>
        </ul>
      </section>

      {status && <div className="mt-3 text-xs text-cyber-accent">{status}</div>}
    </div>
  );
}
