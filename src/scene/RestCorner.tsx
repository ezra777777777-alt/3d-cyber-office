export function RestCorner() {
  return (
    <group position={[-8.0, 0, 1.2]}>
      {/* Floor mat / rug */}
      <mesh position={[0, 0.22, 0]} receiveShadow>
        <cylinderGeometry args={[1.0, 1.0, 0.08, 28]} />
        <meshStandardMaterial color="#173028" emissive="#7ce3aa" emissiveIntensity={0.12} roughness={0.9} />
      </mesh>
      {/* Seating block */}
      <mesh position={[0.25, 0.46, 0]} castShadow>
        <boxGeometry args={[0.92, 0.38, 0.48]} />
        <meshStandardMaterial color="#355b52" roughness={0.86} />
      </mesh>
      {/* Ambient orb light */}
      <mesh position={[-0.52, 0.75, -0.16]}>
        <sphereGeometry args={[0.22, 18, 18]} />
        <meshStandardMaterial color="#7ce3aa" emissive="#7ce3aa" emissiveIntensity={0.28} />
      </mesh>
    </group>
  );
}
