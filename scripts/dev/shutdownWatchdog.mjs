#!/usr/bin/env node
import { wait } from './portUtils.mjs';
import { terminateWindowsTcpPortOwners } from './processTree.mjs';

function parseList(value) {
  return String(value || '')
    .split(',')
    .map((item) => Number(item.trim()))
    .filter((item) => Number.isInteger(item) && item > 0);
}

function parseArgs(argv) {
  const options = {
    parentPid: null,
    ports: [],
    pollMs: 250,
    cleanupMs: 8000,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];
    if (arg === '--parent-pid') {
      options.parentPid = Number(next);
      index += 1;
    } else if (arg === '--ports') {
      options.ports = parseList(next);
      index += 1;
    } else if (arg === '--poll-ms') {
      options.pollMs = Number(next);
      index += 1;
    } else if (arg === '--cleanup-ms') {
      options.cleanupMs = Number(next);
      index += 1;
    }
  }

  return options;
}

function isProcessAlive(pid) {
  if (!Number.isInteger(pid) || pid <= 0) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

async function cleanupPortsUntilQuiet(ports, cleanupMs, pollMs) {
  const deadline = Date.now() + cleanupMs;
  do {
    await terminateWindowsTcpPortOwners(ports, { timeoutMs: Math.max(pollMs, 100), pollMs });
    await wait(pollMs);
  } while (Date.now() < deadline);
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (!options.parentPid || options.ports.length === 0) return;

  while (isProcessAlive(options.parentPid)) {
    await wait(options.pollMs);
  }

  await cleanupPortsUntilQuiet(options.ports, options.cleanupMs, options.pollMs);
}

main().catch(() => {
  process.exitCode = 1;
});
