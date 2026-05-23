import { useUIStore } from '@/store/uiStore';
import { useOfficeStore } from '@/store/officeStore';
import { useEventStore } from '@/store/eventStore';
import { ROLE_LABELS } from '@/data/defaultLayout';
import { labelForAgentStatus, labelForTaskStatus } from '@/i18n/zh';

const STATUS_COLORS: Record<string, string> = {
  idle: '#666688',
  working: '#00f0ff',
  waiting_input: '#f0a500',
  blocked: '#ff3366',
  offline: '#444466',
};

const TASK_STATUS_COLORS: Record<string, string> = {
  created: '#8888aa',
  queued: '#8888aa',
  assigned: '#00f0ff',
  running: '#00f0ff',
  waiting_input: '#f0a500',
  blocked: '#ff3366',
  failed: '#ff3366',
  completed: '#00e676',
  cancelled: '#666688',
};

export function SidePanel() {
  const selectedAgentId = useUIStore((s) => s.selectedAgentId);
  const selectedTaskId = useUIStore((s) => s.selectedTaskId);
  const clearSelection = useUIStore((s) => s.clearSelection);
  const agent = useOfficeStore((s) => (selectedAgentId ? s.getAgent(selectedAgentId) : undefined));
  const task = useOfficeStore((s) => {
    const tid = selectedTaskId || agent?.currentTaskId;
    return tid ? s.getTask(tid) : undefined;
  });
  const recentEvents = useEventStore((s) => {
    const id = selectedAgentId || selectedTaskId;
    if (!id) return [];
    return s.getRecentEvents(20).filter((e) => e.agentId === id || e.taskId === id).slice(0, 10);
  });

  if (!selectedAgentId && !selectedTaskId) {
    return null;
  }

  return (
    <div className="w-72 cyber-panel m-2 p-3 flex flex-col gap-3 overflow-y-auto text-xs max-h-[calc(100vh-6rem)]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-cyber-accent font-semibold text-sm truncate">
          {agent ? agent.name : task?.title}
        </h3>
        <button onClick={clearSelection} className="text-gray-500 hover:text-white text-lg leading-none">
          &times;
        </button>
      </div>

      {/* Agent info */}
      {agent && (
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-500">职责</span>
            <span className="text-white">{ROLE_LABELS[agent.role] || agent.role}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">状态</span>
            <span style={{ color: STATUS_COLORS[agent.status] }}>{labelForAgentStatus(agent.status)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">工位</span>
            <span className="text-white">{agent.deskId}</span>
          </div>
          {agent.lastActiveAt && (
            <div className="flex justify-between">
              <span className="text-gray-500">上次活跃</span>
              <span className="text-gray-400">{formatTime(agent.lastActiveAt)}</span>
            </div>
          )}
        </div>
      )}

      {/* Task info */}
      {task && (
        <div className="space-y-2 border-t border-cyber-border pt-2">
          <div className="text-gray-400 font-medium">当前任务</div>
          <div className="text-white text-sm font-medium">{task.title}</div>
          <div className="flex justify-between">
            <span className="text-gray-500">状态</span>
            <span style={{ color: TASK_STATUS_COLORS[task.status] }}>{labelForTaskStatus(task.status)}</span>
          </div>
          {task.summary && <div className="text-gray-400">{task.summary}</div>}
          {task.outputSummary && (
            <div className="text-cyber-success border-l-2 border-cyber-success pl-2">{task.outputSummary}</div>
          )}
          {task.errorSummary && (
            <div className="text-cyber-danger border-l-2 border-cyber-danger pl-2">{task.errorSummary}</div>
          )}
          {recentEvents.some((e) => e.source === 'runtime') && (
            <div className="flex justify-between border-t border-cyber-border pt-2">
              <span className="text-gray-500">来源</span>
              <span className="text-[#22c55e] font-mono text-[10px]">运行时</span>
            </div>
          )}
        </div>
      )}

      {/* Event feed */}
      {recentEvents.length > 0 && (
        <div className="border-t border-cyber-border pt-2">
          <div className="text-gray-400 font-medium mb-2">最近事件</div>
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {recentEvents.map((evt) => (
              <div key={evt.id} className="flex gap-2 items-start">
                <span className="text-gray-600 whitespace-nowrap">{formatTime(evt.occurredAt)}</span>
                <span className="text-gray-300 truncate">{evt.type}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } catch {
    return iso;
  }
}
