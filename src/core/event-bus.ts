import type { OfficeEvent, EventType } from './types';

type EventMeta = Pick<OfficeEvent, 'source' | 'missionId' | 'approvalId' | 'artifactId'>;

let eventCounter = 0;

export function createEvent(
  type: EventType,
  taskId: string | null,
  agentId: string | null,
  payload: Record<string, unknown> = {},
  meta: EventMeta = {},
): OfficeEvent {
  eventCounter += 1;
  return {
    id: `event-${String(eventCounter).padStart(4, '0')}`,
    type,
    occurredAt: new Date().toISOString(),
    source: meta.source,
    missionId: meta.missionId,
    taskId,
    agentId,
    approvalId: meta.approvalId,
    artifactId: meta.artifactId,
    payload,
  };
}

export function validateEvent(event: OfficeEvent): { valid: boolean; error?: string } {
  if (!event.id) return { valid: false, error: 'Missing event id' };
  if (!event.type) return { valid: false, error: 'Missing event type' };
  if (!event.occurredAt) return { valid: false, error: 'Missing occurredAt' };
  return { valid: true };
}

export type EventHandler = (event: OfficeEvent) => void;

const handlers: EventHandler[] = [];
const seenRuntimeEventIds = new Set<string>();

export function subscribe(handler: EventHandler): () => void {
  handlers.push(handler);
  return () => {
    const idx = handlers.indexOf(handler);
    if (idx >= 0) handlers.splice(idx, 1);
  };
}

export function dispatch(event: OfficeEvent): void {
  const { valid, error } = validateEvent(event);
  if (!valid) {
    console.warn('[EventBus] Invalid event:', error, event);
    return;
  }

  if (event.runtimeEventId) {
    if (seenRuntimeEventIds.has(event.runtimeEventId)) return;
    seenRuntimeEventIds.add(event.runtimeEventId);
  }

  for (const handler of handlers) {
    try {
      handler(event);
    } catch (err) {
      console.error('[EventBus] Handler error:', err);
    }
  }
}

export function resetEventCounter(): void {
  eventCounter = 0;
  seenRuntimeEventIds.clear();
  dispatch(createEvent('office.demo_reset', null, null, {}));
}
