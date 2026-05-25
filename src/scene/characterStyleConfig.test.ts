import { describe, expect, it } from 'vitest';
import {
  CHARACTER_STYLE,
  getCharacterSilhouette,
  getRoleStyle,
  hasHumanoidLimbRatio,
} from './characterStyleConfig';

describe('Plan 18 character style', () => {
  it('uses AI assistant pods for workers instead of humanoids', () => {
    expect(getCharacterSilhouette('agent-coordinator')).toBe('assistant-pod');
    expect(getCharacterSilhouette('agent-builder')).toBe('assistant-pod');
    expect(getCharacterSilhouette('agent-reviewer')).toBe('assistant-pod');
    expect(hasHumanoidLimbRatio('assistant-pod')).toBe(false);
  });

  it('uses a distinct lobster commander silhouette', () => {
    expect(getCharacterSilhouette('agent-lobster-commander')).toBe('lobster-command-pod');
    expect(getRoleStyle('agent-lobster-commander').scale).toBeGreaterThan(1.1);
    expect(getRoleStyle('agent-lobster-commander').accent).toBe('#ff6b4a');
  });

  it('keeps every role inside the shared style system', () => {
    expect(Object.keys(CHARACTER_STYLE.roles).sort()).toEqual([
      'agent-builder',
      'agent-coordinator',
      'agent-lobster-commander',
      'agent-reviewer',
    ]);
  });

  it('hasHumanoidLimbRatio returns false for lobster-command-pod', () => {
    expect(hasHumanoidLimbRatio('lobster-command-pod')).toBe(false);
  });
});
