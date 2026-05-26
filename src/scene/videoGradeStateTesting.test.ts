import { describe, expect, it } from 'vitest';
import { getVideoGradeStateCue } from './videoGradeStateTesting';

describe('video grade state cues', () => {
  it('maps working to cyan active cue', () => {
    expect(getVideoGradeStateCue('working')).toMatchObject({ color: '#25d9ff', motion: 'active' });
  });

  it('maps approval_required to magenta approval cue', () => {
    expect(getVideoGradeStateCue('approval_required')).toMatchObject({ color: '#ff83d1', motion: 'pulse' });
  });

  it('maps completed to green artifact cue', () => {
    expect(getVideoGradeStateCue('completed')).toMatchObject({ color: '#65ef9a', artifactMarker: true });
  });

  it('maps failed and blocked to red reduced cue', () => {
    expect(getVideoGradeStateCue('failed')).toMatchObject({ color: '#ff4f6d', motion: 'reduced' });
    expect(getVideoGradeStateCue('blocked')).toMatchObject({ color: '#ff4f6d', motion: 'reduced' });
  });
});
