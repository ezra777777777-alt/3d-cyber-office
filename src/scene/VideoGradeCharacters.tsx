import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { AgentStatus } from '@/core/types';
import { useOfficeStore } from '@/store/officeStore';
import { useUIStore } from '@/store/uiStore';
import {
  VIDEO_GRADE_PALETTE,
  getVideoGradeCharacterSlots,
} from './videoGradeVisualSpec';

const STATUS_COLOR: Record<AgentStatus, string> = {
  idle: '#7f8b98',
  planning: VIDEO_GRADE_PALETTE.statusAmber,
  working: VIDEO_GRADE_PALETTE.statusCyan,
  waiting_input: VIDEO_GRADE_PALETTE.statusAmber,
  approval_required: VIDEO_GRADE_PALETTE.statusMagenta,
  blocked: VIDEO_GRADE_PALETTE.statusRed,
  failed: VIDEO_GRADE_PALETTE.statusRed,
  completed: VIDEO_GRADE_PALETTE.statusGreen,
  resting: '#8bd9a4',
  offline: '#4f5b66',
};

function activeMotion(status: AgentStatus) {
  return status === 'working' || status === 'planning' || status === 'waiting_input' || status === 'approval_required';
}

function ChairPrimitive() {
  return (
    <group position={[0, 0, -0.12]}>
      <mesh position={[0, 0.27, -0.03]}>
        <boxGeometry args={[0.44, 0.08, 0.38]} />
        <meshStandardMaterial color={VIDEO_GRADE_PALETTE.chair} roughness={0.78} />
      </mesh>
      <mesh position={[0, 0.55, -0.23]}>
        <boxGeometry args={[0.46, 0.5, 0.075]} />
        <meshStandardMaterial color={VIDEO_GRADE_PALETTE.chair} roughness={0.78} />
      </mesh>
      {[-0.17, 0.17].map((x) =>
        [-0.18, 0.1].map((z) => (
          <mesh key={`${x}-${z}`} position={[x, 0.12, z]}>
            <boxGeometry args={[0.04, 0.24, 0.04]} />
            <meshStandardMaterial color="#080b10" roughness={0.82} />
          </mesh>
        )),
      )}
    </group>
  );
}

function WorkerFigure({ status }: { status: AgentStatus }) {
  const arm = useRef<THREE.Group>(null);
  const color = STATUS_COLOR[status];
  const active = activeMotion(status);

  useFrame(({ clock }) => {
    if (!arm.current) return;
    arm.current.rotation.x = active ? Math.sin(clock.elapsedTime * 5) * 0.035 : 0;
  });

  return (
    <group>
      <ChairPrimitive />
      <mesh position={[0, 0.42, 0.03]}>
        <boxGeometry args={[0.32, 0.3, 0.22]} />
        <meshStandardMaterial color={status === 'offline' ? '#3d4650' : VIDEO_GRADE_PALETTE.workerBody} roughness={0.66} />
      </mesh>
      <group ref={arm}>
        <mesh position={[-0.2, 0.43, 0.09]} rotation={[0.18, 0, 0.08]}>
          <boxGeometry args={[0.052, 0.2, 0.06]} />
          <meshStandardMaterial color={VIDEO_GRADE_PALETTE.workerArm} roughness={0.7} />
        </mesh>
        <mesh position={[0.2, 0.43, 0.09]} rotation={[0.18, 0, -0.08]}>
          <boxGeometry args={[0.052, 0.2, 0.06]} />
          <meshStandardMaterial color={VIDEO_GRADE_PALETTE.workerArm} roughness={0.7} />
        </mesh>
      </group>
      <mesh position={[0, 0.68, 0.04]}>
        <boxGeometry args={[0.3, 0.28, 0.28]} />
        <meshStandardMaterial color={VIDEO_GRADE_PALETTE.workerHead} roughness={0.64} />
      </mesh>
      <mesh position={[0, 0.78, 0.045]}>
        <boxGeometry args={[0.32, 0.045, 0.3]} />
        <meshStandardMaterial color="#202630" roughness={0.68} />
      </mesh>
      <mesh position={[0, 0.69, 0.195]}>
        <boxGeometry args={[0.2, 0.028, 0.02]} />
        <meshBasicMaterial color={color} transparent opacity={active ? 0.82 : 0.48} />
      </mesh>
    </group>
  );
}

function CommanderFigure({ status }: { status: AgentStatus }) {
  const color = STATUS_COLOR[status] ?? VIDEO_GRADE_PALETTE.statusAmber;
  return (
    <group scale={1.05}>
      <ChairPrimitive />
      <mesh position={[0, 0.42, 0.03]}>
        <boxGeometry args={[0.38, 0.33, 0.24]} />
        <meshStandardMaterial color={VIDEO_GRADE_PALETTE.commanderRed} roughness={0.62} />
      </mesh>
      <mesh position={[-0.25, 0.46, 0.1]} rotation={[0, 0, 0.28]}>
        <boxGeometry args={[0.07, 0.22, 0.07]} />
        <meshStandardMaterial color={VIDEO_GRADE_PALETTE.commanderDarkRed} roughness={0.7} />
      </mesh>
      <mesh position={[0.25, 0.46, 0.1]} rotation={[0, 0, -0.28]}>
        <boxGeometry args={[0.07, 0.22, 0.07]} />
        <meshStandardMaterial color={VIDEO_GRADE_PALETTE.commanderDarkRed} roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.7, 0.04]}>
        <boxGeometry args={[0.36, 0.32, 0.32]} />
        <meshStandardMaterial color="#b75638" roughness={0.62} />
      </mesh>
      <mesh position={[0, 0.82, 0.045]}>
        <boxGeometry args={[0.4, 0.05, 0.34]} />
        <meshStandardMaterial color={VIDEO_GRADE_PALETTE.commanderDarkRed} roughness={0.68} />
      </mesh>
      <mesh position={[0, 0.7, 0.215]}>
        <boxGeometry args={[0.24, 0.03, 0.02]} />
        <meshBasicMaterial color={color} transparent opacity={0.86} />
      </mesh>
    </group>
  );
}

export function VideoGradeCharacters() {
  const agents = useOfficeStore((s) => s.getAllAgents());
  const visualMode = useUIStore((s) => s.visualMode);
  const commander = agents.find((agent) => agent.role === 'coordinator');
  const workers = agents.filter((agent) => agent.role !== 'coordinator');
  const slots = getVideoGradeCharacterSlots(visualMode);

  return (
    <group>
      {slots.map((slot, index) => {
        const agent = slot.role === 'commander' ? commander : workers[index - 1];
        const status = agent?.status ?? 'idle';
        return (
          <group key={slot.id} position={slot.position} rotation={[0, slot.rotationY, 0]} scale={slot.scale * (slot.role === 'commander' ? 0.92 : 0.72)}>
            {slot.role === 'commander' ? <CommanderFigure status={status} /> : <WorkerFigure status={status} />}
          </group>
        );
      })}
    </group>
  );
}
