import type { AgentRole, TaskStatus } from '@/core/types';

interface DeskScreenContentProps {
  status: TaskStatus | null;
  role: AgentRole | null;
  label: string;
  taskTitle?: string | null;
  density: 'low' | 'normal' | 'showcase';
}

const STATUS_COLORS: Record<string, string> = {
  running: '#00dff6',
  completed: '#00e676',
  blocked: '#ff3366',
  failed: '#ff1144',
  waiting_input: '#f0a500',
  approval_required: '#ffb84d',
  planned: '#6ecbff',
  assigned: '#8899cc',
};

export function DeskScreenContent({ status, role, label, taskTitle, density }: DeskScreenContentProps) {
  if (density === 'low') return null;

  const statusColor = status ? STATUS_COLORS[status] ?? '#8899cc' : '#556688';

  return (
    <group position={[0, 1.2, -0.34]}>
      {/* Top row: role indicator left, label center, status right */}
      <mesh position={[-0.44, 0.22, 0]}>
        <boxGeometry args={[0.2, 0.14, 0.01]} />
        <meshBasicMaterial color={statusColor} transparent opacity={0.85} />
      </mesh>

      <mesh position={[0, 0.22, 0]}>
        <boxGeometry args={[0.5, 0.14, 0.01]} />
        <meshBasicMaterial color="#1a1a2e" transparent opacity={0.6} />
      </mesh>

      <mesh position={[0.44, 0.22, 0]}>
        <boxGeometry args={[0.12, 0.12, 0.01]} />
        <meshBasicMaterial color={statusColor} transparent opacity={0.9} />
      </mesh>

      {/* Middle: progress bars */}
      <mesh position={[-0.3, 0.0, 0]}>
        <boxGeometry args={[0.8, 0.04, 0.01]} />
        <meshBasicMaterial color="#334455" transparent opacity={0.5} />
      </mesh>
      <mesh position={[-0.3 + (status === 'completed' ? 0.4 : status === 'running' ? 0.2 : 0), 0.0, 0.002]}>
        <boxGeometry args={[status === 'completed' ? 0.8 : status === 'running' ? 0.4 : 0.08, 0.04, 0.01]} />
        <meshBasicMaterial color={statusColor} transparent opacity={0.8} />
      </mesh>

      {/* Status indicator bar — replaces Text */}
      {status && (
        <mesh position={[0, -0.08, 0.006]}>
          <boxGeometry args={[0.18, 0.04, 0.01]} />
          <meshBasicMaterial color={statusColor} transparent opacity={0.9} />
        </mesh>
      )}

      {/* Task title indicator — replaces Text */}
      {taskTitle && (
        <mesh position={[0, -0.16, 0.006]}>
          <boxGeometry args={[0.35, 0.025, 0.01]} />
          <meshBasicMaterial color="#8899bb" transparent opacity={0.7} />
        </mesh>
      )}

      {/* Bottom: small worker identifier bars */}
      {[-0.3, -0.1, 0.1, 0.3].map((x, i) => (
        <mesh key={i} position={[x, -0.18, 0]}>
          <boxGeometry args={[0.12, 0.02, 0.01]} />
          <meshBasicMaterial
            color={status ? STATUS_COLORS[status] ?? '#556688' : '#334455'}
            transparent
            opacity={i < (status === 'completed' ? 4 : status === 'running' ? 3 : 1) ? 0.7 : 0.2}
          />
        </mesh>
      ))}
    </group>
  );
}
