export type ChunkKind = 'initial' | 'lazy' | 'vendor' | 'css';
export type ChunkBudgetStatus = 'ok' | 'warning' | 'over_budget';

export interface ChunkBudgetInput {
  name: string;
  sizeKb: number;
  kind: ChunkKind;
}

const BUDGETS: Record<ChunkKind, number> = {
  initial: 700,
  lazy: 250,
  vendor: 900,
  css: 80,
};

export function classifyChunkBudget(chunk: ChunkBudgetInput): ChunkBudgetStatus {
  const budget = BUDGETS[chunk.kind];
  if (chunk.sizeKb <= budget) return 'ok';
  return chunk.kind === 'initial' ? 'over_budget' : 'warning';
}

export function summarizeBundleBudget(chunks: ChunkBudgetInput[]) {
  const overBudget = chunks.filter((chunk) => classifyChunkBudget(chunk) === 'over_budget');
  const warnings = chunks.filter((chunk) => classifyChunkBudget(chunk) === 'warning');
  return {
    status: overBudget.length > 0 ? 'over_budget' : warnings.length > 0 ? 'warning' : 'ok',
    overBudget: overBudget.map((chunk) => chunk.name),
    warnings: warnings.map((chunk) => chunk.name),
  };
}
