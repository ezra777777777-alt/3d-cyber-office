import { useOfficeStore } from '@/store/officeStore';
import type { AgentStatus } from '@/core/types';
import { VideoFrameAvatar } from './VideoFrameAvatar';
import { getVideoFrameAmbientAvatarSlots, VIDEO_FRAME_PALETTE, VIDEO_FRAME_SLOTS } from './videoFrameReplicaSpec';

const STATUS_COLOR: Record<AgentStatus, string> = {
  idle: '#7f8b98',
  planning: VIDEO_FRAME_PALETTE.statusAmber,
  working: VIDEO_FRAME_PALETTE.statusCyan,
  waiting_input: VIDEO_FRAME_PALETTE.statusAmber,
  approval_required: '#ff83d1',
  blocked: VIDEO_FRAME_PALETTE.statusRed,
  failed: VIDEO_FRAME_PALETTE.statusRed,
  completed: VIDEO_FRAME_PALETTE.statusGreen,
  resting: '#8bd9a4',
  offline: '#4f5b66',
};

function isActive(status: AgentStatus) {
  return status === 'working' || status === 'planning' || status === 'waiting_input' || status === 'approval_required';
}

export function VideoFrameAgentLayer() {
  const agents = useOfficeStore((s) => s.getAllAgents());
  const commander = agents.find((agent) => agent.role === 'coordinator');
  const workers = agents.filter((agent) => agent.role !== 'coordinator');

  return (
    <group>
      <VideoFrameAvatar
        position={VIDEO_FRAME_SLOTS.commander.position}
        rotationY={VIDEO_FRAME_SLOTS.commander.rotationY}
        variant="commander"
        statusColor={VIDEO_FRAME_PALETTE.statusAmber}
        active={isActive(commander?.status ?? 'idle')}
      />
      {VIDEO_FRAME_SLOTS.workers.map((slot, index) => {
        const agent = workers[index];
        const status = agent?.status ?? 'idle';
        return (
          <VideoFrameAvatar
            key={slot.id}
            position={slot.position}
            rotationY={slot.rotationY}
            variant="worker"
            statusColor={STATUS_COLOR[status]}
            active={isActive(status)}
          />
        );
      })}
      {getVideoFrameAmbientAvatarSlots().map((slot, index) => (
        <VideoFrameAvatar
          key={slot.id}
          position={slot.position}
          rotationY={slot.rotationY}
          variant="worker"
          statusColor={index % 2 === 0 ? VIDEO_FRAME_PALETTE.statusCyan : VIDEO_FRAME_PALETTE.statusGreen}
          active={false}
          scale={slot.scale}
        />
      ))}
    </group>
  );
}
