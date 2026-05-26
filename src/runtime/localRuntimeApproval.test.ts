import { describe, expect, it, vi } from 'vitest';
import { resolveLocalRuntimeApproval } from './localRuntimeApproval';

describe('local runtime approval resolution', () => {
  it('posts approval decision to local runtime', async () => {
    const fetcher = vi.fn(async () => ({ ok: true, json: async () => ({ ok: true }) }));

    await resolveLocalRuntimeApproval({
      endpoint: 'http://127.0.0.1:8765',
      approvalId: 'approval-1',
      resolution: 'approved',
      note: '允许登记产物',
      fetcher: fetcher as unknown as typeof fetch,
    });

    expect(fetcher).toHaveBeenCalledWith(
      'http://127.0.0.1:8765/approvals/approval-1/resolve',
      expect.objectContaining({
        method: 'POST',
        headers: { 'content-type': 'application/json' },
      }),
    );
  });
});
