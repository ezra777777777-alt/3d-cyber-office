import { brightOfficeTheme } from './sceneVisualTheme';

export function Lighting() {
  return (
    <>
      <ambientLight intensity={brightOfficeTheme.ambientIntensity} color={brightOfficeTheme.ambient} />
      <directionalLight
        position={[8, 12, 4]}
        intensity={brightOfficeTheme.keyLightIntensity}
        color={brightOfficeTheme.keyLight}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <pointLight position={[-6, 3.4, -2]} intensity={brightOfficeTheme.fillCyanIntensity} color={brightOfficeTheme.fillCyan} />
      <pointLight position={[6, 3.4, -2]} intensity={brightOfficeTheme.fillVioletIntensity} color={brightOfficeTheme.fillViolet} />
      <pointLight position={[0, 4.2, -5]} intensity={0.55} color={brightOfficeTheme.commanderGlow} />
    </>
  );
}
