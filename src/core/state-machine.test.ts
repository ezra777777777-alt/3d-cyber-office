import { describe, expect, it } from 'vitest';
import { deriveAgentStatus } from './state-machine';

describe('deriveAgentStatus', () => {
  it('keeps approval and failure states visually distinct from generic idle states', () => {
    expect(deriveAgentStatus('approval_required')).toBe('approval_required');
    expect(deriveAgentStatus('failed')).toBe('failed');
    expect(deriveAgentStatus('completed')).toBe('completed');
  });
});
