import type { SceneZone } from '@/core/types';

export function ZoneLabel({ zone }: { zone: SceneZone }) {
  return (
    <group position={zone.position} rotation={[-Math.PI / 2, 0, 0]}>
      <mesh position={[0, 0, -0.01]}>
        <planeGeometry args={[2.5, 0.72]} />
        <meshBasicMaterial color="#09111f" transparent opacity={0.58} />
      </mesh>
      <mesh position={[0, -0.3, 0]}>
        <planeGeometry args={[1.8, 0.035]} />
        <meshBasicMaterial color={zone.accent} transparent opacity={0.95} />
      </mesh>
      {/* Label indicator bar — replaces Text */}
      <mesh position={[0, 0.11, 0]}>
        <boxGeometry args={[0.8, 0.06, 0.01]} />
        <meshBasicMaterial color="#f7fbff" transparent opacity={0.85} />
      </mesh>
      {/* Subtitle indicator bar — replaces Text */}
      <mesh position={[0, -0.12, 0]}>
        <boxGeometry args={[1.2, 0.03, 0.01]} />
        <meshBasicMaterial color={zone.accent} transparent opacity={0.7} />
      </mesh>
    </group>
  );
}
