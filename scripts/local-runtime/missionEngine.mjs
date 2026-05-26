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
  const workerEngine =
    options.workerEngine ||
    createWorkerEngine({ workspaceRoot, env: options.env, fetcher: options.fetcher });
  const artifactRecords = new Map();
  const onMissionSnapshot =
    typeof options.onMissionSnapshot === 'function' ? options.onMissionSnapshot : null;
  const onArtifactCreated =
    typeof options.onArtifactCreated === 'function' ? options.onArtifactCreated : null;

  function officeTaskId(missionId, taskId) {
    return `runtime-${missionId}-${taskId}`;
  }

  function emitTask(type, missionId, task, workerId, payload = {}) {
    emit(type, {
      runtimeEventId: `rt-${missionId}-${task.id}-${type}-${Date.now()}`,
      missionId,
      taskId: officeTaskId(missionId, task.id),
      workerId,
      payload: { missionTaskId: task.id, title: task.title, summary: task.summary, ...payload },
    });
  }

  function notifyMissionSnapshot(state) {
    if (!onMissionSnapshot) return;
    try {
      onMissionSnapshot(state.snapshot());
    } catch {
      // Journal hooks must not break mission execution.
    }
  }

  function notifyArtifactCreated(artifact) {
    if (!onArtifactCreated) return;
    try {
      onArtifactCreated(artifact);
    } catch {
      // Journal hooks must not break mission execution.
    }
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

  function getPriorArtifactsForTask(state, task) {
    const dependencyIds = new Set(task.dependencyIds || []);
    return [...artifactRecords.values()].filter(
      (artifact) => artifact.missionId === state.mission.id && dependencyIds.has(artifact.taskId),
    );
  }

  async function runOneTask(state, task) {
    const missionId = state.mission.id;
    const worker = getWorkerForRole(task.role);
    state.setTaskStatus(task.id, 'running');
    notifyMissionSnapshot(state);
    emitTask('runtime.task_assigned', missionId, task, worker.id);
    emitTask('runtime.task_started', missionId, task, worker.id, {
      message: `${task.title} 已开始`,
    });

    const result = await workerEngine.runTask({
      mission: state.mission,
      task,
      officeTaskId: officeTaskId(missionId, task.id),
      artifacts: getPriorArtifactsForTask(state, task),
    });

    if (result.status === 'approval_required') {
      const approvalId = `approval-${missionId}-${task.id}-${Date.now()}`;
      state.setTaskStatus(task.id, 'waiting_input');
      notifyMissionSnapshot(state);
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
      const artifactRecord = {
        ...result.artifact,
        missionId,
        taskId: task.id,
        workerId: worker.id,
        summary: result.summary,
      };
      artifactRecords.set(result.artifact.artifactId, artifactRecord);
      notifyArtifactCreated(artifactRecord);
      state.addArtifact(task.id, result.artifact.artifactId);
      notifyMissionSnapshot(state);
      emitTask('runtime.artifact_created', missionId, task, worker.id, {
        artifactId: result.artifact.artifactId,
        title: result.artifact.title,
        kind: result.artifact.kind,
        path: result.artifact.path,
        summary: result.summary,
        createdByWorkerId: result.artifact.createdByWorkerId || worker.id,
        workspaceBacked: result.artifact.workspaceBacked,
        previewable: result.artifact.previewable,
      });
    }

    state.setTaskStatus(task.id, 'completed');
    notifyMissionSnapshot(state);
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
    notifyMissionSnapshot(state);
    return state.snapshot();
  }

  async function startMission(plan) {
    const state = createMissionState(plan);
    missions.set(plan.missionId, state);
    notifyMissionSnapshot(state);

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
      notifyMissionSnapshot(state);
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
    notifyMissionSnapshot(state);
    emitTask('runtime.task_completed', missionId, task, worker.id, {
      outputSummary: 'Approved action completed.',
    });

    if (state.mission.status !== 'completed') {
      state.mission.status = 'running';
      notifyMissionSnapshot(state);
    }
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
