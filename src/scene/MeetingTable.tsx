export function MeetingTable() {
  return (
    <group position={[0, 0, 2.5]}>
      {/* Table top */}
      <mesh position={[0, 0.78, 0]} castShadow receiveShadow>
        <boxGeometry args={[3.2, 0.07, 1.4]} />
        <meshStandardMaterial color="#a0b0c0" roughness={0.3} metalness={0.4} />
      </mesh>
      {/* Table legs */}
      {[[-1.4, -0.55], [1.4, -0.55], [-1.4, 0.55], [1.4, 0.55]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.38, z]} castShadow>
          <boxGeometry args={[0.1, 0.76, 0.1]} />
          <meshStandardMaterial color="#8a95a5" roughness={0.3} metalness={0.7} />
        </mesh>
      ))}
      {/* Center object — carafe */}
      <mesh position={[0, 0.83, 0]}>
        <cylinderGeometry args={[0.06, 0.08, 0.14, 12]} />
        <meshStandardMaterial color="#5588aa" roughness={0.1} metalness={0.2} transparent opacity={0.6} />
      </mesh>
      {/* Simple chairs around table */}
      {[[-0.8, -0.9], [0.8, -0.9], [-0.8, 0.9], [0.8, 0.9]].map(([cx, cz], i) => (
        <group key={`mchair-${i}`} position={[cx, 0.45, cz]}>
          <mesh position={[0, 0.02, 0]} castShadow>
            <boxGeometry args={[0.36, 0.05, 0.36]} />
            <meshStandardMaterial color="#8a95a5" roughness={0.5} />
          </mesh>
          <mesh position={[0, -0.18, 0]}>
            <cylinderGeometry args={[0.05, 0.07, 0.36, 8]} />
            <meshStandardMaterial color="#6a6a7a" roughness={0.3} metalness={0.7} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
