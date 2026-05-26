export const BUILD_BUDGET_KB = {
  'vendor-3d': 900,
  'vendor-react': 280,
  app: 220,
  dashboard: 280,
  commander: 120,
  runtime: 80,
  css: 90,
  other: 160,
};

export function bytesToKb(bytes) {
  return Math.round((Number(bytes || 0) / 1024) * 100) / 100;
}

export function classifyAsset(fileName) {
  const name = String(fileName || '');
  if (name.includes('vendor-3d')) return 'vendor-3d';
  if (name.includes('vendor-react')) return 'vendor-react';
  if (name.includes('dashboard')) return 'dashboard';
  if (name.includes('commander')) return 'commander';
  if (name.includes('runtime')) return 'runtime';
  if (name.endsWith('.css')) return 'css';
  if (name.includes('index-') && name.endsWith('.js')) return 'app';
  return 'other';
}

export function stableAssetFileName(fileName) {
  const normalized = String(fileName || '').replaceAll('\\', '/');
  return normalized.replace(/^(.*)-[-_A-Za-z0-9]{8,}(\.(?:js|css))$/, '$1-[hash]$2');
}

export function summarizeAssets(assets) {
  const summary = {};
  for (const asset of assets) {
    const group = classifyAsset(asset.fileName);
    const current = summary[group] || { group, files: [], maxKb: 0, totalKb: 0 };
    const kb = bytesToKb(asset.bytes);
    current.files.push({ fileName: stableAssetFileName(asset.fileName), kb });
    current.maxKb = Math.max(current.maxKb, kb);
    current.totalKb = Math.round((current.totalKb + kb) * 100) / 100;
    summary[group] = current;
  }
  return summary;
}

export function sortSummary(summary) {
  return Object.fromEntries(
    Object.entries(summary)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([group, item]) => [
        group,
        {
          ...item,
          files: [...item.files].sort((a, b) => a.fileName.localeCompare(b.fileName)),
        },
      ]),
  );
}

export function evaluateBuildBudgets(summary, budgets = BUILD_BUDGET_KB) {
  const failures = [];
  for (const [group, item] of Object.entries(summary)) {
    const budgetKb = budgets[group] ?? budgets.other;
    if (item.maxKb > budgetKb) {
      failures.push({ group, maxKb: item.maxKb, budgetKb });
    }
  }
  return { ok: failures.length === 0, failures };
}

export function createBuildMetricsReport(assets, options = {}) {
  const summary = sortSummary(summarizeAssets(assets));
  const budget = evaluateBuildBudgets(summary);
  const report = {
    schemaVersion: 1,
    ok: budget.ok,
    summary,
    failures: budget.failures,
  };

  if (options.includeTimestamp) {
    report.generatedAt = options.generatedAt || new Date().toISOString();
  }

  return report;
}
