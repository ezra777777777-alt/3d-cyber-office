import { useUIStore } from '@/store/uiStore';
import { useOfficeStore } from '@/store/officeStore';
import { useEventStore } from '@/store/eventStore';

export function DemoControls() {
  const demoRunning = useUIStore((s) => s.demoRunning);
  const demoPaused = useUIStore((s) => s.demoPaused);
  const setDemoRunning = useUIStore((s) => s.setDemoRunning);
  const setDemoPaused = useUIStore((s) => s.setDemoPaused);
  const reset = useOfficeStore((s) => s.reset);
  const clearEvents = useEventStore((s) => s.clear);

  return (
    <div className="cyber-panel m-2 p-2 flex items-center gap-2">
      <span className="text-gray-500 text-xs font-medium">DEMO</span>
      <div className="flex-1" />
      {!demoRunning ? (
        <button
          className="cyber-btn"
          onClick={() => {
            clearEvents();
            reset();
            setDemoRunning(true);
            setDemoPaused(false);
          }}
        >
          Start Demo
        </button>
      ) : (
        <>
          <button
            className={demoPaused ? 'cyber-btn' : 'cyber-btn'}
            onClick={() => setDemoPaused(!demoPaused)}
          >
            {demoPaused ? 'Resume' : 'Pause'}
          </button>
          <button
            className="cyber-btn"
            style={{ borderColor: '#ff336644', color: '#ff3366' }}
            onClick={() => {
              setDemoRunning(false);
              setDemoPaused(false);
              clearEvents();
              reset();
            }}
          >
            Reset
          </button>
        </>
      )}
    </div>
  );
}
