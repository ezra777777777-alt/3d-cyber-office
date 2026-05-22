interface CeilingLampProps {
  position?: [number, number, number];
}

export function CeilingLamp({ position = [0, 3.3, -2] }: CeilingLampProps) {
  return (
    <group position={position}>
      {/* Mount base */}
      <mesh position={[0, 0.08, 0]}>
        <boxGeometry args={[0.6, 0.04, 0.2]} />
        <meshStandardMaterial color="#555566" roughness={0.2} metalness={0.8} />
      </mesh>
      {/* Light panel */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.6, 0.03, 0.2]} />
        <meshStandardMaterial color="#ffffff" roughness={0.1} emissive="#ffeedd" emissiveIntensity={0.8} />
      </mesh>
      {/* Thin suspension rod */}
      <mesh position={[0, 0.13, 0]}>
        <cylinderGeometry args={[0.015, 0.015, 0.18, 6]} />
        <meshStandardMaterial color="#555566" roughness={0.2} metalness={0.9} />
      </mesh>
    </group>
  );
}

export function CeilingLamps() {
  return (
    <>
      <CeilingLamp position={[-4, 3.35, -4]} />
      <CeilingLamp position={[0, 3.35, -4]} />
      <CeilingLamp position={[4, 3.35, -4]} />
      <CeilingLamp position={[0, 3.35, 2]} />
    </>
  );
}
