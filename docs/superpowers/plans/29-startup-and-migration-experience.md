# Startup and Migration Experience Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the project easy to start, diagnose, recover from port conflicts, and migrate between Windows/macOS without relying on memory or scattered commands.

**Architecture:** Add a small cross-platform `scripts/dev/` tool layer around the existing Vite app and local runtime. Keep startup helpers outside React and outside the runtime core. Use Node ESM for portable logic, PowerShell only as a Windows convenience wrapper, and documentation as the user-facing source of truth.

**Tech Stack:** Node ESM, PowerShell wrapper, npm scripts, existing Vite dev server, existing local runtime HTTP health endpoint, existing migration docs.

---

## 0. Preconditions

Plan 29 should be implemented after Plan 28 or after the equivalent runtime health endpoint exists.

Expected Plan 28 capabilities:

- `GET /health` returns at least `ok`, `protocol`, `version`, `runtimeId`, `buildId`, `pid`, `startedAt`, `planner`, and `activeMissionCount`.
- Runtime endpoint can be configured in UI or documented clearly.
- `.local-runtime/` is ignored by git.

If Plan 28 is not fully complete, implement Plan 29 scripts so they gracefully degrade:

- If `/health` has no `buildId`, print `buildId: unknown`.
- If runtime is not running, print a clear disconnected result.
- Do not fail `doctor` solely because the runtime is offline; mark it as `warn`.

---

## 1. Scope

### In Scope

- One-command local startup for frontend + runtime.
- Port availability checks for Vite and Runtime.
- Runtime health diagnostics.
- Node/npm/project-root diagnostics.
- Secret-safe `.env` diagnostics.
- Windows PowerShell and macOS/Linux command guidance.
- Migration docs cleanup for Windows-to-Windows and Windows-to-macOS.
- Release-independent local startup guide.

### Out of Scope

- Electron/Tauri desktop app.
- Auto-installing Node.js.
- Killing unknown user processes automatically.
- Persisting runtime data in a database.
- Cloud sync.
- Model-provider setup beyond checking whether `.env` exists and whether runtime reports configured planner metadata.

---

## 2. Files

### Create

- `scripts/dev/portUtils.mjs`
  - Pure and testable helpers for parsing ports, checking availability, and finding the next free port.

- `scripts/dev/portUtils.test.mjs`
  - Node tests for port parsing and available-port probing.

- `scripts/dev/check-ports.mjs`
  - CLI that checks Vite/runtime ports and prints human-readable status.

- `scripts/dev/doctor.mjs`
  - CLI that checks project root, Node version, package metadata, dependency folder, runtime health, port state, and secret-safe env metadata.

- `scripts/dev/start-all.mjs`
  - Cross-platform process supervisor that starts runtime and Vite together.

- `scripts/dev/start-all.ps1`
  - Windows convenience wrapper for PowerShell users.

- `docs/setup/local-startup-guide.md`
  - User-facing guide for starting, stopping, diagnosing, and changing ports.

### Modify

- `package.json`
  - Add scripts: `dev:all`, `doctor`, `check:ports`, `runtime:e2e` if not already present from Plan 28.

- `docs/runtime/local-runtime-mvp.md`
  - Update startup, health, port, stale process, and `.local-runtime/` guidance.

- `docs/migration/README.md`
  - Replace garbled content with clean Chinese.

- `docs/migration/windows-to-windows.md`
  - Replace garbled content with clean Chinese and current commands.

- `docs/migration/windows-to-mac.md`
  - Replace garbled content with clean Chinese and current commands.

- `docs/migration/troubleshooting.md`
  - Add port conflict, stale runtime, npm PowerShell policy, and package root fixes.

- `docs/migration/migration-checklist.md`
  - Add runtime/local artifact checks.

- `docs/qa/release-readiness-checklist.md`
  - Add Plan 29 checks.

---

## 3. Task 1: Port Utilities

**Files:**
- Create: `scripts/dev/portUtils.mjs`
- Create: `scripts/dev/portUtils.test.mjs`

