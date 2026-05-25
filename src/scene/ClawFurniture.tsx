import { useGLTF } from '@react-three/drei';
import { useMemo } from 'react';
import * as THREE from 'three';
import { CLAW_FURNITURE_ASSETS } from './clawAssets';

type ClawAssetId = keyof typeof CLAW_FURNITURE_ASSETS;

export function ClawFurniture({
  assetId,
  position,
  rotationY = 0,
}: {
  assetId: ClawAssetId;
  position: [number, number, number];
  rotationY?: number;
}) {
  const asset = CLAW_FURNITURE_ASSETS[assetId];
  const { scene } = useGLTF(asset.path);
  const cloned = useMemo(() => {
    const copy = scene.clone(true);
    copy.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (!mesh.isMesh) return;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
    });
    return copy;
  }, [scene]);

  return (
    <primitive
      object={cloned}
      position={position}
      rotation={[0, rotationY, 0]}
      scale={asset.scale}
    />
  );
}
