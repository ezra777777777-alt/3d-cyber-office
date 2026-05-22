export function DeliveryRack() {
  return (
    <group position={[7.2, 0, 3.9]}>
      {/* Main cabinet body */}
      <mesh position={[0, 0.8, 0]} castShadow>
        <boxGeometry args={[1.35, 1.55, 0.42]} />
        <meshStandardMaterial color="#22302a" roughness={0.72} />
      </mesh>
      {/* Shelf edges with green accent */}
      {[0.28, 0.78, 1.22].map((height) => (
        <mesh key={height} position={[0, height, -0.24]}>
          <boxGeometry args={[1.18, 0.04, 0.08]} />
          <meshStandardMaterial color="#00e676" emissive="#00e676" emissiveIntensity={0.22} />
        </mesh>
      ))}
    </group>
  );
}
