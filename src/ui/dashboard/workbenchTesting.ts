import type { CalendarItem, CronJob, FileRecord, ReviewCard, WorkbenchTask } from '@/core/types';

export interface CalendarDayColumn {
  date: string;
  items: CalendarItem[];
}

export interface FileTreeNode {
  id: string;
  name: string;
  kind: 'folder' | 'file';
  fileId?: string;
  children: FileTreeNode[];
}

export type EventRowLevel = 'info' | 'warn' | 'error' | 'success';

export interface EventRowSearchItem {
  id: string;
  type: string;
  message: string;
  level: EventRowLevel;
  taskId?: string | null;
  agentId?: string | null;
  artifactId?: string | null;
  source?: string | null;
}

export function getWeekColumns(items: CalendarItem[], weekStartDate: string): CalendarDayColumn[] {
  const [year, month, day] = weekStartDate.split('-').map(Number);
  const start = new Date(Date.UTC(year, month - 1, day));
  return Array.from({ length: 7 }, (_, index) => {
    const next = new Date(start);
    next.setUTCDate(start.getUTCDate() + index);
    const date = next.toISOString().slice(0, 10);
    return { date, items: items.filter((item) => item.date === date) };
  });
}

export function shiftWeekStart(weekStartDate: string, weeks: number): string {
  const [year, month, day] = weekStartDate.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + weeks * 7);
  return date.toISOString().slice(0, 10);
}

export function filterWorkbenchTasks(
  tasks: WorkbenchTask[],
  status: WorkbenchTask['status'] | 'all',
  source: WorkbenchTask['source'] | 'all',
): WorkbenchTask[] {
  return tasks.filter((task) => (status === 'all' || task.status === status) && (source === 'all' || task.source === source));
}

export function sortCronJobsByNextRun(jobs: CronJob[]): CronJob[] {
  return [...jobs].sort((a, b) => new Date(a.nextRun).getTime() - new Date(b.nextRun).getTime());
}

export function filterCronJobs(
  jobs: CronJob[],
  result: CronJob['lastResult'] | 'all',
): CronJob[] {
  return sortCronJobsByNextRun(jobs).filter((job) => result === 'all' || job.lastResult === result);
}

export function buildFileTree(files: FileRecord[]): FileTreeNode[] {
  const root: FileTreeNode = { id: 'workspace', name: 'workspace', kind: 'folder', children: [] };

  for (const file of files) {
    const segments = file.path.split('/').filter(Boolean);
    let cursor = root;

    for (const segment of segments) {
      let next = cursor.children.find((child) => child.kind === 'folder' && child.name === segment);
      if (!next) {
        next = { id: `${cursor.id}/${segment}`, name: segment, kind: 'folder', children: [] };
        cursor.children.push(next);
      }
      cursor = next;
    }

    cursor.children.push({ id: file.id, name: file.name, kind: 'file', fileId: file.id, children: [] });
  }

  return [root];
}

export function findFileRecord(files: FileRecord[], fileId: string | null): FileRecord | undefined {
  return files.find((file) => file.id === fileId);
}

export function filterEventRows(
  rows: EventRowSearchItem[],
  query: string,
  level: EventRowLevel | 'all',
): EventRowSearchItem[] {
  const normalized = query.trim().toLowerCase();
  return rows.filter((row) => {
    const matchesLevel = level === 'all' || row.level === level;
    const matchesQuery = !normalized || `${row.type} ${row.message}`.toLowerCase().includes(normalized);
    return matchesLevel && matchesQuery;
  });
}

export function getLatestReview(reviews: ReviewCard[]): ReviewCard | undefined {
  return [...reviews].sort((a, b) => b.date.localeCompare(a.date))[0];
}

export function runtimeEventToWorkbenchTaskStatus(type: string): WorkbenchTask['status'] | null {
  if (type === 'task.started' || type === 'task.progress' || type === 'task.assigned') return 'running';
  if (type === 'task.completed') return 'completed';
  if (type === 'task.failed' || type === 'task.blocked' || type === 'approval.requested') return 'blocked';
  if (type === 'task.created' || type === 'task.planned' || type === 'task.queued') return 'todo';
  return null;
}
