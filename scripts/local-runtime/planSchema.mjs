const ROLES = new Set(['researcher', 'builder', 'reviewer']);
const RISKS = new Set(['low', 'medium', 'high', 'critical']);
const ARTIFACT_KINDS = new Set(['notes', 'patch', 'review', 'report']);

function isRecord(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function normalizeArray(value) {
  return Array.isArray(value) ? value.filter((item) => typeof item === 'string') : [];
}

export function normalizePlannerResponse(value) {
  if (!isRecord(value)) throw new Error('Planner response must be an object');
  if (!Array.isArray(value.tasks)) throw new Error('Planner response tasks must be an array');

  return {
    missionId: String(value.missionId || '').trim(),
    missionTitle: String(value.missionTitle || '').trim(),
    missionSummary: typeof value.missionSummary === 'string' ? value.missionSummary.trim() : '',
    planner: isRecord(value.planner) ? value.planner : undefined,
    tasks: value.tasks.map((task, index) => ({
      id: String(task.id || `task-${index + 1}`).trim(),
      role: String(task.role || '').trim(),
      title: String(task.title || '').trim(),
      summary: String(task.summary || '').trim(),
      risk: String(task.risk || 'medium').trim(),
      dependencyIds: normalizeArray(task.dependencyIds),
      expectedArtifactKinds: normalizeArray(task.expectedArtifactKinds).filter((kind) =>
        ARTIFACT_KINDS.has(kind),
      ),
    })),
  };
}

export function validatePlannerResponse(value) {
  let normalized;
  try {
    normalized = normalizePlannerResponse(value);
  } catch (error) {
    return { ok: false, reason: error instanceof Error ? error.message : 'Invalid planner response' };
  }

  if (!normalized.missionId) return { ok: false, reason: 'missionId is missing' };
  if (!normalized.missionTitle) return { ok: false, reason: 'missionTitle is missing' };
  if (normalized.tasks.length < 3) return { ok: false, reason: 'at least three tasks are required' };

  const ids = new Set();
  const roles = new Set();
  for (const task of normalized.tasks) {
    if (!task.id || ids.has(task.id))
      return { ok: false, reason: `duplicate or missing task id: ${task.id}` };
    if (!ROLES.has(task.role)) return { ok: false, reason: `unsupported role: ${task.role}` };
    if (!task.title) return { ok: false, reason: `task ${task.id} title is missing` };
    if (!task.summary) return { ok: false, reason: `task ${task.id} summary is missing` };
    if (!RISKS.has(task.risk)) return { ok: false, reason: `unsupported risk: ${task.risk}` };
    ids.add(task.id);
    roles.add(task.role);
  }

  for (const task of normalized.tasks) {
    for (const dependencyId of task.dependencyIds) {
      if (!ids.has(dependencyId))
        return { ok: false, reason: `unknown dependency ${dependencyId}` };
    }
  }

  for (const requiredRole of ROLES) {
    if (!roles.has(requiredRole)) return { ok: false, reason: `missing role: ${requiredRole}` };
  }

  return { ok: true, value: normalized };
}
