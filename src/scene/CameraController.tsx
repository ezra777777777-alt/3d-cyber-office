import { useRef, useEffect, useCallback } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { useUIStore } from '@/store/uiStore';

export const OFFICE_OVERVIEW_CAMERA = {
  position: [5, 9, 11] as [number, number, number],
  target: [0, 0, -1] as [number, number, number],
};

const DEFAULT_POSITION = new THREE.Vector3(...OFFICE_OVERVIEW_CAMERA.position);
const DEFAULT_TARGET = new THREE.Vector3(...OFFICE_OVERVIEW_CAMERA.target);

// Module-level camera ref so external UI (outside Canvas) can reset view
let _camera: THREE.Camera | null = null;

export function getCamera(): THREE.Camera | null {
  return _camera;
}

export function ExternalResetCamera() {
  const cam = _camera;
  if (!cam) return;
  cam.position.copy(DEFAULT_POSITION);
  cam.lookAt(DEFAULT_TARGET);
  const ui = useUIStore.getState();
  ui.setCameraFocus(null);
  ui.setGuidedCameraShot(null);
}

export function CameraController() {
  const controlsRef = useRef<any>(null);
  const { camera } = useThree();
  const cameraFocus = useUIStore((s) => s.cameraFocus);
  const guidedCameraShot = useUIStore((s) => s.guidedCameraShot);
  const demoPaused = useUIStore((s) => s.demoPaused);

  const currentShotIdRef = useRef<string | null>(null);
  const shotStartRef = useRef(0);
  const shotFromPositionRef = useRef(new THREE.Vector3());
  const shotFromTargetRef = useRef(new THREE.Vector3());
  const wasPausedRef = useRef(false);
  const pauseSnapshotRef = useRef(0);

  useEffect(() => {
    _camera = camera;
    camera.position.copy(DEFAULT_POSITION);
    camera.lookAt(DEFAULT_TARGET);
    return () => { _camera = null; };
  }, [camera]);

  useFrame((state) => {
    // Guided camera shot interpolation
    if (guidedCameraShot && controlsRef.current) {
      const target = controlsRef.current.target as THREE.Vector3;
      if (currentShotIdRef.current !== guidedCameraShot.id) {
        currentShotIdRef.current = guidedCameraShot.id;
        shotStartRef.current = state.clock.elapsedTime * 1000;
        shotFromPositionRef.current.copy(camera.position);
        shotFromTargetRef.current.copy(target);
        wasPausedRef.current = false;
        pauseSnapshotRef.current = 0;
      }

      // Freeze camera motion during pause: adjust shotStart by the pause duration
      if (demoPaused && !wasPausedRef.current) {
        pauseSnapshotRef.current = state.clock.elapsedTime * 1000;
        wasPausedRef.current = true;
      }
      if (!demoPaused && wasPausedRef.current) {
        const pauseDuration = state.clock.elapsedTime * 1000 - pauseSnapshotRef.current;
        shotStartRef.current += pauseDuration;
        wasPausedRef.current = false;
      }

      if (demoPaused) return;

      const elapsedMs = state.clock.elapsedTime * 1000 - shotStartRef.current;
      const t = Math.min(1, elapsedMs / guidedCameraShot.durationMs);
      const ease = 1 - Math.pow(1 - t, 3);
      const nextPosition = new THREE.Vector3(...guidedCameraShot.position);
      const nextTarget = new THREE.Vector3(...guidedCameraShot.target);
      camera.position.lerpVectors(shotFromPositionRef.current, nextPosition, ease);
      target.lerpVectors(shotFromTargetRef.current, nextTarget, ease);
      camera.lookAt(target);
      controlsRef.current.update();
      return;
    }

    // Reset shot tracking when guided shot is cleared
    if (currentShotIdRef.current !== null && !guidedCameraShot) {
      currentShotIdRef.current = null;
      wasPausedRef.current = false;
      pauseSnapshotRef.current = 0;
    }

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
    const ui = useUIStore.getState();
    ui.setCameraFocus(null);
    ui.setGuidedCameraShot(null);
  }, [camera]);
}
