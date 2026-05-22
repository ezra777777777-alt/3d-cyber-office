export function Lighting() {
  return (
    <>
      <ambientLight intensity={0.7} color="#d8d8e8" />
      <directionalLight
        position={[8, 12, 4]}
        intensity={1.0}
        color="#fff8ee"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      {/* Subtle accent lights — not dominating the scene */}
      <pointLight position={[-6, 3, -2]} intensity={0.1} color="#00f0ff" />
      <pointLight position={[6, 3, -2]} intensity={0.1} color="#b347ea" />
    </>
  );
}
