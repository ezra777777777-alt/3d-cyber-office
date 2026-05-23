import { dispatch } from '@/core/event-bus';
import { normalizeWorkerEvent } from './commanderAdapterTesting';
import type {
  CommanderGoalInput,
  CommanderPlannerAdapter,
  PlannedMissionTask,
  WorkerExecutionAdapter,
} from './commanderAdapterTypes';

let activeWorkerAdapter: WorkerExecutionAdapter | null = null;

export function setActiveWorkerAdapter(adapter: WorkerExecutionAdapter | null) {
  activeWorkerAdapter = adapter;
}

export function getActiveWorkerAdapter(): WorkerExecutionAdapter | null {
  return activeWorkerAdapter;
}

export async function planMissionWithAdapter(
  adapter: CommanderPlannerAdapter,
  input: CommanderGoalInput,
) {
  const result = await adapter.plan(input);
  return result;
}

export async function startWorkerExecutionWithAdapter(
  adapter: WorkerExecutionAdapter,
  missionId: string,
  tasks: PlannedMissionTask[],
) {
  const events = await adapter.startMission(missionId, tasks);
  for (const event of events) dispatch(normalizeWorkerEvent(event));
  return events;
}

export async function approveToolRequestWithAdapter(
  adapter: WorkerExecutionAdapter,
  requestId: string,
) {
  const events = await adapter.approveToolRequest(requestId);
  for (const event of events) dispatch(normalizeWorkerEvent(event));
  return events;
}

export async function rejectToolRequestWithAdapter(
  adapter: WorkerExecutionAdapter,
  requestId: string,
  reason: string,
) {
  const events = await adapter.rejectToolRequest(requestId, reason);
  for (const event of events) dispatch(normalizeWorkerEvent(event));
  return events;
}
