import { buildLocalRuntimeUrl } from './localRuntimeTesting';
import type { RuntimeRawMessage } from './runtimeTypes';

export interface RuntimeMissionListItem {
  missionId: string;
  title: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  taskCount: number;
  completedTaskCount: number;
  artifactCount: number;
  approvalCount: number;
}

export interface RuntimeMissionArtifact {
  artifactId: string;
  missionId: string;
  missionTaskId: string;
  title: string;
  kind: string;
  path: string;
  summary: string;
  createdByWorkerId: string;
  createdAt: string;
  workspaceBacked: boolean;
  previewable: boolean;
}

type Fetcher = (input: string) => Promise<Response>;

function friendlyError(endpoint: string, status: number, message: string) {
  return new Error(`Runtime history request failed: ${endpoint} (${status}) ${message}`);
}

async function getJson(endpoint: string, path: string, fetcher: Fetcher): Promise<Record<string, unknown>> {
  const url = buildLocalRuntimeUrl(endpoint, path);
  let response: Response;
  try {
    response = await fetcher(url);
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'network error';
    throw new Error(`Runtime history unavailable: ${url} (${detail})`);
  }
  let body: unknown = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }
  const record = body && typeof body === 'object' && !Array.isArray(body)
    ? (body as Record<string, unknown>)
    : {};
  if (!response.ok) {
    throw friendlyError(url, response.status, String(record.error ?? response.statusText ?? 'HTTP error'));
  }
  if (record.ok === false) {
    throw friendlyError(url, response.status, String(record.error ?? 'Runtime returned ok:false'));
  }
  return record;
}

export async function fetchRuntimeMissions(
  endpoint: string,
  fetcher: Fetcher = fetch,
): Promise<RuntimeMissionListItem[]> {
  const body = await getJson(endpoint, '/missions', fetcher);
  return Array.isArray(body.missions) ? (body.missions as RuntimeMissionListItem[]) : [];
}

export async function fetchRuntimeMission(
  endpoint: string,
  missionId: string,
  fetcher: Fetcher = fetch,
): Promise<unknown> {
  const body = await getJson(endpoint, `/missions/${encodeURIComponent(missionId)}`, fetcher);
  return body.mission;
}

export async function fetchRuntimeMissionEvents(
  endpoint: string,
  missionId: string,
  fetcher: Fetcher = fetch,
): Promise<RuntimeRawMessage[]> {
  const body = await getJson(endpoint, `/missions/${encodeURIComponent(missionId)}/events`, fetcher);
  return Array.isArray(body.events) ? (body.events as RuntimeRawMessage[]) : [];
}

export async function fetchRuntimeMissionArtifacts(
  endpoint: string,
  missionId: string,
  fetcher: Fetcher = fetch,
): Promise<RuntimeMissionArtifact[]> {
  const body = await getJson(endpoint, `/missions/${encodeURIComponent(missionId)}/artifacts`, fetcher);
  return Array.isArray(body.artifacts) ? (body.artifacts as RuntimeMissionArtifact[]) : [];
}

export async function fetchRuntimeArtifactContent(
  endpoint: string,
  missionId: string,
  artifactId: string,
  fetcher: Fetcher = fetch,
): Promise<{ artifact: RuntimeMissionArtifact; content: string; truncated: boolean }> {
  const body = await getJson(
    endpoint,
    `/missions/${encodeURIComponent(missionId)}/artifacts/${encodeURIComponent(artifactId)}`,
    fetcher,
  );
  return {
    artifact: body.artifact as RuntimeMissionArtifact,
    content: typeof body.content === 'string' ? body.content : '',
    truncated: Boolean(body.truncated),
  };
}
