import { useOfficeStore } from '@/store/officeStore';
import { useUIStore } from '@/store/uiStore';
import { Desk } from './Desk';
import { AgentCharacter } from './AgentCharacter';
import { ClawWorkerCharacter } from './ClawWorkerCharacter';
import { useAgentDeskPosition } from './ClawAgentPresenceLayer';
import { DeskStatusBeacon } from './DeskStatusBeacon';

const STATUS_COLOR: Record<string, string> = {
  idle: '#888888',
  working: '#00f0ff',
  blocked: '#ff3366',
  completed: '#00e676',
  waiting_input: '#f0a500',
};

interface AgentGroupProps {
  deskId: string;
}

export function AgentGroup({ deskId }: AgentGroupProps) {
  const desk = useOfficeStore((s) => s.getDesk(deskId));
  const agents = useOfficeStore((s) => s.getAgentsByDesk(deskId));
  const agent = agents[0];
  const officeVisualStyle = useUIStore((s) => s.officeVisualStyle);
  const clawAgentPos = useAgentDeskPosition(agent?.id ?? null);

  if (!desk) return null;

  const agentPos: [number, number, number] =
    officeVisualStyle === 'claw3d'
      ? clawAgentPos
      : [desk.position[0], 0, desk.position[2] + 1.0];

  return (
    <group>
      {officeVisualStyle === 'current' && (
        <Desk deskId={desk.id} position={desk.position} rotation={desk.rotation} label={desk.label} isCommander={desk.isCommander} />
      )}
      {agent && (
        <>
          {officeVisualStyle === 'current' && (
            <group position={desk.position}>
              <DeskStatusBeacon status={agent.status} />
            </group>
          )}
          {officeVisualStyle === 'claw3d' ? (
            <ClawWorkerCharacter
              position={agentPos}
              statusColor={STATUS_COLOR[agent.status] ?? '#888888'}
              pulseScale={agent.status === 'working' ? 1.3 : 1}
            />
          ) : (
            <AgentCharacter
              agentId={agent.id}
              position={agentPos}
              deskRotation={desk.rotation}
            />
          )}
        </>
      )}
    </group>
  );
}
