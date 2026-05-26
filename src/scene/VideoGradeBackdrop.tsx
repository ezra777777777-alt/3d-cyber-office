import { VIDEO_GRADE_PALETTE, VIDEO_GRADE_PLATFORM } from './videoGradeVisualSpec';

function InfoBoard() {
  return (
    <group position={[-0.25, 0.96, -3.44]}>
      <mesh>
        <boxGeometry args={[1.62, 1.14, 0.08]} />
        <meshStandardMaterial color={VIDEO_GRADE_PALETTE.boardBlue} emissive="#0d3149" emissiveIntensity={0.24} roughness={0.48} />
      </mesh>
      <mesh position={[0, 0.27, 0.052]}>
        <boxGeometry args={[1.08, 0.055, 0.012]} />
        <meshBasicMaterial color={VIDEO_GRADE_PALETTE.statusCyan} transparent opacity={0.76} />
      </mesh>
      <mesh position={[-0.2, -0.02, 0.052]}>
        <boxGeometry args={[0.64, 0.045, 0.012]} />
        <meshBasicMaterial color="#b9eaff" transparent opacity={0.5} />
      </mesh>
      <mesh position={[0.18, -0.24, 0.052]}>
        <boxGeometry args={[0.74, 0.045, 0.012]} />
        <meshBasicMaterial color="#b9eaff" transparent opacity={0.38} />
      </mesh>
    </group>
  );
}

function RearArch() {
  return (
    <group position={[1.24, 0, -5.08]}>
      <mesh position={[-0.64, 0.69, 0]}>
        <cylinderGeometry args={[0.045, 0.045, 1.38, 8]} />
        <meshStandardMaterial color="#2b7152" roughness={0.58} />
      </mesh>
      <mesh position={[0.64, 0.69, 0]}>
        <cylinderGeometry args={[0.045, 0.045, 1.38, 8]} />
        <meshStandardMaterial color="#2b7152" roughness={0.58} />
      </mesh>
      <mesh position={[0, 1.38, 0]}>
        <boxGeometry args={[1.48, 0.08, 0.08]} />
        <meshStandardMaterial color="#2b7152" roughness={0.58} />
      </mesh>
    </group>
  );
}

export function VideoGradeBackdrop() {
  return (
    <group>
      <mesh position={[2.35, 1.76, -5.86]}>
        <boxGeometry args={[VIDEO_GRADE_PLATFORM.rearWallWidth, VIDEO_GRADE_PLATFORM.rearWallHeight, 0.16]} />
        <meshStandardMaterial color={VIDEO_GRADE_PALETTE.greenWall} roughness={0.65} metalness={0.05} />
      </mesh>
      <mesh position={[2.35, 3.08, -5.76]}>
        <boxGeometry args={[VIDEO_GRADE_PLATFORM.rearWallWidth + 0.32, 0.1, 0.2]} />
        <meshBasicMaterial color={VIDEO_GRADE_PALETTE.wallTrim} transparent opacity={0.88} />
      </mesh>
      <InfoBoard />
      <RearArch />
    </group>
  );
}
