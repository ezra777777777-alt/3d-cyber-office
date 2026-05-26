import { useUIStore } from '@/store/uiStore';
import { ClawFurniture } from './ClawFurniture';
import { getVideoGradeFurnitureSlots } from './videoGradeVisualSpec';
import type { CLAW_FURNITURE_ASSETS } from './clawAssets';

type AssetId = keyof typeof CLAW_FURNITURE_ASSETS;

function StatusBoard({ position, rotationY }: { position: [number, number, number]; rotationY: number }) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh>
        <boxGeometry args={[0.9, 0.48, 0.06]} />
        <meshStandardMaterial color="#09111b" emissive="#132236" emissiveIntensity={0.2} roughness={0.5} />
      </mesh>
      <mesh position={[-0.18, 0.1, 0.04]}>
        <boxGeometry args={[0.42, 0.035, 0.012]} />
        <meshBasicMaterial color="#25d9ff" transparent opacity={0.74} />
      </mesh>
      <mesh position={[0.12, -0.08, 0.04]}>
        <boxGeometry args={[0.52, 0.035, 0.012]} />
        <meshBasicMaterial color="#65ef9a" transparent opacity={0.52} />
      </mesh>
    </group>
  );
}

export function VideoGradeFurnitureLayer() {
  const visualMode = useUIStore((s) => s.visualMode);
  const furniture = getVideoGradeFurnitureSlots(visualMode);

  return (
    <group>
      {furniture.map((slot) => {
        if (slot.kind === 'statusBoard') {
          return <StatusBoard key={slot.id} position={slot.position} rotationY={slot.rotationY} />;
        }
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
