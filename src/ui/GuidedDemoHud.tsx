import { useUIStore } from '@/store/uiStore';

export function GuidedDemoHud() {
  const demoRunning = useUIStore((state) => state.demoRunning);
  const demoPaused = useUIStore((state) => state.demoPaused);
  const title = useUIStore((state) => state.guidedDemoTitle);
  const body = useUIStore((state) => state.guidedDemoBody);
  const progress = useUIStore((state) => state.guidedDemoProgress);

  if (!demoRunning || !title) return null;

  return (
    <aside className="guided-demo-hud pointer-events-none">
      <div className="guided-demo-kicker">{demoPaused ? '导览已暂停' : '视频复刻导览'}</div>
      <h2>{title}</h2>
      {body && <p>{body}</p>}
      <div className="guided-demo-progress" aria-label="导览进度">
        <span style={{ width: `${Math.round(progress * 100)}%` }} />
      </div>
    </aside>
  );
}
