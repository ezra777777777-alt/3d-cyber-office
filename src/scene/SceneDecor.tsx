import { CeilingLamp } from './CeilingLamp';
import { Plant } from './Plant';
import { DeliveryRack } from './DeliveryRack';
import { RestCorner } from './RestCorner';
import { ProductivityProps } from './ProductivityProps';
import { getVisualDensityPreset } from './visualDensityConfig';
import type { VisualDensityMode } from './visualDensityConfig';

interface SceneDecorProps {
  density?: VisualDensityMode;
}

export function SceneDecor({ density: rawDensity = 'normal' }: SceneDecorProps) {
  const density = getVisualDensityPreset(rawDensity);

  return (
    <>
      {/* Ceiling lamps: 2 for low/normal, 4 for showcase */}
      <CeilingLamp position={[-4, 3.35, -4]} />
      <CeilingLamp position={[4, 3.35, -4]} />
      {rawDensity === 'showcase' && (
        <>
          <CeilingLamp position={[0, 3.35, -4]} />
          <CeilingLamp position={[0, 3.35, 2]} />
        </>
      )}

      <DeliveryRack />

      {/* ProductivityProps only in showcase mode when zone props enabled */}
      {rawDensity === 'showcase' && density.showZoneProps && <ProductivityProps />}

      <RestCorner />

      {/* Plants: 0 in low, max 2 in normal, up to 4 in showcase */}
      {rawDensity !== 'low' && (
        <>
          <Plant position={[8.8, 0, -5.5]} />
          <Plant position={[-8.8, 0, -5.5]} scale={0.9} />
        </>
      )}
      {rawDensity === 'showcase' && (
        <>
          <Plant position={[0, 0, 5.5]} scale={0.8} />
          <Plant position={[-7.0, 0, 2.15]} scale={0.72} />
        </>
      )}
    </>
  );
}
