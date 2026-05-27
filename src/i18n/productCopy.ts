import type { CommanderAdapterMode } from '@/ai/commanderAdapterTypes';
import type { RuntimeConnectionStatus } from '@/runtime/runtimeTypes';

export const commanderModeCopy: Record<CommanderAdapterMode, string> = {
  demo: '演示',
  mock_ai: '模拟 AI',
  local_runtime: '本地 Runtime',
  guarded_real: '真实接入占位',
};

export const runtimeReadinessCopy = {
  disconnected: {
    title: '还没连接本地 Runtime',
    body: '先在终端启动 Runtime，再回到这里连接办公室。',
    command: 'npm.cmd run runtime',
  },
  connected: {
    title: 'Runtime 已连接',
    body: '现在可以让龙虾 Commander 拆解任务，并把审批和产物投影到办公室。',
  },
  stale: {
    title: 'Runtime 可能不是最新进程',
    body: '健康信息显示进程可能已经过期。建议停止旧进程后重新启动。',
  },
  protocolMismatch: {
    title: 'Runtime 协议不匹配',
    body: '浏览器和本地 Runtime 的协议版本不一致。请重启 Runtime 或更新代码后再试。',
  },
  approvalRequired: {
    title: '等待你审批',
    body: '有高风险动作需要确认。审批前，Worker 不会执行写文件或命令。',
  },
  completed: {
    title: '任务已完成',
    body: '可以打开产物、回放任务过程，或者从模板开始下一轮任务。',
  },
} as const;

export const firstRunCopy = {
  title: '开始使用 3D 赛博办公室',
  subtitle: '按顺序完成这 5 步，就能从本地 Runtime 跑通一次 AI 办公闭环。',
  steps: [
    {
      id: 'start-runtime',
      title: '启动本地 Runtime',
      body: '在项目目录打开终端，运行本地任务调度进程。',
      command: 'npm.cmd run runtime',
    },
    {
      id: 'connect-runtime',
      title: '连接办公室',
      body: '切换到“本地 Runtime”模式，确认网关显示已连接。',
    },
    {
      id: 'plan-mission',
      title: '下达任务',
      body: '选择一个任务模板，或直接告诉龙虾 Commander 你想完成什么。',
    },
    {
      id: 'approve-risk',
      title: '审批高风险动作',
      body: '遇到写文件或运行命令时，先看清影响范围，再同意或拒绝。',
    },
    {
      id: 'inspect-results',
      title: '查看产物和历史',
      body: '任务完成后，从文件、历史或 Commander 总结里查看结果。',
    },
  ],
} as const;

export const missionTemplateCopy = [
  {
    id: 'project-health-check',
    title: '项目体检',
    description: '让 Worker 检查当前项目结构、测试脚本、风险点和下一步建议。',
  },
  {
    id: 'release-summary',
    title: '生成发布说明',
    description: '根据近期计划和 QA 文档整理一份可读的发布摘要。',
  },
  {
    id: 'feature-plan',
    title: '小功能实现预案',
    description: '把一个功能想法拆成研究、实现、测试、验收几段任务。',
  },
] as const;

export function readableRuntimeState(status: RuntimeConnectionStatus): string {
  if (status === 'connected') return 'Runtime 已连接';
  if (status === 'connecting') return '正在连接 Runtime';
  if (status === 'protocol_mismatch') return 'Runtime 协议不匹配';
  if (status === 'degraded') return 'Runtime 降级运行';
  if (status === 'error') return 'Runtime 出错';
  if (status === 'disconnected') return 'Runtime 未连接';
  return 'Runtime 待机';
}
