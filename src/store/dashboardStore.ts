import { create } from 'zustand';
import type { CalendarItem, WorkbenchTask } from '@/core/types';
import { demoSchedule, demoWorkbenchTasks } from '@/data/demoSchedules';

const STORAGE_KEY = 'cyber-office-dashboard';

interface DashboardPersistedState {
  calendarItems: CalendarItem[];
  workbenchTasks: WorkbenchTask[];
  selectedFileId: string | null;
  taskStatusFilter: WorkbenchTask['status'] | 'all';
  taskSourceFilter: WorkbenchTask['source'] | 'all';
  restMuted: boolean;
}

function loadFromStorage(): DashboardPersistedState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // Migrate legacy format (array of CalendarItem) to structured format
    if (Array.isArray(parsed)) {
      return {
        calendarItems: parsed,
        workbenchTasks: [],
        selectedFileId: null,
        taskStatusFilter: 'all',
        taskSourceFilter: 'all',
        restMuted: false,
      };
    }
    if (parsed && typeof parsed === 'object' && Array.isArray(parsed.calendarItems)) {
      return {
        calendarItems: parsed.calendarItems,
        workbenchTasks: Array.isArray(parsed.workbenchTasks) ? parsed.workbenchTasks : [],
        selectedFileId: parsed.selectedFileId ?? null,
        taskStatusFilter: parsed.taskStatusFilter ?? 'all',
        taskSourceFilter: parsed.taskSourceFilter ?? 'all',
        restMuted: parsed.restMuted ?? false,
      };
    }
  } catch { /* ignore */ }
  return null;
}

function saveToStorage(state: DashboardPersistedState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch { /* quota exceeded — skip */ }
}

function initCalendarItems(): CalendarItem[] {
  return demoSchedule.map((i) => ({
    ...i,
    stages: i.stages?.map((s) => ({ ...s })),
  }));
}

interface DashboardState {
  calendarItems: CalendarItem[];
  calendarWeekStart: string;
  workbenchTasks: WorkbenchTask[];
  selectedFileId: string | null;
  taskStatusFilter: WorkbenchTask['status'] | 'all';
  taskSourceFilter: WorkbenchTask['source'] | 'all';
  restMuted: boolean;

  getCalendarItems: () => CalendarItem[];
  toggleStage: (itemId: string, stageIdx: number) => void;
  markComplete: (itemId: string) => void;
  resetCalendar: () => void;
  setCalendarWeekStart: (weekStart: string) => void;
  setSelectedFile: (fileId: string | null) => void;
  setTaskStatusFilter: (filter: WorkbenchTask['status'] | 'all') => void;
  setTaskSourceFilter: (filter: WorkbenchTask['source'] | 'all') => void;
  toggleRestMuted: () => void;
  upsertRuntimeWorkbenchTask: (task: Partial<WorkbenchTask> & Pick<WorkbenchTask, 'id'>) => void;
}

function initState(): Pick<DashboardState, 'calendarItems' | 'workbenchTasks' | 'selectedFileId' | 'taskStatusFilter' | 'taskSourceFilter' | 'restMuted'> {
  const stored = loadFromStorage();
  if (stored) {
    return {
      calendarItems: stored.calendarItems,
      workbenchTasks: stored.workbenchTasks.length > 0 ? stored.workbenchTasks : demoWorkbenchTasks,
      selectedFileId: stored.selectedFileId,
      taskStatusFilter: stored.taskStatusFilter,
      taskSourceFilter: stored.taskSourceFilter,
      restMuted: stored.restMuted,
    };
  }
  return {
    calendarItems: initCalendarItems(),
    workbenchTasks: demoWorkbenchTasks,
    selectedFileId: null,
    taskStatusFilter: 'all',
    taskSourceFilter: 'all',
    restMuted: false,
  };
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
  ...initState(),
  calendarWeekStart: '2026-05-19',

  getCalendarItems: () => get().calendarItems,

  toggleStage: (itemId, stageIdx) => {
    set((s) => {
      const items = s.calendarItems.map((item) => {
        if (item.id !== itemId) return item;
        const stages = [...(item.stages || [])];
        if (stageIdx >= stages.length) return item;
        stages[stageIdx] = { ...stages[stageIdx], done: !stages[stageIdx].done };
        const doneCount = stages.filter((st) => st.done).length;
        const progress = stages.length > 0 ? doneCount / stages.length : 1;
        return {
          ...item,
          stages,
          progress,
          completed: progress >= 1,
        };
      });
      return { calendarItems: items };
    });
  },

  markComplete: (itemId) => {
    set((s) => {
      const items = s.calendarItems.map((item) => {
        if (item.id !== itemId) return item;
        const stages = (item.stages || []).map((st) => ({ ...st, done: true }));
        return {
          ...item,
          completed: true,
          progress: 1,
          stages: stages.length > 0 ? stages : item.stages,
        };
      });
      return { calendarItems: items };
    });
  },

  resetCalendar: () => {
    const fresh = demoSchedule.map((i) => ({
      ...i,
      stages: i.stages?.map((s) => ({ ...s })),
    }));
    set({ calendarItems: fresh });
  },

  setCalendarWeekStart: (weekStart) => set({ calendarWeekStart: weekStart }),

  setSelectedFile: (fileId) => set({ selectedFileId: fileId }),

  setTaskStatusFilter: (filter) => set({ taskStatusFilter: filter }),

  setTaskSourceFilter: (filter) => set({ taskSourceFilter: filter }),

  toggleRestMuted: () => set((s) => ({ restMuted: !s.restMuted })),

  upsertRuntimeWorkbenchTask: (patch) =>
    set((state) => {
      const exists = state.workbenchTasks.find((current) => current.id === patch.id);
      if (exists) {
        return {
          workbenchTasks: state.workbenchTasks.map((current) =>
            current.id === patch.id ? { ...current, ...patch } : current,
          ),
        };
      }
      // New task — title and summary are required for first creation
      return {
        workbenchTasks: [
          {
            id: patch.id,
            title: patch.title ?? `Runtime task ${patch.id}`,
            status: patch.status ?? 'todo',
            source: patch.source ?? 'runtime',
            officeTaskId: patch.officeTaskId ?? null,
            agentId: patch.agentId ?? null,
            dueLabel: patch.dueLabel ?? 'Runtime',
            priority: patch.priority ?? 'medium',
            summary: patch.summary ?? 'Projected from runtime event stream.',
          },
          ...state.workbenchTasks,
        ],
      };
    }),
}));

// Persist full workbench state whenever it changes
useDashboardStore.subscribe((state) => {
  saveToStorage({
    calendarItems: state.calendarItems,
    workbenchTasks: state.workbenchTasks,
    selectedFileId: state.selectedFileId,
    taskStatusFilter: state.taskStatusFilter,
    taskSourceFilter: state.taskSourceFilter,
    restMuted: state.restMuted,
  });
});
