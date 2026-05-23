import { useUIStore } from '@/store/uiStore';
import { useOfficeStore } from '@/store/officeStore';
import { useEventStore } from '@/store/eventStore';
import { useCommanderStore } from '@/store/commanderStore';
import { startDemoEngine, stopDemoEngine } from '@/demo/demoEngine';
import { fullDemoScenario } from '@/demo/scenarios';
import { commanderFullScenario, commanderApprovedDeliveryScenario } from '@/demo/commanderScenario';
import { buildGuidedDemoTimeline } from '@/demo/guidedDemoTimeline';
import { actionLabels } from '@/i18n/zh';

export function DemoControls() {
  const demoRunning = useUIStore((s) => s.demoRunning);
  const demoPaused = useUIStore((s) => s.demoPaused);
  const setDemoRunning = useUIStore((s) => s.setDemoRunning);
  const setDemoPaused = useUIStore((s) => s.setDemoPaused);
  const reset = useOfficeStore((s) => s.reset);
  const clearEvents = useEventStore((s) => s.clear);
  const resetCommander = useCommanderStore((s) => s.resetCommander);
  const createMissionFromDraft = useCommanderStore((s) => s.createMissionFromDraft);
  const clearGuidedDemo = useUIStore((s) => s.clearGuidedDemo);

  function handleStartGuidedDemo() {
    try {
      stopDemoEngine();
      clearEvents();
      reset();
      resetCommander();
      clearGuidedDemo();
      createMissionFromDraft();
      setDemoRunning(true);
      setDemoPaused(false);
      startDemoEngine(buildGuidedDemoTimeline());
    } catch (err) {
      console.error('[DemoControls] Guided demo start failed:', err);
    }
  }

  function handleStart() {
    try {
      stopDemoEngine();
      clearEvents();
      reset();
      resetCommander();
      setDemoRunning(true);
      setDemoPaused(false);
      startDemoEngine(fullDemoScenario());
    } catch (err) {
      console.error('[DemoControls] Start failed:', err);
    }
  }

  function handleStartCommander() {
    try {
      stopDemoEngine();
      clearEvents();
      reset();
      resetCommander();
      createMissionFromDraft();
      setDemoRunning(true);
      setDemoPaused(false);
      startDemoEngine(commanderFullScenario());
    } catch (err) {
      console.error('[DemoControls] Commander start failed:', err);
    }
  }

  function handleStartApprovedDelivery() {
    try {
      stopDemoEngine();
      clearEvents();
      reset();
      resetCommander();
      createMissionFromDraft();
      setDemoRunning(true);
      setDemoPaused(false);
      startDemoEngine(commanderApprovedDeliveryScenario());
    } catch (err) {
      console.error('[DemoControls] Approved delivery start failed:', err);
    }
  }

  function handleReset() {
    try {
      setDemoRunning(false);
      setDemoPaused(false);
      stopDemoEngine();
      clearEvents();
      reset();
      resetCommander();
      clearGuidedDemo();
    } catch (err) {
      console.error('[DemoControls] Reset failed:', err);
    }
  }

  return (
    <div
      className="m-2 p-2 flex items-center gap-2 rounded-lg border border-cyber-border bg-cyber-panel flex-wrap"
      style={{ zIndex: 50, position: 'relative' }}
    >
      <span className="text-gray-500 text-xs font-medium">演示</span>
      <div className="flex-1" />
      {!demoRunning ? (
        <>
          <button className="cyber-btn" onClick={handleStartGuidedDemo} style={{ borderColor: '#ffb84d66', color: '#ffb84d' }}>
            {actionLabels.startGuidedDemo}
          </button>
          <button className="cyber-btn" onClick={handleStart}>
            {actionLabels.startStandardDemo}
          </button>
          <button className="cyber-btn" onClick={handleStartCommander} style={{ borderColor: '#00f0ff66', color: '#00f0ff' }}>
            {actionLabels.startCommanderDemo}
          </button>
          <button className="cyber-btn" onClick={handleStartApprovedDelivery} style={{ borderColor: '#22c55e66', color: '#22c55e' }}>
            {actionLabels.startApprovedDelivery}
          </button>
        </>
      ) : (
        <>
          <button className="cyber-btn" onClick={() => setDemoPaused(!demoPaused)}>
            {demoPaused ? actionLabels.resume : actionLabels.pause}
          </button>
          <button
            className="cyber-btn"
            style={{ borderColor: '#ff336644', color: '#ff3366' }}
            onClick={handleReset}
          >
            {actionLabels.reset}
          </button>
        </>
      )}
    </div>
  );
}
