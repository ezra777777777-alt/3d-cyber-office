import { describe, expect, it } from 'vitest';
import { resolveClawAgentPosition } from './ClawAgentPresenceLayer';

describe('Claw agent presence mapping', () => {
  it('places idle workers near their assigned desks', () => {
    expect(resolveClawAgentPosition('agent-coordinator', 'idle')).toEqual([-4.2, 0, -0.6]);
    expect(resolveClawAgentPosition('agent-builder', 'idle')).toEqual([-1.3, 0, 0.04999999999999993]);
    expect(resolveClawAgentPosition('agent-reviewer', 'idle')).toEqual([3, 0, 0.39999999999999997]);
  });

  it('moves active workers toward the desk surface', () => {
    expect(resolveClawAgentPosition('agent-builder', 'working')).toEqual([-0.8, 0, -0.9500000000000001]);
  });

  it('moves blocked or waiting workers toward the main agent zone', () => {
    expect(resolveClawAgentPosition('agent-builder', 'blocked')).toEqual([2.9, 0, -2.8]);
    expect(resolveClawAgentPosition('agent-reviewer', 'waiting_input')).toEqual([2.9, 0, -2.8]);
  });

  it('moves completed workers toward the foreground delivery area', () => {
    expect(resolveClawAgentPosition('agent-coordinator', 'completed')).toEqual([0.6, 0, 1.4]);
  });
});
