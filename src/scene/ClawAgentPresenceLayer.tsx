import { useOfficeStore } from '@/store/officeStore';
import { useCommanderStore } from '@/store/commanderStore';

const WORKER_DESK_MAP: Record<string, number> = {
  'agent-coordinator': 0,
  'agent-builder': 1,
  'agent-reviewer': 2,
};

const DESK_OFFSETS: [number, number, number][] = [
  [-3.7, 0, -1.2],
  [-0.8, 0, -0.55],
  [3.5, 0, -0.2],
];

const MAIN_AGENT_ZONE: [number, number, number] = [2.9, 0, -2.8];
const FOREGROUND_DELIVERY: [number, number, number] = [0.6, 0, 1.4];

export function resolveClawAgentPosition(
  agentId: string | null,
  status?: string,
): [number, number, number] {
  const deskIndex = agentId ? (WORKER_DESK_MAP[agentId] ?? 0) : 0;
  const baseDesk = DESK_OFFSETS[deskIndex] ?? DESK_OFFSETS[0];

  switch (status) {
    case 'working':
      return [baseDesk[0], 0, baseDesk[2] - 0.4];
    case 'idle':
      return [baseDesk[0] - 0.5, 0, baseDesk[2] + 0.6];
    case 'blocked':
    case 'waiting_input':
      return MAIN_AGENT_ZONE;
    case 'completed':
      return FOREGROUND_DELIVERY;
    default:
      return baseDesk;
  }
}

export function useAgentDeskPosition(agentId: string | null): [number, number, number] {
  const agent = useOfficeStore((s) => (agentId ? s.getAgent(agentId) : undefined));
  useCommanderStore((s) => s.missions);

  return resolveClawAgentPosition(agentId, agent?.status);
}
