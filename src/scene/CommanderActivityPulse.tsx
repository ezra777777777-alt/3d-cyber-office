import { useRef } from 'react';
import * as THREE from 'three';
import { Line } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import type { CommanderExperienceStage } from '@/commander/commanderExperience';
import type { Desk, WorkerProfile } from '@/core/types';
import { brightOfficeTheme } from './sceneVisualTheme';

interface CommanderActivityPulseProps {
  stage: CommanderExperienceStage;
  commanderDesk: Desk;
  workerDesks: Desk[];
  highlightWorkerIds: string[];
  workers: WorkerProfile[];
}

const pulseStages: CommanderExperienceStage[] = ['planning', 'working', 'approval', 'delivering', 'blocked', 'completed'];

const STAGE_COLORS: Record<string, string> = {
  planning: brightOfficeTheme.fillCyan,
  working: brightOfficeTheme.workerAccent,
  approval: brightOfficeTheme.commanderAccent,
  delivering: '#00e676',
  blocked: '#ff3366',
  completed: '#00e676',
};

export function CommanderActivityPulse({
  stage,
  commanderDesk,
  workerDesks,
  highlightWorkerIds,
  workers,
}: CommanderActivityPulseProps) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (!groupRef.current) return;
    const t = Math.abs(Math.sin(Date.now() * 0.004));
    groupRef.current.children.forEach((child) => {
      if (child instanceof THREE.Line) {
        child.material.opacity = 0.25 + t * 0.35;
      }
    });
  });

  if (!pulseStages.includes(stage)) return null;

  const activeDesks = (() => {
    if (highlightWorkerIds.length === 0) return workerDesks;
    const workerById = new Map(workers.map((w) => [w.id, w]));
    const highlightedDeskIds = new Set(
      highlightWorkerIds
        .map((wid) => workerById.get(wid)?.deskId)
        .filter(Boolean),
    );
    return workerDesks.filter((d) => highlightedDeskIds.has(d.id));
  })();

  const color = STAGE_COLORS[stage] ?? brightOfficeTheme.fillCyan;

  return (
    <group ref={groupRef}>
      {activeDesks.map((workerDesk) => (
        <Line
          key={`pulse-${workerDesk.id}`}
          points={[
            [commanderDesk.position[0], 0.14, commanderDesk.position[2]],
            [
              (commanderDesk.position[0] + workerDesk.position[0]) / 2,
              0.28,
              (commanderDesk.position[2] + workerDesk.position[2]) / 2,
            ],
            [workerDesk.position[0], 0.14, workerDesk.position[2]],
          ]}
          color={color}
          transparent
          opacity={0.3}
          lineWidth={1}
        />
      ))}
    </group>
  );
}
