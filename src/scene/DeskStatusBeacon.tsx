import type { AgentStatus } from '@/core/types';

const BEACON_COLORS: Partial<Record<AgentStatus, string>> = {
  working: '#00f0ff',
  waiting_input: '#f0a500',
  approval_required: '#ffb84d',
  blocked: '#ff3366',
  failed: '#ff3366',
  completed: '#00e676',
};

export function DeskStatusBeacon({ status }: { status: AgentStatus }) {
  const color = BEACON_COLORS[status];
  if (!color) return null;

  return (
    <group position={[0.72, 1.18, -0.42]}>
      <mesh>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.1} />
      </mesh>
      <pointLight color={color} intensity={0.48} distance={1.5} />
    </group>
  );
}
