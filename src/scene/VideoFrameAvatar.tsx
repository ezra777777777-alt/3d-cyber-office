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
  scale?: number;
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

function StatusMarker({ color, active }: { color: string; active: boolean }) {
  return (
    <mesh position={[0, 0.36, 0.18]}>
      <boxGeometry args={[0.12, 0.035, 0.025]} />
      <meshBasicMaterial color={color} transparent opacity={active ? 0.78 : 0.38} />
    </mesh>
  );
}

export function VideoFrameAvatar({ position, rotationY, variant, statusColor, active, scale = 1 }: VideoFrameAvatarProps) {
  const root = useRef<THREE.Group>(null);
  const head = useRef<THREE.Mesh>(null);
  const isCommander = variant === 'commander';

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (root.current) root.current.position.y = position[1] + Math.sin(t * (active ? 1.8 : 1.1)) * 0.004;
    if (head.current) head.current.rotation.y = Math.sin(t * 1.15) * (active ? 0.035 : 0.015);
  });

  return (
    <group ref={root} position={position} rotation={[0, rotationY, 0]} scale={(isCommander ? 0.9 : 0.7) * scale}>
      <Chair />
      <mesh position={[-0.07, 0.16, 0.02]}>
        <boxGeometry args={[0.07, 0.18, 0.08]} />
        <meshStandardMaterial color="#101319" roughness={0.72} />
      </mesh>
      <mesh position={[0.07, 0.16, 0.02]}>
        <boxGeometry args={[0.07, 0.18, 0.08]} />
        <meshStandardMaterial color="#101319" roughness={0.72} />
      </mesh>
      <mesh position={[0, 0.43, 0.035]}>
        <boxGeometry args={[isCommander ? 0.38 : 0.32, isCommander ? 0.34 : 0.3, 0.24]} />
        <meshStandardMaterial color={isCommander ? VIDEO_FRAME_PALETTE.commanderBody : VIDEO_FRAME_PALETTE.workerBody} roughness={0.64} />
      </mesh>
      <mesh position={[-0.2, 0.43, 0.06]} rotation={[0, 0, 0.04]}>
        <boxGeometry args={[0.045, 0.2, 0.06]} />
        <meshStandardMaterial color={isCommander ? '#a44a32' : '#1a2028'} roughness={0.7} />
      </mesh>
      <mesh position={[0.2, 0.43, 0.06]} rotation={[0, 0, -0.04]}>
        <boxGeometry args={[0.045, 0.2, 0.06]} />
        <meshStandardMaterial color={isCommander ? '#a44a32' : '#1a2028'} roughness={0.7} />
      </mesh>
      <mesh ref={head} position={[0, 0.68, 0.04]}>
        <boxGeometry args={[isCommander ? 0.36 : 0.3, isCommander ? 0.34 : 0.28, isCommander ? 0.34 : 0.3]} />
        <meshStandardMaterial color={isCommander ? '#b75638' : VIDEO_FRAME_PALETTE.workerHead} roughness={0.62} />
      </mesh>
      <mesh position={[0, 0.84, 0.015]}>
        <boxGeometry args={[isCommander ? 0.38 : 0.32, 0.045, isCommander ? 0.36 : 0.32]} />
        <meshStandardMaterial color={isCommander ? '#8f2f26' : '#202630'} roughness={0.68} />
      </mesh>
      <mesh position={[0, 0.69, isCommander ? 0.23 : 0.2]}>
        <boxGeometry args={[isCommander ? 0.24 : 0.2, 0.028, 0.02]} />
        <meshBasicMaterial color={statusColor} transparent opacity={0.76} />
      </mesh>
      <StatusMarker color={statusColor} active={active || isCommander} />
    </group>
  );
}
