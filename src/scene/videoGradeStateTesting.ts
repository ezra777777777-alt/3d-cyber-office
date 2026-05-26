import type { AgentStatus } from '@/core/types';
import { VIDEO_GRADE_PALETTE } from './videoGradeVisualSpec';

export interface VideoGradeStateCue {
  color: string;
  motion: 'idle' | 'active' | 'pulse' | 'reduced';
  artifactMarker: boolean;
}

export function getVideoGradeStateCue(status: AgentStatus): VideoGradeStateCue {
  if (status === 'working') return { color: VIDEO_GRADE_PALETTE.statusCyan, motion: 'active', artifactMarker: false };
  if (status === 'planning' || status === 'waiting_input') return { color: VIDEO_GRADE_PALETTE.statusAmber, motion: 'pulse', artifactMarker: false };
  if (status === 'approval_required') return { color: VIDEO_GRADE_PALETTE.statusMagenta, motion: 'pulse', artifactMarker: false };
  if (status === 'completed') return { color: VIDEO_GRADE_PALETTE.statusGreen, motion: 'idle', artifactMarker: true };
  if (status === 'blocked' || status === 'failed') return { color: VIDEO_GRADE_PALETTE.statusRed, motion: 'reduced', artifactMarker: false };
  if (status === 'offline') return { color: '#4f5b66', motion: 'reduced', artifactMarker: false };
  return { color: '#7f8b98', motion: 'idle', artifactMarker: false };
}
