interface WhiteboardProps {
  position?: [number, number, number];
  rotation?: number;
}

export function Whiteboard({ position = [-7, 1.5, 5.5], rotation = 0 }: WhiteboardProps) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Board surface */}
      <mesh position={[0, 0, 0]} castShadow>
        <boxGeometry args={[0.1, 1.3, 2.2]} />
        <meshStandardMaterial color="#e8e8f0" roughness={0.4} />
      </mesh>
      {/* Frame */}
      <mesh position={[0.06, 0, 0]}>
        <boxGeometry args={[0.02, 1.34, 2.24]} />
        <meshStandardMaterial color="#888899" roughness={0.2} metalness={0.8} />
      </mesh>
      {/* Marker tray */}
      <mesh position={[0.08, -0.6, 0]}>
        <boxGeometry args={[0.04, 0.04, 1.8]} />
        <meshStandardMaterial color="#888899" roughness={0.2} metalness={0.8} />
      </mesh>
      {/* Marker pens */}
      {[-0.4, 0, 0.4].map((mz, i) => (
        <mesh key={i} position={[0.1, -0.58, mz]}>
          <cylinderGeometry args={[0.015, 0.015, 0.08, 8]} />
          <meshStandardMaterial color={['#3366cc', '#cc3333', '#33aa33'][i]} roughness={0.3} />
        </mesh>
      ))}
      {/* Scribble marks on board */}
      <mesh position={[0.06, 0.15, -0.3]}>
        <boxGeometry args={[0.005, 0.04, 0.5]} />
        <meshBasicMaterial color="#334466" />
      </mesh>
      <mesh position={[0.06, 0.0, 0.2]}>
        <boxGeometry args={[0.005, 0.03, 0.8]} />
        <meshBasicMaterial color="#446688" />
      </mesh>
    </group>
  );
}
