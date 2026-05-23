import { brightOfficeTheme } from './sceneVisualTheme';

interface FloorProps {
  size?: [number, number];
}

export function Floor({ size = brightOfficeTheme.floorSize }: FloorProps) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
      <planeGeometry args={size} />
      <meshStandardMaterial color={brightOfficeTheme.floor} roughness={brightOfficeTheme.floorRoughness} />
    </mesh>
  );
}
