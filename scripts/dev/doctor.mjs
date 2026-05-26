#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { isPortFree, parsePort, probeHttpJson } from './portUtils.mjs';

const root = process.cwd();
const checks = [];

function addCheck(name, status, detail, advice = null) {
  checks.push({ name, status, detail, advice });
}

function exists(relativePath) {
  return fs.existsSync(path.join(root, relativePath));
}

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
}

function checkProjectRoot() {
  if (!exists('package.json')) {
    addCheck('project-root', 'fail', 'package.json not found.', 'Run this command from the project root.');
    return;
  }
  const pkg = readJson('package.json');
  addCheck('project-root', 'pass', `${pkg.name}@${pkg.version || '0.0.0'}`);
}

function checkNodeVersion() {
  const major = Number(process.versions.node.split('.')[0]);
  if (major < 20) {
    addCheck('node-version', 'warn', `Node ${process.version}`, 'Use Node.js 20 or newer.');
    return;
  }
  addCheck('node-version', 'pass', `Node ${process.version}`);
}

function checkDependencies() {
  if (!exists('node_modules')) {
    addCheck('dependencies', 'warn', 'node_modules not found.', 'Run npm install.');
    return;
  }
  addCheck('dependencies', 'pass', 'node_modules exists.');
}

function checkEnvFiles() {
  const envFiles = fs.readdirSync(root).filter((name) => name === '.env' || name.startsWith('.env.'));
  const unsafe = envFiles.filter((name) => name !== '.env.example');
  if (unsafe.length === 0) {
    addCheck('env-files', 'pass', 'No local secret env files detected.');
    return;
  }
  addCheck(
    'env-files',
    'warn',
    `Local env files present: ${unsafe.join(', ')}`,
    'Do not copy these files into migration bundles or screenshots.',
  );
}

async function checkPortsAndRuntime() {
  const vitePort = parsePort(process.env.VITE_PORT, 5173);
  const runtimePort = parsePort(process.env.LOCAL_RUNTIME_PORT, 8765);

  const viteFree = await isPortFree(vitePort);
  addCheck(
    'vite-port',
    viteFree ? 'pass' : 'warn',
    `Port ${vitePort} is ${viteFree ? 'free' : 'occupied'}.`,
    viteFree ? null : 'If Vite is already running, open its printed URL. Otherwise choose another port.',
  );

  const runtimeFree = await isPortFree(runtimePort);
  if (runtimeFree) {
    addCheck(
      'runtime-port',
      'warn',
      `Runtime port ${runtimePort} is free; runtime is probably not running.`,
      'Run npm.cmd run runtime, or npm.cmd run dev:all.',
    );
    return;
  }

  const health = await probeHttpJson(`http://127.0.0.1:${runtimePort}/health`);
  if (!health.ok || !health.json) {
    addCheck(
      'runtime-health',
      'warn',
      `Port ${runtimePort} is occupied but /health did not return JSON.`,
      'Another process may be using the runtime port. Change LOCAL_RUNTIME_PORT or stop the old process.',
    );
    return;
  }

  addCheck(
    'runtime-health',
    'pass',
    JSON.stringify({
      runtimeId: health.json.runtimeId,
      buildId: health.json.buildId || 'unknown',
      pid: health.json.pid || 'unknown',
      planner: health.json.planner || null,
    }),
  );
}

checkProjectRoot();
checkNodeVersion();
checkDependencies();
checkEnvFiles();
await checkPortsAndRuntime();

for (const check of checks) {
  const marker = check.status === 'pass' ? 'PASS' : check.status === 'warn' ? 'WARN' : 'FAIL';
  console.log(`[${marker}] ${check.name}: ${check.detail}`);
  if (check.advice) console.log(`       ${check.advice}`);
}

const hasFail = checks.some((check) => check.status === 'fail');
process.exitCode = hasFail ? 1 : 0;
