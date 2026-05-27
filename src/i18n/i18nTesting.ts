import { moduleLabels, type ModuleId } from './zh';

export function getKnownModuleIds(): ModuleId[] {
  return Object.keys(moduleLabels) as ModuleId[];
}

export function hasChineseText(value: string): boolean {
  return /[\u4e00-\u9fff]/.test(value);
}

export function findMissingLabels<T extends string>(
  labels: Partial<Record<T, string>>,
  requiredKeys: readonly T[],
): T[] {
  return requiredKeys.filter((key) => !labels[key]?.trim());
}

export function findOverlongMobileLabels<T extends string>(
  labels: Record<T, string>,
  maxCharacters: number,
): T[] {
  return (Object.keys(labels) as T[]).filter((key) => labels[key].length > maxCharacters);
}
