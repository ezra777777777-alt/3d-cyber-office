export type MissionTemplateId =
  | 'project-health-check'
  | 'release-summary'
  | 'feature-plan';

export interface MissionTemplate {
  id: MissionTemplateId;
  title: string;
  goal: string;
  materialNote: string;
  constraintsText: string;
}

export const missionTemplates: MissionTemplate[] = [
  {
    id: 'project-health-check',
    title: '项目体检',
    goal: '请检查当前 3D 赛博办公室项目的工程状态，找出最影响真实用户体验、启动可靠性、Runtime 闭环和发布质量的问题。',
    materialNote: '优先阅读 package.json、docs/qa、docs/superpowers/plans、src/ui、src/runtime、scripts/local-runtime。输出要引用具体文件或命令。',
    constraintsText: [
      '不要修改代码，只生成分析产物。',
      '按 P0/P1/P2 分级。',
      '每个问题给出验证方法。',
      '不要输出任何密钥或本机隐私路径。',
    ].join('\n'),
  },
  {
    id: 'release-summary',
    title: '生成发布说明',
    goal: '请根据当前仓库里的计划文档、QA 记录和 release 文档，生成一份面向用户的本地 MVP 发布说明。',
    materialNote: '重点阅读 docs/release、docs/qa、docs/superpowers/plans/28-33-runtime-productization-roadmap.md。',
    constraintsText: [
      '发布说明必须区分已完成能力、已知限制和启动步骤。',
      '语言使用中文，避免工程黑话。',
      '不要夸大尚未实现的云同步、团队协作或全自动执行能力。',
    ].join('\n'),
  },
  {
    id: 'feature-plan',
    title: '小功能实现预案',
    goal: '请把一个小功能想法拆成研究、实现、测试、验收四段，并指出需要审批的高风险动作。',
    materialNote: '默认小功能：给 Launchpad 增加“复制启动命令”和“打开历史记录”的快捷动作。',
    constraintsText: [
      '先输出计划，不直接改代码。',
      '需要写文件或运行命令时必须进入审批。',
      '测试命令必须写清楚预期结果。',
    ].join('\n'),
  },
];

export function getMissionTemplateById(id: string): MissionTemplate | null {
  return missionTemplates.find((template) => template.id === id) ?? null;
}
