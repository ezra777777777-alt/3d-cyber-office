import http from 'node:http';
import { readRuntimeEnv, redactEnvForHealth } from './env.mjs';
import { planMission } from './modelPlanner.mjs';
import { createApprovalQueue } from './approvalQueue.mjs';
import { createToolRegistry } from './toolRegistry.mjs';
import { createMissionEngine } from './missionEngine.mjs';
import { createRuntimeIdentity } from './runtimeIdentity.mjs';

const HOST = '127.0.0.1';
const PORT = Number(process.env.LOCAL_RUNTIME_PORT || 8765);
const PROTOCOL = 'openclaw-local';
const VERSION = '0.1.0';
const startedAt = new Date().toISOString();
const runtimeEnv = readRuntimeEnv(process.env);
const runtimeIdentity = createRuntimeIdentity({ startedAt });

/** @type {Set<http.ServerResponse>} */
const clients = new Set();
const approvalQueue = createApprovalQueue();
const tools = createToolRegistry({ workspaceRoot: process.cwd() });

function now() {
  return new Date().toISOString();
}

function json(res, status, body) {
  const text = JSON.stringify(body);
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'access-control-allow-origin': '*',
    'access-control-allow-methods': 'GET,POST,OPTIONS',
    'access-control-allow-headers': 'content-type',
  });
  res.end(text);
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 1024 * 1024) {
        reject(new Error('Request body too large'));
        req.destroy();
      }
    });
    req.on('end', () => {
      if (!body.trim()) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new Error('Invalid JSON'));
      }
    });
    req.on('error', reject);
  });
}

function sendSse(res, message) {
  res.write('event: runtime-message\n');
  res.write(`data: ${JSON.stringify(message)}\n\n`);
}

function broadcast(type, partial) {
  const message = {
    runtimeEventId: partial.runtimeEventId,
    protocol: PROTOCOL,
    version: VERSION,
    type,
    occurredAt: partial.occurredAt || now(),
    workerId: partial.workerId ?? null,
    taskId: partial.taskId ?? null,
    missionId: partial.missionId ?? null,
    payload: partial.payload || {},
  };

  for (const client of clients) sendSse(client, message);
  return message;
}

function emitApprovalRequest(approval) {
  broadcast('runtime.approval_requested', {
    runtimeEventId: `rt-${approval.approvalId}-requested`,
    missionId: approval.missionId,
    taskId: approval.officeTaskId,
    workerId: approval.workerId,
    payload: {
      approvalId: approval.approvalId,
      missionTaskId: approval.taskId,
      action: approval.toolName,
      reason: approval.reason,
      target: approval.target,
      impact: approval.impact,
      risk: approval.risk,
    },
  });
}

