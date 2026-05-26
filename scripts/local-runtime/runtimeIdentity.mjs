import fs from 'node:fs';
import path from 'node:path';

export const RUNTIME_BUILD_ID = 'plan-28-runtime-usability';

export function getRuntimeSourceSignature(root = process.cwd()) {
  const files = [
    'scripts/local-runtime/server.mjs',
    'scripts/local-runtime/missionEngine.mjs',
    'scripts/local-runtime/workerEngine.mjs',
    'scripts/local-runtime/deterministicPlanner.mjs',
  ];

  return files
    .map((file) => {
      const fullPath = path.join(root, file);
      const stat = fs.statSync(fullPath);
      return `${file}:${stat.mtimeMs}`;
    })
    .join('|');
}

export function createRuntimeIdentity(input = {}) {
  return {
    runtimeId: input.runtimeId || 'local-runtime-dev',
    buildId: input.buildId || RUNTIME_BUILD_ID,
    pid: process.pid,
    nodeVersion: process.version,
    startedAt: input.startedAt || new Date().toISOString(),
    sourceSignature:
      input.sourceSignature || getRuntimeSourceSignature(input.root || process.cwd()),
  };
}
