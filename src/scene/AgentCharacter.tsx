import { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useOfficeStore } from '@/store/officeStore';
import { useUIStore } from '@/store/uiStore';
import type { AgentStatus } from '@/core/types';
import { getRoleStyle } from './characterStyleConfig';
import { AssistantPod, LobsterCommandPod } from './CharacterKit';

interface AgentCharacterProps {
  agentId: string;
  position: [number, number, number];
  deskRotation?: number;
}

const STATUS_COLOR_MAP: Record<string, string> = {
  blocked: '#ff3366',
  failed: '#ff1144',
  waiting_input: '#f0a500',
  approval_required: '#ffb84d',
  completed: '#00e676',
  resting: '#7ce3aa',
  working: '#4fc3f7',
  idle: '#aab8c2',
  planning: '#c0c8d4',
  offline: '#667788',
};

export function AgentCharacter({ agentId, position, deskRotation = 0 }: AgentCharacterProps) {
  const groupRef = useRef<THREE.Group>(null);
  const pulseRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const agent = useOfficeStore((s) => s.getAgent(agentId));
  const selectedAgentId = useUIStore((s) => s.selectedAgentId);
  const selectAgent = useUIStore((s) => s.selectAgent);

  if (!agent) return null;

  const selected = agent.id === selectedAgentId;
  const status: AgentStatus = agent.status;
  const style = getRoleStyle(agent.id);
  const statusColor = STATUS_COLOR_MAP[status] ?? '#aab8c2';

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    const t = Date.now() * 0.001;

    // Selection rotation
    if (selected) {
      groupRef.current.rotation.y += delta * 0.5;
    }

    // Pulse animation on character kit
    if (pulseRef.current) {
      let pulse = 1.0;
      if (status === 'working') {
        pulse = 1.05 + Math.sin(t * 3.2) * 0.015;
      } else if (status === 'blocked' || status === 'failed') {
        pulse = 1.02;
      }
      pulseRef.current.scale.setScalar(pulse);
    }

    // Selection ring animation
    if (ringRef.current && selected) {
      const ringPulse = 1.0 + Math.sin(t * 2.5) * 0.06;
      ringRef.current.scale.setScalar(ringPulse);
      const mat = ringRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.5 + Math.sin(t * 3.0) * 0.25;
    }
  });

  return (
    <group ref={groupRef} position={position} rotation={[0, deskRotation, 0]}>
      <group ref={pulseRef}>
        {style.silhouette === 'lobster-command-pod' ? (
          <LobsterCommandPod style={style} statusColor={statusColor} pulseScale={1.0} />
        ) : (
          <AssistantPod style={style} statusColor={statusColor} pulseScale={1.0} />
        )}
      </group>

      {/* Selection ring at base */}
      {selected && (
        <mesh ref={ringRef} position={[0, 0.04, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.52, 0.035, 8, 48]} />
          <meshBasicMaterial color={style.accent} transparent opacity={0.6} />
        </mesh>
      )}

      {/* Click target (invisible) */}
      <mesh
        position={[0, 0.7, 0]}
        onClick={(e) => {
          e.stopPropagation();
          selectAgent(agent.id);
        }}
      >
        <boxGeometry args={[0.7, 1.4, 0.6]} />
        <meshStandardMaterial color="#ffffff" visible={false} />
      </mesh>
    </group>
  );
}
