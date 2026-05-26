const ARTIFACT_KINDS = new Set(['notes', 'patch', 'review', 'report']);
const TOOL_NAMES = new Set([
  'workspace.list_files',
  'workspace.read_file',
  'workspace.search_text',
  'artifact.write',
  'workspace.write_file',
  'command.run',
]);

const MAX_TEXT = 60_000;

function isRecord(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function text(value, fallback = '') {
  return typeof value === 'string' ? value.trim().slice(0, MAX_TEXT) : fallback;
}

function normalizeRequestedTool(value) {
  if (value == null) return null;
  if (!isRecord(value)) return null;

  const toolName = text(value.toolName);
  if (!TOOL_NAMES.has(toolName)) {
    throw new Error(`Unsupported requested tool: ${toolName || 'missing'}`);
  }

  return {
    toolName,
    input: isRecord(value.input) ? value.input : {},
    reason: text(value.reason, 'Worker requested a tool.'),
    impact: text(value.impact, 'This action affects the local runtime workspace.'),
  };
}

export function normalizeWorkerOutput(value, task = {}) {
  if (!isRecord(value)) throw new Error('Worker output must be an object');

  const summary =
    text(value.summary) ||
    text(task.summary) ||
    `${text(task.title, 'Worker task')} completed.`;
  const artifactKind = ARTIFACT_KINDS.has(text(value.artifactKind))
    ? text(value.artifactKind)
    : task.expectedArtifactKinds?.[0] || 'notes';

  return {
    summary,
    artifactTitle: text(value.artifactTitle, `${text(task.title, 'Worker')} artifact`),
    artifactKind,
    artifactContent: text(value.artifactContent, summary),
    requestedTool: normalizeRequestedTool(value.requestedTool),
    contextUsed: Array.isArray(value.contextUsed)
      ? value.contextUsed.filter((item) => typeof item === 'string').slice(0, 20)
      : [],
    confidence:
      typeof value.confidence === 'number'
        ? Math.max(0, Math.min(1, value.confidence))
        : null,
  };
}

export function buildWorkerOutputContract() {
  return {
    summary: 'string, required',
    artifactTitle: 'string, optional',
    artifactKind: 'notes | patch | review | report',
    artifactContent: 'string markdown, optional',
    contextUsed: ['relative/path.ext'],
    confidence: 'number from 0 to 1',
    requestedTool: {
      toolName:
        'workspace.write_file | command.run | artifact.write | workspace.read_file | workspace.search_text | workspace.list_files',
      input: {},
      reason: 'string',
      impact: 'string',
    },
  };
}
