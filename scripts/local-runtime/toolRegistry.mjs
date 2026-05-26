import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { createWorkspacePolicy } from './workspacePolicy.mjs';
import { createArtifactStore } from './artifactStore.mjs';

const MAX_READ_BYTES = 300_000;
const ALLOWLISTED_COMMANDS = new Set([
  'npm.cmd run test',
  'npx.cmd tsc --noEmit',
  'npm.cmd run build',
  'npm.cmd run runtime:test',
]);

async function listFilesRecursive(root, dir, limit, collected = []) {
  if (collected.length >= limit) return collected;
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === '.git') continue;
    const absolute = path.join(dir, entry.name);
    const relative = path.relative(root, absolute).replaceAll(path.sep, '/');
    if (entry.isDirectory()) {
      await listFilesRecursive(root, absolute, limit, collected);
    } else {
      collected.push(relative);
      if (collected.length >= limit) break;
    }
  }
  return collected;
}

function runAllowlistedCommand(command, cwd) {
  if (!ALLOWLISTED_COMMANDS.has(command)) {
    throw new Error(`Command is not allowlisted: ${command}`);
  }

  const useShell = process.platform === 'win32';
  const [file, ...args] = useShell ? [command] : command.split(' ');
  return new Promise((resolve, reject) => {
    const child = spawn(file, args, { cwd, shell: useShell, windowsHide: true });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => { stdout += chunk.toString(); });
    child.stderr.on('data', (chunk) => { stderr += chunk.toString(); });
    child.on('error', reject);
    child.on('close', (code) =>
      resolve({ code, stdout: stdout.slice(-12000), stderr: stderr.slice(-12000) }),
    );
  });
}

export function createToolRegistry(options) {
  const workspaceRoot = path.resolve(options.workspaceRoot || process.cwd());
  const policy = createWorkspacePolicy(workspaceRoot);
  const artifactStore = createArtifactStore(workspaceRoot);

  async function executeApproved(request) {
    if (request.toolName === 'workspace.list_files') {
      const base = policy.resolveInside(request.input?.path || '.');
      return {
        files: await listFilesRecursive(workspaceRoot, base, Number(request.input?.limit || 200)),
      };
    }

    if (request.toolName === 'workspace.read_file') {
      const absolute = policy.resolveInside(request.input?.path);
      const content = await readFile(absolute, 'utf8');
      if (Buffer.byteLength(content, 'utf8') > MAX_READ_BYTES)
        throw new Error('File is too large to read through runtime tool');
      return { path: request.input.path, content };
    }

    if (request.toolName === 'workspace.search_text') {
      const query = String(request.input?.query || '');
      if (!query) return { matches: [] };
      const files = await listFilesRecursive(
        workspaceRoot,
        workspaceRoot,
        Number(request.input?.limit || 300),
      );
      const matches = [];
      for (const file of files) {
        const absolute = policy.resolveInside(file);
        const content = await readFile(absolute, 'utf8').catch(() => '');
        if (content.includes(query)) matches.push({ path: file });
      }
      return { matches };
    }

    if (request.toolName === 'artifact.write') {
      return artifactStore.writeArtifact({
        missionId: request.missionId,
        taskId: request.taskId,
        title: request.input?.title || 'Runtime artifact',
        kind: request.input?.kind || 'notes',
        content: request.input?.content || '',
        summary: request.input?.summary || '',
        createdByWorkerId: request.workerId,
      });
    }

    if (request.toolName === 'workspace.write_file') {
      const absolute = policy.resolveInside(request.input?.path);
      await mkdir(path.dirname(absolute), { recursive: true });
      await writeFile(absolute, String(request.input?.content || ''), 'utf8');
      return { path: request.input.path, written: true };
    }

    if (request.toolName === 'command.run') {
      return runAllowlistedCommand(String(request.input?.command || ''), workspaceRoot);
    }

    throw new Error(`Unknown tool: ${request.toolName}`);
  }

  return {
    policy,
    executeApproved,
  };
}
