import { useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
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
import { SceneDecor } from './SceneDecor';
import { PendingMarker, DoneMarker } from './ZoneMarkers';
import { defaultLayout } from '@/data/defaultLayout';
import { ZoneLabel } from './ZoneLabel';
import { CommanderStation } from './CommanderStation';
import { CommanderVisualLayer } from './CommanderVisualLayer';
import { brightOfficeTheme } from './sceneVisualTheme';

const BG = brightOfficeTheme.firstScreenBackground;

function ForceInitialRender() {
  const { gl, scene, camera } = useThree();
  useEffect(() => {
    gl.render(scene, camera);
  }, [gl, scene, camera]);
  return null;
}

export function OfficeScene() {
  const desks = useOfficeStore((s) => s.desks);
  const clearSelection = useUIStore((s) => s.clearSelection);

  return (
    <div className="w-full h-full office-canvas-wrapper">
      <Canvas
        gl={{ antialias: false, alpha: false }}
        onCreated={({ gl }) => {
          gl.setClearColor(BG);
        }}
        onClick={() => clearSelection()}
      >
        <color attach="background" args={[brightOfficeTheme.background]} />
        <fog attach="fog" args={[brightOfficeTheme.fog, brightOfficeTheme.fogNear, brightOfficeTheme.fogFar]} />

        <Lighting />
        <Floor />
        <Walls />

        <CommanderStation />
        <CommanderVisualLayer />
        {defaultLayout.zones.map((zone) => (
          <ZoneLabel key={zone.id} zone={zone} />
        ))}

        <SceneDecor />

        <group>
          {desks
            .filter((desk) => desk.zone === 'commander' || desk.zone === 'workstation')
            .map((desk) => (
              <AgentGroup key={desk.id} deskId={desk.id} />
            ))}
        </group>

        <MeetingTable />
        <Whiteboard />
        <PendingMarker />
        <Cabinet />
        <DoneMarker />

        <CameraController />
        <ForceInitialRender />
      </Canvas>
    </div>
  );
}
