import { useState } from 'react';
import { useEventStore } from '@/store/eventStore';
import { useOfficeStore } from '@/store/officeStore';
import { useUIStore } from '@/store/uiStore';

const LEVEL_COLORS: Record<string, string> = {
  info: '#8888aa',
  warn: '#f0a500',
  error: '#ff3366',
  success: '#00e676',
};

export function LogsView() {
  const [filter, setFilter] = useState<string>('all');
  const events = useEventStore((s) => s.events);
  const getTask = useOfficeStore((s) => s.getTask);
  const selectTask = useUIStore((s) => s.selectTask);
  const selectAgent = useUIStore((s) => s.selectAgent);

  const displayEvents = [...events].reverse();

  const getLevel = (type: string): string => {
    if (type.includes('failed') || type.includes('blocked')) return 'error';
    if (type.includes('waiting_input')) return 'warn';
    if (type.includes('completed')) return 'success';
    return 'info';
  };

  const filtered = filter === 'all'
    ? displayEvents
    : displayEvents.filter((e) => getLevel(e.type) === filter);

  return (
    <div className="p-6 h-full flex flex-col">
      <h2 className="text-lg font-semibold text-cyber-accent mb-4">Logs</h2>

      <div className="flex gap-2 mb-4">
        {['all', 'info', 'warn', 'error', 'success'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 text-xs rounded capitalize ${
              filter === f
                ? 'bg-cyber-accent/15 text-cyber-accent border border-cyber-accent/30'
                : 'text-gray-400 hover:text-white border border-transparent'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto space-y-1">
        {filtered.length === 0 && (
          <div className="text-gray-600 text-sm text-center py-12">No log entries</div>
        )}
        {filtered.map((evt) => {
          const level = getLevel(evt.type);
          return (
            <div
              key={evt.id}
              className="flex gap-2 items-start text-xs hover:bg-white/5 rounded px-2 py-1.5 cursor-pointer"
              onClick={() => {
                if (evt.taskId) selectTask(evt.taskId);
                else if (evt.agentId) selectAgent(evt.agentId);
              }}
            >
              <span className="text-gray-600 font-mono whitespace-nowrap w-20">
                {new Date(evt.occurredAt).toLocaleTimeString('zh-CN')}
              </span>
              <span className="font-mono w-16" style={{ color: LEVEL_COLORS[level] }}>
                [{level.toUpperCase()}]
              </span>
              <span className="text-gray-300">{evt.type}</span>
              {evt.payload?.message != null && (
                <span className="text-gray-500 truncate">{String(evt.payload.message)}</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
