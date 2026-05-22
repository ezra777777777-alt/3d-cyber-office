import { useRef } from 'react';
import * as THREE from 'three';
import { useOfficeStore } from '@/store/officeStore';
import { useUIStore } from '@/store/uiStore';
import { Chair } from './Chair';

interface DeskProps {
  deskId: string;
  position: [number, number, number];
  rotation?: number;
  label: string;
  isCommander?: boolean;
}

export function Desk({ deskId, position, rotation = 0, label, isCommander }: DeskProps) {
  const groupRef = useRef<THREE.Group>(null);
  const agents = useOfficeStore((s) => s.getAgentsByDesk(deskId));
  const agent = agents[0];
  const task = useOfficeStore((s) => (agent?.currentTaskId ? s.getTask(agent.currentTaskId) : undefined));
  const selectedAgentId = useUIStore((s) => s.selectedAgentId);
  const selectAgent = useUIStore((s) => s.selectAgent);

  const isSelected = agent && agent.id === selectedAgentId;
  const isActive = task?.status === 'running';
  const isBlocked = task?.status === 'blocked' || task?.status === 'failed';
  const needsInput = task?.status === 'waiting_input';

  const accentColor = isCommander ? '#ffb84d' : '#00f0ff';
  let screenColor = '#111122';
  let screenEmissive = '#111122';
  if (isActive) {
    screenColor = '#002244';
    screenEmissive = accentColor;
  } else if (isBlocked) {
    screenColor = '#220000';
    screenEmissive = '#ff3366';
  } else if (needsInput) {
    screenColor = '#221100';
    screenEmissive = '#f0a500';
  }

  return (
    <group ref={groupRef} position={position} rotation={[0, rotation, 0]}>
      {/* Desk surface */}
      <mesh position={[0, 0.75, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.4, 0.08, 1.2]} />
        <meshStandardMaterial color="#3a3a4a" roughness={0.3} metalness={0.4} />
      </mesh>

      {/* Desk legs — thicker at corners */}
      {[[-1.05, -0.5], [1.05, -0.5], [-1.05, 0.5], [1.05, 0.5]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.375, z]} castShadow>
          <boxGeometry args={[0.1, 0.75, 0.1]} />
          <meshStandardMaterial color="#2a2a3a" roughness={0.3} metalness={0.7} />
        </mesh>
      ))}

      {/* Monitor */}
      <mesh position={[0, 1.2, -0.38]} castShadow>
        <boxGeometry args={[1.3, 0.75, 0.06]} />
        <meshStandardMaterial color={screenColor} roughness={0.15} emissive={screenEmissive} emissiveIntensity={isActive ? 0.5 : 0.08} />
      </mesh>

      {/* Monitor stand base */}
      <mesh position={[0, 0.83, -0.4]} castShadow>
        <boxGeometry args={[0.35, 0.06, 0.25]} />
        <meshStandardMaterial color="#2a2a3a" roughness={0.2} metalness={0.8} />
      </mesh>
      {/* Monitor stand neck */}
      <mesh position={[0, 0.96, -0.38]}>
        <boxGeometry args={[0.08, 0.22, 0.06]} />
        <meshStandardMaterial color="#2a2a3a" roughness={0.2} metalness={0.8} />
      </mesh>

      {/* Desktop props */}
      {/* Keyboard */}
      <mesh position={[0, 0.81, 0.18]} castShadow>
        <boxGeometry args={[0.5, 0.025, 0.16]} />
        <meshStandardMaterial color="#2a2a35" roughness={0.6} />
      </mesh>
      {/* Coffee mug */}
      <mesh position={[0.6, 0.81, -0.05]} castShadow>
        <cylinderGeometry args={[0.06, 0.055, 0.1, 12]} />
        <meshStandardMaterial color="#cc9966" roughness={0.4} />
      </mesh>
      {/* Mug handle */}
      <mesh position={[0.66, 0.81, -0.03]}>
        <torusGeometry args={[0.035, 0.012, 6, 8, Math.PI]} />
        <meshStandardMaterial color="#cc9966" roughness={0.4} />
      </mesh>
      {/* Small file block */}
      <mesh position={[-0.55, 0.81, -0.15]} castShadow>
        <boxGeometry args={[0.15, 0.05, 0.22]} />
        <meshStandardMaterial color="#d0d0d8" roughness={0.7} />
      </mesh>

      {/* Chair */}
      <Chair />

      {/* Selection outline */}
      {isSelected && (
        <mesh position={[0, 0.76, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.05, 1.1, 4]} />
          <meshBasicMaterial color="#00f0ff" side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* Click target */}
      <mesh
        position={[0, 0.5, 0]}
        onClick={(e) => {
          e.stopPropagation();
          if (agent) selectAgent(agent.id);
        }}
      >
        <boxGeometry args={[2.4, 1.2, 1.4]} />
        <meshStandardMaterial color="#ffffff" visible={false} />
      </mesh>
    </group>
  );
}
