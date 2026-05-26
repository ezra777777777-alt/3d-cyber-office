import { spawn } from 'node:child_process';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SERVER_SCRIPT = path.join(__dirname, 'server.mjs');
const PORT = 8766;
const BASE = `http://127.0.0.1:${PORT}`;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function fetchJson(url, options) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const req = http.request(
      {
        hostname: urlObj.hostname,
        port: urlObj.port,
        path: urlObj.pathname,
        method: options?.method || 'GET',
        headers: options?.body
          ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(options.body) }
          : {},
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, body: data ? JSON.parse(data) : null });
          } catch {
            resolve({ status: res.statusCode, body: data });
          }
        });
      },
    );
    req.on('error', reject);
    if (options?.body) req.write(options.body);
    req.end();
  });
}

function connectSse(url) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const req = http.get(
      { hostname: urlObj.hostname, port: urlObj.port, path: urlObj.pathname },
      (res) => {
        if (res.statusCode !== 200) {
          reject(new Error(`SSE connect failed with ${res.statusCode}`));
          return;
        }
        const events = [];
        let buffer = '';
        res.on('data', (chunk) => {
          buffer += chunk.toString();
          const parts = buffer.split('\n\n');
          buffer = parts.pop() || '';
          for (const part of parts) {
            const dataMatch = part.match(/^data: (.+)$/m);
            if (!dataMatch) continue;
            try {
              events.push(JSON.parse(dataMatch[1]));
            } catch {
              // skip unparseable events
            }
          }
        });
        resolve({
          events,
          close: () => req.destroy(),
          waitForEvent: (type, timeoutMs = 15000) =>
            new Promise((resolveEvent, rejectEvent) => {
              const timer = setTimeout(
                () => rejectEvent(new Error(`Timeout waiting for ${type}`)),
                timeoutMs,
              );
              const check = () => {
                const idx = events.findIndex((e) => e.type === type);
                if (idx >= 0) {
                  clearTimeout(timer);
                  resolveEvent(events[idx]);
                } else {
                  setTimeout(check, 100);
                }
              };
              check();
            }),
          waitForEvents: (types, timeoutMs = 20000) => {
            const wf = (t) =>
              new Promise((resolveEvent, rejectEvent) => {
                const timer = setTimeout(
                  () => rejectEvent(new Error(`Timeout waiting for ${t}`)),
                  timeoutMs,
                );
                const check = () => {
                  const idx = events.findIndex((e) => e.type === t);
                  if (idx >= 0) {
                    clearTimeout(timer);
                    resolveEvent(events[idx]);
                  } else {
                    setTimeout(check, 100);
                  }
                };
                check();
              });
            return Promise.all(types.map(wf));
          },
        });
      },
    );
    req.on('error', reject);
  });
}

async function waitForHealth(maxRetries = 30) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const res = await fetchJson(`${BASE}/health`);
      if (res.status === 200 && res.body?.ok) return res.body;
    } catch {
      // server not ready yet
    }
    await sleep(500);
  }
  throw new Error('Server did not become healthy in time');
}