- [ ] **Step 1: Create port utility module**

Create `scripts/dev/portUtils.mjs`:

```js
import net from 'node:net';

export function parsePort(value, fallback) {
  const raw = value === undefined || value === null || value === '' ? fallback : value;
  const port = Number(raw);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`Invalid port: ${raw}`);
  }
  return port;
}

export function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function isPortFree(port, host = '127.0.0.1') {
  return new Promise((resolve) => {
    const server = net.createServer();

    server.once('error', () => resolve(false));
    server.once('listening', () => {
      server.close(() => resolve(true));
    });

    server.listen(port, host);
  });
}

export async function findAvailablePort(startPort, host = '127.0.0.1', maxAttempts = 20) {
  for (let offset = 0; offset < maxAttempts; offset += 1) {
    const port = startPort + offset;
    if (await isPortFree(port, host)) return port;
  }
  throw new Error(`No available port found from ${startPort} after ${maxAttempts} attempts.`);
}

export async function probeHttpJson(url, timeoutMs = 1200) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { signal: controller.signal });
    const text = await response.text();
    let json = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      json = null;
    }
    return {
      ok: response.ok,
      status: response.status,
      json,
      text,
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      json: null,
      text: error instanceof Error ? error.message : 'request failed',
    };
  } finally {
    clearTimeout(timeout);
  }
}
```

- [ ] **Step 2: Add tests**

Create `scripts/dev/portUtils.test.mjs`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import net from 'node:net';
import { findAvailablePort, isPortFree, parsePort } from './portUtils.mjs';

test('parsePort accepts valid numeric values', () => {
  assert.equal(parsePort('5173', 3000), 5173);
  assert.equal(parsePort(undefined, 8765), 8765);
  assert.equal(parsePort(19765, 8765), 19765);
});

test('parsePort rejects invalid values', () => {
  assert.throws(() => parsePort('abc', 8765), /Invalid port/);
  assert.throws(() => parsePort('70000', 8765), /Invalid port/);
  assert.throws(() => parsePort('0', 8765), /Invalid port/);
});

test('isPortFree returns false for a listening port', async () => {
  const server = net.createServer();
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  assert.equal(typeof address, 'object');
  assert.equal(await isPortFree(address.port), false);
  await new Promise((resolve) => server.close(resolve));
});

test('findAvailablePort finds a free port at or after the starting port', async () => {
  const port = await findAvailablePort(19000, '127.0.0.1', 50);
  assert.equal(typeof port, 'number');
  assert.ok(port >= 19000);
});
```

- [ ] **Step 3: Run focused tests**

Run:

```powershell
node --test scripts/dev/portUtils.test.mjs
```

Expected:

```text
pass 4
```

---

## 4. Task 2: Port Check CLI

**Files:**
- Create: `scripts/dev/check-ports.mjs`
- Modify: `package.json`

- [ ] **Step 1: Create CLI**

Create `scripts/dev/check-ports.mjs`:

```js
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
```

- [ ] **Step 2: Add npm script**

Modify `package.json`:

```json
"check:ports": "node scripts/dev/check-ports.mjs"
```

Keep existing scripts unchanged.

- [ ] **Step 3: Run CLI**

Run:

```powershell
npm.cmd run check:ports
```

Expected:

- Prints Vite port status.
- Prints runtime port status.
- If runtime is occupied by a running local runtime, health summary is shown.
- If port is occupied by something else, script does not crash.

---

## 5. Task 3: Doctor CLI

**Files:**
- Create: `scripts/dev/doctor.mjs`
- Modify: `package.json`

- [ ] **Step 1: Create doctor CLI**

Create `scripts/dev/doctor.mjs`:

```js
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
      'Run npm.cmd run runtime, or npm.cmd run dev:all after this plan lands.',
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
```

- [ ] **Step 2: Add npm script**

Modify `package.json`:

```json
"doctor": "node scripts/dev/doctor.mjs"
```

- [ ] **Step 3: Run doctor**

Run:

```powershell
npm.cmd run doctor
```

Expected:

- Exits `0` when project root is correct even if runtime is offline.
- Exits `1` only when project root is wrong or another hard failure exists.
- Does not print secret values from `.env`.

---

## 6. Task 4: One-Command Startup

**Files:**
- Create: `scripts/dev/start-all.mjs`
- Create: `scripts/dev/start-all.ps1`
- Modify: `package.json`

- [ ] **Step 1: Create cross-platform start script**

Create `scripts/dev/start-all.mjs`:

```js
#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { findAvailablePort, isPortFree, parsePort, wait } from './portUtils.mjs';

