import { useUIStore } from '@/store/uiStore';
import { ClawFurniture } from './ClawFurniture';
import { getVideoFrameFurnitureSlots } from './videoFrameReplicaSpec';
import type { CLAW_FURNITURE_ASSETS } from './clawAssets';

type AssetId = keyof typeof CLAW_FURNITURE_ASSETS;

export function VideoFrameFurnitureLayer() {
  const visualMode = useUIStore((s) => s.visualMode);
  const furniture = getVideoFrameFurnitureSlots(visualMode);

  return (
    <group>
      {furniture.map((slot) => {
        if (!slot.assetId) return null;
        return (
          <group key={slot.id} position={slot.position} rotation={[0, slot.rotationY, 0]} scale={slot.scale}>
            <ClawFurniture assetId={slot.assetId as AssetId} position={[0, 0, 0]} rotationY={0} />
          </group>
        );
      })}
    </group>
  );
}
