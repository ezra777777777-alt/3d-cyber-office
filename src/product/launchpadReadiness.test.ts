import { describe, expect, it } from 'vitest';
import { deriveLaunchpadReadiness } from './launchpadReadiness';

describe('deriveLaunchpadReadiness', () => {
  it('starts blocked when runtime is disconnected', () => {
    const state = deriveLaunchpadReadiness({
      runtimeStatus: 'disconnected',
      runtimeMode: 'connected',
      hasMission: false,
      hasPendingApproval: false,
      hasCompletedMission: false,
      artifactCount: 0,
    });

    expect(state.primaryStatus).toBe('blocked');
    expect(state.primaryAction.moduleId).toBe('gateway');
    expect(state.steps.find((step) => step.id === 'start-runtime')?.state).toBe('action');
  });

  it('asks the user to create a mission when runtime is connected but no mission exists', () => {
    const state = deriveLaunchpadReadiness({
      runtimeStatus: 'connected',
      runtimeMode: 'connected',
      hasMission: false,
      hasPendingApproval: false,
      hasCompletedMission: false,
      artifactCount: 0,
    });

    expect(state.primaryStatus).toBe('ready');
    expect(state.primaryAction.moduleId).toBe('office');
    expect(state.steps.find((step) => step.id === 'plan-mission')?.state).toBe('action');
  });

  it('highlights approval when a mission is waiting for user decision', () => {
    const state = deriveLaunchpadReadiness({
      runtimeStatus: 'connected',
      runtimeMode: 'connected',
      hasMission: true,
      hasPendingApproval: true,
      hasCompletedMission: false,
      artifactCount: 0,
    });

    expect(state.primaryStatus).toBe('action');
    expect(state.primaryAction.label).toBe('去审批');
    expect(state.steps.find((step) => step.id === 'approve-risk')?.state).toBe('action');
  });

  it('points to history and artifacts after completion', () => {
    const state = deriveLaunchpadReadiness({
      runtimeStatus: 'connected',
      runtimeMode: 'connected',
      hasMission: true,
      hasPendingApproval: false,
      hasCompletedMission: true,
      artifactCount: 2,
    });

    expect(state.primaryStatus).toBe('complete');
    expect(state.primaryAction.moduleId).toBe('history');
    expect(state.steps.find((step) => step.id === 'inspect-results')?.state).toBe('done');
  });
});
