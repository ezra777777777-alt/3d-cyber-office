import { spawn, spawnSync } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const defaultBundledNodeModules = process.env.USERPROFILE
  ? path.join(
      process.env.USERPROFILE,
      '.cache',
      'codex-runtimes',
      'codex-primary-runtime',
      'dependencies',
      'node',
      'node_modules',
    )
  : '';
const baseNodeModules = process.env.CODEX_BUNDLED_NODE_MODULES
  ?? defaultBundledNodeModules;
const pnpmDir = path.join(baseNodeModules, '.pnpm');
const playwrightPnpmDir = existsSync(pnpmDir)
  ? readdirSync(pnpmDir).find((name) => /^playwright@/.test(name))
  : null;
const bundledNodeModules = playwrightPnpmDir
  ? path.join(pnpmDir, playwrightPnpmDir, 'node_modules')
  : baseNodeModules;
const { chromium } = require(path.join(bundledNodeModules, 'playwright'));

const root = process.cwd();
const port = Number(process.env.PLAN32_PORT ?? 5196);
const outputDir = path.resolve(process.env.PLAN32_OUTPUT_DIR ?? path.join(root, 'qa-artifacts', 'plan32-video-grade'));
const browserExecutable = [
  process.env.PLAN32_CHROME,
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
].filter(Boolean).find((candidate) => existsSync(candidate));

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function stopTree(proc) {
  if (!proc?.pid) return;
  if (process.platform === 'win32') {
    spawnSync('taskkill', ['/PID', String(proc.pid), '/T', '/F'], { stdio: 'ignore', timeout: 5000 });
    return;
  }
  try {
    process.kill(proc.pid, 'SIGTERM');
  } catch {
    // Best effort cleanup.
  }
}

async function waitForHttp(url, timeoutMs = 30000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      // Vite is still starting.
    }
    await delay(500);
  }
  throw new Error(`Timed out waiting for ${url}`);
}

function buildQaState(mode) {
  const now = new Date().toISOString();
  const missionId = 'plan32-visual-qa';
  const approvalId = 'approval-plan32-visual';
  const officeData = {
    agents: [
      ['agent-coordinator', { id: 'agent-coordinator', name: 'Lobster Commander', role: 'coordinator', status: 'approval_required', deskId: 'desk-commander', currentTaskId: 'task-approval', lastActiveAt: now }],
      ['agent-coder', { id: 'agent-coder', name: 'Code Agent', role: 'coding', status: 'working', deskId: 'desk-a2', currentTaskId: 'task-build', lastActiveAt: now }],
      ['agent-writer', { id: 'agent-writer', name: 'Write Agent', role: 'writing', status: 'completed', deskId: 'desk-b1', currentTaskId: 'task-notes', lastActiveAt: now }],
      ['agent-analyst', { id: 'agent-analyst', name: 'Analyst Agent', role: 'analysis', status: 'blocked', deskId: 'desk-b2', currentTaskId: 'task-risk', lastActiveAt: now }],
      ['agent-researcher', { id: 'agent-researcher', name: 'Research Agent', role: 'research', status: 'waiting_input', deskId: 'desk-done', currentTaskId: 'task-research', lastActiveAt: now }],
    ],
    tasks: [
      ['task-approval', { id: 'task-approval', title: 'Approval gate', summary: 'Awaiting human approval.', status: 'approval_required', assignedAgentId: 'agent-coordinator', createdAt: now, updatedAt: now, outputSummary: null, errorSummary: null }],
      ['task-build', { id: 'task-build', title: 'Build artifact', summary: 'Worker is producing an output.', status: 'running', assignedAgentId: 'agent-coder', createdAt: now, updatedAt: now, outputSummary: null, errorSummary: null }],
      ['task-notes', { id: 'task-notes', title: 'Notes delivered', summary: 'Artifact delivered.', status: 'completed', assignedAgentId: 'agent-writer', createdAt: now, updatedAt: now, outputSummary: 'Visual QA artifact ready.', errorSummary: null }],
      ['task-risk', { id: 'task-risk', title: 'Risk review', summary: 'Blocked for review.', status: 'blocked', assignedAgentId: 'agent-analyst', createdAt: now, updatedAt: now, outputSummary: null, errorSummary: 'Requires decision.' }],
    ],
  };
  const commander = {
    state: {
      missions: {
        [missionId]: {
          id: missionId,
          title: 'Plan 32 Visual QA',
          originalGoal: 'Verify video-grade office composition.',
          materialNote: 'Injected browser QA state.',
          constraints: ['desktop screenshot', 'mobile screenshot'],
          status: 'approval_required',
          createdAt: now,
          updatedAt: now,
          summary: null,
          taskIds: ['qa-research', 'qa-build', 'qa-review'],
          tasks: {
            'qa-research': { id: 'qa-research', title: 'Research visual reference', summary: 'Reference comparison.', status: 'completed', workerId: 'worker-researcher', officeTaskId: 'task-notes', dependencyIds: [], expectedArtifactIds: ['artifact-plan32'], risk: 'low', approvalId: null, artifactIds: ['artifact-plan32'] },
            'qa-build': { id: 'qa-build', title: 'Build visual surface', summary: 'Render updated office.', status: 'running', workerId: 'worker-builder', officeTaskId: 'task-build', dependencyIds: ['qa-research'], expectedArtifactIds: [], risk: 'medium', approvalId: null, artifactIds: [] },
            'qa-review': { id: 'qa-review', title: 'Approve risky change', summary: 'Approval cue should show.', status: 'approval_required', workerId: 'worker-reviewer', officeTaskId: 'task-approval', dependencyIds: ['qa-build'], expectedArtifactIds: [], risk: 'high', approvalId, artifactIds: [] },
          },
        },
      },
      selectedMissionId: missionId,
      approvals: {
        [approvalId]: {
          id: approvalId,
          missionId,
          taskId: 'qa-review',
          officeTaskId: 'task-approval',
          requestedByWorkerId: 'worker-reviewer',
          action: 'Visual approval cue',
          reason: 'Show magenta approval state in the Commander station.',
          target: '3D office scene',
          impact: 'Visual QA only.',
          risk: 'high',
          status: 'pending',
          requestedAt: now,
          resolvedAt: null,
          resolutionNote: null,
        },
      },
      artifacts: {
        'artifact-plan32': {
          id: 'artifact-plan32',
          missionId,
          title: 'Visual QA artifact',
          kind: 'notes',
          path: '.local-runtime/artifacts/plan32-visual.md',
          summary: 'Completed state should display a green artifact marker.',
          createdByWorkerId: 'worker-researcher',
          taskId: 'qa-research',
          officeTaskId: 'task-notes',
          previewable: true,
          workspaceBacked: true,
          createdAt: now,
        },
      },
      adapterMode: 'demo',
    },
    version: 0,
  };
  const ui = { state: { activeModule: 'office', visualMode: mode }, version: 0 };
  return { officeData, commander, ui };
}

