import { createToolRegistry } from './toolRegistry.mjs';
import { getWorkerForRole } from './workerProfiles.mjs';
import { buildWorkerPrompt } from './workerPrompts.mjs';
import { buildContextPack } from './contextPack.mjs';
import { createModelWorkerDecision } from './modelWorker.mjs';
import { normalizeWorkerOutput } from './workerOutputSchema.mjs';

function summarizeContext(contextPack) {
  if (!contextPack?.files?.length) return 'No workspace context files were selected.';
  return contextPack.files
    .map((file) => `- ${file.path}${file.truncated ? ' (truncated)' : ''}`)
    .join('\n');
}

function defaultWorkerResult(input) {
  const contextSummary = summarizeContext(input.contextPack);
  const contextUsed = input.contextPack?.files?.map((file) => file.path) || [];
  const roleIntro = {
    researcher: 'Researcher inspected bounded workspace context and summarized useful signals.',
    builder: 'Builder used prior artifacts and workspace context to outline implementation work.',
    reviewer: 'Reviewer checked prior artifacts and workspace context for validation needs.',
  }[input.task.role] || 'Worker completed the assigned task.';

  return {
    summary: `${roleIntro}\n\nWorkspace context:\n${contextSummary}`,
    artifactTitle: `${input.task.title} artifact`,
    artifactKind: input.task.expectedArtifactKinds?.[0] || 'notes',
    artifactContent: [
      `# ${input.task.title}`,
      '',
      input.task.summary,
      '',
      '## Workspace Context Used',
      contextSummary,
      '',
      '## Prior Artifacts',
      input.artifacts?.length
        ? input.artifacts
            .map((artifact) => `- ${artifact.title}: ${artifact.summary || artifact.path}`)
            .join('\n')
        : '- None',
    ].join('\n'),
    contextUsed,
    confidence: contextUsed.length ? 0.72 : 0.35,
  };
}

export function createWorkerEngine(options = {}) {
  const workspaceRoot = options.workspaceRoot || process.cwd();
  const tools = createToolRegistry({ workspaceRoot });
  const fallback = async (workerInput) => defaultWorkerResult(workerInput);
  const modelPlanWorker =
    options.modelPlanWorker ||
    createModelWorkerDecision({
      env: options.env,
      fetcher: options.fetcher,
      fallback,
    });

  async function runTask(input) {
    const worker = getWorkerForRole(input.task.role);
    const contextPack = await buildContextPack({
      workspaceRoot,
      mission: input.mission,
      task: input.task,
    });
    const prompt = buildWorkerPrompt({
      worker,
      mission: input.mission,
      task: input.task,
      artifacts: input.artifacts || [],
      contextPack,
      tools: tools.listTools(),
    });

    if (input.task.role === 'builder' && input.task.risk === 'high' && !input.approvalGranted) {
      return {
        status: 'approval_required',
        summary: 'Builder needs user approval before writing an execution artifact.',
        worker,
        toolRequest: {
          toolName: 'workspace.write_file',
          input: {
            path: `.local-runtime/${input.mission.id}-${input.task.id}.md`,
            content: `# ${input.task.title}\n\n${input.task.summary}\n`,
          },
          reason: 'Builder will write an execution checklist into the local runtime workspace.',
          impact: 'Writes only under .local-runtime and does not modify project source code.',
        },
      };
    }

    const decision = normalizeWorkerOutput(
      await modelPlanWorker({ ...input, worker, prompt, contextPack }),
      input.task,
    );

    if (decision.requestedTool) {
      const toolName = decision.requestedTool.toolName;
      if (tools.policy.isApprovalRequired(toolName)) {
        return {
          status: 'approval_required',
          summary: decision.summary || 'Worker requested approval.',
          worker,
          toolRequest: decision.requestedTool,
        };
      }

      const result = await tools.executeApproved({
        toolName,
        input: decision.requestedTool.input || {},
        missionId: input.mission.id,
        taskId: input.task.id,
        officeTaskId: input.officeTaskId || `runtime-${input.mission.id}-${input.task.id}`,
        workerId: worker.id,
      });
      return {
        status: 'completed',
        summary: decision.summary || 'Tool executed.',
        worker,
        result,
      };
    }

    const artifact = await tools.executeApproved({
      toolName: 'artifact.write',
      input: {
        title: decision.artifactTitle || `${input.task.title} artifact`,
        kind: decision.artifactKind || input.task.expectedArtifactKinds?.[0] || 'notes',
        content: decision.artifactContent || decision.summary || input.task.summary,
        summary: decision.summary || input.task.summary,
      },
      missionId: input.mission.id,
      taskId: input.task.id,
      officeTaskId: input.officeTaskId || `runtime-${input.mission.id}-${input.task.id}`,
      workerId: worker.id,
    });

    return {
      status: 'completed',
      summary: decision.summary || `${input.task.title} completed.`,
      worker,
      artifact,
    };
  }

  return { runTask };
}
