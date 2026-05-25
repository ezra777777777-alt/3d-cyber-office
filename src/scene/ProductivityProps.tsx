/**
 * TaskBoardProp — a single large whiteboard/screen on a stand.
 * Primary dimension: 0.9m wide, clearly readable from default camera.
 * Only shown in 'showcase' density mode.
 */
function TaskBoardProp({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Stand base */}
      <mesh position={[0, 0.04, 0]} receiveShadow>
        <boxGeometry args={[0.4, 0.06, 0.3]} />
        <meshStandardMaterial color="#5a5a6a" roughness={0.3} metalness={0.6} />
      </mesh>
      {/* Stand pole */}
      <mesh position={[0, 0.55, 0]} castShadow>
        <cylinderGeometry args={[0.04, 0.05, 1.0, 8]} />
        <meshStandardMaterial color="#6a6a7a" roughness={0.3} metalness={0.7} />
      </mesh>
      {/* Board frame */}
      <mesh position={[0, 1.15, 0.04]} castShadow>
        <boxGeometry args={[0.9, 0.55, 0.05]} />
        <meshStandardMaterial color="#3a3a4a" roughness={0.3} metalness={0.5} />
      </mesh>
      {/* Board surface */}
      <mesh position={[0, 1.15, 0.07]}>
        <boxGeometry args={[0.82, 0.47, 0.02]} />
        <meshStandardMaterial color="#fafaff" roughness={0.4} emissive="#334466" emissiveIntensity={0.12} />
      </mesh>
      {/* Status light on top of board */}
      <mesh position={[0, 1.45, 0.04]}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshStandardMaterial color="#00dff6" roughness={0.1} emissive="#00dff6" emissiveIntensity={0.5} />
      </mesh>
    </group>
  );
}

/**
 * ArtifactTrayProp — a delivery tray stack.
 * Primary dimension: 0.35m wide per tray, 3 trays stacked.
 * Only shown in 'showcase' density mode.
 */
function ArtifactTrayProp({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Base stand */}
      <mesh position={[0, 0.22, 0]} receiveShadow>
        <boxGeometry args={[0.36, 0.4, 0.28]} />
        <meshStandardMaterial color="#4a5a5a" roughness={0.4} metalness={0.5} />
      </mesh>
      {/* Tray 1 (bottom) */}
      <mesh position={[0.03, 0.44, 0]} castShadow>
        <boxGeometry args={[0.34, 0.03, 0.26]} />
        <meshStandardMaterial color="#8899aa" roughness={0.3} metalness={0.6} />
      </mesh>
      {/* Tray 2 (middle) */}
      <mesh position={[-0.02, 0.50, 0.02]} castShadow>
        <boxGeometry args={[0.32, 0.03, 0.24]} />
        <meshStandardMaterial color="#99aabb" roughness={0.3} metalness={0.6} />
      </mesh>
      {/* Tray 3 (top) */}
      <mesh position={[0.01, 0.56, -0.01]} castShadow>
        <boxGeometry args={[0.30, 0.03, 0.22]} />
        <meshStandardMaterial color="#aabbcc" roughness={0.3} metalness={0.6} />
      </mesh>
      {/* Status indicator on top tray */}
      <mesh position={[0.01, 0.60, -0.01]}>
        <boxGeometry args={[0.08, 0.015, 0.04]} />
        <meshStandardMaterial color="#00e676" roughness={0.1} emissive="#00e676" emissiveIntensity={0.4} />
      </mesh>
    </group>
  );
}

export function ProductivityProps() {
  return (
    <group>
      {/* TaskBoard near the wall / meeting area */}
      <TaskBoardProp position={[3.8, 0, 4.5]} />

      {/* ArtifactTray stack near the delivery zone */}
      <ArtifactTrayProp position={[6.2, 0, -2.5]} />
    </group>
  );
}
