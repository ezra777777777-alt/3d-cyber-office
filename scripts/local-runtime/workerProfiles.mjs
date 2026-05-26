const WORKERS = [
  {
    id: 'worker-commander',
    role: 'commander',
    name: 'Lobster Commander',
    capabilities: ['planning', 'routing', 'summarizing', 'retry_decision'],
  },
  {
    id: 'worker-research',
    role: 'researcher',
    name: 'Research Worker',
    capabilities: ['read_context', 'search_text', 'write_notes'],
  },
  {
    id: 'worker-builder',
    role: 'builder',
    name: 'Builder Worker',
    capabilities: ['draft_patch', 'write_artifact', 'request_write_approval'],
  },
  {
    id: 'worker-review',
    role: 'reviewer',
    name: 'Review Worker',
    capabilities: ['review_artifacts', 'request_test_approval', 'write_review'],
  },
];

export function listWorkerProfiles() {
  return WORKERS.map((worker) => ({ ...worker, capabilities: [...worker.capabilities] }));
}

export function getWorkerForRole(role) {
  const worker = WORKERS.find((item) => item.role === role);
  if (!worker) throw new Error(`Unknown worker role: ${role}`);
  return { ...worker, capabilities: [...worker.capabilities] };
}
