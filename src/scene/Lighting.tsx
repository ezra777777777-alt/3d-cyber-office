import { brightOfficeTheme } from './sceneVisualTheme';

export function Lighting() {
  return (
    <>
      <ambientLight intensity={brightOfficeTheme.ambientIntensity * brightOfficeTheme.firstScreenAmbientBoost} color={brightOfficeTheme.ambient} />
      <directionalLight
        position={[8, 12, 4]}
        intensity={brightOfficeTheme.keyLightIntensity * brightOfficeTheme.firstScreenKeyLightBoost}
        color={brightOfficeTheme.keyLight}
      />
      <pointLight position={[-6, 3.4, -2]} intensity={brightOfficeTheme.fillCyanIntensity} color={brightOfficeTheme.fillCyan} />
      <pointLight position={[6, 3.4, -2]} intensity={brightOfficeTheme.fillVioletIntensity} color={brightOfficeTheme.fillViolet} />
      <pointLight position={[0, 4.2, -5]} intensity={brightOfficeTheme.commanderLightIntensity} color={brightOfficeTheme.commanderGlow} />
    </>
  );
}
