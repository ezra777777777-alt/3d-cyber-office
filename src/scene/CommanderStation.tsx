import { brightOfficeTheme } from './sceneVisualTheme';

export function CommanderStation() {
  return (
    <group position={[0, 0, -4.25]}>
      {/* Wide cylinder base — clean light surface */}
      <mesh position={[0, 0.03, 0]} receiveShadow>
        <cylinderGeometry args={[1.45, 1.45, 0.08, 48]} />
        <meshStandardMaterial color="#dbe8f2" roughness={0.45} metalness={0.15} />
      </mesh>

      {/* Command ring — horizontal torus in commander accent */}
      <mesh position={[0, 0.10, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.2, 0.03, 16, 64]} />
        <meshStandardMaterial
          color={brightOfficeTheme.commanderAccent}
          emissive={brightOfficeTheme.commanderAccent}
          emissiveIntensity={0.45}
          roughness={0.28}
        />
      </mesh>

      {/* Status board — dark panel with emissive glow */}
      <mesh position={[0, 0.18, -0.36]} castShadow>
        <boxGeometry args={[1.5, 0.65, 0.06]} />
        <meshStandardMaterial
          color="#26374a"
          emissive={brightOfficeTheme.commanderAccent}
          emissiveIntensity={0.35}
          roughness={0.3}
        />
      </mesh>

      {/* Simplified side accent pillars */}
      <mesh position={[-0.72, 0.25, -0.36]}>
        <cylinderGeometry args={[0.04, 0.04, 0.45, 12]} />
        <meshBasicMaterial color={brightOfficeTheme.commanderGlow} />
      </mesh>
      <mesh position={[0.72, 0.25, -0.36]}>
        <cylinderGeometry args={[0.04, 0.04, 0.45, 12]} />
        <meshBasicMaterial color={brightOfficeTheme.commanderGlow} />
      </mesh>
    </group>
  );
}
