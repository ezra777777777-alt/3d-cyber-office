import type { CommanderVisualState } from '@/commander/commanderVisualState';
import { brightOfficeTheme } from './sceneVisualTheme';

interface CommanderStatusBoardProps {
  state: CommanderVisualState;
}

function barWidth(value: number, total: number): number {
  if (total <= 0) return 0.08;
  return Math.max(0.08, Math.min(1.1, (value / total) * 1.1));
}

export function CommanderStatusBoard({ state }: CommanderStatusBoardProps) {
  const completeWidth = barWidth(state.completedTasks, state.totalTasks);
  const activeWidth = barWidth(state.activeTasks, state.totalTasks);
  const approvalWidth = state.pendingApprovals > 0 ? 0.65 : 0.08;

  return (
    <group position={[-6.2, 1.55, -4.64]}>
      <mesh>
        <boxGeometry args={[1.82, 0.9, 0.08]} />
        <meshStandardMaterial color="#10233a" emissive={brightOfficeTheme.commanderAccent} emissiveIntensity={0.24} roughness={0.28} />
      </mesh>
      <mesh position={[-0.33, 0.22, 0.055]}>
        <boxGeometry args={[completeWidth, 0.08, 0.035]} />
        <meshBasicMaterial color="#00e676" />
      </mesh>
      <mesh position={[-0.33, 0.02, 0.055]}>
        <boxGeometry args={[activeWidth, 0.08, 0.035]} />
        <meshBasicMaterial color={brightOfficeTheme.workerAccent} />
      </mesh>
      <mesh position={[-0.55, -0.18, 0.055]}>
        <boxGeometry args={[approvalWidth, 0.08, 0.035]} />
        <meshBasicMaterial color="#f0a500" />
      </mesh>
      <mesh position={[0.68, -0.28, 0.055]}>
        <circleGeometry args={[state.artifactCount > 0 ? 0.11 : 0.06, 24]} />
        <meshBasicMaterial color={state.artifactCount > 0 ? brightOfficeTheme.commanderGlow : '#35516a'} />
      </mesh>
    </group>
  );
}
