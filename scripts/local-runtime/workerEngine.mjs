import { createToolRegistry } from './toolRegistry.mjs';
import { getWorkerForRole } from './workerProfiles.mjs';
import { buildWorkerPrompt } from './workerPrompts.mjs';

function defaultWorkerResult(input) {
  return {
    summary: `${input.task.title}已完成。`,
    artifactTitle: `${input.task.title}产物`,
    artifactKind: input.task.expectedArtifactKinds?.[0] || 'notes',
    artifactContent: `# ${input.task.title}\n\n${input.task.summary}\n`,
  };
}

export function createWorkerEngine(options) {
  const tools = createToolRegistry({
    workspaceRoot: options.workspaceRoot || process.cwd(),
  });
  const modelPlanWorker = options.modelPlanWorker || (async (input) => defaultWorkerResult(input));

  async function runTask(input) {
    const worker = getWorkerForRole(input.task.role);
    const prompt = buildWorkerPrompt({
      worker,
      mission: input.mission,
      task: input.task,
      artifacts: input.artifacts || [],
      tools: [
        { name: 'workspace.list_files', risk: 'low' },
        { name: 'workspace.read_file', risk: 'low' },
        { name: 'workspace.search_text', risk: 'low' },
        { name: 'artifact.write', risk: 'low' },
        { name: 'workspace.write_file', risk: 'high' },
        { name: 'command.run', risk: 'high' },
      ],
    });

    if (input.task.role === 'builder' && input.task.risk === 'high' && !input.approvalGranted) {
      return {
        status: 'approval_required',
        summary: 'Builder 需要用户批准后才能写入执行产物。',
        worker,
        toolRequest: {
          toolName: 'workspace.write_file',
          input: {
            path: `.local-runtime/${input.mission.id}-${input.task.id}.md`,
            content: `# ${input.task.title}\n\n${input.task.summary}\n`,
          },
          reason: '构建 Worker 将把执行清单写入本地 Runtime 工作区。',
          impact: '仅写入 .local-runtime 目录，不修改项目源码。',
        },
      };
    }

    const decision = await modelPlanWorker({ ...input, worker, prompt });

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
        officeTaskId:
          input.officeTaskId || `runtime-${input.mission.id}-${input.task.id}`,
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
        title:
          decision.artifactTitle || `${input.task.title}产物`,
        kind:
          decision.artifactKind ||
          input.task.expectedArtifactKinds?.[0] ||
          'notes',
        content:
          decision.artifactContent ||
          decision.summary ||
          input.task.summary,
        summary: decision.summary || input.task.summary,
      },
      missionId: input.mission.id,
      taskId: input.task.id,
      officeTaskId:
        input.officeTaskId || `runtime-${input.mission.id}-${input.task.id}`,
      workerId: worker.id,
    });

    return {
      status: 'completed',
      summary: decision.summary || `${input.task.title}已完成。`,
      worker,
      artifact,
    };
  }

  return { runTask };
}
