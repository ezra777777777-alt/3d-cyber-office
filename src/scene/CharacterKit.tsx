import { CharacterRoleStyle } from './characterStyleConfig';

interface CharacterKitProps {
  style: CharacterRoleStyle;
  statusColor: string;
  pulseScale: number;
}

export function AssistantPod({ style, statusColor, pulseScale }: CharacterKitProps) {
  return (
    <group scale={style.scale * pulseScale}>
      {/* Rounded body */}
      <mesh position={[0, 0.74, 0]}>
        <sphereGeometry args={[0.38, 24, 16]} />
        <meshStandardMaterial color={style.body} roughness={0.62} metalness={0.08} />
      </mesh>
      {/* Wide visor face */}
      <mesh position={[0, 0.78, 0.32]} scale={[1.0, 0.34, 0.08]}>
        <boxGeometry args={[0.55, 0.28, 0.04]} />
        <meshStandardMaterial
          color={style.visor}
          emissive={style.accent}
          emissiveIntensity={0.22}
          roughness={0.35}
        />
      </mesh>
      {/* Status light */}
      <mesh position={style.statusLightOffset}>
        <sphereGeometry args={[0.075, 12, 8]} />
        <meshBasicMaterial color={statusColor} />
      </mesh>
      {/* Cylinder base */}
      <mesh position={[0, 0.28, 0]}>
        <cylinderGeometry args={[0.28, 0.36, 0.48, 20]} />
        <meshStandardMaterial color={style.body} roughness={0.72} />
      </mesh>
      {/* Base ring in accent color */}
      <mesh position={[0, 0.03, 0]}>
        <cylinderGeometry args={[0.34, 0.34, 0.08, 20]} />
        <meshStandardMaterial color={style.accent} roughness={0.5} />
      </mesh>
    </group>
  );
}

export function LobsterCommandPod({ style, statusColor, pulseScale }: CharacterKitProps) {
  return (
    <group scale={style.scale * pulseScale}>
      {/* Larger body sphere */}
      <mesh position={[0, 0.76, 0]}>
        <sphereGeometry args={[0.46, 28, 18]} />
        <meshStandardMaterial color={style.body} roughness={0.58} metalness={0.05} />
      </mesh>
      {/* Wide visor face */}
      <mesh position={[0, 0.82, 0.38]} scale={[1.15, 0.36, 0.08]}>
        <boxGeometry args={[0.62, 0.28, 0.04]} />
        <meshStandardMaterial
          color={style.visor}
          emissive={style.accent}
          emissiveIntensity={0.35}
          roughness={0.32}
        />
      </mesh>
      {/* Left claw — torus arc rotated outward */}
      <mesh position={[-0.52, 0.72, 0.16]} rotation={[0, 0, -0.58]}>
        <torusGeometry args={[0.17, 0.045, 8, 18, Math.PI * 1.2]} />
        <meshStandardMaterial color={style.accent} roughness={0.42} />
      </mesh>
      {/* Right claw — torus arc rotated outward */}
      <mesh position={[0.52, 0.72, 0.16]} rotation={[0, 0, 0.58]}>
        <torusGeometry args={[0.17, 0.045, 8, 18, Math.PI * 1.2]} />
        <meshStandardMaterial color={style.accent} roughness={0.42} />
      </mesh>
      {/* Status light */}
      <mesh position={style.statusLightOffset}>
        <sphereGeometry args={[0.085, 12, 8]} />
        <meshBasicMaterial color={statusColor} />
      </mesh>
      {/* Cylinder base */}
      <mesh position={[0, 0.18, 0]}>
        <cylinderGeometry args={[0.34, 0.46, 0.38, 24]} />
        <meshStandardMaterial color={style.body} roughness={0.7} />
      </mesh>
      {/* Halo ring */}
      <mesh position={[0, 1.05, 0.02]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.58, 0.025, 8, 48]} />
        <meshBasicMaterial color={style.accent} transparent opacity={0.45} />
      </mesh>
    </group>
  );
}
