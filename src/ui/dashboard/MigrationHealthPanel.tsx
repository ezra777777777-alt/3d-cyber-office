import type { MigrationHealthResult } from '@/migration/migrationHealth';
import { createMigrationCoverageSummary } from '@/migration/migrationHealth';

export function MigrationHealthPanel({ health }: { health: MigrationHealthResult | null }) {
  if (!health) {
    return (
      <section className="cyber-panel p-3">
        <h3 className="text-sm font-semibold text-white">迁移健康检查</h3>
        <p className="text-sm text-gray-400 mt-1">预览导出或导入后，这里会显示状态覆盖、风险和恢复建议。</p>
      </section>
    );
  }

  const color =
    health.status === 'blocked'
      ? 'text-red-300'
      : health.status === 'warning'
        ? 'text-amber-300'
        : 'text-cyber-success';
  return (
    <section className="cyber-panel p-3">
      <h3 className="text-sm font-semibold text-white">迁移健康检查</h3>
      <p className={`text-sm mt-1 ${color}`}>
        {health.status === 'ok'
          ? '可以迁移'
          : health.status === 'warning'
            ? '可以迁移，但有缺失项'
            : '已阻止迁移'}
      </p>
      <p className="text-xs text-gray-400 mt-2">{createMigrationCoverageSummary(health.counts)}</p>
      {health.errors.length > 0 && (
        <ul className="mt-2 text-xs text-red-300 space-y-1">
          {health.errors.map((error) => <li key={error}>{error}</li>)}
        </ul>
      )}
      {health.warnings.length > 0 && (
        <ul className="mt-2 text-xs text-amber-300 space-y-1">
          {health.warnings.map((warning) => <li key={warning}>{warning}</li>)}
        </ul>
      )}
    </section>
  );
}
