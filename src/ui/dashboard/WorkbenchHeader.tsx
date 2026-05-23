import type { ReactNode } from 'react';
import type { WorkbenchSource } from '@/core/types';

const SOURCE_LABELS: Record<WorkbenchSource, string> = {
  demo: 'Demo',
  local: 'Local',
  runtime: 'Runtime',
  cron: 'Cron',
  google_tasks: 'Google Tasks',
  system: 'System',
  user: 'User',
};

export function SourceBadge({ source }: { source: WorkbenchSource }) {
  return (
    <span className="rounded border border-cyber-border bg-cyber-panel px-2 py-0.5 text-[11px] text-gray-300">
      {SOURCE_LABELS[source]}
    </span>
  );
}

export function WorkbenchHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle: string;
  actions?: ReactNode;
}) {
  return (
    <header className="workbench-header">
      <div>
        <h2 className="text-lg font-semibold text-cyber-accent">{title}</h2>
        <p className="text-xs text-gray-500">{subtitle}</p>
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}
