import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { VIDEO_GRADE_PALETTE } from './videoGradeVisualSpec';
import { VideoGradeBackdrop } from './VideoGradeBackdrop';
import { VideoGradePlatform } from './VideoGradePlatform';

export function VideoFrameOfficeEnvironment() {
  const { scene } = useThree();

  useEffect(() => {
    scene.background = new THREE.Color(VIDEO_GRADE_PALETTE.background);
    scene.fog = new THREE.Fog(VIDEO_GRADE_PALETTE.background, 15, 39);
  }, [scene]);

  return (
    <group>
      <ambientLight intensity={0.42} color="#3f526b" />
      <directionalLight position={[6.2, 8.4, 5.8]} intensity={1.22} color="#ffe6c4" />
      <directionalLight position={[-5.4, 4.8, -2.8]} intensity={0.44} color="#8eb5e6" />
      <pointLight position={[3.0, 2.55, -4.58]} intensity={0.95} distance={6.5} color={VIDEO_GRADE_PALETTE.statusAmber} />
      <pointLight position={[-6.0, 0.75, -2.25]} intensity={0.72} distance={5.4} color={VIDEO_GRADE_PALETTE.water} />
      <pointLight position={[6.35, 0.75, -2.42]} intensity={0.72} distance={5.4} color={VIDEO_GRADE_PALETTE.water} />

      <VideoGradePlatform />
      <VideoGradeBackdrop />
    </group>
  );
}
