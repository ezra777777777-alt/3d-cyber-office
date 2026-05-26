import { VideoFrameOfficeEnvironment } from './VideoFrameOfficeEnvironment';
import { VideoFrameFurnitureLayer } from './VideoFrameFurnitureLayer';
import { VideoFrameAgentLayer } from './VideoFrameAgentLayer';
import { VIDEO_FRAME_LANDMARKS, VIDEO_FRAME_PALETTE } from './videoFrameReplicaSpec';

function LobsterIdentityBoard() {
  return (
    <group position={[2.95, 1.42, -5.54]}>
      <mesh>
        <boxGeometry args={[0.78, 0.46, 0.04]} />
        <meshBasicMaterial color="#080b12" transparent opacity={0.88} />
      </mesh>
      <mesh position={[-0.18, 0.06, 0.032]} scale={[1, 0.7, 0.18]}>
        <sphereGeometry args={[0.12, 16, 10]} />
        <meshBasicMaterial color={VIDEO_FRAME_PALETTE.lobster} />
      </mesh>
      <mesh position={[0.02, -0.1, 0.033]}>
        <boxGeometry args={[0.42, 0.035, 0.012]} />
        <meshBasicMaterial color={VIDEO_FRAME_PALETTE.statusAmber} transparent opacity={0.82} />
      </mesh>
    </group>
  );
}

function BottomAgentDockHint() {
  return (
    <group position={[0, 0.07, 2.75]}>
      {[-1.8, -1.2, -0.6, 0, 0.6, 1.2].map((x, index) => (
        <mesh key={x} position={[x, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.11, 16]} />
          <meshBasicMaterial
            color={index === 0 ? VIDEO_FRAME_PALETTE.lobster : VIDEO_FRAME_PALETTE.statusCyan}
            transparent
            opacity={0.52}
          />
        </mesh>
      ))}
    </group>
  );
}

function SceneLandmarks() {
  const board = VIDEO_FRAME_LANDMARKS.blueInfoBoard;
  const arch = VIDEO_FRAME_LANDMARKS.rearArch;
  return (
    <group>
      <group position={board.position}>
        <mesh>
          <boxGeometry args={board.size} />
          <meshStandardMaterial
            color="#1f5f86"
            emissive="#0d3149"
            emissiveIntensity={0.28}
            roughness={0.48}
            metalness={0.08}
          />
        </mesh>
        <mesh position={[0, 0.25, 0.052]}>
          <boxGeometry args={[1.1, 0.055, 0.012]} />
          <meshBasicMaterial color={VIDEO_FRAME_PALETTE.statusCyan} transparent opacity={0.75} />
        </mesh>
        <mesh position={[-0.22, -0.04, 0.052]}>
          <boxGeometry args={[0.62, 0.045, 0.012]} />
          <meshBasicMaterial color="#b9eaff" transparent opacity={0.56} />
        </mesh>
        <mesh position={[0.2, -0.22, 0.052]}>
          <boxGeometry args={[0.76, 0.045, 0.012]} />
          <meshBasicMaterial color="#b9eaff" transparent opacity={0.42} />
        </mesh>
      </group>
      <group position={arch.position}>
        <mesh position={[-arch.width / 2, arch.height / 2, 0]}>
          <cylinderGeometry args={[0.045, 0.045, arch.height, 8]} />
          <meshStandardMaterial color="#2b7152" roughness={0.58} />
        </mesh>
        <mesh position={[arch.width / 2, arch.height / 2, 0]}>
          <cylinderGeometry args={[0.045, 0.045, arch.height, 8]} />
          <meshStandardMaterial color="#2b7152" roughness={0.58} />
        </mesh>
        <mesh position={[0, arch.height, 0]}>
          <boxGeometry args={[arch.width + 0.2, 0.08, 0.08]} />
          <meshStandardMaterial color="#2b7152" roughness={0.58} />
        </mesh>
      </group>
    </group>
  );
}

export function VideoFrameOffice() {
  return (
    <>
      <color attach="background" args={[VIDEO_FRAME_PALETTE.background]} />
      <fog attach="fog" args={[VIDEO_FRAME_PALETTE.background, 14, 36]} />
      <VideoFrameOfficeEnvironment />
      <VideoFrameFurnitureLayer />
      <VideoFrameAgentLayer />
      <SceneLandmarks />
      <LobsterIdentityBoard />
      <BottomAgentDockHint />
    </>
  );
}
