import { buildWorkerOutputContract } from './workerOutputSchema.mjs';

function formatArtifacts(artifacts = []) {
  return artifacts.length
    ? artifacts
        .map((artifact) => `- ${artifact.title}: ${artifact.summary || artifact.path}`)
        .join('\n')
    : '- No prior artifacts.';
}

function formatTools(tools = []) {
  return tools.length
    ? tools
        .map((tool) => {
          const description = tool.description ? `: ${tool.description}` : '';
          return `- ${tool.name} (${tool.risk})${description}`;
        })
        .join('\n')
    : '- No tools are available.';
}

function formatContextPack(contextPack) {
  const files = contextPack?.files || [];
  if (!files.length) return '- No workspace context files were selected.';

  return files
    .map((file) =>
      [
        `### ${file.path}${file.truncated ? ' (truncated)' : ''}`,
        '```',
        file.content,
        '```',
      ].join('\n'),
    )
    .join('\n\n');
}

export function buildWorkerPrompt(input) {
  return [
    `You are ${input.worker.name}.`,
    `Worker role: ${input.worker.role}.`,
    `Mission: ${input.mission.title}`,
    `Task: ${input.task.title}`,
    `Task summary: ${input.task.summary}`,
    '',
    'Return ONLY JSON. No markdown fences. No commentary outside JSON.',
    'Use this exact output contract:',
    JSON.stringify(buildWorkerOutputContract(), null, 2),
    '',
    'Available tools:',
    formatTools(input.tools),
    '',
    'Tool policy:',
    '- Low-risk tools may be requested when useful.',
    '- High-risk tools such as workspace.write_file and command.run pause the mission for user approval.',
    '- Never request destructive commands or actions outside the workspace.',
    '',
    'Prior dependency artifacts:',
    formatArtifacts(input.artifacts || []),
    '',
    'Workspace context pack:',
    formatContextPack(input.contextPack),
    '',
    'Ground your summary and artifactContent in the context pack when relevant.',
    'Set contextUsed to the relative paths you actually relied on.',
  ].join('\n');
}
