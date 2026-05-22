import { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useOfficeStore } from '@/store/officeStore';
import { useUIStore } from '@/store/uiStore';
import type { AgentStatus } from '@/core/types';

interface AgentCharacterProps {
  agentId: string;
  position: [number, number, number];
  deskRotation?: number;
}

const ROLE_COLORS: Record<string, string> = {
  research: '#4fc3f7',
  coding: '#00e676',
  writing: '#ffab40',
  analysis: '#b347ea',
  coordinator: '#ffb84d',
};

const ROLE_BODY_COLORS: Record<string, string> = {
  research: '#1e2e3e',
  coding: '#1e2e1e',
  writing: '#2e2a1e',
  analysis: '#251e2e',
  coordinator: '#1e1e22',
};

export function AgentCharacter({ agentId, position, deskRotation = 0 }: AgentCharacterProps) {
  const groupRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const agent = useOfficeStore((s) => s.getAgent(agentId));
  const selectedAgentId = useUIStore((s) => s.selectedAgentId);
  const selectAgent = useUIStore((s) => s.selectAgent);

  if (!agent) return null;

  const isSelected = agent.id === selectedAgentId;
  const status: AgentStatus = agent.status;
  const isWorking = status === 'working';
  const isBlocked = status === 'blocked';
  const isFailed = status === 'failed';
  const needsInput = status === 'waiting_input';
  const needsApproval = status === 'approval_required';
  const isCompleted = status === 'completed';
  const isResting = status === 'resting';
  const roleColor = ROLE_COLORS[agent.role] || '#00f0ff';
  const bodyColor = ROLE_BODY_COLORS[agent.role] || '#1a1a2e';

  // Posture offsets: sit for working/completed, stand otherwise
  const isSitting = isWorking || isCompleted;
  const bodyY = isSitting ? 0.48 : 0.65;
  const headY = isSitting ? 0.9 : 1.05;

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    const t = Date.now() * 0.001;

    if (isSelected) {
      groupRef.current.rotation.y += delta * 0.5;
    }

    if (bodyRef.current) {
      if (isWorking) {
        bodyRef.current.rotation.x = -0.15 + Math.sin(t * 2) * 0.02;
        bodyRef.current.position.y = Math.sin(t * 3) * 0.015 + 0.48;
      } else if (isBlocked || isFailed) {
        bodyRef.current.rotation.x = 0.1;
        bodyRef.current.position.y = 0.65;
      } else if (needsInput) {
        bodyRef.current.rotation.x = -0.25;
        bodyRef.current.position.y = 0.65;
      } else if (needsApproval) {
        bodyRef.current.rotation.x = -0.12 + Math.sin(t * 1.5) * 0.03;
        bodyRef.current.position.y = 0.65;
      } else if (isCompleted) {
        bodyRef.current.rotation.x = -0.05;
        bodyRef.current.position.y = 0.48 + Math.sin(t * 0.8) * 0.005;
      } else if (isResting) {
        bodyRef.current.rotation.x = 0.05 + Math.sin(t * 0.5) * 0.02;
        bodyRef.current.position.y = 0.65;
      } else {
        // Idle — gentle sway
        bodyRef.current.rotation.x = Math.sin(t * 0.8) * 0.03;
        bodyRef.current.position.y = 0.65 + Math.sin(t * 1.2) * 0.01;
      }
    }
  });

  const showLegs = !isSitting;
  const legLength = isSitting ? 0.15 : 0.4;
  const legY = isSitting ? 0.15 : 0.2;

  return (
    <group ref={groupRef} position={position} rotation={[0, deskRotation, 0]}>
      <group ref={bodyRef} position={[0, bodyY, 0]}>
        {/* Torso */}
        <mesh position={[0, 0, 0]} castShadow>
          <boxGeometry args={[0.35, 0.5, 0.22]} />
          <meshStandardMaterial color={bodyColor} roughness={0.5} />
        </mesh>

        {/* Head */}
        <group ref={headRef} position={[0, 0.35, 0]}>
          <mesh castShadow>
            <sphereGeometry args={[0.13, 16, 16]} />
            <meshStandardMaterial color="#3a3a4a" roughness={0.4} />
          </mesh>
          {/* Eyes */}
          <mesh position={[-0.04, 0.02, 0.11]}>
            <sphereGeometry args={[0.025, 8, 8]} />
            <meshStandardMaterial
              color={roleColor}
              roughness={0.1}
              emissive={roleColor}
              emissiveIntensity={isWorking || isCompleted ? 1.0 : 0.35}
            />
          </mesh>
          <mesh position={[0.04, 0.02, 0.11]}>
            <sphereGeometry args={[0.025, 8, 8]} />
            <meshStandardMaterial
              color={roleColor}
              roughness={0.1}
              emissive={roleColor}
              emissiveIntensity={isWorking || isCompleted ? 1.0 : 0.35}
            />
          </mesh>

          {/* Status marker above head */}
          <StatusMarker
            status={status}
            position={[0, 0.2, 0]}
          />
        </group>

        {/* Arms */}
        <mesh
          position={[-0.25, -0.05, 0]}
          rotation={[0, 0, isWorking ? Math.sin(Date.now() * 0.005) * 0.25 + 0.15 : 0.1]}
          castShadow
        >
          <boxGeometry args={[0.09, 0.38, 0.09]} />
          <meshStandardMaterial color={bodyColor} roughness={0.5} />
        </mesh>
        <mesh
          position={[0.25, -0.05, 0]}
          rotation={[0, 0, isWorking ? Math.sin(Date.now() * 0.005 + 1.5) * 0.25 - 0.15 : -0.1]}
          castShadow
        >
          <boxGeometry args={[0.09, 0.38, 0.09]} />
          <meshStandardMaterial color={bodyColor} roughness={0.5} />
        </mesh>
      </group>

      {/* Legs — hidden when sitting */}
      {showLegs && (
        <>
          <mesh position={[-0.07, legY, 0]} castShadow>
            <boxGeometry args={[0.11, legLength, 0.11]} />
            <meshStandardMaterial color="#2a2a35" roughness={0.5} />
          </mesh>
          <mesh position={[0.07, legY, 0]} castShadow>
            <boxGeometry args={[0.11, legLength, 0.11]} />
            <meshStandardMaterial color="#2a2a35" roughness={0.5} />
          </mesh>
        </>
      )}

      {/* Sitting legs */}
      {isSitting && (
        <>
          <mesh position={[-0.1, 0.15, 0.08]} rotation={[0.5, 0, 0]} castShadow>
            <boxGeometry args={[0.1, 0.2, 0.1]} />
            <meshStandardMaterial color="#2a2a35" roughness={0.5} />
          </mesh>
          <mesh position={[0.1, 0.15, 0.08]} rotation={[0.5, 0, 0]} castShadow>
            <boxGeometry args={[0.1, 0.2, 0.1]} />
            <meshStandardMaterial color="#2a2a35" roughness={0.5} />
          </mesh>
        </>
      )}

      {/* Click target */}
      <mesh
        position={[0, 0.7, 0]}
        onClick={(e) => {
          e.stopPropagation();
          selectAgent(agent.id);
        }}
      >
        <boxGeometry args={[0.6, 1.3, 0.5]} />
        <meshStandardMaterial color="#ffffff" visible={false} />
      </mesh>
    </group>
  );
}

