import { execFile, execFileSync, spawn } from 'node:child_process';

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function runProcess(command, args, options, spawnFn) {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (exitCode = 1) => {
      if (settled) return;
      settled = true;
      resolve(exitCode);
    };

    const child = spawnFn(command, args, options);
    child.once('exit', finish);
    child.once('error', finish);
  });
}

function stopWindowsProcess(pid, spawnFn) {
  return runProcess(
    'powershell.exe',
    ['-NoProfile', '-Command', `Stop-Process -Id ${pid} -Force -ErrorAction SilentlyContinue`],
    { stdio: 'ignore', windowsHide: true },
    spawnFn,
  );
}

export async function terminateProcessTree(
  child,
  { platform = process.platform, signal = 'SIGTERM', spawnFn = spawn } = {},
) {
  if (!child) return Promise.resolve();

  if (platform === 'win32' && child.pid) {
    const exitCode = await runProcess(
      'taskkill',
      ['/pid', String(child.pid), '/T', '/F'],
      { stdio: 'ignore', windowsHide: true },
      spawnFn,
    );
    if (exitCode !== 0) await stopWindowsProcess(child.pid, spawnFn);
    return;
  }

  try {
    child.kill(signal);
  } catch {
    // Process may have already exited.
  }
}

export async function terminateProcessTrees(children, options = {}) {
  await Promise.allSettled(Array.from(children, (child) => terminateProcessTree(child, options)));
  await terminateWindowsTcpPortOwners(options.ports || [], options);
}

export function collectAncestorPids(startPid, readParentPid, maxDepth = 12) {
  const ancestors = [];
  const seen = new Set([startPid]);
  let currentPid = startPid;

  for (let depth = 0; depth < maxDepth; depth += 1) {
    const parentPid = readParentPid(currentPid);
    if (!Number.isInteger(parentPid) || parentPid <= 0 || seen.has(parentPid)) break;
    ancestors.push(parentPid);
    seen.add(parentPid);
    currentPid = parentPid;
  }

  return ancestors;
}

export function readWindowsAncestorPids(
  startPid,
  { platform = process.platform, execFileSyncFn = execFileSync } = {},
) {
  if (platform !== 'win32' || !Number.isInteger(startPid) || startPid <= 0) return [];

  const script = `
$code = @'
using System;
using System.Runtime.InteropServices;
public static class DevAllParentPidReader {
  [StructLayout(LayoutKind.Sequential)]
  public struct PROCESS_BASIC_INFORMATION {
    public IntPtr Reserved1;
    public IntPtr PebBaseAddress;
    public IntPtr Reserved2_0;
    public IntPtr Reserved2_1;
    public IntPtr UniqueProcessId;
    public IntPtr InheritedFromUniqueProcessId;
  }
  [DllImport("ntdll.dll")]
  public static extern int NtQueryInformationProcess(IntPtr processHandle, int processInformationClass, ref PROCESS_BASIC_INFORMATION processInformation, int processInformationLength, out int returnLength);
  public static int GetParentPid(int pid) {
    using (var process = System.Diagnostics.Process.GetProcessById(pid)) {
      PROCESS_BASIC_INFORMATION pbi = new PROCESS_BASIC_INFORMATION();
      int returnLength;
      int status = NtQueryInformationProcess(process.Handle, 0, ref pbi, Marshal.SizeOf(typeof(PROCESS_BASIC_INFORMATION)), out returnLength);
      if (status != 0) return 0;
      return pbi.InheritedFromUniqueProcessId.ToInt32();
    }
  }
}
'@
Add-Type -TypeDefinition $code
$pidValue = ${startPid}
$seen = @{}
for ($i = 0; $i -lt 12; $i++) {
  if ($seen.ContainsKey($pidValue)) { break }
  $seen[$pidValue] = $true
  try {
    $parent = [DevAllParentPidReader]::GetParentPid($pidValue)
  } catch {
    break
  }
  if ($parent -le 0 -or $seen.ContainsKey($parent)) { break }
  Write-Output $parent
  $pidValue = $parent
}
`;

  const parseOutput = (output) =>
    String(output || '')
      .split(/\r?\n/)
      .map((line) => Number(line.trim()))
      .filter((pid) => Number.isInteger(pid) && pid > 0);

  try {
    const output = execFileSyncFn('powershell.exe', ['-NoProfile', '-Command', script], {
      encoding: 'utf8',
      windowsHide: true,
    });
    return parseOutput(output);
  } catch (error) {
    return parseOutput(error?.stdout);
  }
}

export function findWindowsTcpPortOwners(netstatOutput, ports) {
  const wantedPorts = new Set(ports.map((port) => String(port)));
  const owners = new Set();

  for (const line of String(netstatOutput).split(/\r?\n/)) {
    const parts = line.trim().split(/\s+/);
    if (parts[0] !== 'TCP' || parts[3] !== 'LISTENING') continue;

    const portMatch = parts[1]?.match(/:(\d+)$/);
    const pid = Number(parts[4]);
    if (portMatch && wantedPorts.has(portMatch[1]) && Number.isInteger(pid)) {
      owners.add(pid);
    }
  }

  return [...owners];
}

function readWindowsNetstat({ execFileFn = execFile } = {}) {
  return new Promise((resolve, reject) => {
    execFileFn('netstat', ['-ano', '-p', 'tcp'], { windowsHide: true }, (error, stdout) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(stdout);
    });
  });
}

export async function terminateWindowsTcpPortOwners(
  ports,
  {
    platform = process.platform,
    currentPid = process.pid,
    execFileFn = execFile,
    spawnFn = spawn,
    timeoutMs = 3000,
    pollMs = 100,
  } = {},
) {
  if (platform !== 'win32' || ports.length === 0) return;

  let output;
  try {
    output = await readWindowsNetstat({ execFileFn });
  } catch {
    return;
  }

  const owners = findWindowsTcpPortOwners(output, ports).filter((pid) => pid !== currentPid);
  await Promise.allSettled(
    owners.map((pid) => stopWindowsProcess(pid, spawnFn)),
  );

  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    let nextOutput;
    try {
      nextOutput = await readWindowsNetstat({ execFileFn });
    } catch {
      return;
    }
    const remaining = findWindowsTcpPortOwners(nextOutput, ports).filter((pid) => pid !== currentPid);
    if (remaining.length === 0) return;
    await wait(pollMs);
  }
}
