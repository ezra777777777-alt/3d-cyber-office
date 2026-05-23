import { useState, useMemo } from 'react';
import { useEventStore } from '@/store/eventStore';
import { useOfficeStore } from '@/store/officeStore';
import { useUIStore } from '@/store/uiStore';
import { filterEventRows } from './workbenchTesting';
import type { EventRowLevel, EventRowSearchItem } from './workbenchTesting';
import { useDashboardStore } from '@/store/dashboardStore';
import { WorkbenchHeader } from './WorkbenchHeader';

const LEVEL_COLORS: Record<string, string> = {
  info: '#8888aa',
  warn: '#f0a500',
  error: '#ff3366',
  success: '#00e676',
};

const SOURCE_OPTIONS = [
  { key: 'all', label: '全部来源' },
  { key: 'demo', label: 'Demo' },
  { key: 'commander', label: 'Commander' },
  { key: 'runtime', label: 'Runtime' },
  { key: 'user', label: '用户' },
] as const;

type EventSource = 'demo' | 'commander' | 'runtime' | 'user';

function getLevel(type: string): EventRowLevel {
  if (type.includes('failed') || type.includes('blocked') || type.includes('adapter_error')) return 'error';
  if (type.includes('waiting_input') || type.includes('approval.requested')) return 'warn';
  if (type.includes('completed') || type.includes('artifact.created')) return 'success';
  return 'info';
}

function isSourceMatch(source: string | null | undefined, filter: EventSource | 'all'): boolean {
  if (filter === 'all') return true;
  if (filter === 'demo') return source === 'demo';
  if (filter === 'commander') return source === 'commander';
  if (filter === 'runtime') return source === 'runtime';
  if (filter === 'user') return source === 'user';
  return true;
}

export function LogsView() {
  const [levelFilter, setLevelFilter] = useState<EventRowLevel | 'all'>('all');
  const [sourceFilter, setSourceFilter] = useState<EventSource | 'all'>('all');
  const [query, setQuery] = useState('');
  const events = useEventStore((s) => s.events);
  const getTask = useOfficeStore((s) => s.getTask);
  const selectTask = useUIStore((s) => s.selectTask);
  const selectAgent = useUIStore((s) => s.selectAgent);
  const setActiveModule = useUIStore((s) => s.setActiveModule);
  const setSelectedArtifactId = useDashboardStore((s) => s.setSelectedArtifactId);

  const rows: EventRowSearchItem[] = useMemo(
    () =>
      [...events].reverse().map((evt) => ({
        id: evt.id,
        type: evt.type,
        message: evt.payload?.message != null ? String(evt.payload.message) : evt.type,
        level: getLevel(evt.type),
        taskId: evt.taskId,
        agentId: evt.agentId,
        artifactId: evt.artifactId ?? null,
        source: evt.source ?? null,
      })),
    [events],
  );

  const filtered = useMemo(() => {
    const byLevel = filterEventRows(rows, query, levelFilter);
    return byLevel.filter((row) => isSourceMatch(row.source, sourceFilter));
  }, [rows, query, levelFilter, sourceFilter]);

  return (
    <div className="workbench-page flex flex-col">
      <WorkbenchHeader title="事件日志" subtitle="查看 Demo、Runtime、Commander 和用户动作。" />

      <div className="flex flex-wrap items-center gap-2 mb-2">
        {SOURCE_OPTIONS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setSourceFilter(key)}
            className={`px-3 py-1 text-xs rounded ${
              sourceFilter === key
                ? 'bg-cyber-accent/15 text-cyber-accent border border-cyber-accent/30'
                : 'text-gray-400 hover:text-white border border-transparent'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-3">
        {(['all', 'info', 'warn', 'error', 'success'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setLevelFilter(f)}
            className={`px-3 py-1 text-xs rounded capitalize ${
              levelFilter === f
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
          placeholder="搜索任务、审批、工具、运行时…"
          className="min-w-[220px] flex-1 rounded border border-cyber-border bg-cyber-dark px-3 py-1.5 text-xs text-white outline-none focus:border-cyber-accent/50"
        />
      </div>

      <div className="flex-1 overflow-y-auto space-y-1">
        {filtered.length === 0 && (
          <div className="text-gray-600 text-sm text-center py-12">暂无日志</div>
        )}
        {filtered.map((row) => (
          <div
            key={row.id}
            className="flex gap-2 items-start text-xs hover:bg-white/5 rounded px-2 py-1.5 cursor-pointer"
            onClick={() => {
              if (row.taskId) selectTask(row.taskId);
              else if (row.agentId) selectAgent(row.agentId);
            }}
          >
            <span className="text-gray-600 font-mono whitespace-nowrap w-20">
              {events.find((e) => e.id === row.id)?.occurredAt
                ? new Date(events.find((e) => e.id === row.id)!.occurredAt).toLocaleTimeString('zh-CN')
                : ''}
            </span>
            <span className="font-mono w-16" style={{ color: LEVEL_COLORS[row.level] }}>
              [{row.level.toUpperCase()}]
            </span>
            <span className="text-gray-300 whitespace-nowrap">{row.type}</span>
            <span className="text-gray-500 truncate flex-1 min-w-0">{row.message}</span>
            <div className="flex gap-1 flex-shrink-0">
              {row.taskId && (
                <button
                  className="text-[10px] px-1.5 py-0.5 rounded border border-cyber-border text-gray-400 hover:text-white"
                  onClick={(e) => { e.stopPropagation(); selectTask(row.taskId!); }}
                >
                  查看任务
                </button>
              )}
              {row.artifactId && (
                <button
                  className="text-[10px] px-1.5 py-0.5 rounded border border-cyber-border text-gray-400 hover:text-white"
                  onClick={(e) => { e.stopPropagation(); setActiveModule('files'); setSelectedArtifactId(row.artifactId!); }}
                >
                  查看产物
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
