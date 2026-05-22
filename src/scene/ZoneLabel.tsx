import { Text } from '@react-three/drei';
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
      <Text position={[0, 0.11, 0]} fontSize={0.21} color="#f7fbff" anchorX="center" anchorY="middle">
        {zone.label}
      </Text>
      <Text position={[0, -0.12, 0]} fontSize={0.11} color={zone.accent} anchorX="center" anchorY="middle">
        {zone.subtitle}
      </Text>
    </group>
  );
}
