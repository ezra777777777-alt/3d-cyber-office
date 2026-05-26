import { useRuntimeStore } from '@/store/runtimeStore';
import { labelForRuntimeMode, labelForRuntimeStatus } from '@/i18n/zh';

const MODES = ['demo', 'mock', 'connected', 'offline'] as const;

export function RuntimeModeSwitch() {
  const mode = useRuntimeStore((state) => state.mode);
  const status = useRuntimeStore((state) => state.status);
  const setMode = useRuntimeStore((state) => state.setMode);
  const resetRuntime = useRuntimeStore((state) => state.resetRuntime);

  return (
    <div className="runtime-mode-switch">
      <span className="text-gray-400 text-xs font-medium">运行时</span>
      {MODES.map((nextMode) => (
        <button
          key={nextMode}
          type="button"
          className={mode === nextMode ? 'cyber-btn text-xs' : 'workbench-chip'}
          onClick={() => {
            resetRuntime();
            setMode(nextMode);
          }}
        >
          {labelForRuntimeMode(nextMode)}
        </button>
      ))}
      <span
        className="text-xs font-medium"
        style={{ color: status === 'connected' ? '#00e676' : status === 'error' ? '#ff3366' : '#8888aa' }}
      >
        {labelForRuntimeStatus(status)}
      </span>
    </div>
  );
}
