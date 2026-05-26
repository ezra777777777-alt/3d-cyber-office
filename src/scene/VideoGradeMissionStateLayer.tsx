import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';
import { useOfficeStore } from '@/store/officeStore';
import { useUIStore } from '@/store/uiStore';
import { getVideoGradeStateCue } from './videoGradeStateTesting';
import { getVideoGradeCharacterSlots } from './videoGradeVisualSpec';

function DeskCue({
  position,
  color,
  pulse,
  artifact,
}: {
  position: [number, number, number];
  color: string;
  pulse: boolean;
  artifact: boolean;
}) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const material = ref.current.material as THREE.MeshBasicMaterial;
    material.opacity = pulse ? 0.36 + Math.sin(clock.elapsedTime * 4) * 0.16 : 0.32;
  });

  return (
    <group position={[position[0], 0.065, position[2] + 0.46]}>
      <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.2, 24]} />
        <meshBasicMaterial color={color} transparent opacity={0.32} />
      </mesh>
      {artifact ? (
        <mesh position={[0.22, 0.08, 0.02]}>
          <boxGeometry args={[0.12, 0.08, 0.06]} />
          <meshBasicMaterial color={color} transparent opacity={0.72} />
        </mesh>
      ) : null}
    </group>
  );
}

export function VideoGradeMissionStateLayer() {
  const agents = useOfficeStore((s) => s.getAllAgents());
  const visualMode = useUIStore((s) => s.visualMode);
  const slots = getVideoGradeCharacterSlots(visualMode);
  const workers = agents.filter((current) => current.role !== 'coordinator');

  return (
    <group>
      {slots.map((slot, index) => {
        const agent = slot.role === 'commander'
          ? agents.find((current) => current.role === 'coordinator')
          : workers[index - 1];
        const cue = getVideoGradeStateCue(agent?.status ?? 'idle');
        return (
          <DeskCue
            key={slot.id}
            position={slot.position}
            color={cue.color}
            pulse={cue.motion === 'pulse' || cue.motion === 'active'}
            artifact={cue.artifactMarker}
          />
        );
      })}
    </group>
  );
}
