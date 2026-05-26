import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { findAvailablePort, isPortFree, wait } from './portUtils.mjs';
import { terminateWindowsTcpPortOwners } from './processTree.mjs';

async function waitForPortState(port, expectedFree, timeoutMs = 20000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if ((await isPortFree(port)) === expectedFree) return;
    await wait(250);
  }
  throw new Error(`Port ${port} did not become ${expectedFree ? 'free' : 'occupied'}`);
}

async function waitForExit(child, timeoutMs = 5000) {
  const exit = new Promise((resolve) => child.once('exit', resolve));
  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('dev:all did not exit after SIGINT')), timeoutMs),
  );
  await Promise.race([exit, timeout]);
}

async function runProgrammaticSigintCase({ name, command, args, shell, baseRuntimePort, baseVitePort }) {
  const runtimePort = await findAvailablePort(baseRuntimePort, '127.0.0.1', 50);
  const vitePort = await findAvailablePort(baseVitePort, '127.0.0.1', 50);
  const output = [];
  const child = spawn(command, args, {
    cwd: process.cwd(),
    env: {
      ...process.env,
      LOCAL_RUNTIME_PORT: String(runtimePort),
      VITE_PORT: String(vitePort),
    },
    stdio: ['ignore', 'pipe', 'pipe'],
    shell,
    windowsHide: true,
  });

  child.stdout.on('data', (data) => output.push(String(data)));
  child.stderr.on('data', (data) => output.push(String(data)));

  try {
    await waitForPortState(runtimePort, false);
    await waitForPortState(vitePort, false);

    child.kill('SIGINT');
    await waitForExit(child);

    await waitForPortState(runtimePort, true);
    await waitForPortState(vitePort, true);
  } finally {
    if (child.exitCode === null && child.signalCode === null) child.kill('SIGKILL');
    await terminateWindowsTcpPortOwners([runtimePort, vitePort], { timeoutMs: 5000 });
  }

  assert.equal(await isPortFree(runtimePort), true, `${name}\n${output.join('')}`);
  assert.equal(await isPortFree(vitePort), true, `${name}\n${output.join('')}`);
}

test('dev:all releases runtime and Vite ports after programmatic SIGINT', async () => {
  await runProgrammaticSigintCase({
    name: 'direct node start-all',
    command: process.execPath,
    args: ['scripts/dev/start-all.mjs'],
    shell: false,
    baseRuntimePort: 19165,
    baseVitePort: 19173,
  });
});

test('npm dev:all wrapper releases runtime and Vite ports after programmatic SIGINT', async () => {
  await runProgrammaticSigintCase({
    name: 'npm.cmd run dev:all',
    command: 'npm.cmd run dev:all',
    args: [],
    shell: true,
    baseRuntimePort: 19265,
    baseVitePort: 19273,
  });
});
