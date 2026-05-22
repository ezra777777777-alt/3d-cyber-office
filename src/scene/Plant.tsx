interface PlantProps {
  position?: [number, number, number];
  scale?: number;
}

export function Plant({ position = [8.5, 0, -4], scale = 1 }: PlantProps) {
  return (
    <group position={position} scale={scale}>
      {/* Pot */}
      <mesh position={[0, 0.2, 0]} castShadow>
        <cylinderGeometry args={[0.18, 0.14, 0.4, 12]} />
        <meshStandardMaterial color="#c4885a" roughness={0.6} />
      </mesh>
      {/* Pot rim */}
      <mesh position={[0, 0.42, 0]}>
        <cylinderGeometry args={[0.2, 0.19, 0.04, 12]} />
        <meshStandardMaterial color="#d4986a" roughness={0.5} />
      </mesh>
      {/* Soil */}
      <mesh position={[0, 0.43, 0]}>
        <cylinderGeometry args={[0.16, 0.0, 0.03, 8]} />
        <meshStandardMaterial color="#3a2a1a" roughness={0.9} />
      </mesh>
      {/* Leaves — layered cones */}
      <mesh position={[0, 0.6, 0]} castShadow>
        <coneGeometry args={[0.25, 0.5, 8]} />
        <meshStandardMaterial color="#2d5a27" roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.75, 0]} castShadow>
        <coneGeometry args={[0.2, 0.4, 8]} />
        <meshStandardMaterial color="#3a7a32" roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.9, 0]} castShadow>
        <coneGeometry args={[0.12, 0.3, 8]} />
        <meshStandardMaterial color="#4a8a3a" roughness={0.7} />
      </mesh>
      {/* Small accent leaf cones */}
      <mesh position={[0.08, 0.55, 0.1]} rotation={[0.3, 0, 0.5]}>
        <coneGeometry args={[0.1, 0.3, 6]} />
        <meshStandardMaterial color="#335a2a" roughness={0.7} />
      </mesh>
      <mesh position={[-0.1, 0.52, -0.05]} rotation={[-0.2, 0.4, -0.3]}>
        <coneGeometry args={[0.08, 0.25, 6]} />
        <meshStandardMaterial color="#335a2a" roughness={0.7} />
      </mesh>
    </group>
  );
}
