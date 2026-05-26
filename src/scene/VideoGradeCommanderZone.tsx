import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { buildCommanderVisualState, type CommanderVisualTone } from '@/commander/commanderVisualState';
import { useCommanderStore } from '@/store/commanderStore';
import { VIDEO_GRADE_PALETTE } from './videoGradeVisualSpec';

const TONE_COLOR: Record<CommanderVisualTone, string> = {
  idle: '#5a4930',
  planning: VIDEO_GRADE_PALETTE.statusAmber,
  running: VIDEO_GRADE_PALETTE.statusCyan,
  approval: VIDEO_GRADE_PALETTE.statusMagenta,
  blocked: VIDEO_GRADE_PALETTE.statusRed,
  completed: VIDEO_GRADE_PALETTE.statusGreen,
};

function LobsterMark() {
  return (
    <group>
      <mesh>
        <boxGeometry args={[0.24, 0.18, 0.035]} />
        <meshStandardMaterial
          color={VIDEO_GRADE_PALETTE.commanderRed}
          emissive="#512018"
          emissiveIntensity={0.18}
          roughness={0.55}
        />
      </mesh>
      <mesh position={[-0.18, 0.02, 0]} rotation={[0, 0, 0.42]}>
        <boxGeometry args={[0.13, 0.055, 0.035]} />
        <meshStandardMaterial color={VIDEO_GRADE_PALETTE.commanderDarkRed} roughness={0.58} />
      </mesh>
      <mesh position={[0.18, 0.02, 0]} rotation={[0, 0, -0.42]}>
        <boxGeometry args={[0.13, 0.055, 0.035]} />
        <meshStandardMaterial color={VIDEO_GRADE_PALETTE.commanderDarkRed} roughness={0.58} />
      </mesh>
      <mesh position={[0, 0.14, 0]} rotation={[0, 0, Math.PI / 4]}>
        <boxGeometry args={[0.09, 0.09, 0.034]} />
        <meshStandardMaterial color="#ff866c" roughness={0.56} />
      </mesh>
    </group>
  );
}

function AuthorityRing({ color, pulse }: { color: string; pulse: boolean }) {
  const ring = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!ring.current) return;
    const material = ring.current.material as THREE.MeshBasicMaterial;
    material.opacity = pulse ? 0.34 + Math.sin(clock.elapsedTime * 3.6) * 0.14 : 0.22;
  });

  return (
    <mesh ref={ring} position={[0, 0.08, 0.02]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[0.82, 1.05, 42]} />
      <meshBasicMaterial color={color} transparent opacity={0.28} />
    </mesh>
  );
}

function StatusConsole({
  color,
  totalTasks,
  completedTasks,
  pendingApprovals,
  artifactCount,
}: {
  color: string;
  totalTasks: number;
  completedTasks: number;
  pendingApprovals: number;
  artifactCount: number;
}) {
  const taskCount = Math.max(1, Math.min(totalTasks || 4, 6));

  return (
    <group position={[0, 1.1, -0.05]}>
      <mesh>
        <boxGeometry args={[1.18, 0.62, 0.065]} />
        <meshStandardMaterial color="#080b12" emissive="#111d2a" emissiveIntensity={0.22} roughness={0.48} />
      </mesh>
      <group position={[-0.34, 0.1, 0.048]} scale={1.2}>
        <LobsterMark />
      </group>
      <mesh position={[0.22, 0.16, 0.05]}>
        <boxGeometry args={[0.46, 0.038, 0.014]} />
        <meshBasicMaterial color={color} transparent opacity={0.78} />
      </mesh>
      <mesh position={[0.08, -0.1, 0.05]}>
        <boxGeometry args={[0.72, 0.034, 0.014]} />
        <meshBasicMaterial color={completedTasks > 0 ? VIDEO_GRADE_PALETTE.statusGreen : '#617080'} transparent opacity={0.48} />
      </mesh>
      {Array.from({ length: taskCount }, (_, index) => (
        <mesh key={index} position={[-0.18 + index * 0.09, -0.22, 0.052]}>
          <boxGeometry args={[0.055, 0.034, 0.012]} />
          <meshBasicMaterial
            color={index < completedTasks ? VIDEO_GRADE_PALETTE.statusGreen : color}
            transparent
            opacity={index < Math.max(completedTasks, pendingApprovals) ? 0.86 : 0.34}
          />
        </mesh>
      ))}
      {pendingApprovals > 0 ? (
        <mesh position={[0.48, 0.05, 0.054]}>
          <boxGeometry args={[0.12, 0.16, 0.014]} />
          <meshBasicMaterial color={VIDEO_GRADE_PALETTE.statusMagenta} transparent opacity={0.9} />
        </mesh>
      ) : null}
      {artifactCount > 0 ? (
        <mesh position={[0.48, -0.19, 0.054]} rotation={[0, 0, Math.PI / 4]}>
          <boxGeometry args={[0.1, 0.1, 0.014]} />
          <meshBasicMaterial color={VIDEO_GRADE_PALETTE.statusGreen} transparent opacity={0.82} />
        </mesh>
      ) : null}
    </group>
  );
}

function CommandRails({ color, active }: { color: string; active: boolean }) {
  return (
    <group position={[0, 0.12, 0.18]}>
      {[-0.68, 0, 0.68].map((x, index) => (
        <mesh key={x} position={[x, 0, 1.56 - index * 0.16]} rotation={[0, 0, 0.05 * (index - 1)]}>
          <boxGeometry args={[0.05, 0.035, 2.36]} />
          <meshBasicMaterial color={color} transparent opacity={active ? 0.28 : 0.12} />
        </mesh>
      ))}
    </group>
  );
}

export function VideoGradeCommanderZone() {
  const selectedMissionId = useCommanderStore((state) => state.selectedMissionId);
  const mission = useCommanderStore((state) =>
    state.selectedMissionId ? state.missions[state.selectedMissionId] : undefined,
  );
  const approvals = useCommanderStore((state) => state.approvals);
  const workers = useCommanderStore((state) => state.workers);
  const visualState = buildCommanderVisualState(mission, approvals, workers);
  const color = TONE_COLOR[visualState.tone];
  const isActive = Boolean(selectedMissionId) && visualState.tone !== 'idle';

  return (
    <group position={[3.15, 0, -5.32]}>
      <AuthorityRing color={color} pulse={visualState.tone === 'approval' || visualState.tone === 'running'} />
      <CommandRails color={color} active={isActive} />
      <StatusConsole
        color={color}
        totalTasks={visualState.totalTasks}
        completedTasks={visualState.completedTasks}
        pendingApprovals={visualState.pendingApprovals}
        artifactCount={visualState.artifactCount}
      />
      <pointLight position={[0, 1.35, 0.25]} intensity={isActive ? 0.82 : 0.36} distance={4.4} color={color} />
    </group>
  );
}
