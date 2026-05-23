import { useState, useMemo } from 'react';
import { useEventStore } from '@/store/eventStore';
import { useOfficeStore } from '@/store/officeStore';
import { useUIStore } from '@/store/uiStore';
import { filterEventRows } from './workbenchTesting';
import type { EventRowLevel, EventRowSearchItem } from './workbenchTesting';
import { WorkbenchHeader } from './WorkbenchHeader';

const LEVEL_COLORS: Record<string, string> = {
  info: '#8888aa',
  warn: '#f0a500',
  error: '#ff3366',
  success: '#00e676',
};

function getLevel(type: string): EventRowLevel {
  if (type.includes('failed') || type.includes('blocked')) return 'error';
  if (type.includes('waiting_input') || type.includes('approval')) return 'warn';
  if (type.includes('completed')) return 'success';
  return 'info';
}

export function LogsView() {
  const [filter, setFilter] = useState<EventRowLevel | 'all'>('all');
  const [query, setQuery] = useState('');
  const events = useEventStore((s) => s.events);
  const getTask = useOfficeStore((s) => s.getTask);
  const selectTask = useUIStore((s) => s.selectTask);
  const selectAgent = useUIStore((s) => s.selectAgent);

  const rows: EventRowSearchItem[] = useMemo(
    () =>
      [...events].reverse().map((evt) => ({
        id: evt.id,
        type: evt.type,
        message: evt.payload?.message != null ? String(evt.payload.message) : evt.type,
        level: getLevel(evt.type),
        taskId: evt.taskId,
        agentId: evt.agentId,
        occurredAt: evt.occurredAt,
      })),
    [events],
  );

  const filtered = filterEventRows(rows, query, filter);

  return (
    <div className="workbench-page flex flex-col">
      <WorkbenchHeader title="Logs / Events" subtitle="Searchable event stream from the office engine." />

      <div className="flex flex-wrap items-center gap-2 mb-3">
        {(['all', 'info', 'warn', 'error', 'success'] as const).map((f) => (
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
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search task, approval, tool, runtime..."
          className="min-w-[220px] flex-1 rounded border border-cyber-border bg-cyber-dark px-3 py-1.5 text-xs text-white outline-none focus:border-cyber-accent/50"
        />
      </div>

      <div className="flex-1 overflow-y-auto space-y-1">
        {filtered.length === 0 && (
          <div className="text-gray-600 text-sm text-center py-12">No log entries</div>
        )}
        {filtered.map((row) => {
          const evt = events.find((e) => e.id === row.id);
          return (
            <div
              key={row.id}
              className="flex gap-2 items-start text-xs hover:bg-white/5 rounded px-2 py-1.5 cursor-pointer"
              onClick={() => {
                if (evt?.taskId) selectTask(evt.taskId);
                else if (evt?.agentId) selectAgent(evt.agentId);
              }}
            >
              <span className="text-gray-600 font-mono whitespace-nowrap w-20">
                {evt ? new Date(evt.occurredAt).toLocaleTimeString('zh-CN') : ''}
              </span>
              <span className="font-mono w-16" style={{ color: LEVEL_COLORS[row.level] }}>
                [{row.level.toUpperCase()}]
              </span>
              <span className="text-gray-300">{row.type}</span>
              <span className="text-gray-500 truncate">{row.message}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
