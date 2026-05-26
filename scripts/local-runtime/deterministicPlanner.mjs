export function createDeterministicPlan(input) {
  const goal = input.goal && input.goal.trim() ? input.goal.trim() : '整理当前项目实用性';

  return {
    missionId: input.missionId,
    missionTitle: goal.slice(0, 40),
    missionSummary: '本地 Runtime 已将目标拆成调研、执行、复核三步。',
    planner: {
      provider: 'mock',
      mode: 'deterministic',
    },
    tasks: [
      {
        id: 'research-gap',
        role: 'researcher',
        title: '梳理实用性缺口',
        summary: `围绕目标"${goal}"读取上下文，整理当前可用性缺口。`,
        risk: 'low',
        dependencyIds: [],
        expectedArtifactKinds: ['notes'],
      },
      {
        id: 'build-checklist',
        role: 'builder',
        title: '生成执行清单',
        summary: '把缺口转成可执行任务清单，并在审批通过后登记为产物。',
        risk: 'high',
        dependencyIds: ['research-gap'],
        expectedArtifactKinds: ['report'],
      },
      {
        id: 'review-output',
        role: 'reviewer',
        title: '复核交付质量',
        summary: '检查执行清单是否完整、可落地、没有越权行为。',
        risk: 'low',
        dependencyIds: ['build-checklist'],
        expectedArtifactKinds: ['review'],
      },
    ],
  };
}
