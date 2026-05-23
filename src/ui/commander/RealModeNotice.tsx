import { useCommanderStore } from '@/store/commanderStore';

export function RealModeNotice() {
  const mode = useCommanderStore((state) => state.adapterMode);
  const status = useCommanderStore((state) => state.adapterStatus);
  const error = useCommanderStore((state) => state.adapterError);

  if (mode === 'demo') return null;

  return (
    <section className="commander-section">
      <header className="commander-section-title">
        <span>真实 AI 边界</span>
        <span className="commander-pill">{status}</span>
      </header>
      <p className="text-xs text-gray-400">
        {mode === 'mock_ai'
          ? 'Mock AI 会模拟真实规划和审批，不会执行真实副作用。'
          : '真实 Adapter 当前为受保护占位，不会在浏览器请求或保存凭据。'}
      </p>
      {error && <p className="text-xs text-red-300 mt-2">{error}</p>}
    </section>
  );
}
