interface FloorProps {
  size?: [number, number];
}

export function Floor({ size = [20, 16] }: FloorProps) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
      <planeGeometry args={size} />
      <meshStandardMaterial color="#2a2a38" roughness={0.7} />
    </mesh>
  );
}
