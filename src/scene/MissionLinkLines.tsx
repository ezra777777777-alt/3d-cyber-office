import * as THREE from 'three';
import { Line } from '@react-three/drei';
import type { CommanderLinkTarget } from '@/commander/commanderVisualState';
import type { Desk } from '@/core/types';
import { brightOfficeTheme } from './sceneVisualTheme';

const statusColors: Record<string, string> = {
  completed: '#00e676',
  approval_required: '#f0a500',
  blocked: '#ff3366',
  failed: '#ff3366',
  running: brightOfficeTheme.workerAccent,
  assigned: '#6ecbff',
  waiting_input: '#f0a500',
};

interface MissionLinkLinesProps {
  commanderDesk: Desk;
  desks: Desk[];
  links: CommanderLinkTarget[];
}

function linePoints(from: Desk, to: Desk): [number, number, number][] {
  return [
    [from.position[0], 0.16, from.position[2]],
    [(from.position[0] + to.position[0]) / 2, 0.22, (from.position[2] + to.position[2]) / 2],
    [to.position[0], 0.16, to.position[2]],
  ];
}

export function MissionLinkLines({ commanderDesk, desks, links }: MissionLinkLinesProps) {
  const deskById = new Map(desks.map((desk) => [desk.id, desk]));
  return (
    <group>
      {links.map((link) => {
        const targetDesk = deskById.get(link.deskId);
        if (!targetDesk) return null;
        const color = statusColors[link.status] ?? brightOfficeTheme.workerAccent;
        return (
          <Line
            key={`${link.missionTaskId}-${link.deskId}`}
            points={linePoints(commanderDesk, targetDesk)}
            color={color}
            transparent
            opacity={link.status === 'completed' ? 0.38 : 0.74}
            lineWidth={1.5}
          />
        );
      })}
    </group>
  );
}
