import { describe, expect, it } from 'vitest';
import { applyTaskEvent, deriveAgentStatus } from './state-machine';
import type { Task } from './types';

const baseTask: Task = {
  id: 'task-test',
  title: 'Test task',
  summary: 'Test summary',
  status: 'created',
  assignedAgentId: null,
  createdAt: '2026-05-22T09:00:00.000Z',
  updatedAt: '2026-05-22T09:00:00.000Z',
  outputSummary: null,
  errorSummary: null,
};

describe('deriveAgentStatus', () => {
  it('keeps approval and failure states visually distinct from generic idle states', () => {
    expect(deriveAgentStatus('approval_required')).toBe('approval_required');
    expect(deriveAgentStatus('failed')).toBe('failed');
    expect(deriveAgentStatus('completed')).toBe('completed');
  });
});

describe('Commander state machine', () => {
  it('moves a created Commander task into planned state before assignment', () => {
    expect(applyTaskEvent({ ...baseTask, status: 'created' }, 'task.planned')).toBe('planned');
  });

  it('resumes an approval task after an approval resolution event', () => {
    expect(applyTaskEvent({ ...baseTask, status: 'approval_required' }, 'approval.resolved')).toBe('running');
  });

  it('keeps artifact events from changing task lifecycle state', () => {
    expect(applyTaskEvent({ ...baseTask, status: 'running' }, 'artifact.created')).toBeNull();
  });
});
