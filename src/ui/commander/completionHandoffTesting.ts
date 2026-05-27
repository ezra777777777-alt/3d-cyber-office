import type { ModuleId } from '@/i18n/zh';

export type CompletionHandoffActionId = 'open-files' | 'open-history' | 'start-next';

export interface CompletionHandoffInput {
  completed: boolean;
  artifactCount: number;
}

export interface CompletionHandoffAction {
  id: CompletionHandoffActionId;
  label: string;
  moduleId: ModuleId;
}

export function getCompletionHandoffActions(input: CompletionHandoffInput): CompletionHandoffAction[] {
  if (!input.completed) return [];

  const actions: CompletionHandoffAction[] = [];
  if (input.artifactCount > 0) {
    actions.push({ id: 'open-files', label: '查看产物', moduleId: 'files' });
  }
  actions.push({ id: 'open-history', label: '回放过程', moduleId: 'history' });
  actions.push({ id: 'start-next', label: '开始下一轮', moduleId: 'launchpad' });
  return actions;
}
