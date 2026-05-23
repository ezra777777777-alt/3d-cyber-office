interface WallsProps {
  roomSize?: [number, number, number]; // width, height, depth
}

export function Walls({ roomSize = [20, 3.5, 14] }: WallsProps) {
  const [w, h, d] = roomSize;
  const thick = 0.15;
  const wallColor = '#4a4a58';
  const wallRoughness = 0.7;

  return (
    <group>
      {/* Back wall — solid with window panels */}
      <mesh position={[0, h / 2, -d / 2]} receiveShadow>
        <boxGeometry args={[w, h, thick]} />
        <meshStandardMaterial color={wallColor} roughness={wallRoughness} />
      </mesh>

      {/* Window panels on back wall */}
      {[-4, 0, 4].map((x, i) => (
        <mesh key={`win-${i}`} position={[x, h * 0.55, -d / 2 + thick / 2 + 0.01]}>
          <boxGeometry args={[1.8, 1.2, 0.02]} />
          <meshStandardMaterial
            color="#8899bb"
            roughness={0.1}
            metalness={0.3}
            transparent
            opacity={0.5}
            emissive="#334466"
            emissiveIntensity={0.2}
          />
        </mesh>
      ))}

      {/* Left wall */}
      <mesh position={[-w / 2, h / 2, 0]} receiveShadow>
        <boxGeometry args={[thick, h, d]} />
        <meshStandardMaterial color={wallColor} roughness={wallRoughness} />
      </mesh>

      {/* Right wall */}
      <mesh position={[w / 2, h / 2, 0]} receiveShadow>
        <boxGeometry args={[thick, h, d]} />
        <meshStandardMaterial color={wallColor} roughness={wallRoughness} />
      </mesh>

      {/* Short divider between pending and done zones */}
      <mesh position={[0, h * 0.4, 3.5]} receiveShadow>
        <boxGeometry args={[0.1, h * 0.8, 2]} />
        <meshStandardMaterial color="#3a3a48" roughness={0.6} transparent opacity={0.7} />
      </mesh>

      {/* Ceiling — semi-transparent for top-down readability */}
      <mesh position={[0, h, 0]} receiveShadow>
        <boxGeometry args={[w, 0.08, d]} />
        <meshStandardMaterial
          color="#3a3a50"
          roughness={0.8}
          transparent
          opacity={0.25}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}
