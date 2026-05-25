import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { VIDEO_FRAME_PALETTE } from './videoFrameReplicaSpec';

export interface VideoFrameAvatarProps {
  position: [number, number, number];
  rotationY: number;
  variant: 'commander' | 'worker';
  statusColor: string;
  active: boolean;
}

function Chair() {
  return (
    <group position={[0, 0, -0.12]}>
      <mesh position={[0, 0.27, -0.03]}>
        <boxGeometry args={[0.44, 0.08, 0.38]} />
        <meshStandardMaterial color={VIDEO_FRAME_PALETTE.chair} roughness={0.78} />
      </mesh>
      <mesh position={[0, 0.56, -0.23]}>
        <boxGeometry args={[0.46, 0.5, 0.075]} />
        <meshStandardMaterial color={VIDEO_FRAME_PALETTE.chair} roughness={0.78} />
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

function StatusDiamond({ color, active }: { color: string; active: boolean }) {
  return (
    <mesh position={[0, 0.04, 0.08]} rotation={[-Math.PI / 2, 0, Math.PI / 4]}>
      <ringGeometry args={[0.22, 0.3, 4]} />
      <meshBasicMaterial color={color} transparent opacity={active ? 0.68 : 0.32} />
    </mesh>
  );
}

export function VideoFrameAvatar({ position, rotationY, variant, statusColor, active }: VideoFrameAvatarProps) {
  const root = useRef<THREE.Group>(null);
  const head = useRef<THREE.Mesh>(null);
  const isCommander = variant === 'commander';

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (root.current) root.current.position.y = position[1] + Math.sin(t * (active ? 2.2 : 1.1)) * 0.014;
    if (head.current) head.current.rotation.y = Math.sin(t * 1.25) * (active ? 0.06 : 0.025);
  });

  return (
    <group ref={root} position={position} rotation={[0, rotationY, 0]} scale={isCommander ? 1.0 : 0.82}>
      <Chair />
      <mesh position={[-0.07, 0.15, 0]}>
        <boxGeometry args={[0.065, 0.3, 0.075]} />
        <meshStandardMaterial color="#101319" roughness={0.72} />
      </mesh>
      <mesh position={[0.07, 0.15, 0]}>
        <boxGeometry args={[0.065, 0.3, 0.075]} />
        <meshStandardMaterial color="#101319" roughness={0.72} />
      </mesh>
      <mesh position={[0, 0.46, 0.04]}>
        <boxGeometry args={[isCommander ? 0.38 : 0.34, isCommander ? 0.4 : 0.36, 0.24]} />
        <meshStandardMaterial color={isCommander ? VIDEO_FRAME_PALETTE.commanderBody : VIDEO_FRAME_PALETTE.workerBody} roughness={0.64} />
      </mesh>
      <mesh ref={head} position={[0, 0.8, 0.04]}>
        <boxGeometry args={[isCommander ? 0.4 : 0.34, isCommander ? 0.4 : 0.34, isCommander ? 0.4 : 0.34]} />
        <meshStandardMaterial color={isCommander ? '#d96b45' : VIDEO_FRAME_PALETTE.workerHead} roughness={0.54} />
      </mesh>
      <mesh position={[0, 0.82, isCommander ? 0.25 : 0.22]}>
        <boxGeometry args={[isCommander ? 0.28 : 0.23, 0.035, 0.022]} />
        <meshBasicMaterial color={statusColor} transparent opacity={0.76} />
      </mesh>
      <StatusDiamond color={statusColor} active={active || isCommander} />
    </group>
  );
}