const missionEngine = createMissionEngine({
  workspaceRoot: process.cwd(),
  emit: broadcast,
});

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    json(res, 204, {});
    return;
  }

  const url = new URL(req.url || '/', `http://${HOST}:${PORT}`);

  if (req.method === 'GET' && url.pathname === '/health') {
    json(res, 200, {
      ok: true,
      protocol: PROTOCOL,
      version: VERSION,
      ...runtimeIdentity,
      connectedClients: clients.size,
      planner: redactEnvForHealth(runtimeEnv),
      activeMissionCount: missionEngine.listMissions().length,
    });
    return;
  }

  if (req.method === 'GET' && url.pathname === '/events') {
    res.writeHead(200, {
      'content-type': 'text/event-stream; charset=utf-8',
      'cache-control': 'no-cache',
      connection: 'keep-alive',
      'access-control-allow-origin': '*',
    });
    clients.add(res);
    sendSse(res, {
      runtimeEventId: `rt-heartbeat-${Date.now()}`,
      protocol: PROTOCOL,
      version: VERSION,
      type: 'runtime.heartbeat',
      occurredAt: now(),
      workerId: null,
      taskId: null,
      missionId: null,
      payload: { status: 'connected', runtimeId: 'local-runtime-dev' },
    });
    req.on('close', () => clients.delete(res));
    return;
  }

  if (req.method === 'POST' && url.pathname === '/missions') {
    try {
      const body = await readJson(req);
      const goal =
        typeof body.goal === 'string' && body.goal.trim() ? body.goal.trim() : '整理当前项目实用性';
      const missionId = `mission-local-${Date.now()}`;
      const response = await planMission({
        missionId,
        goal,
        materialNote: typeof body.materialNote === 'string' ? body.materialNote : '',
        constraintsText: typeof body.constraintsText === 'string' ? body.constraintsText : '',
        env: runtimeEnv,
      });
      json(res, 200, response);
      broadcast('runtime.task_progress', {
        runtimeEventId: `rt-${missionId}-planner`,
        missionId,
        taskId: null,
        workerId: 'worker-commander',
        payload: {
          message: `Planner mode: ${response.planner?.mode || 'unknown'}`,
          planner: response.planner,
        },
      });
      missionEngine.startMission(response).catch((error) => {
        broadcast('runtime.task_failed', {
          runtimeEventId: `rt-${missionId}-engine-failed`,
          missionId,
          taskId: null,
          workerId: 'worker-commander',
          payload: {
            errorSummary: error instanceof Error ? error.message : 'Mission engine failed',
          },
        });
      });
    } catch (error) {
      json(res, 400, { ok: false, error: error instanceof Error ? error.message : 'Bad request' });
    }
    return;
  }

  const missionMatch = url.pathname.match(/^\/missions\/([^/]+)$/);
  if (req.method === 'GET' && missionMatch) {
    const mid = decodeURIComponent(missionMatch[1]);
    const mission = missionEngine.getMission(mid);
    if (!mission) {
      json(res, 404, { ok: false, error: 'Mission not found' });
      return;
    }
    json(res, 200, { ok: true, mission });
    return;
  }

  if (req.method === 'POST' && url.pathname === '/tools/request') {
    try {
      const body = await readJson(req);
      const toolName = String(body.toolName || '');
      const missionId = String(body.missionId || '');
      const taskId = String(body.taskId || '');
      const officeTaskId = String(body.officeTaskId || `runtime-${missionId}-${taskId}`);
      const workerId = String(body.workerId || 'worker-builder');
      const input = body.input && typeof body.input === 'object' ? body.input : {};

      if (tools.policy.isApprovalRequired(toolName)) {
        const approval = approvalQueue.requestApproval({
          missionId,
          taskId,
          officeTaskId,
          workerId,
          toolName,
          target: String(input.path || input.command || input.title || toolName),
          reason: String(body.reason || 'Runtime worker requested a high-risk tool.'),
          impact: String(body.impact || 'This action may change workspace state.'),
          risk: tools.policy.classifyToolRisk(toolName),
          action: { toolName, input, missionId, taskId, officeTaskId, workerId },
        });
        emitApprovalRequest(approval);
        json(res, 202, { ok: true, approvalId: approval.approvalId, status: 'pending' });
        return;
      }

      const result = await tools.executeApproved({
        toolName,
        input,
        missionId,
        taskId,
        officeTaskId,
        workerId,
      });
      broadcast('runtime.tool_called', {
        runtimeEventId: `rt-${missionId}-${taskId}-${Date.now()}-tool`,
        missionId,
        taskId: officeTaskId,
        workerId,
        payload: { tool: toolName, resultSummary: 'Tool executed successfully.' },
      });
      json(res, 200, { ok: true, result });
    } catch (error) {
      json(res, 400, {
        ok: false,
        error: error instanceof Error ? error.message : 'Tool request failed',
      });
    }
    return;
  }

  const approvalMatch = url.pathname.match(/^\/approvals\/([^/]+)\/resolve$/);
  if (req.method === 'POST' && approvalMatch) {
    const approvalId = decodeURIComponent(approvalMatch[1]);
    const body = await readJson(req).catch(() => ({}));
    const resolution = body.resolution === 'rejected' ? 'rejected' : 'approved';
    const note = typeof body.note === 'string' ? body.note : `Local runtime approval ${resolution}`;

    const missionApproval = await missionEngine.resolveApproval(approvalId, resolution, note);
    if (missionApproval.ok) {
      json(res, 200, { ok: true, approvalId, resolution });
      return;
    }

    const queued = approvalQueue.resolveApproval(approvalId, resolution);
    if (queued.approval) {
      broadcast('runtime.approval_resolved', {
        runtimeEventId: `rt-${approvalId}-resolved`,
        missionId: queued.approval.missionId,
        taskId: queued.approval.officeTaskId,
        workerId: queued.approval.workerId,
        payload: { approvalId, resolution, note },
      });

      if (queued.action) {
        try {
          const result = await tools.executeApproved(queued.action);
          broadcast('runtime.tool_called', {
            runtimeEventId: `rt-${approvalId}-tool-called`,
            missionId: queued.action.missionId,
            taskId: queued.action.officeTaskId,
            workerId: queued.action.workerId,
            payload: { tool: queued.action.toolName, resultSummary: 'Approved tool executed.', result },
          });
        } catch (error) {
          broadcast('runtime.task_failed', {
            runtimeEventId: `rt-${approvalId}-tool-failed`,
            missionId: queued.action.missionId,
            taskId: queued.action.officeTaskId,
            workerId: queued.action.workerId,
            payload: { errorSummary: error instanceof Error ? error.message : 'Approved tool failed' },
          });
        }
      }
      json(res, 200, { ok: true, approvalId, resolution });
      return;
    }

    json(res, 404, { ok: false, error: 'Approval not found' });
    return;
  }

  json(res, 404, { ok: false, error: 'Not found' });
});

server.listen(PORT, HOST, () => {
  console.log(`[local-runtime] listening on http://${HOST}:${PORT}`);
});
