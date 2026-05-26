#!/usr/bin/env node
import { spawn } from 'node:child_process';
import http from 'node:http';
import { createPreviewCommand, createPreviewSpawnOptions, stopPreviewChildren } from './releaseSmoke.mjs';

const host = process.env.PREVIEW_HOST || '127.0.0.1';
const previewPort = Number(process.env.PREVIEW_PORT || 4173);
const runtimePort = Number(process.env.RUNTIME_PORT || 8765);
const children = [];

function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function requestText(url) {
  return new Promise((resolve, reject) => {
    const req = http.get(url, (res) => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => resolve({ statusCode: res.statusCode, body }));
    });
    req.on('error', reject);
    req.setTimeout(3000, () => {
      req.destroy(new Error(`Timeout probing ${url}`));
    });
  });
}

function spawnLogged(name, command, args) {
  const child = spawn(command, args, {
    ...createPreviewSpawnOptions(),
  });
  child.stdout.on('data', (data) => process.stdout.write(`[${name}] ${data}`));
  child.stderr.on('data', (data) => process.stderr.write(`[${name}] ${data}`));
  children.push(child);
  return child;
}

async function stopChildren() {
  await stopPreviewChildren(children, { previewPort });
}

async function waitForHtml(url) {
  let lastError = null;
  for (let attempt = 0; attempt < 30; attempt += 1) {
    try {
      const response = await requestText(url);
      if (response.statusCode === 200 && response.body.includes('<div id="root">')) {
        return response;
      }
      lastError = new Error(`Unexpected response ${response.statusCode}`);
    } catch (error) {
      lastError = error;
    }
    await wait(400);
  }
  throw lastError || new Error(`Preview did not respond at ${url}`);
}

try {
  console.log('[release:smoke] starting Vite preview');
  const previewCommand = createPreviewCommand({ host, port: previewPort });
  spawnLogged('preview', previewCommand.command, previewCommand.args);
  const previewUrl = `http://${host}:${previewPort}`;
  await waitForHtml(previewUrl);
  console.log(`[release:smoke] preview OK: ${previewUrl}`);

  try {
    const runtime = await requestText(`http://${host}:${runtimePort}/health`);
    if (runtime.statusCode === 200 && runtime.body.includes('openclaw-local')) {
      console.log(`[release:smoke] runtime health OK: http://${host}:${runtimePort}/health`);
    } else {
      console.log(`[release:smoke] runtime health skipped or non-OK: ${runtime.statusCode}`);
    }
  } catch {
    console.log('[release:smoke] runtime health skipped because runtime is not running');
  }
} finally {
  await stopChildren();
}
