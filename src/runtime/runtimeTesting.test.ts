import { describe, expect, it } from 'vitest';
import type { RuntimeRawMessage } from './runtimeTypes';
import { normalizeRuntimeEvent } from './normalizeRuntimeEvent';
import { detectProtocolCompatibility, redactRuntimePayload, dedupeRuntimeMessages, sortRuntimeMessages } from './runtimeTesting';

const baseMessage: RuntimeRawMessage = {
  runtimeEventId: 'rt-001',
  protocol: 'openclaw',
  version: '0.4.0',
  type: 'runtime.task_started',
  occurredAt: '2026-05-23T01:00:00.000Z',
  workerId: 'agent-coder',
  taskId: 'runtime-task-1',
  missionId: 'mission-runtime-demo',
  payload: {
    title: 'Build runtime adapter',
    token: 'secret-token-value',
  },
};

describe('runtime normalization', () => {
  it('maps runtime task messages to OfficeEvent without losing provenance', () => {
    const result = normalizeRuntimeEvent(baseMessage);
    expect(result.event).toMatchObject({
      type: 'task.started',
      taskId: 'runtime-task-1',
      agentId: 'agent-coder',
      source: 'runtime',
      runtimeEventId: 'rt-001',
      missionId: 'mission-runtime-demo',
    });
  });

  it('redacts secret-looking payload keys before diagnostics display', () => {
    expect(redactRuntimePayload(baseMessage.payload)).toEqual({
      title: 'Build runtime adapter',
      token: '[redacted]',
    });
  });

  it('flags protocol mismatch instead of pretending to connect', () => {
    expect(detectProtocolCompatibility('openclaw', '0.3.0')).toMatchObject({
      ok: false,
      diagnosticKind: 'protocol_mismatch',
    });
  });

  it('accepts compatible protocol version', () => {
    expect(detectProtocolCompatibility('openclaw', '0.4.2')).toMatchObject({
      ok: true,
      diagnosticKind: 'healthy',
    });
  });
});

describe('runtime message ordering', () => {
  it('dedupes repeated runtime event ids', () => {
    const duplicate = { ...baseMessage, occurredAt: '2026-05-23T01:00:01.000Z' };
    expect(dedupeRuntimeMessages([baseMessage, duplicate]).map((m) => m.runtimeEventId)).toEqual(['rt-001']);
  });

  it('sorts runtime messages by occurredAt before replay', () => {
    const later = { ...baseMessage, runtimeEventId: 'rt-002', occurredAt: '2026-05-23T01:00:02.000Z' };
    const earlier = { ...baseMessage, runtimeEventId: 'rt-000', occurredAt: '2026-05-23T00:59:59.000Z' };
    expect(sortRuntimeMessages([later, earlier]).map((m) => m.runtimeEventId)).toEqual(['rt-000', 'rt-002']);
  });
});

describe('normalizeRuntimeEvent edge cases', () => {
  it('returns diagnostics for unknown protocol', () => {
    const msg: RuntimeRawMessage = { ...baseMessage, protocol: 'unknown', version: '1.0.0' };
    const result = normalizeRuntimeEvent(msg);
    expect(result.diagnostics.length).toBeGreaterThan(0);
    expect(result.diagnostics[0].kind).toBe('protocol_mismatch');
  });

  it('returns null event for unmapped message type', () => {
    const msg: RuntimeRawMessage = { ...baseMessage, type: 'runtime.worker_status' as never };
    const result = normalizeRuntimeEvent(msg);
    expect(result.event).toBeNull();
    expect(result.diagnostics.some((d) => d.title === 'Unknown runtime message')).toBe(true);
  });

  it('preserves raw message in normalized result', () => {
    const result = normalizeRuntimeEvent(baseMessage);
    expect(result.raw).toBe(baseMessage);
  });
});
