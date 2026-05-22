import { useRef, useEffect, useCallback } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { useUIStore } from '@/store/uiStore';

export const OFFICE_OVERVIEW_CAMERA = {
  position: [13, 13, 15] as [number, number, number],
  target: [0, 0, 0] as [number, number, number],
};

const DEFAULT_POSITION = new THREE.Vector3(...OFFICE_OVERVIEW_CAMERA.position);
const DEFAULT_TARGET = new THREE.Vector3(...OFFICE_OVERVIEW_CAMERA.target);

export function CameraController() {
  const controlsRef = useRef<any>(null);
  const { camera } = useThree();
  const cameraFocus = useUIStore((s) => s.cameraFocus);

  useEffect(() => {
    camera.position.copy(DEFAULT_POSITION);
    camera.lookAt(DEFAULT_TARGET);
  }, [camera]);

  useFrame(() => {
    if (cameraFocus && controlsRef.current) {
      const target = controlsRef.current.target as THREE.Vector3;
      target.lerp(new THREE.Vector3(...cameraFocus), 0.1);
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.08}
      minDistance={4}
      maxDistance={28}
      maxPolarAngle={Math.PI / 2.1}
      minPolarAngle={0.15}
      target={DEFAULT_TARGET.toArray() as [number, number, number]}
      mouseButtons={{
        LEFT: THREE.MOUSE.ROTATE,
        MIDDLE: THREE.MOUSE.PAN,
        RIGHT: THREE.MOUSE.PAN,
      }}
    />
  );
}

export function useResetCamera() {
  const { camera } = useThree();
  return useCallback(() => {
    camera.position.copy(DEFAULT_POSITION);
    camera.lookAt(DEFAULT_TARGET);
    useUIStore.getState().setCameraFocus(null);
  }, [camera]);
}
