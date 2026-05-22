import { useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { OFFICE_OVERVIEW_CAMERA } from '@/scene/CameraController';

export function ResetCameraBtn() {
  const { camera } = useThree();

  function handleReset() {
    camera.position.set(...OFFICE_OVERVIEW_CAMERA.position);
    camera.lookAt(...OFFICE_OVERVIEW_CAMERA.target);
  }

  return (
    <Html fullscreen>
      <div className="absolute bottom-4 right-4 pointer-events-auto">
        <button
          onClick={handleReset}
          className="cyber-btn text-xs px-2 py-1 bg-cyber-panel/90"
          title="Reset camera view"
        >
          Reset View
        </button>
      </div>
    </Html>
  );
}
