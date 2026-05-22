import { CeilingLamps } from './CeilingLamp';
import { Plant } from './Plant';
import { DeliveryRack } from './DeliveryRack';
import { RestCorner } from './RestCorner';

export function SceneDecor() {
  return (
    <>
      <CeilingLamps />
      <DeliveryRack />
      <RestCorner />
      <Plant position={[8.8, 0, -5.5]} />
      <Plant position={[-8.8, 0, -5.5]} scale={0.9} />
      <Plant position={[0, 0, 5.5]} scale={0.8} />
      <Plant position={[-7.0, 0, 2.15]} scale={0.72} />
    </>
  );
}
