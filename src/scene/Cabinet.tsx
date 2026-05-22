interface CabinetProps {
  position?: [number, number, number];
  rotation?: number;
}

export function Cabinet({ position = [7, 0, 5], rotation = 0 }: CabinetProps) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Main body */}
      <mesh position={[0, 0.9, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.5, 1.8, 1.2]} />
        <meshStandardMaterial color="#5a5040" roughness={0.5} />
      </mesh>
      {/* Shelf dividers */}
      {[0, 0.45, 0.9].map((y, i) => (
        <mesh key={i} position={[0, y, 0]} receiveShadow>
          <boxGeometry args={[0.48, 0.03, 1.18]} />
          <meshStandardMaterial color="#4a4030" roughness={0.4} />
        </mesh>
      ))}
      {/* Items on shelves */}
      {/* Bottom shelf — box */}
      <mesh position={[0, 0.15, 0.2]}>
        <boxGeometry args={[0.3, 0.18, 0.25]} />
        <meshStandardMaterial color="#667788" roughness={0.5} />
      </mesh>
      {/* Bottom shelf — binder */}
      <mesh position={[0, 0.12, -0.3]}>
        <boxGeometry args={[0.35, 0.12, 0.15]} />
        <meshStandardMaterial color="#884444" roughness={0.5} />
      </mesh>
      {/* Middle shelf — documents stack */}
      <mesh position={[0, 0.38, 0]}>
        <boxGeometry args={[0.35, 0.08, 0.22]} />
        <meshStandardMaterial color="#d8d8e0" roughness={0.6} />
      </mesh>
      {/* Top shelf — small box */}
      <mesh position={[0, 0.62, -0.2]}>
        <boxGeometry args={[0.2, 0.15, 0.2]} />
        <meshStandardMaterial color="#557755" roughness={0.5} />
      </mesh>
      {/* Top surface item */}
      <mesh position={[0, 0.93, 0.3]}>
        <cylinderGeometry args={[0.08, 0.09, 0.12, 8]} />
        <meshStandardMaterial color="#aa9966" roughness={0.3} metalness={0.5} />
      </mesh>
    </group>
  );
}