async function run() {
  console.log('[e2e] Starting local runtime...');
  const serverProc = spawn('node', [SERVER_SCRIPT], {
    env: { ...process.env, LOCAL_RUNTIME_PORT: String(PORT) },
    stdio: 'pipe',
  });
  serverProc.stdout.on('data', (d) => process.stdout.write(`  [server] ${d}`));
  serverProc.stderr.on('data', (d) => process.stderr.write(`  [server:err] ${d}`));

  const errors = [];
  try {
    console.log('[e2e] Waiting for /health...');
    const health = await waitForHealth();
    console.log(`[e2e] Server healthy. buildId=${health.buildId}, pid=${health.pid}`);

    console.log('[e2e] Connecting SSE...');
    const sse = await connectSse(`${BASE}/events`);

    console.log('[e2e] Creating mission...');
    const missionRes = await fetchJson(`${BASE}/missions`, {
      method: 'POST',
      body: JSON.stringify({ goal: 'E2E 端到端闭环测试', constraintsText: '端到端验证' }),
    });
    if (missionRes.status !== 200) {
      throw new Error(`Mission creation failed: ${JSON.stringify(missionRes.body)}`);
    }
    console.log(`[e2e] Mission created: ${missionRes.body.missionId}, provider=${missionRes.body.planner?.provider}`);

    // Wait for approval event from the builder task
    console.log('[e2e] Waiting for approval_requested event...');
    const approvalEvent = await sse.waitForEvent('runtime.approval_requested', 20000);
    console.log(`[e2e] Got approval: ${approvalEvent.payload.approvalId}`);

    const approvalId = approvalEvent.payload.approvalId;
    console.log(`[e2e] Resolving approval ${approvalId}...`);
    const resolveRes = await fetchJson(`${BASE}/approvals/${encodeURIComponent(approvalId)}/resolve`, {
      method: 'POST',
      body: JSON.stringify({ resolution: 'approved', note: 'E2E 自动批准' }),
    });
    if (resolveRes.status !== 200) {
      throw new Error(`Approval resolve failed: ${JSON.stringify(resolveRes.body)}`);
    }
    console.log('[e2e] Approval resolved');

    console.log('[e2e] Waiting for approval_resolved and tool_called events...');
    await sse.waitForEvents(['runtime.approval_resolved', 'runtime.tool_called'], 20000);

    // Wait for mission_completed
    console.log('[e2e] Waiting for mission_completed...');
    const completed = await sse.waitForEvent('runtime.mission_completed', 30000);
    console.log(`[e2e] Mission completed: ${completed.payload.summary}`);

    // Verify event types received
    const eventTypes = [...new Set(sse.events.map((e) => e.type))];
    const requiredTypes = [
      'runtime.approval_requested',
      'runtime.approval_resolved',
      'runtime.tool_called',
      'runtime.task_created',
      'runtime.task_assigned',
      'runtime.task_started',
      'runtime.task_completed',
      'runtime.artifact_created',
      'runtime.mission_completed',
    ];
    const missingTypes = requiredTypes.filter((t) => !eventTypes.includes(t));

    console.log('\n[e2e] ====== VERIFICATION ======');
    console.log(`[e2e] Total events received: ${sse.events.length}`);
    console.log(`[e2e] Event types: ${eventTypes.join(', ')}`);

    const missionEvents = sse.events.filter((e) => e.missionId === missionRes.body.missionId);
    const completedTasks = missionEvents.filter((e) => e.type === 'runtime.task_completed');
    const artifacts = missionEvents.filter((e) => e.type === 'runtime.artifact_created');

    console.log(`[e2e] Completed tasks: ${completedTasks.length}`);
    console.log(`[e2e] Artifacts created: ${artifacts.length}`);

    if (missingTypes.length > 0) {
      console.log(`[e2e] MISSING event types: ${missingTypes.join(', ')}`);
      errors.push(`Missing events: ${missingTypes.join(', ')}`);
    } else {
      console.log('[e2e] All required event types received');
    }

    if (completedTasks.length < 3) {
      errors.push(`Expected at least 3 completed tasks, got ${completedTasks.length}`);
    }

    // Check for runtime.adapter_error (should NOT appear — regression check)
    const adapterErrors = missionEvents.filter((e) => e.type === 'runtime.adapter_error');
    if (adapterErrors.length > 0) {
      errors.push(`Found ${adapterErrors.length} adapter_error events (should use mission_completed instead)`);
    }

    if (errors.length === 0) {
      console.log('[e2e] PASS — end-to-end flow verified');
    } else {
      console.log(`[e2e] FAIL — ${errors.join('; ')}`);
    }

    sse.close();
    serverProc.kill();
    process.exit(errors.length === 0 ? 0 : 1);
  } catch (error) {
    console.error(`[e2e] FATAL: ${error.message}`);
    serverProc.kill();
    process.exit(1);
  }
}

run();
