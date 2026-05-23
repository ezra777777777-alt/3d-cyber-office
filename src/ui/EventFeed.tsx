import { useEventStore } from '@/store/eventStore';

const EVENT_STYLES: Record<string, { color: string; icon: string }> = {
  'task.created': { color: '#8888aa', icon: '+' },
  'task.queued': { color: '#8888aa', icon: '~' },
  'task.assigned': { color: '#00f0ff', icon: '>' },
  'task.started': { color: '#00f0ff', icon: '>>' },
  'task.progress': { color: '#00f0ff', icon: '...' },
  'task.waiting_input': { color: '#f0a500', icon: '?' },
  'task.blocked': { color: '#ff3366', icon: '!!' },
  'task.failed': { color: '#ff3366', icon: 'X' },
  'task.completed': { color: '#00e676', icon: 'OK' },
  'task.cancelled': { color: '#666688', icon: '--' },
  'agent.status_changed': { color: '#b347ea', icon: '@' },
  'office.demo_reset': { color: '#666688', icon: 'R' },
  'user.action': { color: '#00e676', icon: 'ME' },
  'user.message': { color: '#00e676', icon: 'MSG' },
  'task.planned': { color: '#6366f1', icon: 'PL' },
  'tool.called': { color: '#f59e0b', icon: 'TL' },
  'artifact.created': { color: '#8b5cf6', icon: 'A+' },
  'approval.requested': { color: '#f97316', icon: '?!' },
  'approval.resolved': { color: '#22c55e', icon: 'OK' },
  'commander.summary_ready': { color: '#00f0ff', icon: 'SUM' },
  'runtime.heartbeat': { color: '#22c55e', icon: 'HB' },
  'runtime.adapter_error': { color: '#ff3366', icon: 'ERR' },
};

export function EventFeed() {
  const events = useEventStore((s) => s.getRecentEvents(12));

  return (
    <div className="cyber-panel m-2 p-2 flex flex-col max-h-48 overflow-hidden">
      <div className="text-gray-500 text-xs font-medium mb-2 px-1">Event Feed</div>
      <div className="flex-1 overflow-y-auto space-y-0.5">
        {events.length === 0 && (
          <div className="text-gray-600 text-xs px-1 py-2 italic">No events yet...</div>
        )}
        {events.map((evt) => {
          const style = EVENT_STYLES[evt.type] || { color: '#666688', icon: '*' };
          return (
            <div key={evt.id} className="flex gap-2 items-start text-xs hover:bg-white/5 rounded px-1 py-0.5">
              <span className="text-gray-600 whitespace-nowrap font-mono">{formatTime(evt.occurredAt)}</span>
              {evt.source === 'runtime' && (
                <span className="text-[#22c55e] font-mono text-[10px] px-0.5 border border-[#22c55e]/30 rounded">RT</span>
              )}
              <span style={{ color: style.color }} className="font-mono w-6">{style.icon}</span>
              <span className="text-gray-300 truncate">{evt.type}</span>
              {evt.payload?.message != null && (
                <span className="text-gray-500 truncate">{String(evt.payload.message).slice(0, 40)}</span>
              )}
              {evt.payload?.action === 'complete' && (
                <span className="text-cyber-success truncate">Completed: {String(evt.payload.title || '').slice(0, 30)}</span>
              )}
              {evt.payload?.action === 'stage_toggle' && (
                <span className="text-gray-400 truncate">{String(evt.payload.stage || '')}: {typeof evt.payload.progress === 'number' ? Math.round(evt.payload.progress * 100) + '%' : ''}</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } catch {
    return '';
  }
}
