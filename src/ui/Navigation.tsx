import { useUIStore } from '@/store/uiStore';

const MODULES = [
  { id: 'office', label: 'Office' },
  { id: 'calendar', label: 'Calendar' },
  { id: 'logs', label: 'Logs' },
  { id: 'files', label: 'Files' },
  { id: 'cronjobs', label: 'Cron Jobs' },
  { id: 'gateway', label: 'Gateway' },
  { id: 'review', label: 'Review' },
];

export function Navigation() {
  const activeModule = useUIStore((s) => s.activeModule);
  const setActiveModule = useUIStore((s) => s.setActiveModule);

  return (
    <nav className="flex items-center gap-1 px-2 sm:px-3 py-1.5 sm:py-2 border-b border-cyber-border bg-cyber-panel/80 backdrop-blur-sm flex-wrap">
      <div className="text-cyber-accent font-semibold text-xs sm:text-sm mr-2 sm:mr-4 tracking-wider whitespace-nowrap">
        CYBER OFFICE
      </div>
      {MODULES.map((mod) => (
        <button
          key={mod.id}
          onClick={() => setActiveModule(mod.id)}
          className={`px-1.5 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-xs rounded transition-colors whitespace-nowrap ${
            activeModule === mod.id
              ? 'bg-cyber-accent/15 text-cyber-accent border border-cyber-accent/30'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          {mod.label}
        </button>
      ))}
    </nav>
  );
}
