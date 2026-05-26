#!/usr/bin/env node
import { findAvailablePort, isPortFree, parsePort, probeHttpJson } from './portUtils.mjs';

const host = '127.0.0.1';
const vitePort = parsePort(process.env.VITE_PORT, 5173);
const runtimePort = parsePort(process.env.LOCAL_RUNTIME_PORT, 8765);

async function describePort(name, port, healthPath = null) {
  const free = await isPortFree(port, host);
  const result = {
    name,
    port,
    free,
    status: free ? 'free' : 'occupied',
    advice: null,
    health: null,
  };

  if (!free && healthPath) {
    result.health = await probeHttpJson(`http://${host}:${port}${healthPath}`);
  }

  if (!free) {
    const suggested = await findAvailablePort(port + 1, host, 30);
    result.advice = `Port ${port} is occupied. Suggested next port: ${suggested}.`;
  }

  return result;
}

const results = [
  await describePort('vite', vitePort),
  await describePort('runtime', runtimePort, '/health'),
];

for (const result of results) {
  console.log(`[${result.name}] ${result.port}: ${result.status}`);
  if (result.health?.json) {
    console.log(`  health: ${JSON.stringify({
      ok: result.health.json.ok,
      runtimeId: result.health.json.runtimeId,
      buildId: result.health.json.buildId,
      pid: result.health.json.pid,
      planner: result.health.json.planner,
    })}`);
  }
  if (result.advice) console.log(`  ${result.advice}`);
}

if (process.argv.includes('--json')) {
  console.log(JSON.stringify(results, null, 2));
}