const host = '127.0.0.1';
const requestedVitePort = parsePort(process.env.VITE_PORT, 5173);
const requestedRuntimePort = parsePort(process.env.LOCAL_RUNTIME_PORT, 8765);

const vitePort = await findAvailablePort(requestedVitePort, host, 30);
const runtimePort = await findAvailablePort(requestedRuntimePort, host, 30);

const children = [];

function spawnLogged(name, command, args, env = {}) {
  const child = spawn(command, args, {
    cwd: process.cwd(),
    env: { ...process.env, ...env },
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: process.platform === 'win32',
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

function shutdown() {
  console.log('[dev:all] stopping child processes...');
  for (const child of children) child.kill();
}

process.on('SIGINT', () => {
  shutdown();
  process.exit(130);
});

process.on('SIGTERM', () => {
  shutdown();
  process.exit(143);
});

console.log(`[dev:all] Runtime: http://${host}:${runtimePort}`);
console.log(`[dev:all] Vite:    http://${host}:${vitePort}`);

spawnLogged('runtime', process.execPath, ['scripts/local-runtime/server.mjs'], {
  LOCAL_RUNTIME_PORT: String(runtimePort),
});

await wait(400);

spawnLogged('vite', 'npm.cmd', ['run', 'dev', '--', '--host', host, '--port', String(vitePort)], {
  VITE_PORT: String(vitePort),
});

const runtimeFreeAfterStart = await isPortFree(runtimePort, host);
if (runtimeFreeAfterStart) {
  console.error('[dev:all] Runtime did not bind its port. Check runtime logs above.');
}
```

- [ ] **Step 2: Add non-Windows npm compatibility**

The script above uses `npm.cmd`. Adjust it so non-Windows uses `npm`:

```js
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
spawnLogged('vite', npmCommand, ['run', 'dev', '--', '--host', host, '--port', String(vitePort)], {
  VITE_PORT: String(vitePort),
});
```

- [ ] **Step 3: Create PowerShell wrapper**

Create `scripts/dev/start-all.ps1`:

```powershell
$ErrorActionPreference = "Stop"
$Root = Resolve-Path -LiteralPath (Join-Path $PSScriptRoot "..\..")
Set-Location -LiteralPath $Root
node scripts/dev/start-all.mjs
```

- [ ] **Step 4: Add npm script**

Modify `package.json`:

```json
"dev:all": "node scripts/dev/start-all.mjs"
```

- [ ] **Step 5: Manual smoke test**

Run:

```powershell
npm.cmd run dev:all
```

Expected:

- Console prints Runtime URL and Vite URL.
- Runtime logs show listening.
- Vite logs show local URL.
- Pressing `Ctrl+C` stops both child processes.

---

## 7. Task 5: Runtime and Startup Docs

**Files:**
- Create: `docs/setup/local-startup-guide.md`
- Modify: `docs/runtime/local-runtime-mvp.md`

- [ ] **Step 1: Create local startup guide**

Create `docs/setup/local-startup-guide.md`:

```md
# 本地启动指南

## 推荐方式

在项目根目录运行：

```powershell
npm.cmd run dev:all
```

这会同时启动：

- 前端 Vite 应用
- 本地 Runtime

终端会打印两个地址：

- `Vite`: 浏览器打开这个地址
- `Runtime`: Gateway 使用这个端点

## 分开启动

如果你想分别看日志，可以开两个终端。

终端 1：

```powershell
npm.cmd run runtime
```

终端 2：

```powershell
npm.cmd run dev
```

## 检查环境

```powershell
npm.cmd run doctor
```

## 检查端口

```powershell
npm.cmd run check:ports
```

## 端口被占用

Runtime 默认端口是 `8765`。如果被占用，可以换端口：

```powershell
$env:LOCAL_RUNTIME_PORT="19765"
npm.cmd run runtime
```

然后在 Gateway 里把端点改成：

```text
http://127.0.0.1:19765
```

## macOS

macOS 使用同样的 npm script，但命令通常写成：

```bash
npm run dev:all
npm run doctor
npm run check:ports
```

如果要换 Runtime 端口：

```bash
LOCAL_RUNTIME_PORT=19765 npm run runtime
```

## 不要迁移的内容

不要复制这些目录或文件到另一台机器：

- `node_modules/`
- `dist/`
- `.vite/`
- `.env`
- `.env.*`
- `.local-runtime/` 中的临时运行输出，除非你明确要保留历史产物

API key、token、password 不会进入迁移包。换电脑后在安全 Runtime 环境里重新配置。
```

- [ ] **Step 2: Rewrite runtime MVP doc**

Replace `docs/runtime/local-runtime-mvp.md` with:

```md
# Local Runtime MVP

## 启动方式

推荐：

```powershell
npm.cmd run dev:all
```

分开启动：

```powershell
npm.cmd run runtime
npm.cmd run dev
```

## 健康检查

默认地址：

```text
http://127.0.0.1:8765/health
```

Gateway 页面会显示 Runtime endpoint、buildId、pid、startedAt、planner 和 activeMissionCount。

## Runtime 做什么

- 接收 Commander goal：`POST /missions`
- 推送运行事件：`GET /events`
- 处理审批：`POST /approvals/:approvalId/resolve`
- 提供安全工具请求：`POST /tools/request`
- 生成本地运行产物到 `.local-runtime/`

## Runtime 不做什么

- 不把 API key 放进前端。
- 不把 secret 写入迁移包。
- 不自动执行高风险写入或命令。
- 不自动杀掉旧进程。

## 常见问题

### Gateway 显示 disconnected

1. 运行 `npm.cmd run doctor`。
2. 确认 Runtime 进程仍在运行。
3. 打开 `http://127.0.0.1:8765/health`。
4. 如果端口被旧进程占用，换端口启动 Runtime，并在 Gateway 修改 endpoint。

### PowerShell 不能运行 npm

使用：

```powershell
npm.cmd run dev
npm.cmd run runtime
```

### 端口被旧 Runtime 占用

```powershell
$env:LOCAL_RUNTIME_PORT="19765"
npm.cmd run runtime
```

然后将 Gateway endpoint 改为：

```text
http://127.0.0.1:19765
```

## 相关文档

- `docs/setup/local-startup-guide.md`
- `docs/migration/README.md`
- `docs/runtime/model-planner-setup.md`
- `docs/runtime/safe-tool-execution.md`
```

- [ ] **Step 3: Verify docs render as UTF-8**

Run:

```powershell
node -e "const fs=require('fs'); for (const f of ['docs/setup/local-startup-guide.md','docs/runtime/local-runtime-mvp.md']) { const s=fs.readFileSync(f,'utf8'); console.log(f, s.includes('�') ? 'bad' : 'ok') }"
```

Expected:

```text
docs/setup/local-startup-guide.md ok
docs/runtime/local-runtime-mvp.md ok
```

---

## 8. Task 6: Migration Docs Cleanup

**Files:**
- Modify: `docs/migration/README.md`
- Modify: `docs/migration/windows-to-windows.md`
- Modify: `docs/migration/windows-to-mac.md`
- Modify: `docs/migration/troubleshooting.md`
- Modify: `docs/migration/migration-checklist.md`

- [ ] **Step 1: Rewrite migration README**

Replace `docs/migration/README.md` with:

```md
# 3D 赛博办公室迁移指南

如果你要把项目迁移到另一台电脑，按目标系统阅读：

1. `windows-to-windows.md`：Windows 到 Windows。
2. `windows-to-mac.md`：Windows 到 macOS。
3. `3d-cyber-office-data-migration.md`：浏览器本地数据导出/导入。
4. `migration-checklist.md`：迁移检查清单。
5. `troubleshooting.md`：常见问题排查。
6. `../setup/local-startup-guide.md`：本地启动指南。
7. `../qa/final-acceptance-checklist.md`：迁移后验收。

## 重要提醒

迁移包不会包含：

- Runtime/API key
- token
- password
- `.env`
- `.env.*`
- `node_modules/`
- `dist/`

换电脑后，请在新的安全 Runtime 环境里重新配置模型供应商凭据。
```

- [ ] **Step 2: Rewrite Windows-to-Windows doc**

Replace `docs/migration/windows-to-windows.md` with:

```md
# Windows 到 Windows 迁移

## 适用范围

适用于把当前项目从一台 Windows 电脑迁移到另一台 Windows 电脑。

## 旧电脑：导出浏览器状态

```powershell
cd "C:\Users\A413\Documents\3D赛博办公室"
npm.cmd run dev
```

打开应用后：

1. 进入 `Migration` 页面。
2. 点击预览导出。
3. 下载迁移 JSON。
4. 单独保存这个 JSON 文件。

## 复制源码

复制项目源码目录，但不要复制：

- `node_modules/`
- `dist/`
- `.vite/`
- `.env`
- `.env.*`
- `.local-runtime/`
- `*.log`
- `tsconfig.tsbuildinfo`

推荐新路径：

```text
D:\projects\3d-cyber-office
```

## 新电脑：安装和启动

1. 安装 Node.js LTS。
2. 打开 PowerShell：

```powershell
cd "D:\projects\3d-cyber-office"
npm install
npm.cmd run doctor
npm.cmd run dev:all
```

3. 打开 Vite 打印的浏览器地址。
4. 进入 `Migration` 页面。
5. 粘贴迁移 JSON。
6. 预览导入。
7. 确认健康检查不是 blocked。
8. 应用导入。
9. 刷新页面。

## Runtime 凭据

真实 Runtime、API key、token、password 不会迁移。请在新电脑上重新配置 `.env` 或外部安全 Runtime。

## 验收

- `npm.cmd run doctor` 没有 fail。
- Office 能打开。
- Commander 状态恢复。
- Calendar/Tasks/Files/Review 状态恢复。
- Gateway 可以连接本地 Runtime。
- 迁移 JSON 中没有 API key、token、password。
```

- [ ] **Step 3: Rewrite Windows-to-macOS doc**

Replace `docs/migration/windows-to-mac.md` with:

```md
# Windows 到 macOS 迁移

## 适用范围

适用于把 Windows 上的项目源码和浏览器状态迁移到 macOS。

## 不要复制

不要复制这些内容：

- `node_modules/`
- `dist/`
- `.vite/`
- `.env`
- `.env.*`
- `.local-runtime/`
- Windows 专属临时文件

macOS 需要重新安装依赖。

## 推荐路径

```bash
mkdir -p ~/Projects
cd ~/Projects
```

项目目录建议：

```text
~/Projects/3d-cyber-office
```

## 安装步骤

```bash
cd ~/Projects/3d-cyber-office
npm install
npm run doctor
npm run dev:all
```

打开 Vite 打印的本地地址，然后进入 `Migration` 页面导入 JSON。

## 命令对照

| Windows | macOS |
| --- | --- |
| `npm.cmd run dev:all` | `npm run dev:all` |
| `npm.cmd run doctor` | `npm run doctor` |
| `$env:LOCAL_RUNTIME_PORT="19765"` | `LOCAL_RUNTIME_PORT=19765 npm run runtime` |

## Runtime 凭据

迁移包不包含真实 Runtime 凭据。请在 macOS 上重新配置 `.env` 或外部安全 Runtime。

## 验收

- `npm run doctor` 没有 fail。
- `npm run test` 通过。
- `npm run build` 成功。
- Migration 导入成功。
- Gateway 可以连接本地 Runtime。
```

- [ ] **Step 4: Rewrite troubleshooting**

Replace `docs/migration/troubleshooting.md` with:

```md
# 迁移问题排查

## npm 找不到 package.json

原因：当前目录不是项目根目录。

解决：

```powershell
cd "D:\projects\3d-cyber-office"
npm.cmd run doctor
```

## PowerShell 禁止 npm.ps1

使用 `npm.cmd`：

```powershell
npm.cmd run build
```

## node_modules 不能跨系统复制

删除后重新安装：

```powershell
Remove-Item -Recurse -Force node_modules
npm install
```

macOS：

```bash
rm -rf node_modules
npm install
```

## Vite 端口不是 5173

Vite 会自动换端口。使用终端打印的实际地址。

## Runtime 端口被占用

检查：

```powershell
npm.cmd run check:ports
```

换端口：

```powershell
$env:LOCAL_RUNTIME_PORT="19765"
npm.cmd run runtime
```

然后在 Gateway 里把 endpoint 改成 `http://127.0.0.1:19765`。

## 导入 JSON 被 blocked

可能原因：

- 迁移包里含 token/password/authorization。
- schema 不匹配。
- JSON 被手动改坏。

解决：

1. 不要手动加入凭据。
2. 从旧电脑 Migration 页面重新导出。
3. 重新预览导入。

## 真实 AI Runtime 不能用

迁移包不会带凭据。请在新机器的外部 Runtime 中重新配置 API key 或本地模型服务。
```

- [ ] **Step 5: Update checklist**

Modify `docs/migration/migration-checklist.md` to include:

```md
- [ ] `npm.cmd run doctor` or `npm run doctor` completed on target.
- [ ] `node_modules/` was installed on target, not copied.
- [ ] `.env` and `.env.*` were not copied unless intentionally recreated.
- [ ] `.local-runtime/` was not copied unless historical runtime artifacts are intentionally preserved.
- [ ] Gateway endpoint points to the target machine runtime.
- [ ] Runtime credentials were recreated manually if needed.
```

- [ ] **Step 6: Verify UTF-8**

Run:

```powershell
node -e "const fs=require('fs'); const files=['docs/migration/README.md','docs/migration/windows-to-windows.md','docs/migration/windows-to-mac.md','docs/migration/troubleshooting.md']; for (const f of files) { const s=fs.readFileSync(f,'utf8'); console.log(f, s.includes('�') ? 'bad' : 'ok') }"
```

Expected: all `ok`.

---

## 9. Task 7: Package Scripts and Verification Matrix

**Files:**
- Modify: `package.json`
- Modify: `docs/qa/release-readiness-checklist.md`

- [ ] **Step 1: Ensure package scripts exist**

Modify `package.json` scripts to include:

```json
{
  "dev": "vite",
  "dev:all": "node scripts/dev/start-all.mjs",
  "doctor": "node scripts/dev/doctor.mjs",
  "check:ports": "node scripts/dev/check-ports.mjs",
  "build": "tsc -b && vite build",
  "preview": "vite preview",
  "test": "vitest run",
  "runtime": "node scripts/local-runtime/server.mjs",
  "runtime:test": "node --test scripts/local-runtime/*.test.mjs",
  "runtime:e2e": "node scripts/local-runtime/e2e-user-flow.mjs"
}
```

If `runtime:e2e` does not exist because Plan 28 was not implemented yet, do not add the script in Plan 29. Instead add it after Plan 28 lands.

- [ ] **Step 2: Update release checklist**

Add to `docs/qa/release-readiness-checklist.md`:

```md
- [ ] Plan 29 启动体验：`npm.cmd run doctor` 能诊断项目根目录、依赖、端口和 Runtime 健康。
- [ ] Plan 29 一键启动：`npm.cmd run dev:all` 能同时启动 Runtime 和 Vite。
- [ ] Plan 29 迁移文档：Windows/Windows、Windows/macOS、troubleshooting 均为可读中文且命令与实际 scripts 一致。
```

- [ ] **Step 3: Run full script verification**

Run:

```powershell
node --test scripts/dev/*.test.mjs
npm.cmd run check:ports
npm.cmd run doctor
npm.cmd run test
npm.cmd run build
```

Expected:

- Node dev tests pass.
- Check-ports prints status.
- Doctor prints PASS/WARN lines and exits 0 from project root.
- Frontend tests pass.
- Build succeeds.

---

## 10. Task 8: Manual Startup QA

**Files:**
- Modify: `docs/qa/release-readiness-checklist.md`

- [ ] **Step 1: Run one-command startup**

Run:

```powershell
npm.cmd run dev:all
```

Expected:

- Runtime starts.
- Vite starts.
- Console prints both URLs.
- Browser can open Vite URL.
- Gateway can connect to runtime endpoint.

- [ ] **Step 2: Test port conflict behavior**

Open a second terminal while `dev:all` is running.

Run:

```powershell
npm.cmd run check:ports
```

Expected:

- Vite and runtime ports are reported as occupied.
- Runtime health is shown if the occupied runtime port belongs to this app.
- Suggested alternate port is printed.

- [ ] **Step 3: Test doctor from wrong directory**

Run from `C:\Windows\system32`:

```powershell
npm.cmd run doctor
```

Expected:

- This may fail because no `package.json` exists.
- Troubleshooting docs explain that the user must `cd` into project root first.

- [ ] **Step 4: Record outcome**

Update `docs/qa/release-readiness-checklist.md` Plan 29 lines with pass/fail notes.

---

## 11. Acceptance Criteria

### Functional

- [ ] `npm.cmd run check:ports` exists and reports Vite/runtime port status.
- [ ] `npm.cmd run doctor` exists and gives actionable PASS/WARN/FAIL output.
- [ ] `npm.cmd run dev:all` starts runtime and Vite together.
- [ ] `Ctrl+C` stops both child processes from `dev:all`.
- [ ] Runtime port conflict produces a suggested next port.
- [ ] Runtime health summary is shown when an app runtime occupies the port.
- [ ] Scripts work on Windows with `npm.cmd`.
- [ ] Scripts are written in Node ESM and are macOS-compatible.

### Documentation

- [ ] `docs/setup/local-startup-guide.md` exists.
- [ ] Migration README is clean Chinese.
- [ ] Windows-to-Windows doc is clean Chinese.
- [ ] Windows-to-macOS doc is clean Chinese.
- [ ] Troubleshooting covers `package.json` directory error.
- [ ] Troubleshooting covers PowerShell `npm.ps1` execution policy.
- [ ] Troubleshooting covers runtime port conflict.
- [ ] Docs state that API keys and `.env` files are not migrated.

### Verification

- [ ] `node --test scripts/dev/*.test.mjs`
- [ ] `npm.cmd run check:ports`
- [ ] `npm.cmd run doctor`
- [ ] `npm.cmd run test`
- [ ] `npm.cmd run build`
- [ ] Manual `npm.cmd run dev:all` smoke test

---

## 12. Handoff Notes For Claude Code

1. Do not rewrite runtime engine logic in this plan.
2. Do not install new dependencies.
3. Do not kill user processes automatically.
4. Do not copy `.env` values into docs or logs.
5. Keep docs in UTF-8.
6. If PowerShell displays Chinese as mojibake, verify with Node `fs.readFileSync(file, 'utf8')` before assuming file corruption.
7. If Plan 28 has not landed `runtime:e2e`, skip that package script and note it in the final summary.
