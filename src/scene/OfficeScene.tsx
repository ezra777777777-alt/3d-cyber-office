import { Canvas } from '@react-three/fiber';
import { useOfficeStore } from '@/store/officeStore';
import { useUIStore } from '@/store/uiStore';
import { Lighting } from './Lighting';
import { Floor } from './Floor';
import { Walls } from './Walls';
import { AgentGroup } from './AgentGroup';
import { CameraController } from './CameraController';
import { MeetingTable } from './MeetingTable';
import { Whiteboard } from './Whiteboard';
import { Cabinet } from './Cabinet';
import { Plant } from './Plant';
import { CeilingLamps } from './CeilingLamp';
import { PendingMarker, DoneMarker } from './ZoneMarkers';
import { ResetCameraBtn } from '@/ui/ResetCameraBtn';
import { defaultLayout } from '@/data/defaultLayout';
import { ZoneLabel } from './ZoneLabel';
import { CommanderStation } from './CommanderStation';

export function OfficeScene() {
  const desks = useOfficeStore((s) => s.desks);
  const clearSelection = useUIStore((s) => s.clearSelection);

  return (
    <div className="w-full h-full">
      <Canvas
        shadows
        gl={{ antialias: true, alpha: false }}
        style={{ background: '#1a1a2a' }}
        onClick={() => clearSelection()}
      >
        <Lighting />
        <Floor />
        <Walls />

        {/* Zone labels and commander focal point */}
        <CommanderStation />
        {defaultLayout.zones.map((zone) => (
          <ZoneLabel key={zone.id} zone={zone} />
        ))}

        {/* Ceiling lamps */}
        <CeilingLamps />

        {/* Main work area — 4 workstations */}
        <group>
          {desks
            .filter((desk) => desk.zone === 'commander' || desk.zone === 'workstation')
            .map((desk) => (
              <AgentGroup key={desk.id} deskId={desk.id} />
            ))}
        </group>

        {/* Collaboration area — meeting table */}
        <MeetingTable />

        {/* Pending zone — whiteboard + marker */}
        <Whiteboard />
        <PendingMarker />

        {/* Completed zone — cabinet + marker */}
        <Cabinet />
        <DoneMarker />

        {/* Decorative plants */}
        <Plant position={[8.8, 0, -5.5]} />
        <Plant position={[-8.8, 0, -5.5]} scale={0.9} />
        <Plant position={[0, 0, 5.5]} scale={0.8} />

        <CameraController />
        <ResetCameraBtn />
        <fog attach="fog" args={['#1a1a2a', 18, 35]} />
      </Canvas>
    </div>
  );
}
