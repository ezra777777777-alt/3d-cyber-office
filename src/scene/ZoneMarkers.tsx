import * as THREE from 'three';

export function PendingMarker() {
  return (
    <group position={[-7, 0.5, 4.5]}>
      {/* Stack of 3 translucent task cards */}
      {[0, 0.05, 0.1].map((zOffset, i) => (
        <mesh key={i} position={[0, 1.2 + i * 0.04, zOffset]}>
          <boxGeometry args={[1.0, 0.6, 0.03]} />
          <meshStandardMaterial
            color="#334466"
            roughness={0.2}
            emissive="#224488"
            emissiveIntensity={0.3 - i * 0.08}
            transparent
            opacity={0.85 - i * 0.15}
          />
        </mesh>
      ))}
      {/* Card indicator bar */}
      <mesh position={[0, 1.54, 0.1]}>
        <boxGeometry args={[0.8, 0.03, 0.01]} />
        <meshBasicMaterial color="#00f0ff" />
      </mesh>
      {/* Subtle glow plane */}
      <mesh position={[0, 0.8, -0.02]} rotation={[0, 0, 0]}>
        <planeGeometry args={[1.1, 0.3]} />
        <meshBasicMaterial color="#00f0ff" transparent opacity={0.08} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

export function DoneMarker() {
  return (
    <group position={[7.2, 1.0, 3.65]}>
      {/* Archive shelf indicator — sits beside DeliveryRack */}
      <mesh position={[0, 0.6, 0]}>
        <boxGeometry args={[0.8, 0.04, 0.3]} />
        <meshStandardMaterial color="#3a4a3a" roughness={0.3} metalness={0.4} />
      </mesh>
      {/* Completion check ring */}
      <mesh position={[0, 0.85, 0.16]} rotation={[0, 0, 0]}>
        <ringGeometry args={[0.15, 0.18, 4]} />
        <meshBasicMaterial color="#00e676" transparent opacity={0.5} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}
