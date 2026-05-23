export interface MigrationHealthBundle {
  schemaVersion: number;
  exportedAt: string;
  app: string;
  storage: Record<string, unknown>;
}

export interface PersistedRecordCounts {
  ui: number;
  agents: number;
  tasks: number;
  calendarItems: number;
  workbenchTasks: number;
  missions: number;
  artifacts: number;
}

export interface MigrationHealthResult {
  status: 'ok' | 'warning' | 'blocked';
  errors: string[];
  warnings: string[];
  counts: PersistedRecordCounts;
}

const SECRET_PATTERNS = [
  /authorization/i,
  /bearer\s+[a-z0-9._-]+/i,
  /api[_-]?key/i,
  /password/i,
  /secret/i,
  /token/i,
  /sk-[a-z0-9]/i,
];

function objectRecord(value: unknown): Record<string, any> {
  return value && typeof value === 'object' ? (value as Record<string, any>) : {};
}

export function countPersistedRecords(storage: Record<string, unknown>): PersistedRecordCounts {
  const office = objectRecord(storage['cyber-office-data']);
  const dashboard = objectRecord(storage['cyber-office-dashboard']);
  const commander = objectRecord(storage['cyber-office-commander']);
  const ui = objectRecord(storage['cyber-office-ui']);

  return {
    ui: Object.keys(ui).length,
    agents: Array.isArray(office.agents) ? office.agents.length : 0,
    tasks: Array.isArray(office.tasks) ? office.tasks.length : 0,
    calendarItems: Array.isArray(dashboard.calendarItems) ? dashboard.calendarItems.length : 0,
    workbenchTasks: Array.isArray(dashboard.workbenchTasks) ? dashboard.workbenchTasks.length : 0,
    missions: commander.missions ? Object.keys(commander.missions).length : 0,
    artifacts: commander.artifacts ? Object.keys(commander.artifacts).length : 0,
  };
}

export function hasSecretLikeContent(value: unknown): boolean {
  const text = JSON.stringify(value);
  return SECRET_PATTERNS.some((pattern) => pattern.test(text));
}

export function checkMigrationBundleHealth(bundle: MigrationHealthBundle): MigrationHealthResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const counts = countPersistedRecords(bundle.storage);

  if (bundle.app !== '3d-cyber-office') errors.push('迁移包 app 标识不匹配。');
  if (!bundle.schemaVersion || bundle.schemaVersion < 1) errors.push('迁移包 schemaVersion 无效。');
  if (hasSecretLikeContent(bundle.storage))
    errors.push('迁移包中发现疑似敏感凭据，请移除 token、password 或 authorization 后再导入。');

  if (!bundle.storage['cyber-office-data']) warnings.push('缺少 office 数据，导入后将使用默认 Agent 和任务。');
  if (!bundle.storage['cyber-office-dashboard']) warnings.push('缺少 dashboard 数据，日程和工作台偏好将使用默认值。');
  if (!bundle.storage['cyber-office-commander']) warnings.push('缺少 commander 数据，历史 mission 和 artifact 不会恢复。');

  return {
    status: errors.length > 0 ? 'blocked' : warnings.length > 0 ? 'warning' : 'ok',
    errors,
    warnings,
    counts,
  };
}

export function createMigrationCoverageSummary(counts: PersistedRecordCounts): string {
  return [
    `UI 字段 ${counts.ui} 个`,
    `Agent ${counts.agents} 个`,
    `任务 ${counts.tasks} 个`,
    `日程 ${counts.calendarItems} 条`,
    `工作台任务 ${counts.workbenchTasks} 条`,
    `Mission ${counts.missions} 个`,
    `Artifact ${counts.artifacts} 个`,
  ].join('，');
}
