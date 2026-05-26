import { VIDEO_GRADE_PALETTE, VIDEO_GRADE_PLATFORM } from './videoGradeVisualSpec';

function FloorBoardLines() {
  const boardCount = 11;
  const width = VIDEO_GRADE_PLATFORM.floorWidth / boardCount;
  return (
    <group>
      {Array.from({ length: boardCount }).map((_, index) => {
        const x = -VIDEO_GRADE_PLATFORM.floorWidth / 2 + width / 2 + index * width;
        return (
          <mesh key={index} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.012, -1.8]}>
            <boxGeometry args={[0.018, VIDEO_GRADE_PLATFORM.floorDepth, 0.012]} />
            <meshBasicMaterial color={VIDEO_GRADE_PALETTE.floorLine} transparent opacity={0.24} />
          </mesh>
        );
      })}
    </group>
  );
}

function WaterStrip({
  position,
  rotationZ,
  width,
  depth,
}: {
  position: [number, number, number];
  rotationZ: number;
  width: number;
  depth: number;
}) {
  return (
    <group position={position} rotation={[-Math.PI / 2, 0, rotationZ]}>
      <mesh>
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial
          color={VIDEO_GRADE_PALETTE.water}
          emissive={VIDEO_GRADE_PALETTE.waterDark}
          emissiveIntensity={0.36}
          transparent
          opacity={0.88}
          roughness={0.42}
        />
      </mesh>
      <mesh position={[0, 0, 0.012]}>
        <ringGeometry args={[Math.min(width, depth) * 0.22, Math.min(width, depth) * 0.34, 32]} />
        <meshBasicMaterial color="#e6f5f0" transparent opacity={0.36} />
      </mesh>
    </group>
  );
}

export function VideoGradePlatform() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.052, -1.86]}>
        <planeGeometry args={[VIDEO_GRADE_PLATFORM.width, VIDEO_GRADE_PLATFORM.depth]} />
        <meshStandardMaterial color={VIDEO_GRADE_PALETTE.platform} roughness={0.72} metalness={0.02} />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.024, -1.72]}>
        <planeGeometry args={[VIDEO_GRADE_PLATFORM.floorWidth, VIDEO_GRADE_PLATFORM.floorDepth]} />
        <meshStandardMaterial color={VIDEO_GRADE_PALETTE.floor} roughness={0.58} metalness={0.03} />
      </mesh>

      <FloorBoardLines />

      <mesh position={[0, 0.018, 3.73]} rotation={[-Math.PI / 2, 0, 0]}>
        <boxGeometry args={[VIDEO_GRADE_PLATFORM.floorWidth + 0.6, 0.1, 0.06]} />
        <meshBasicMaterial color={VIDEO_GRADE_PALETTE.platformEdge} transparent opacity={0.62} />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[6.9, -0.034, -2.45]}>
        <planeGeometry args={[3.0, 5.1]} />
        <meshStandardMaterial color="#f6f1e8" roughness={0.74} metalness={0.02} />
      </mesh>

      <WaterStrip position={[-6.75, 0.045, -2.1]} rotationZ={0.13} width={1.38} depth={9.8} />
      <WaterStrip position={[6.85, 0.045, -2.22]} rotationZ={-0.12} width={1.3} depth={9.1} />
      <WaterStrip position={[-7.25, 0.055, -5.2]} rotationZ={0.18} width={3.9} depth={2.6} />
    </group>
  );
}
