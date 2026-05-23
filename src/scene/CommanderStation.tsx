import { brightOfficeTheme } from './sceneVisualTheme';

export function CommanderStation() {
  return (
    <group position={[-6.2, 0, -3.8]}>
      <mesh position={[0, 0.03, -0.45]} receiveShadow>
        <cylinderGeometry args={[1.28, 1.38, 0.08, 40]} />
        <meshStandardMaterial color="#182033" emissive={brightOfficeTheme.commanderAccent} emissiveIntensity={0.26} roughness={0.55} />
      </mesh>
      <mesh position={[0, 0.86, -0.56]} castShadow>
        <boxGeometry args={[1.92, 0.12, 0.52]} />
        <meshStandardMaterial color="#25344a" metalness={0.25} roughness={0.35} />
      </mesh>
      <mesh position={[0, 1.25, -0.62]}>
        <boxGeometry args={[1.78, 0.78, 0.07]} />
        <meshStandardMaterial color="#10233a" emissive={brightOfficeTheme.commanderAccent} emissiveIntensity={0.5} roughness={0.24} />
      </mesh>
      <mesh position={[0, 1.66, -0.58]}>
        <boxGeometry args={[0.76, 0.06, 0.055]} />
        <meshBasicMaterial color={brightOfficeTheme.commanderGlow} />
      </mesh>
      <mesh position={[-0.72, 1.02, -0.56]}>
        <cylinderGeometry args={[0.045, 0.045, 0.58, 12]} />
        <meshBasicMaterial color={brightOfficeTheme.commanderGlow} />
      </mesh>
      <mesh position={[0.72, 1.02, -0.56]}>
        <cylinderGeometry args={[0.045, 0.045, 0.58, 12]} />
        <meshBasicMaterial color={brightOfficeTheme.commanderGlow} />
      </mesh>
    </group>
  );
}
