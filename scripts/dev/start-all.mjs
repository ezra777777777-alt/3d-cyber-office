#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { findAvailablePort, isPortFree, parsePort, wait } from './portUtils.mjs';
import { readWindowsAncestorPids, terminateProcessTrees } from './processTree.mjs';

const host = '127.0.0.1';
const requestedVitePort = parsePort(process.env.VITE_PORT, 5173);
const requestedRuntimePort = parsePort(process.env.LOCAL_RUNTIME_PORT, 8765);

const vitePort = await findAvailablePort(requestedVitePort, host, 30);
const runtimePort = await findAvailablePort(requestedRuntimePort, host, 30);

const children = [];
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const parentPid = process.ppid;
const windowsLauncherPids =
  process.platform === 'win32' ? readWindowsAncestorPids(process.pid).slice(0, 3) : [];
const launcherPids =
  process.platform === 'win32'
    ? (windowsLauncherPids.length > 0 ? windowsLauncherPids : [parentPid])
    : [parentPid];

function startShutdownWatchdog(ports) {
  if (process.platform !== 'win32') return null;

  const child = spawn(
    process.execPath,
    [
      'scripts/dev/shutdownWatchdog.mjs',
      '--parent-pid',
      String(process.pid),
      '--ports',
      ports.join(','),
    ],
    {
      cwd: process.cwd(),
      detached: true,
      stdio: 'ignore',
      windowsHide: true,
    },
  );
  child.unref();
  return child;
}

function spawnLogged(name, command, args, { env: extraEnv = {}, useShell = false } = {}) {
  const child = spawn(command, args, {
    cwd: process.cwd(),
    env: { ...process.env, ...extraEnv },
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: useShell,
    windowsHide: false,
  });

  child.stdout.on('data', (data) => {
    for (const line of String(data).split(/\r?\n/).filter(Boolean)) {
      console.log(`[${name}] ${line}`);
    }
  });

  child.stderr.on('data', (data) => {
    for (const line of String(data).split(/\r?\n/).filter(Boolean)) {
      console.error(`[${name}] ${line}`);
    }
  });

  child.on('exit', (code) => {
    console.log(`[${name}] exited with code ${code}`);
  });

  children.push(child);
  return child;
}

let isShuttingDown = false;
let parentMonitor = null;

function logDevAll(message) {
  try {
    console.log(message);
  } catch {
    // The npm/cmd wrapper may already have closed the output pipe.
  }
}

function isProcessAlive(pid) {
  if (!Number.isInteger(pid) || pid <= 0) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    if (error?.code === 'EPERM') return true;
    return false;
  }
}

function startParentExitMonitor() {
  if (process.platform !== 'win32' || launcherPids.length === 0) return;

  parentMonitor = setInterval(() => {
    if (launcherPids.some((pid) => !isProcessAlive(pid))) {
      void shutdown(130, 'SIGTERM');
    }
  }, 500);
  parentMonitor.unref();
}

function startPipeExitMonitor() {
  if (process.stdout.isTTY && process.stderr.isTTY) return;
  const shutdownFromClosedPipe = () => {
    void shutdown(130, 'SIGTERM');
  };

  process.stdout.once('close', shutdownFromClosedPipe);
  process.stderr.once('close', shutdownFromClosedPipe);
  process.stdout.once('error', shutdownFromClosedPipe);
  process.stderr.once('error', shutdownFromClosedPipe);
}

async function shutdown(exitCode, signal) {
  if (isShuttingDown) return;
  isShuttingDown = true;
  if (parentMonitor) clearInterval(parentMonitor);
  logDevAll('[dev:all] stopping child processes...');
  await terminateProcessTrees(children, { signal, ports: [runtimePort, vitePort] });
  process.exit(exitCode);
}

process.on('SIGINT', () => {
  void shutdown(130, 'SIGINT');
});

process.on('SIGTERM', () => {
  void shutdown(143, 'SIGTERM');
});

console.log(`[dev:all] Runtime: http://${host}:${runtimePort}`);
console.log(`[dev:all] Vite:    http://${host}:${vitePort}`);

startShutdownWatchdog([runtimePort, vitePort]);
startParentExitMonitor();
startPipeExitMonitor();

spawnLogged('runtime', process.execPath, ['scripts/local-runtime/server.mjs'], {
  env: { LOCAL_RUNTIME_PORT: String(runtimePort) },
});

await wait(800);

spawnLogged('vite', npmCommand, ['run', 'dev', '--', '--host', host, '--port', String(vitePort)], {
  env: { VITE_PORT: String(vitePort) },
  useShell: true,
});

const runtimeFreeAfterStart = await isPortFree(runtimePort, host);
if (runtimeFreeAfterStart) {
  console.error('[dev:all] Runtime did not bind its port. Check runtime logs above.');
}
