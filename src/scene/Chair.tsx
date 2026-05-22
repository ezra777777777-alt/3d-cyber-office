export function Chair() {
  return (
    <group position={[0, 0.45, 0.45]}>
      {/* Seat cushion */}
      <mesh position={[0, 0.02, 0]} castShadow>
        <boxGeometry args={[0.44, 0.06, 0.44]} />
        <meshStandardMaterial color="#2a2a38" roughness={0.5} />
      </mesh>
      {/* Backrest */}
      <mesh position={[0, 0.22, -0.2]} castShadow>
        <boxGeometry args={[0.4, 0.35, 0.05]} />
        <meshStandardMaterial color="#2a2a38" roughness={0.5} />
      </mesh>
      {/* Base pole */}
      <mesh position={[0, -0.15, 0]}>
        <cylinderGeometry args={[0.06, 0.08, 0.3, 8]} />
        <meshStandardMaterial color="#1a1a2a" roughness={0.3} metalness={0.7} />
      </mesh>
      {/* Base disc */}
      <mesh position={[0, -0.3, 0]} receiveShadow>
        <cylinderGeometry args={[0.18, 0.2, 0.04, 16]} />
        <meshStandardMaterial color="#1a1a2a" roughness={0.3} metalness={0.8} />
      </mesh>
      {/* Casters */}
      {[0, 1, 2, 3].map((i) => {
        const angle = (i * Math.PI) / 2 + Math.PI / 4;
        return (
          <mesh key={i} position={[Math.cos(angle) * 0.16, -0.33, Math.sin(angle) * 0.16]}>
            <sphereGeometry args={[0.03, 6, 6]} />
            <meshStandardMaterial color="#111122" roughness={0.2} metalness={0.9} />
          </mesh>
        );
      })}
    </group>
  );
}
