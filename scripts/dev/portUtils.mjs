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
