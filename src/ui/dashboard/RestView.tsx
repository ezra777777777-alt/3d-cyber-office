import { demoRestCards } from '@/data/demoSchedules';
import { useDashboardStore } from '@/store/dashboardStore';
import { WorkbenchHeader } from './WorkbenchHeader';

export function RestView() {
  const restMuted = useDashboardStore((state) => state.restMuted);
  const toggleRestMuted = useDashboardStore((state) => state.toggleRestMuted);

  return (
    <div className="workbench-page">
      <WorkbenchHeader
        title="Quiet Garden"
        subtitle="Rest, sound, and daily-surprise slices for idle agents."
        actions={<button className="cyber-btn text-xs" onClick={toggleRestMuted}>{restMuted ? 'Unmute' : 'Mute'}</button>}
      />
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
