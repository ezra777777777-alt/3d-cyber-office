import { useOfficeStore } from '@/store/officeStore';
import { Desk } from './Desk';
import { AgentCharacter } from './AgentCharacter';
import { DeskStatusBeacon } from './DeskStatusBeacon';

interface AgentGroupProps {
  deskId: string;
}

export function AgentGroup({ deskId }: AgentGroupProps) {
  const desk = useOfficeStore((s) => s.getDesk(deskId));
  const agents = useOfficeStore((s) => s.getAgentsByDesk(deskId));
  const agent = agents[0];

  if (!desk) return null;

  // Agent stands behind the desk (between desk and chair)
  // When working/sitting, character will be positioned at chair height by AgentCharacter
  const agentPos: [number, number, number] = [desk.position[0], 0, desk.position[2] + 1.0];

  return (
    <group>
      <Desk deskId={desk.id} position={desk.position} rotation={desk.rotation} label={desk.label} isCommander={desk.isCommander} />
      {agent && (
        <>
          <group position={desk.position}>
            <DeskStatusBeacon status={agent.status} />
          </group>
          <AgentCharacter
            agentId={agent.id}
            position={agentPos}
            deskRotation={desk.rotation}
          />
        </>
      )}
    </group>
  );
}
