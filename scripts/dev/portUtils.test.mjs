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
