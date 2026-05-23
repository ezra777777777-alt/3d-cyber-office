import { brightOfficeTheme } from './sceneVisualTheme';

interface WallsProps {
  roomSize?: [number, number, number];
}

export function Walls({ roomSize = brightOfficeTheme.roomSize }: WallsProps) {
  const [w, h, d] = roomSize;
  const thick = brightOfficeTheme.wallThickness;

  return (
    <group>
      {/* Back wall — solid with window panels */}
      <mesh position={[0, h / 2, -d / 2]} receiveShadow>
        <boxGeometry args={[w, h, thick]} />
        <meshStandardMaterial color={brightOfficeTheme.wall} roughness={0.5} />
      </mesh>

      {/* Window panels on back wall */}
      {[-4, 0, 4].map((x, i) => (
        <mesh key={`win-${i}`} position={[x, h * 0.55, -d / 2 + thick / 2 + 0.01]}>
          <boxGeometry args={[1.8, 1.2, 0.02]} />
          <meshStandardMaterial
            color={brightOfficeTheme.windowColor}
            roughness={0.1}
            metalness={0.3}
            transparent
            opacity={brightOfficeTheme.windowOpacity}
            emissive={brightOfficeTheme.windowEmissive}
            emissiveIntensity={brightOfficeTheme.windowEmissiveIntensity}
          />
        </mesh>
      ))}

      {/* Left wall */}
      <mesh position={[-w / 2, h / 2, 0]} receiveShadow>
        <boxGeometry args={[thick, h, d]} />
        <meshStandardMaterial color={brightOfficeTheme.wall} roughness={0.5} />
      </mesh>

      {/* Right wall */}
      <mesh position={[w / 2, h / 2, 0]} receiveShadow>
        <boxGeometry args={[thick, h, d]} />
        <meshStandardMaterial color={brightOfficeTheme.wall} roughness={0.5} />
      </mesh>

      {/* Short divider between pending and done zones */}
      <mesh position={[0, h * 0.4, 3.5]} receiveShadow>
        <boxGeometry args={[0.1, h * 0.8, 2]} />
        <meshStandardMaterial color={brightOfficeTheme.divider} roughness={0.6} transparent opacity={0.7} />
      </mesh>

      {/* Ceiling — semi-transparent for top-down readability */}
      <mesh position={[0, h, 0]} receiveShadow>
        <boxGeometry args={[w, 0.08, d]} />
        <meshStandardMaterial
          color={brightOfficeTheme.ceiling}
          roughness={0.6}
          transparent
          opacity={brightOfficeTheme.ceilingOpacity}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}
