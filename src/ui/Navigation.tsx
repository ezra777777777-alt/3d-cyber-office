import { useUIStore } from '@/store/uiStore';
import { moduleLabels, moduleShortLabels, type ModuleId } from '@/i18n/zh';

const MODULES: { id: ModuleId }[] = [
  { id: 'office' },
  { id: 'calendar' },
  { id: 'tasks' },
  { id: 'logs' },
  { id: 'files' },
  { id: 'history' },
  { id: 'cronjobs' },
  { id: 'gateway' },
  { id: 'review' },
  { id: 'rest' },
  { id: 'migration' },
];

export function Navigation() {
  const activeModule = useUIStore((s) => s.activeModule);
  const setActiveModule = useUIStore((s) => s.setActiveModule);

  return (
    <nav className="flex items-center gap-1 px-2 sm:px-3 py-1.5 sm:py-2 border-b border-cyber-border bg-cyber-panel/80 backdrop-blur-sm flex-wrap mobile-nav-scroll">
      <div className="text-cyber-accent font-semibold text-xs sm:text-sm mr-2 sm:mr-4 tracking-wider whitespace-nowrap">
        3D 赛博办公室
      </div>
      {MODULES.map((mod) => (
        <button
          key={mod.id}
          onClick={() => setActiveModule(mod.id)}
          className={`px-1.5 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-xs rounded transition-colors whitespace-nowrap ${
            activeModule === mod.id
              ? 'bg-cyber-accent/15 text-cyber-accent border border-cyber-accent/30'
              : 'text-gray-300 hover:text-white hover:bg-white/5'
          }`}
          title={moduleLabels[mod.id]}
        >
          <span className="sm:hidden">{moduleShortLabels[mod.id]}</span>
          <span className="hidden sm:inline">{moduleLabels[mod.id]}</span>
        </button>
      ))}
    </nav>
  );
}
