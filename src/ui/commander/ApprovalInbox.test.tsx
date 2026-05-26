import { describe, expect, it, vi } from 'vitest';
import { resolveApprovalDecision } from './ApprovalInbox';

describe('ApprovalInbox decision flow', () => {
  it('keeps local approval pending when runtime sync fails', async () => {
    const calls: string[] = [];
    const syncRuntimeApproval = vi.fn(async () => {
      calls.push('runtime');
      throw new Error('runtime offline');
    });
    const resolveApproval = vi.fn(() => calls.push('local'));

    await expect(
      resolveApprovalDecision(
        {
          syncRuntimeApproval,
          getAdapter: () => null,
          approveWithAdapter: vi.fn(),
          rejectWithAdapter: vi.fn(),
          resolveApproval,
        },
        {
          approvalId: 'approval-1',
          resolution: 'approved',
          localNote: 'local approved',
          runtimeNote: 'runtime approved',
        },
      ),
    ).rejects.toThrow('runtime offline');

    expect(resolveApproval).not.toHaveBeenCalled();
    expect(calls).toEqual(['runtime']);
  });

  it('syncs runtime before resolving local approval state', async () => {
    const calls: string[] = [];

    await resolveApprovalDecision(
      {
        syncRuntimeApproval: vi.fn(async () => {
          calls.push('runtime');
        }),
        getAdapter: () => null,
        approveWithAdapter: vi.fn(),
        rejectWithAdapter: vi.fn(),
        resolveApproval: vi.fn(() => calls.push('local')),
      },
      {
        approvalId: 'approval-1',
        resolution: 'approved',
        localNote: 'local approved',
        runtimeNote: 'runtime approved',
      },
    );

    expect(calls).toEqual(['runtime', 'local']);
  });
});