const STATUS_CONFIG: Record<string, { color: string; scale: number; pulse: boolean } | null> = {
  blocked: { color: '#ff3366', scale: 1.2, pulse: true },
  failed: { color: '#ff1144', scale: 1.35, pulse: true },
  waiting_input: { color: '#f0a500', scale: 1.1, pulse: true },
  approval_required: { color: '#ffb84d', scale: 1.15, pulse: true },
  completed: { color: '#00e676', scale: 1.0, pulse: false },
  resting: { color: '#7ce3aa', scale: 0.75, pulse: false },
};

function StatusMarker({
  status,
  position,
}: {
  status: string;
  position: [number, number, number];
}) {
  const ref = useRef<THREE.Mesh>(null);
  const config = STATUS_CONFIG[status];

  if (!config) return null;

  useFrame(() => {
    if (ref.current) {
      if (config.pulse) {
        ref.current.scale.setScalar(config.scale + Math.abs(Math.sin(Date.now() * 0.006)) * 0.3);
        const mat = ref.current.material as THREE.MeshBasicMaterial;
        mat.opacity = 0.6 + Math.abs(Math.sin(Date.now() * 0.005)) * 0.4;
      } else if (status === 'completed') {
        const mat = ref.current.material as THREE.MeshBasicMaterial;
        mat.opacity = 0.5 + Math.sin(Date.now() * 0.002) * 0.15;
      } else if (status === 'resting') {
        const mat = ref.current.material as THREE.MeshBasicMaterial;
        mat.opacity = 0.3 + Math.sin(Date.now() * 0.003) * 0.1;
      }
    }
  });

  return (
    <mesh ref={ref} position={position}>
      <ringGeometry args={[0.08, 0.13, 16]} />
      <meshBasicMaterial color={config.color} transparent opacity={0.7} side={THREE.DoubleSide} />
    </mesh>
  );
}
