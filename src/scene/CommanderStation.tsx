export function CommanderStation() {
  return (
    <group position={[-6.2, 0, -3.8]}>
      {/* Glowing base disc */}
      <mesh position={[0, 0.03, -0.45]} receiveShadow>
        <cylinderGeometry args={[1.15, 1.15, 0.05, 32]} />
        <meshStandardMaterial color="#18131f" emissive="#ffb84d" emissiveIntensity={0.18} roughness={0.7} />
      </mesh>
      {/* Commander status panel */}
      <mesh position={[0, 1.25, -0.62]}>
        <boxGeometry args={[1.65, 0.72, 0.06]} />
        <meshStandardMaterial color="#16223c" emissive="#ffb84d" emissiveIntensity={0.38} roughness={0.28} />
      </mesh>
      {/* Accent strip */}
      <mesh position={[0, 1.62, -0.6]}>
        <boxGeometry args={[0.62, 0.05, 0.05]} />
        <meshBasicMaterial color="#ffb84d" />
      </mesh>
    </group>
  );
}
