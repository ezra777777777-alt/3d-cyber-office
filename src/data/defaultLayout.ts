import type { Agent, AgentRole, Desk, OfficeLayout } from '@/core/types';

export const ROLE_LABELS: Record<AgentRole, string> = {
  research: 'Research',
  coding: 'Coding',
  writing: 'Writing',
  analysis: 'Analysis',
  coordinator: 'Coordinator',
};

export const defaultDesks: Desk[] = [
  {
    id: 'desk-commander',
    position: [-6.2, 0, -3.8],
    rotation: 0,
    label: 'Lobster Command',
    zone: 'commander',
    isCommander: true,
  },
  { id: 'desk-a2', position: [-2.1, 0, -4], rotation: 0, label: 'Research Bay', zone: 'workstation' },
  { id: 'desk-b1', position: [2.1, 0, -4], rotation: 0, label: 'Build Bay', zone: 'workstation' },
  { id: 'desk-b2', position: [6.2, 0, -4], rotation: 0, label: 'Review Bay', zone: 'workstation' },
  { id: 'desk-pending', position: [-5.8, 0, 4.1], rotation: Math.PI, label: 'Intake', zone: 'pending' },
  { id: 'desk-done', position: [5.8, 0, 4.1], rotation: Math.PI, label: 'Delivery', zone: 'completed' },
];

export const defaultAgents: Agent[] = [
  {
    id: 'agent-coordinator',
    name: 'Lobster Commander',
    role: 'coordinator',
    status: 'idle',
    deskId: 'desk-commander',
    currentTaskId: null,
    lastActiveAt: new Date().toISOString(),
  },
  {
    id: 'agent-coder',
    name: 'Code Agent',
    role: 'coding',
    status: 'idle',
    deskId: 'desk-a2',
    currentTaskId: null,
    lastActiveAt: new Date().toISOString(),
  },
  {
    id: 'agent-writer',
    name: 'Write Agent',
    role: 'writing',
    status: 'idle',
    deskId: 'desk-b1',
    currentTaskId: null,
    lastActiveAt: new Date().toISOString(),
  },
  {
    id: 'agent-analyst',
    name: 'Analyst Agent',
    role: 'analysis',
    status: 'idle',
    deskId: 'desk-b2',
    currentTaskId: null,
    lastActiveAt: new Date().toISOString(),
  },
];

export const defaultLayout: OfficeLayout = {
  roomSize: [20, 3.5, 14],
  desks: defaultDesks,
  zones: [
    { id: 'commander', label: 'Lobster Command', subtitle: 'mission intake', position: [-6.2, 0.05, -6.0], accent: '#ffb84d' },
    { id: 'workers', label: 'Worker Pods', subtitle: 'research build review', position: [2.0, 0.05, -6.0], accent: '#00f0ff' },
    { id: 'intake', label: 'Intake Queue', subtitle: 'plan and assign', position: [-6.5, 0.05, 5.9], accent: '#6ecbff' },
    { id: 'delivery', label: 'Delivery Rack', subtitle: 'artifacts ready', position: [6.4, 0.05, 5.9], accent: '#00e676' },
    { id: 'collaboration', label: 'Review Table', subtitle: 'plan and reflect', position: [0, 0.05, 1.5], accent: '#ff7bd5' },
    { id: 'diagnostics', label: 'Gateway Wall', subtitle: 'cron logs runtime', position: [8.3, 0.05, 0], accent: '#f0a500' },
    { id: 'rest', label: 'Quiet Garden', subtitle: 'idle and recharge', position: [-8.1, 0.05, 0.8], accent: '#7ce3aa' },
  ],
};
