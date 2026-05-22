import { useOfficeStore } from '@/store/officeStore';

export function StatusBar() {
  const tasks = useOfficeStore((s) => s.getAllTasks());
  const agents = useOfficeStore((s) => s.getAllAgents());

  const total = tasks.length;
  const running = tasks.filter((t) => t.status === 'running').length;
  const waitingInput = tasks.filter((t) => t.status === 'waiting_input').length;
  const failed = tasks.filter((t) => t.status === 'blocked' || t.status === 'failed').length;
  const activeAgents = agents.filter((a) => a.status === 'working').length;

  const items = [
    { label: 'Tasks', value: total, color: '#e0e0f0' },
    { label: 'Running', value: running, color: '#00f0ff' },
    { label: 'Waiting', value: waitingInput, color: '#f0a500' },
    { label: 'Failed', value: failed, color: failed > 0 ? '#ff3366' : '#666688' },
    { label: 'Active', value: activeAgents, color: '#00e676' },
  ];

  return (
    <div className="flex items-center gap-4 px-4 py-1.5 border-b border-cyber-border bg-cyber-dark/80 text-xs">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-1.5">
          <span className="text-gray-500">{item.label}</span>
          <span className="font-semibold tabular-nums" style={{ color: item.color }}>
            {item.value}
          </span>
        </div>
      ))}
    </div>
  );
}
