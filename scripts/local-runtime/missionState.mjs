export function createMissionState(plan, options = {}) {
  const maxRetries = options.maxRetries ?? 2;
  const tasks = new Map(
    plan.tasks.map((task) => [
      task.id,
      {
        ...task,
        status: 'planned',
        artifactIds: [],
        retryCount: 0,
        errorSummary: null,
      },
    ]),
  );

  const mission = {
    id: plan.missionId,
    title: plan.missionTitle,
    summary: plan.missionSummary || '',
    status: 'planned',
    startedAt: null,
    completedAt: null,
  };

  function getTask(taskId) {
    return tasks.get(taskId) || null;
  }

  function dependenciesComplete(task) {
    return (task.dependencyIds || []).every(
      (dependencyId) => tasks.get(dependencyId)?.status === 'completed',
    );
  }

  function getReadyTasks() {
    return [...tasks.values()].filter(
      (task) => task.status === 'planned' && dependenciesComplete(task),
    );
  }

  function setTaskStatus(taskId, status) {
    const task = tasks.get(taskId);
    if (!task) throw new Error(`Unknown task: ${taskId}`);
    task.status = status;
    if (status === 'running') mission.status = 'running';
    if (status === 'waiting_input') mission.status = 'waiting_input';
    if (status === 'blocked') mission.status = 'blocked';
    if ([...tasks.values()].every((item) => item.status === 'completed')) {
      mission.status = 'completed';
      mission.completedAt = new Date().toISOString();
    }
  }

  function recordFailure(taskId, message) {
    const task = getTask(taskId);
    if (!task) throw new Error(`Unknown task: ${taskId}`);
    task.retryCount += 1;
    task.errorSummary = message;
    task.status = task.retryCount >= maxRetries ? 'blocked' : 'planned';
    if (task.status === 'blocked') mission.status = 'blocked';
  }

  function addArtifact(taskId, artifactId) {
    const task = getTask(taskId);
    if (!task) throw new Error(`Unknown task: ${taskId}`);
    task.artifactIds.push(artifactId);
  }

  function snapshot() {
    return {
      mission: { ...mission },
      tasks: [...tasks.values()].map((task) => ({
        ...task,
        artifactIds: [...task.artifactIds],
      })),
    };
  }

  return {
    mission,
    getTask,
    getReadyTasks,
    setTaskStatus,
    recordFailure,
    addArtifact,
    snapshot,
  };
}
