export function buildWorkerPrompt(input) {
  const artifactText = input.artifacts.length
    ? input.artifacts
        .map(
          (artifact) =>
            `- ${artifact.title}: ${artifact.summary || artifact.path}`,
        )
        .join('\n')
    : '- No prior artifacts.';

  const toolText = input.tools
    .map((tool) => `- ${tool.name} (${tool.risk})`)
    .join('\n');

  return [
    `You are ${input.worker.name}.`,
    `Mission: ${input.mission.title}`,
    `Task: ${input.task.title}`,
    `Task summary: ${input.task.summary}`,
    '',
    'Available tools:',
    toolText,
    '',
    'Prior artifacts:',
    artifactText,
    '',
    'Return concise JSON with summary, artifactTitle, artifactKind, artifactContent, and requestedTool if needed.',
    'Do not request destructive actions.',
  ].join('\n');
}
