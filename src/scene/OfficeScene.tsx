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
import { VideoFrameOffice } from './VideoFrameOffice';
import { VIDEO_GRADE_PALETTE } from './videoGradeVisualSpec';

const BG = brightOfficeTheme.firstScreenBackground;
const CLAW_BG = VIDEO_GRADE_PALETTE.background;

function ForceInitialRender() {
  const { gl, scene, camera } = useThree();
  useEffect(() => {
    gl.render(scene, camera);
  }, [gl, scene, camera]);
  return null;
}

function CurrentOfficeContent() {
  return (
    <>
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

      <DeskAndAgentGroup />

      <MeetingTable />
      <Whiteboard />
      <PendingMarker />
      <Cabinet />
      <DoneMarker />
    </>
  );
}

function Claw3dOfficeContent() {
  return <VideoFrameOffice />;
}

function DeskAndAgentGroup() {
  const desks = useOfficeStore((s) => s.desks);
  return (
    <group>
      {desks
        .filter((desk) => desk.zone === 'commander' || desk.zone === 'workstation')
        .map((desk) => (
          <AgentGroup key={desk.id} deskId={desk.id} />
        ))}
    </group>
  );
}

export function OfficeScene() {
  const clearSelection = useUIStore((s) => s.clearSelection);
  const officeVisualStyle = useUIStore((s) => s.officeVisualStyle);

  return (
    <div className={`w-full h-full ${officeVisualStyle === 'claw3d' ? 'office-canvas-wrapper-claw' : 'office-canvas-wrapper'}`}>
      <Canvas
        gl={{ antialias: false, alpha: false }}
        onCreated={({ gl }) => {
          gl.setClearColor(officeVisualStyle === 'claw3d' ? CLAW_BG : BG);
        }}
        onClick={() => clearSelection()}
      >
        {officeVisualStyle === 'claw3d' ? <Claw3dOfficeContent /> : <CurrentOfficeContent />}
        <CameraController />
        <ForceInitialRender />
      </Canvas>
    </div>
  );
}
