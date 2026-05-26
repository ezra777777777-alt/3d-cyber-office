import { createMissionState } from './missionState.mjs';
import { createWorkerEngine } from './workerEngine.mjs';
import { getWorkerForRole } from './workerProfiles.mjs';
import { createToolRegistry } from './toolRegistry.mjs';

export function createMissionEngine(options) {
  const missions = new Map();
  const pendingApprovals = new Map();
  const emit = options.emit;
  const workspaceRoot = options.workspaceRoot || process.cwd();
  const tools = options.tools || createToolRegistry({ workspaceRoot });
  const workerEngine = options.workerEngine || createWorkerEngine({ workspaceRoot });

  function officeTaskId(missionId, taskId) {
    return `runtime-${missionId}-${taskId}`;
  }

  function emitTask(type, missionId, task, workerId, payload = {}) {
    emit(type, {
      runtimeEventId: `rt-${missionId}-${task.id}-${type}-${Date.now()}`,
      missionId,
      taskId: officeTaskId(missionId, task.id),
      workerId,
      payload: { ...payload, missionTaskId: task.id, title: task.title, summary: task.summary },
    });
  }

  function emitSummaryIfCompleted(state) {
    if (state.mission.status !== 'completed') return;

    const snapshot = state.snapshot();
    const completedTaskCount = snapshot.tasks.filter((task) => task.status === 'completed').length;
    const artifactCount = snapshot.tasks.reduce((sum, task) => sum + task.artifactIds.length, 0);

    emit('runtime.mission_completed', {
      runtimeEventId: `rt-${state.mission.id}-mission-completed-${Date.now()}`,
      missionId: state.mission.id,
      taskId: null,
      workerId: 'worker-commander',
      payload: {
        message: 'Mission completed',
        summary: `${state.mission.title} 已完成：${completedTaskCount} 个任务，${artifactCount} 个产物。`,
        missionStatus: 'completed',
        completedTaskCount,
        artifactCount,
      },
    });
  }

  async function runOneTask(state, task) {
    const missionId = state.mission.id;
    const worker = getWorkerForRole(task.role);
    state.setTaskStatus(task.id, 'running');
    emitTask('runtime.task_assigned', missionId, task, worker.id);
    emitTask('runtime.task_started', missionId, task, worker.id, {
      message: `${task.title} 已开始`,
    });

    const result = await workerEngine.runTask({
      mission: state.mission,
      task,
      officeTaskId: officeTaskId(missionId, task.id),
      artifacts: [],
    });

    if (result.status === 'approval_required') {
      const approvalId = `approval-${missionId}-${task.id}-${Date.now()}`;
      state.setTaskStatus(task.id, 'waiting_input');
      pendingApprovals.set(approvalId, {
        state,
        task,
        worker,
        toolRequest: result.toolRequest,
      });
      emitTask('runtime.approval_requested', missionId, task, worker.id, {
        approvalId,
        action: result.toolRequest.toolName,
        reason: result.toolRequest.reason,
        target:
          result.toolRequest.input?.path ||
          result.toolRequest.input?.command ||
          result.toolRequest.toolName,
        impact: result.toolRequest.impact,
        risk: 'high',
      });
      return false;
    }

    if (result.artifact) {
      state.addArtifact(task.id, result.artifact.artifactId);
      emitTask('runtime.artifact_created', missionId, task, worker.id, {
        artifactId: result.artifact.artifactId,
        title: result.artifact.title,
        kind: result.artifact.kind,
        path: result.artifact.path,
        summary: result.summary,
      });
    }

    state.setTaskStatus(task.id, 'completed');
    emitTask('runtime.task_completed', missionId, task, worker.id, {
      outputSummary: result.summary,
    });
    return true;
  }

  async function drainReadyTasks(state) {
    let progressed = true;
    while (
      progressed &&
      state.mission.status !== 'completed' &&
      state.mission.status !== 'blocked' &&
      state.mission.status !== 'waiting_input'
    ) {
      progressed = false;
      const ready = state.getReadyTasks();
      for (const task of ready) {
        const completed = await runOneTask(state, task);
        progressed = progressed || completed;
        if (!completed) return state.snapshot();
      }
    }

    emitSummaryIfCompleted(state);
    return state.snapshot();
  }

  async function startMission(plan) {
    const state = createMissionState(plan);
    missions.set(plan.missionId, state);

    for (const task of plan.tasks) {
      const worker = getWorkerForRole(task.role);
      emitTask('runtime.task_created', plan.missionId, task, worker.id);
      emitTask('runtime.task_planned', plan.missionId, task, worker.id);
    }

    return drainReadyTasks(state);
  }

  async function resolveApproval(approvalId, resolution, note = '') {
    const pending = pendingApprovals.get(approvalId);
    if (!pending) return { ok: false, reason: 'approval_not_found' };

    pendingApprovals.delete(approvalId);
    const { state, task, worker, toolRequest } = pending;
    const missionId = state.mission.id;

    emit('runtime.approval_resolved', {
      runtimeEventId: `rt-${approvalId}-resolved`,
      missionId,
      taskId: officeTaskId(missionId, task.id),
      workerId: worker.id,
      payload: {
        approvalId,
        resolution,
        note,
        missionTaskId: task.id,
      },
    });

    if (resolution !== 'approved') {
      state.setTaskStatus(task.id, 'blocked');
      emitTask('runtime.task_failed', missionId, task, worker.id, {
        errorSummary: note || 'User rejected approval request.',
      });
      return { ok: true, snapshot: state.snapshot() };
    }

    const result = await tools.executeApproved({
      toolName: toolRequest.toolName,
      input: toolRequest.input || {},
      missionId,
      taskId: task.id,
      officeTaskId: officeTaskId(missionId, task.id),
      workerId: worker.id,
    });

    emit('runtime.tool_called', {
      runtimeEventId: `rt-${approvalId}-tool-called`,
      missionId,
      taskId: officeTaskId(missionId, task.id),
      workerId: worker.id,
      payload: {
        tool: toolRequest.toolName,
        resultSummary: 'Approved tool executed.',
        result,
        missionTaskId: task.id,
      },
    });

    state.setTaskStatus(task.id, 'completed');
    emitTask('runtime.task_completed', missionId, task, worker.id, {
      outputSummary: 'Approved action completed.',
    });

    state.mission.status = 'running';
    return { ok: true, snapshot: await drainReadyTasks(state) };
  }

  function getMission(missionId) {
    return missions.get(missionId)?.snapshot() || null;
  }

  function listMissions() {
    return [...missions.values()].map((state) => state.snapshot());
  }

  return {
    startMission,
    resolveApproval,
    getMission,
    listMissions,
  };
}