async function capture(browser, name, viewport, mode) {
  const context = await browser.newContext({ viewport, deviceScaleFactor: 1, isMobile: viewport.width <= 480 });
  const qaState = buildQaState(mode);
  await context.addInitScript((state) => {
    localStorage.setItem('cyber-office-data', JSON.stringify(state.officeData));
    localStorage.setItem('cyber-office-commander', JSON.stringify(state.commander));
    localStorage.setItem('cyber-office-ui', JSON.stringify(state.ui));
  }, qaState);
  const page = await context.newPage();
  const consoleMessages = [];
  page.on('console', (message) => {
    if (message.type() === 'error') consoleMessages.push(message.text());
  });
  await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: 'networkidle', timeout: 45000 });
  await page.waitForTimeout(4500);
  const filePath = path.join(outputDir, `${name}.png`);
  await page.screenshot({ path: filePath, fullPage: false });
  await context.close();
  return { filePath, consoleErrors: consoleMessages.slice(0, 8) };
}

async function runWithBrowser(headless) {
  const browser = await chromium.launch({
    headless,
    executablePath: browserExecutable,
    args: [
      '--disable-gpu-sandbox',
      '--enable-webgl',
      '--ignore-gpu-blocklist',
      '--in-process-gpu',
      '--use-angle=swiftshader',
    ],
  });
  try {
    const low = await capture(browser, 'desktop-1366x768-low', { width: 1366, height: 768 }, 'low');
    const desktop = await capture(browser, 'desktop-1366x768-normal', { width: 1366, height: 768 }, 'normal');
    const showcase = await capture(browser, 'desktop-1366x768-showcase', { width: 1366, height: 768 }, 'showcase');
    const mobile = await capture(browser, 'mobile-390x844-normal', { width: 390, height: 844 }, 'normal');
    return { headless, low, desktop, showcase, mobile };
  } finally {
    await browser.close();
  }
}

async function main() {
  await mkdir(outputDir, { recursive: true });
  const vite = spawn(process.env.ComSpec ?? 'cmd.exe', ['/d', '/s', '/c', `npm.cmd run dev -- --host 127.0.0.1 --port ${port}`], {
    cwd: root,
    windowsHide: true,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  try {
    await waitForHttp(`http://127.0.0.1:${port}/`);
    let result;
    try {
      result = await runWithBrowser(true);
    } catch (error) {
      console.error(`[plan32-playwright] headless failed: ${error.message}`);
      result = await runWithBrowser(false);
    }
    const resultPath = path.join(outputDir, 'plan32-playwright-result.json');
    await writeFile(resultPath, JSON.stringify(result, null, 2));
    console.log(JSON.stringify({ ...result, resultPath }, null, 2));
  } finally {
    stopTree(vite);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
