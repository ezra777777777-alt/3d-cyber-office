import path from 'node:path';

const RISK_BY_TOOL = {
  'workspace.list_files': 'low',
  'workspace.read_file': 'low',
  'workspace.search_text': 'low',
  'artifact.write': 'low',
  'workspace.write_file': 'high',
  'command.run': 'high',
};

export function createWorkspacePolicy(workspaceRoot = process.cwd()) {
  const root = path.resolve(workspaceRoot);

  function resolveInside(relativePath) {
    const resolved = path.resolve(root, String(relativePath || '.'));
    const relative = path.relative(root, resolved);
    if (relative.startsWith('..') || path.isAbsolute(relative)) {
      throw new Error(`Path is outside workspace root: ${relativePath}`);
    }
    return resolved;
  }

  function classifyToolRisk(toolName) {
    return RISK_BY_TOOL[toolName] || 'critical';
  }

  function isApprovalRequired(toolName) {
    const risk = classifyToolRisk(toolName);
    return risk === 'medium' || risk === 'high' || risk === 'critical';
  }

  return {
    root,
    resolveInside,
    classifyToolRisk,
    isApprovalRequired,
  };
}
