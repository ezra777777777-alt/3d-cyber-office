import { appendFile, mkdir, readFile, readdir, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';

const MAX_STRING = 12_000;
const MAX_STREAM_TEXT = 4_000;
const MAX_ARTIFACT_BYTES = 500_000;
const SAFE_ID = /^[a-zA-Z0-9._-]+$/;
const REDACTED = '[redacted]';
const OMITTED_CONTENT = '[omitted raw content]';
const SECRET_KEY_PATTERN = /apiKey|token|secret|password|authorization|cookie|credential/i;
const RAW_CONTENT_KEYS = new Set(['content', 'fileContent', 'prompt', 'rawPrompt']);

function assertSafeId(id, label) {
  const value = String(id || '');
  if (!SAFE_ID.test(value)) throw new Error(`unsafe ${label}: ${id}`);
  return value;
}

function runtimeRoot(workspaceRoot) {
  return path.join(workspaceRoot, '.local-runtime');
}

function missionsRoot(workspaceRoot) {
  return path.join(runtimeRoot(workspaceRoot), 'missions');
}

function missionDir(workspaceRoot, missionId) {
  return path.join(missionsRoot(workspaceRoot), assertSafeId(missionId, 'mission id'));
}

async function readJson(file, fallback) {
  try {
    return JSON.parse(await readFile(file, 'utf8'));
  } catch {
    return fallback;
  }
}

async function atomicWriteJson(file, value) {
  await mkdir(path.dirname(file), { recursive: true });
  const tmp = `${file}.${process.pid}.${Date.now()}.tmp`;
  await writeFile(tmp, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
  try {
    await rename(tmp, file);
  } catch (error) {
    if (process.platform !== 'win32' || error?.code !== 'EPERM') throw error;
    await rm(file, { force: true });
    await rename(tmp, file);
  }
}

function capString(value, key) {
  const text = String(value);
  const max = key === 'stdout' || key === 'stderr' ? MAX_STREAM_TEXT : MAX_STRING;
  return text.length > max ? text.slice(-max) : text;
}

export function sanitizeJournalValue(value, key = '', depth = 0) {
  if (SECRET_KEY_PATTERN.test(key)) return REDACTED;
  if (RAW_CONTENT_KEYS.has(key)) return OMITTED_CONTENT;
  if (depth > 8) return '[max depth reached]';
  if (typeof value === 'string') return capString(value, key);
  if (typeof value === 'number' || typeof value === 'boolean' || value == null) return value;
  if (Array.isArray(value)) {
    return value.slice(0, 200).map((item) => sanitizeJournalValue(item, '', depth + 1));
  }
  if (typeof value === 'object') {
    const output = {};
    for (const [entryKey, entryValue] of Object.entries(value)) {
      output[entryKey] = sanitizeJournalValue(entryValue, entryKey, depth + 1);
    }
    return output;
  }
  return String(value);
}

function summarizeSnapshot(snapshot, now, existing = {}) {
  const tasks = Array.isArray(snapshot.tasks) ? snapshot.tasks : [];
  const artifactCount = tasks.reduce(
    (sum, task) => sum + (Array.isArray(task.artifactIds) ? task.artifactIds.length : 0),
    0,
  );
  return {
    missionId: snapshot.mission.id,
    title: snapshot.mission.title || snapshot.mission.id,
    status: snapshot.mission.status || 'unknown',
    createdAt: existing.createdAt || snapshot.mission.startedAt || now,
    updatedAt: now,
    taskCount: tasks.length,
    completedTaskCount: tasks.filter((task) => task.status === 'completed').length,
    artifactCount,
    approvalCount: existing.approvalCount || 0,
  };
}

function countApprovals(events) {
  return events.filter((event) => event.type === 'runtime.approval_requested').length;
}

function isRuntimeArtifactPath(workspaceRoot, artifactPath) {
  const artifactsDir = path.join(runtimeRoot(workspaceRoot), 'artifacts');
  const absolute = path.resolve(workspaceRoot, String(artifactPath || ''));
  const relative = path.relative(artifactsDir, absolute);
  return Boolean(relative) && !relative.startsWith('..') && !path.isAbsolute(relative);
}

export function createMissionJournal(options = {}) {
  const workspaceRoot = path.resolve(options.workspaceRoot || process.cwd());
  const now = options.now || (() => new Date().toISOString());
  const writeQueues = new Map();

  function enqueue(missionId, work) {
    const safeMissionId = assertSafeId(missionId, 'mission id');
    const previous = writeQueues.get(safeMissionId) || Promise.resolve();
    const next = previous.then(work, work);
    writeQueues.set(
      safeMissionId,
      next.catch(() => {
        // Keep the chain usable after a failed write.
      }),
    );
    return next;
  }

  async function appendEvent(message) {
    if (!message?.missionId) return;
    await enqueue(message.missionId, async () => {
      const dir = missionDir(workspaceRoot, message.missionId);
      await mkdir(dir, { recursive: true });
      const sanitized = sanitizeJournalValue(message);
      await appendFile(path.join(dir, 'events.jsonl'), `${JSON.stringify(sanitized)}\n`, 'utf8');
    });
  }

  async function readMissionEvents(missionId, { limit = 500 } = {}) {
    const safeMissionId = assertSafeId(missionId, 'mission id');
    const file = path.join(missionDir(workspaceRoot, safeMissionId), 'events.jsonl');
    const text = await readFile(file, 'utf8').catch(() => '');
    const cappedLimit = Math.max(0, Math.min(Number(limit) || 500, 1000));
    const events = [];
    for (const line of text.split(/\r?\n/)) {
      if (!line.trim()) continue;
      try {
        events.push(JSON.parse(line));
      } catch {
        // Skip malformed JSONL lines.
      }
      if (events.length >= cappedLimit) break;
    }
    return events;
  }

  async function writeMissionSnapshot(snapshot) {
    const missionId = snapshot?.mission?.id;
    await enqueue(missionId, async () => {
      const safeMissionId = assertSafeId(missionId, 'mission id');
      const dir = missionDir(workspaceRoot, safeMissionId);
      const currentTime = now();
      await atomicWriteJson(path.join(dir, 'mission.json'), sanitizeJournalValue(snapshot));

      const indexPath = path.join(missionsRoot(workspaceRoot), 'index.json');
      const index = await readJson(indexPath, []);
      const existing = Array.isArray(index)
        ? index.find((item) => item.missionId === safeMissionId) || {}
        : {};
      const events = await readMissionEvents(safeMissionId);
      const summary = {
        ...summarizeSnapshot(snapshot, currentTime, existing),
        approvalCount: countApprovals(events),
      };
      const nextIndex = [
        summary,
        ...(Array.isArray(index)
          ? index.filter((item) => item.missionId !== safeMissionId)
          : []),
      ].sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
      await atomicWriteJson(indexPath, nextIndex);
    });
  }

  async function recordArtifact(artifact) {
    const missionId = artifact?.missionId;
    await enqueue(missionId, async () => {
      const safeMissionId = assertSafeId(missionId, 'mission id');
      const file = path.join(missionDir(workspaceRoot, safeMissionId), 'artifacts.json');
      const existing = await readJson(file, []);
      const metadata = sanitizeJournalValue({
        artifactId: artifact.artifactId,
        missionId: safeMissionId,
        missionTaskId: artifact.missionTaskId || artifact.taskId || '',
        title: artifact.title || 'Runtime artifact',
        kind: artifact.kind || 'notes',
        path: artifact.path || '',
        summary: artifact.summary || '',
        createdByWorkerId: artifact.createdByWorkerId || artifact.workerId || '',
        createdAt: artifact.createdAt || now(),
        workspaceBacked: Boolean(artifact.workspaceBacked),
        previewable: artifact.previewable !== false,
      });
      const next = [
        metadata,
        ...(Array.isArray(existing)
          ? existing.filter((item) => item.artifactId !== metadata.artifactId)
          : []),
      ];
      await atomicWriteJson(file, next);
    });
  }

  async function readMission(missionId) {
    const safeMissionId = assertSafeId(missionId, 'mission id');
    return readJson(path.join(missionDir(workspaceRoot, safeMissionId), 'mission.json'), null);
  }

  async function listMissions({ limit = 50 } = {}) {
    const indexPath = path.join(missionsRoot(workspaceRoot), 'index.json');
    let index = await readJson(indexPath, null);
    if (!Array.isArray(index)) {
      const root = missionsRoot(workspaceRoot);
      const entries = await readdir(root, { withFileTypes: true }).catch(() => []);
      index = [];
      for (const entry of entries) {
        if (!entry.isDirectory() || !SAFE_ID.test(entry.name)) continue;
        const snapshot = await readMission(entry.name);
        if (!snapshot?.mission) continue;
        const events = await readMissionEvents(entry.name);
        index.push({
          ...summarizeSnapshot(snapshot, snapshot.mission.completedAt || snapshot.mission.startedAt || now()),
          approvalCount: countApprovals(events),
        });
      }
    }

    return index
      .sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)))
      .slice(0, Number(limit) || 50);
  }

  async function listMissionArtifacts(missionId) {
    const safeMissionId = assertSafeId(missionId, 'mission id');
    const file = path.join(missionDir(workspaceRoot, safeMissionId), 'artifacts.json');
    const artifacts = await readJson(file, []);
    return Array.isArray(artifacts) ? artifacts : [];
  }

  async function readArtifactContent(missionId, artifactId) {
    assertSafeId(artifactId, 'artifact id');
    const artifacts = await listMissionArtifacts(missionId);
    const artifact = artifacts.find((item) => item.artifactId === artifactId);
    if (!artifact) return null;
    if (!isRuntimeArtifactPath(workspaceRoot, artifact.path)) {
      throw new Error(`unsafe artifact path: ${artifact.path}`);
    }

    const absolute = path.resolve(workspaceRoot, artifact.path);
    const content = await readFile(absolute, 'utf8');
    const bytes = Buffer.byteLength(content, 'utf8');
    if (bytes <= MAX_ARTIFACT_BYTES) return { artifact, content, truncated: false };
    return {
      artifact,
      content: content.slice(0, MAX_ARTIFACT_BYTES),
      truncated: true,
    };
  }

  return {
    appendEvent,
    writeMissionSnapshot,
    recordArtifact,
    listMissions,
    readMission,
    readMissionEvents,
    listMissionArtifacts,
    readArtifactContent,
  };
}
