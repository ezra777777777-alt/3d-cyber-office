import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { VIDEO_FRAME_EXPANSION_ZONES, VIDEO_FRAME_PALETTE, VIDEO_FRAME_PLATFORM } from './videoFrameReplicaSpec';

function FloorBoards() {
  const boardCount = 9;
  const width = VIDEO_FRAME_PLATFORM.floorWidth / boardCount;
  return (
    <group>
      {Array.from({ length: boardCount }).map((_, index) => {
        const x = -VIDEO_FRAME_PLATFORM.floorWidth / 2 + width / 2 + index * width;
        return (
          <mesh key={index} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.006, -1.8]}>
            <boxGeometry args={[0.018, VIDEO_FRAME_PLATFORM.floorDepth, 0.01]} />
            <meshBasicMaterial color={VIDEO_FRAME_PALETTE.floorLine} transparent opacity={0.22} />
          </mesh>
        );
      })}
    </group>
  );
}

function LowPolyTree({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.28, 0]}>
        <cylinderGeometry args={[0.045, 0.06, 0.56, 6]} />
        <meshStandardMaterial color="#8b6a43" roughness={0.75} />
      </mesh>
      <mesh position={[0, 0.72, 0]}>
        <sphereGeometry args={[0.28, 8, 6]} />
        <meshStandardMaterial color="#2d7a3d" roughness={0.68} />
      </mesh>
      <mesh position={[0.22, 0.62, -0.05]}>
        <sphereGeometry args={[0.2, 8, 6]} />
        <meshStandardMaterial color="#347f43" roughness={0.68} />
      </mesh>
      <mesh position={[-0.2, 0.62, 0.08]}>
        <sphereGeometry args={[0.18, 8, 6]} />
        <meshStandardMaterial color="#3b8a4d" roughness={0.68} />
      </mesh>
    </group>
  );
}

export function VideoFrameOfficeEnvironment() {
  const { scene } = useThree();

  useEffect(() => {
    scene.background = new THREE.Color(VIDEO_FRAME_PALETTE.background);
    scene.fog = new THREE.Fog(VIDEO_FRAME_PALETTE.background, 14, 36);
  }, [scene]);

  return (
    <group>
      <ambientLight intensity={0.39} color="#3f526b" />
      <directionalLight position={[5.8, 8.4, 5.6]} intensity={1.28} color="#ffe6c4" />
      <directionalLight position={[-4.8, 4.8, -2.6]} intensity={0.42} color="#8eb5e6" />
      <pointLight position={[2.9, 2.6, -4.45]} intensity={0.95} distance={6.5} color={VIDEO_FRAME_PALETTE.statusAmber} />
      <pointLight position={[-5.8, 0.75, -2.2]} intensity={0.75} distance={5} color={VIDEO_FRAME_PALETTE.water} />
      <pointLight position={[6.1, 0.75, -2.5]} intensity={0.75} distance={5} color={VIDEO_FRAME_PALETTE.water} />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.04, -1.85]}>
        <planeGeometry args={[VIDEO_FRAME_PLATFORM.width, VIDEO_FRAME_PLATFORM.depth]} />
        <meshStandardMaterial color={VIDEO_FRAME_PALETTE.platform} roughness={0.72} metalness={0.02} />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[VIDEO_FRAME_EXPANSION_ZONES.rightExtension.position[0], -0.033, VIDEO_FRAME_EXPANSION_ZONES.rightExtension.position[2]]}>
        <planeGeometry args={[VIDEO_FRAME_EXPANSION_ZONES.rightExtension.size[0], VIDEO_FRAME_EXPANSION_ZONES.rightExtension.size[1]]} />
        <meshStandardMaterial color="#f6f1e8" roughness={0.74} metalness={0.02} />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.025, -1.72]}>
        <planeGeometry args={[VIDEO_FRAME_PLATFORM.floorWidth, VIDEO_FRAME_PLATFORM.floorDepth]} />
        <meshStandardMaterial color={VIDEO_FRAME_PALETTE.floor} roughness={0.58} metalness={0.03} />
      </mesh>
      <FloorBoards />

      <mesh position={[2.35, 1.75, -5.75]}>
        <boxGeometry args={[8.4, 2.48, 0.16]} />
        <meshStandardMaterial color={VIDEO_FRAME_PALETTE.greenWall} roughness={0.65} metalness={0.05} />
      </mesh>
      <mesh position={[2.35, 3.04, -5.66]}>
        <boxGeometry args={[8.7, 0.1, 0.2]} />
        <meshBasicMaterial color={VIDEO_FRAME_PALETTE.wallTrim} transparent opacity={0.88} />
      </mesh>

      <mesh position={[-6.4, 0.04, -2.0]} rotation={[-Math.PI / 2, 0, 0.14]}>
        <planeGeometry args={[1.38, 9.2]} />
        <meshStandardMaterial color={VIDEO_FRAME_PALETTE.water} emissive={VIDEO_FRAME_PALETTE.waterDark} emissiveIntensity={0.38} transparent opacity={0.9} />
      </mesh>
      <mesh position={[6.55, 0.04, -2.15]} rotation={[-Math.PI / 2, 0, -0.12]}>
        <planeGeometry args={[1.28, 8.5]} />
        <meshStandardMaterial color={VIDEO_FRAME_PALETTE.water} emissive={VIDEO_FRAME_PALETTE.waterDark} emissiveIntensity={0.38} transparent opacity={0.88} />
      </mesh>

      <mesh position={[VIDEO_FRAME_EXPANSION_ZONES.leftGarden.position[0], 0.045, VIDEO_FRAME_EXPANSION_ZONES.leftGarden.position[2]]} rotation={[-Math.PI / 2, 0, 0.18]}>
        <planeGeometry args={[VIDEO_FRAME_EXPANSION_ZONES.leftGarden.size[0], VIDEO_FRAME_EXPANSION_ZONES.leftGarden.size[1]]} />
        <meshStandardMaterial color={VIDEO_FRAME_PALETTE.water} emissive={VIDEO_FRAME_PALETTE.waterDark} emissiveIntensity={0.35} transparent opacity={0.72} />
      </mesh>
      <mesh position={[-6.95, 0.065, -5.35]} rotation={[-Math.PI / 2, 0, 0.18]}>
        <ringGeometry args={[0.72, 0.92, 28]} />
        <meshBasicMaterial color="#e6f5f0" transparent opacity={0.5} />
      </mesh>
      <LowPolyTree position={[-7.65, 0, -5.7]} scale={1.0} />
      <LowPolyTree position={[-6.72, 0, -5.95]} scale={0.8} />
      <LowPolyTree position={[-5.82, 0, -4.78]} scale={0.72} />
      <LowPolyTree position={[-7.25, 0, -3.85]} scale={0.76} />
    </group>
  );
}
