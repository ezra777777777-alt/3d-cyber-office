import { buildLocalRuntimeUrl } from './localRuntimeTesting';

interface ResolveLocalRuntimeApprovalInput {
  endpoint: string;
  approvalId: string;
  resolution: 'approved' | 'rejected';
  note: string;
  fetcher?: typeof fetch;
}

export async function resolveLocalRuntimeApproval(
  input: ResolveLocalRuntimeApprovalInput,
): Promise<void> {
  const fetcher = input.fetcher ?? fetch;
  const response = await fetcher(
    buildLocalRuntimeUrl(input.endpoint, `/approvals/${encodeURIComponent(input.approvalId)}/resolve`),
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ resolution: input.resolution, note: input.note }),
    },
  );

  if (!response.ok) {
    throw new Error(`Local runtime approval failed: HTTP ${response.status}`);
  }
}
