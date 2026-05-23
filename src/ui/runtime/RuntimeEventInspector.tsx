import { useRuntimeStore } from '@/store/runtimeStore';
import { redactRuntimePayload } from '@/runtime/runtimeTesting';

export function RuntimeEventInspector() {
  const rawEvents = useRuntimeStore((state) => state.rawEvents);

  return (
    <section className="cyber-panel p-4">
      <h3 className="text-sm font-medium text-white">运行时事件检查器</h3>
      <div className="mt-3 grid gap-2">
        {rawEvents.slice(0, 8).map((event) => (
          <article key={event.runtimeEventId} className="runtime-event-row">
            <div>
              <strong>{event.type}</strong>
              <span className="text-xs text-gray-500">{event.runtimeEventId}</span>
            </div>
            <pre>{JSON.stringify(redactRuntimePayload(event.payload), null, 2)}</pre>
          </article>
        ))}
        {rawEvents.length === 0 ? (
          <p className="text-xs text-gray-500">尚未收到运行时事件。</p>
        ) : null}
      </div>
    </section>
  );
}
