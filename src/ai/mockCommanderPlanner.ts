import type { CommanderGoalInput, CommanderPlannerAdapter, CommanderPlannerResult } from './commanderAdapterTypes';

export function createMockCommanderPlanner(): CommanderPlannerAdapter {
  return {
    mode: 'mock_ai',
    getStatus: () => 'idle',
    async plan(input: CommanderGoalInput): Promise<CommanderPlannerResult> {
      const missionTitle = input.goal.trim() || '新的 Commander 任务';
      return {
        missionTitle,
        missionSummary: `基于目标「${missionTitle}」生成 Research / Build / Review 三阶段任务。`,
        tasks: [
          {
            id: 'research-reference',
            role: 'researcher',
            title: '调研目标和资料',
            summary: input.materialNote || '整理需求、约束和参考资料。',
            risk: 'low',
            dependencyIds: [],
            expectedArtifactKinds: ['notes'],
          },
          {
            id: 'build-office-loop',
            role: 'builder',
            title: '构建实现方案',
            summary: '根据调研结果修改本地项目并产生产物。',
            risk: 'high',
            dependencyIds: ['research-reference'],
            expectedArtifactKinds: ['patch'],
          },
          {
            id: 'review-delivery',
            role: 'reviewer',
            title: '审查和交付',
            summary: '验证任务、整理产物并生成总结。',
            risk: 'low',
            dependencyIds: ['build-office-loop'],
            expectedArtifactKinds: ['review'],
          },
        ],
      };
    },
  };
}
