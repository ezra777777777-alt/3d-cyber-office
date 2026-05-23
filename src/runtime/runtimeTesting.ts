import type { RuntimeCompatibility, RuntimeRawMessage } from './runtimeTypes';

const SECRET_KEY_PATTERN = /token|secret|password|api[_-]?key|authorization/i;

export function redactRuntimePayload(payload: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(payload).map(([key, value]) => [key, SECRET_KEY_PATTERN.test(key) ? '[redacted]' : value]),
  );
}

export function detectProtocolCompatibility(protocol: string, version: string): RuntimeCompatibility {
  if (protocol !== 'openclaw') {
    return {
      ok: false,
      diagnosticKind: 'protocol_mismatch',
      message: `Unsupported protocol: ${protocol}`,
    };
  }

  if (!version.startsWith('0.4.')) {
    return {
      ok: false,
      diagnosticKind: 'protocol_mismatch',
      message: `Expected OpenClaw 0.4.x, received ${version}`,
    };
  }

  return {
    ok: true,
    diagnosticKind: 'healthy',
    message: 'Runtime protocol is compatible.',
  };
}

export function dedupeRuntimeMessages(messages: RuntimeRawMessage[]): RuntimeRawMessage[] {
  const seen = new Set<string>();
  return messages.filter((message) => {
    if (seen.has(message.runtimeEventId)) return false;
    seen.add(message.runtimeEventId);
    return true;
  });
}

export function sortRuntimeMessages(messages: RuntimeRawMessage[]): RuntimeRawMessage[] {
  return [...messages].sort((a, b) => a.occurredAt.localeCompare(b.occurredAt));
}
