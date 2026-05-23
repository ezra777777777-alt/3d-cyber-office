import { demoRestCards } from '@/data/demoSchedules';
import { useDashboardStore } from '@/store/dashboardStore';
import { WorkbenchHeader } from './WorkbenchHeader';

const REST_MODES = [
  { key: 'normal', label: '正常' },
  { key: 'focus', label: '专注' },
  { key: 'muted', label: '静音' },
] as const;

const MODE_COPY: Record<string, string> = {
  normal: '正常工作模式，所有事件和提醒正常显示。',
  focus: '专注模式，降低非关键提醒，保持任务状态机运行。',
  muted: '静音模式，暂停界面通知和音效。',
};

export function RestView() {
  const restMuted = useDashboardStore((state) => state.restMuted);
  const toggleRestMuted = useDashboardStore((state) => state.toggleRestMuted);
  const restMode = useDashboardStore((state) => state.restMode);
  const setRestMode = useDashboardStore((state) => state.setRestMode);

  return (
    <div className="workbench-page">
      <WorkbenchHeader
        title="休息区"
        subtitle="查看静音、专注和 Agent 轻量状态。"
        actions={
          <button className="cyber-btn text-xs" onClick={toggleRestMuted}>
            {restMuted ? '取消静音' : '静音'}
          </button>
        }
      />

      {/* Rest mode segmented control */}
      <div className="workbench-filter-row mb-4">
        {REST_MODES.map(({ key, label }) => (
          <button
            key={key}
            className={restMode === key ? 'cyber-btn text-xs' : 'workbench-chip'}
            onClick={() => setRestMode(key)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mb-4 text-xs text-gray-500 border-l-2 border-cyber-border pl-3">
        <p>{MODE_COPY[restMode]}</p>
        <p className="mt-1 text-gray-600">休息模式只影响界面提醒，不改变任务状态。</p>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {demoRestCards.map((card) => (
          <article key={card.id} className="cyber-panel p-4">
            <div className="mb-2 h-1 rounded" style={{ backgroundColor: card.accent }} />
            <h3 className="text-sm font-medium text-white">{card.title}</h3>
            <p className="mt-2 text-xs leading-5 text-gray-400">{card.summary}</p>
            <div className="mt-3 text-[11px] uppercase tracking-wide text-gray-500">{card.kind.replace('_', ' ')}</div>
          </article>
        ))}
      </div>
    </div>
  );
}
