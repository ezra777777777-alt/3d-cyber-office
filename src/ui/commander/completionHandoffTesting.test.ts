import { describe, expect, it } from 'vitest';
import { getCompletionHandoffActions } from './completionHandoffTesting';

describe('getCompletionHandoffActions', () => {
  it('returns no handoff actions when mission is not complete', () => {
    expect(getCompletionHandoffActions({ completed: false, artifactCount: 0 })).toEqual([]);
  });

  it('shows artifact and history actions when mission completed with artifacts', () => {
    expect(getCompletionHandoffActions({ completed: true, artifactCount: 2 }).map((action) => action.id)).toEqual([
      'open-files',
      'open-history',
      'start-next',
    ]);
  });

  it('still shows history when mission completed without artifacts', () => {
    expect(getCompletionHandoffActions({ completed: true, artifactCount: 0 }).map((action) => action.id)).toEqual([
      'open-history',
      'start-next',
    ]);
  });
});
