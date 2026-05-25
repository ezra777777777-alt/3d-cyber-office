import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface ClawWorkerProps {
  position: [number, number, number];
  statusColor: string;
  pulseScale: number;
}

export function ClawWorkerCharacter({ position, statusColor, pulseScale }: ClawWorkerProps) {
  const groupRef = useRef<THREE.Group>(null);
  const armLRef = useRef<THREE.Group>(null);
  const armRRef = useRef<THREE.Group>(null);
  const legLRef = useRef<THREE.Group>(null);
  const legRRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const walkCycle = Math.sin(t * 3.5) * 0.45;
    const idleBob = Math.sin(t * 1.8) * 0.04;

    if (groupRef.current) {
      groupRef.current.position.y = position[1] + idleBob;
    }
    if (armLRef.current) armLRef.current.rotation.x = walkCycle;
    if (armRRef.current) armRRef.current.rotation.x = -walkCycle;
    if (legLRef.current) legLRef.current.rotation.x = -walkCycle * 0.6;
    if (legRRef.current) legRRef.current.rotation.x = walkCycle * 0.6;
  });

  return (
    <group ref={groupRef} position={position}>
      {/* Body */}
      <mesh position={[0, 0.55, 0]} castShadow>
        <boxGeometry args={[0.28, 0.4, 0.2]} />
        <meshStandardMaterial color="#e8d5c0" roughness={0.5} metalness={0.05} />
      </mesh>

      {/* Head */}
      <mesh position={[0, 0.92, 0]} castShadow>
        <sphereGeometry args={[0.16, 12, 10]} />
        <meshStandardMaterial color="#f0dcc8" roughness={0.4} metalness={0.03} />
      </mesh>

      {/* Visor/hat band */}
      <mesh position={[0, 0.94, 0.13]} castShadow>
        <boxGeometry args={[0.22, 0.06, 0.04]} />
        <meshStandardMaterial color="#2a3a4a" roughness={0.3} metalness={0.2} />
      </mesh>

      {/* Left arm */}
      <group ref={armLRef} position={[-0.19, 0.56, 0]}>
        <mesh position={[0, -0.18, 0]} castShadow>
          <cylinderGeometry args={[0.05, 0.05, 0.36, 8]} />
          <meshStandardMaterial color="#e0c8a8" roughness={0.5} metalness={0.05} />
        </mesh>
      </group>

      {/* Right arm */}
      <group ref={armRRef} position={[0.19, 0.56, 0]}>
        <mesh position={[0, -0.18, 0]} castShadow>
          <cylinderGeometry args={[0.05, 0.05, 0.36, 8]} />
          <meshStandardMaterial color="#e0c8a8" roughness={0.5} metalness={0.05} />
        </mesh>
      </group>

      {/* Left leg */}
      <group ref={legLRef} position={[-0.08, 0.2, 0]}>
        <mesh position={[0, -0.14, 0]} castShadow>
          <cylinderGeometry args={[0.06, 0.06, 0.3, 8]} />
          <meshStandardMaterial color="#3a3040" roughness={0.6} metalness={0.05} />
        </mesh>
      </group>

      {/* Right leg */}
      <group ref={legRRef} position={[0.08, 0.2, 0]}>
        <mesh position={[0, -0.14, 0]} castShadow>
          <cylinderGeometry args={[0.06, 0.06, 0.3, 8]} />
          <meshStandardMaterial color="#3a3040" roughness={0.6} metalness={0.05} />
        </mesh>
      </group>

      {/* Status glow ring at feet */}
      <mesh position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.2, 0.26, 24]} />
        <meshBasicMaterial color={statusColor} transparent opacity={0.7 * pulseScale} />
      </mesh>
    </group>
  );
}
