import * as THREE from 'three';
import type { CommanderVisualTone } from '@/commander/commanderVisualState';
import { brightOfficeTheme } from './sceneVisualTheme';

const toneColors: Record<CommanderVisualTone, string> = {
  idle: brightOfficeTheme.commanderAccent,
  planning: '#6ecbff',
  running: '#00dff6',
  approval: '#f0a500',
  blocked: '#ff3366',
  completed: '#00e676',
};

interface CommanderCommandRingProps {
  tone: CommanderVisualTone;
  activeTasks: number;
  pendingApprovals: number;
}

export function CommanderCommandRing({ tone, activeTasks, pendingApprovals }: CommanderCommandRingProps) {
  const color = toneColors[tone];
  const pulseScale = tone === 'idle' ? 1 : 1.08;
  const ringThickness = pendingApprovals > 0 ? 0.13 : 0.09;

  return (
    <group position={[-6.2, 0.08, -3.8]} scale={[pulseScale, 1, pulseScale]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.22, 1.22 + ringThickness, 64]} />
        <meshBasicMaterial color={color} side={THREE.DoubleSide} transparent opacity={0.72} />
      </mesh>
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.58, 1.62, 64]} />
        <meshBasicMaterial color={brightOfficeTheme.commanderGlow} side={THREE.DoubleSide} transparent opacity={0.32} />
      </mesh>
      {activeTasks > 0 && (
        <mesh position={[0, 0.08, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.12 + activeTasks * 0.025, 24]} />
          <meshBasicMaterial color={color} transparent opacity={0.78} />
        </mesh>
      )}
      <pointLight position={[0, 1.6, 0]} color={color} intensity={pendingApprovals > 0 ? 0.9 : 0.55} distance={5.2} />
    </group>
  );
}
