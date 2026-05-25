import { CommanderDock } from '@/ui/commander/CommanderDock';
import { ResetCameraBtn } from '@/ui/ResetCameraBtn';
import { SidePanel } from '@/ui/SidePanel';

export function OfficePresentationLayer() {
  return (
    <div className="office-presentation-layer">
      {/* Top safe zone: Commander status left, reset right */}
      <div className="office-top-safe-zone">
        <div className="pointer-events-auto max-w-[280px] max-h-[40vh] overflow-auto">
          <CommanderDock />
        </div>
        <div className="pointer-events-auto">
          <ResetCameraBtn />
        </div>
      </div>

      {/* Bottom safe zone: compact narrative / event feed */}
      <div className="office-bottom-safe-zone">
        <div className="office-hud-strip pointer-events-auto" />
      </div>

      {/* Side panel: overlay on right, only when selected */}
      <div className="office-layer-side pointer-events-auto">
        <SidePanel />
      </div>
    </div>
  );
}
