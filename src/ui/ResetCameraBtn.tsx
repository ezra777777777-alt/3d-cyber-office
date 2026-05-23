import { ExternalResetCamera } from '@/scene/CameraController';

export function ResetCameraBtn() {
  return (
    <button
      onClick={ExternalResetCamera}
      className="cyber-btn text-xs px-2 py-1 bg-cyber-panel/90"
      title="Reset camera view"
    >
      Reset View
    </button>
  );
}
