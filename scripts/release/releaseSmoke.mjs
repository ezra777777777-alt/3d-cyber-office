import { terminateProcessTrees } from '../dev/processTree.mjs';

export function createPreviewCommand({ platform = process.platform, host, port }) {
  const npmArgs = ['run', 'preview', '--', '--host', host, '--port', String(port)];
  if (platform === 'win32') {
    return {
      command: 'cmd.exe',
      args: ['/d', '/s', '/c', 'npm.cmd', ...npmArgs],
    };
  }

  return {
    command: 'npm',
    args: npmArgs,
  };
}

export function createPreviewSpawnOptions() {
  return {
    cwd: process.cwd(),
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  };
}

export async function stopPreviewChildren(
  children,
  {
    previewPort,
    terminateProcessTreesFn = terminateProcessTrees,
  } = {},
) {
  await terminateProcessTreesFn(children, { ports: [previewPort] });
}
