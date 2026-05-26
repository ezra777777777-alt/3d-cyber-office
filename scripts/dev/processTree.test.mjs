import test from 'node:test';
import assert from 'node:assert/strict';
import {
  collectAncestorPids,
  findWindowsTcpPortOwners,
  readWindowsAncestorPids,
  terminateProcessTree,
  terminateWindowsTcpPortOwners,
} from './processTree.mjs';

function createFakeProcessExit(exitCodes = [0]) {
  const calls = [];
  const spawnFn = (command, args, options) => {
    calls.push({ command, args, options });
    const exitCode = exitCodes[Math.min(calls.length - 1, exitCodes.length - 1)];
    return {
      once(event, callback) {
        if (event === 'exit') callback(exitCode);
        return this;
      },
    };
  };
  return { calls, spawnFn };
}

test('terminateProcessTree uses taskkill for Windows process trees', async () => {
  const child = {
    pid: 1234,
    kill() {
      throw new Error('child.kill should not be used for Windows tree shutdown');
    },
  };
  const fakeTaskkill = createFakeProcessExit();

  await terminateProcessTree(child, {
    platform: 'win32',
    spawnFn: fakeTaskkill.spawnFn,
  });

  assert.deepEqual(fakeTaskkill.calls, [
    {
      command: 'taskkill',
      args: ['/pid', '1234', '/T', '/F'],
      options: { stdio: 'ignore', windowsHide: true },
    },
  ]);
});

test('terminateProcessTree falls back to Stop-Process when taskkill fails on Windows', async () => {
  const child = {
    pid: 1234,
    kill() {
      throw new Error('child.kill should not be used for Windows tree shutdown');
    },
  };
  const fakeProcessExit = createFakeProcessExit([1, 0]);

  await terminateProcessTree(child, {
    platform: 'win32',
    spawnFn: fakeProcessExit.spawnFn,
  });

  assert.deepEqual(fakeProcessExit.calls, [
    {
      command: 'taskkill',
      args: ['/pid', '1234', '/T', '/F'],
      options: { stdio: 'ignore', windowsHide: true },
    },
    {
      command: 'powershell.exe',
      args: [
        '-NoProfile',
        '-Command',
        'Stop-Process -Id 1234 -Force -ErrorAction SilentlyContinue',
      ],
      options: { stdio: 'ignore', windowsHide: true },
    },
  ]);
});

test('terminateProcessTree falls back to child.kill without a Windows pid', async () => {
  let killedWith = null;
  const child = {
    pid: undefined,
    kill(signal) {
      killedWith = signal;
    },
  };

  await terminateProcessTree(child, { platform: 'win32', signal: 'SIGINT' });

  assert.equal(killedWith, 'SIGINT');
});

test('terminateProcessTree uses child.kill on non-Windows platforms', async () => {
  let killedWith = null;
  const child = {
    pid: 1234,
    kill(signal) {
      killedWith = signal;
    },
  };

  await terminateProcessTree(child, { platform: 'linux', signal: 'SIGTERM' });

  assert.equal(killedWith, 'SIGTERM');
});

test('findWindowsTcpPortOwners parses listening pids for selected ports', () => {
  const output = `
  Proto  Local Address          Foreign Address        State           PID
  TCP    127.0.0.1:5173         0.0.0.0:0              LISTENING       4444
  TCP    [::1]:8765             [::]:0                 LISTENING       5555
  TCP    127.0.0.1:9999         0.0.0.0:0              ESTABLISHED     6666
  `;

  assert.deepEqual(findWindowsTcpPortOwners(output, [5173, 8765, 9999]), [4444, 5555]);
});

test('collectAncestorPids walks parent pids until the chain ends', () => {
  const parents = new Map([
    [400, 300],
    [300, 200],
    [200, 0],
  ]);

  assert.deepEqual(collectAncestorPids(400, (pid) => parents.get(pid) ?? 0), [300, 200]);
});

test('readWindowsAncestorPids keeps stdout from non-zero PowerShell exits', () => {
  const error = new Error('powershell exited after partial output');
  error.stdout = '300\r\n200\r\n';
  const execFileSyncFn = () => {
    throw error;
  };

  assert.deepEqual(
    readWindowsAncestorPids(400, {
      platform: 'win32',
      execFileSyncFn,
    }),
    [300, 200],
  );
});

test('terminateWindowsTcpPortOwners kills listening pids and skips current process', async () => {
  const fakeStopProcess = createFakeProcessExit();
  const execCalls = [];
  let netstatCalls = 0;
  const execFileFn = (command, args, options, callback) => {
    execCalls.push({ command, args, options });
    netstatCalls += 1;
    callback(
      null,
      netstatCalls === 1
        ? `
        TCP    127.0.0.1:5173     0.0.0.0:0              LISTENING       1111
        TCP    127.0.0.1:8765     0.0.0.0:0              LISTENING       2222
        `
        : '',
      '',
    );
  };

  await terminateWindowsTcpPortOwners([5173, 8765], {
    platform: 'win32',
    currentPid: 1111,
    execFileFn,
    spawnFn: fakeStopProcess.spawnFn,
    pollMs: 0,
  });

  assert.equal(execCalls[0].command, 'netstat');
  assert.deepEqual(fakeStopProcess.calls, [
    {
      command: 'powershell.exe',
      args: [
        '-NoProfile',
        '-Command',
        'Stop-Process -Id 2222 -Force -ErrorAction SilentlyContinue',
      ],
      options: { stdio: 'ignore', windowsHide: true },
    },
  ]);
});
