import { describe, expect, it } from 'vitest';
import { demoCronJobs, demoFiles, demoSchedule, demoWorkbenchTasks } from '@/data/demoSchedules';
import {
  buildFileTree,
  filterCronJobs,
  filterEventRows,
  filterWorkbenchTasks,
  findFileRecord,
  getLatestReview,
  getWeekColumns,
  runtimeEventToWorkbenchTaskStatus,
  shiftWeekStart,
  sortCronJobsByNextRun,
} from './workbenchTesting';
import { demoReviews } from '@/data/demoSchedules';
import type { EventRowSearchItem } from './workbenchTesting';

describe('workbench helpers', () => {
  it('groups calendar items into seven week columns', () => {
    expect(getWeekColumns(demoSchedule, '2026-05-19')).toHaveLength(7);
  });

  it('filters source-aware tasks by status and source', () => {
    expect(filterWorkbenchTasks(demoWorkbenchTasks, 'blocked', 'runtime').map((task) => task.id)).toEqual([
      'wb-task-runtime-review',
    ]);
  });

  it('builds a workspace tree from file paths', () => {
    expect(buildFileTree(demoFiles)[0]).toMatchObject({ name: 'workspace', kind: 'folder' });
  });

  it('sorts cron jobs by upcoming run time', () => {
    expect(sortCronJobsByNextRun(demoCronJobs)[0]?.id).toBe('cron-2');
  });

  it('keeps completed task cards out of running filters', () => {
    expect(filterWorkbenchTasks(demoWorkbenchTasks, 'running', 'all').every((task) => task.status === 'running')).toBe(true);
  });

  it('shifts the calendar week by whole weeks', () => {
    expect(shiftWeekStart('2026-05-19', 1)).toBe('2026-05-26');
    expect(shiftWeekStart('2026-05-19', -1)).toBe('2026-05-12');
  });

  it('finds the selected file record for preview', () => {
    expect(findFileRecord(demoFiles, 'file-1')?.kind).toBe('markdown');
  });

  it('filters event rows by query and level', () => {
    const rows: EventRowSearchItem[] = [
      { id: 'evt-1', type: 'task.completed', message: 'finished spec', level: 'success' },
      { id: 'evt-2', type: 'task.blocked', message: 'approval needed', level: 'error' },
    ];
    expect(filterEventRows(rows, 'approval', 'error').map((row) => row.id)).toEqual(['evt-2']);
  });

  it('filters failing cron jobs without losing next-run ordering', () => {
    expect(filterCronJobs(demoCronJobs, 'failed').map((job) => job.lastResult)).toEqual(['failed']);
  });

  it('selects the latest review card by date', () => {
    expect(getLatestReview(demoReviews)?.id).toBe('review-1');
  });

  it('projects runtime task events into workbench task statuses', () => {
    expect(runtimeEventToWorkbenchTaskStatus('task.started')).toBe('running');
    expect(runtimeEventToWorkbenchTaskStatus('task.completed')).toBe('completed');
    expect(runtimeEventToWorkbenchTaskStatus('task.failed')).toBe('blocked');
    expect(runtimeEventToWorkbenchTaskStatus('task.created')).toBe('todo');
  });
});
