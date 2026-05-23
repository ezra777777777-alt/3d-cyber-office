import { ExternalResetCamera } from '@/scene/CameraController';
import { actionLabels } from '@/i18n/zh';

export function ResetCameraBtn() {
  return (
    <button
      onClick={ExternalResetCamera}
      className="cyber-btn text-xs px-2 py-1 bg-cyber-panel/90"
      title="重置视角"
    >
      {actionLabels.resetView}
    </button>
  );
}
