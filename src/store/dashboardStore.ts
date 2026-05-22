import { create } from 'zustand';
import type { CalendarItem } from '@/core/types';
import { demoSchedule } from '@/data/demoSchedules';

const STORAGE_KEY = 'cyber-office-dashboard';

function loadFromStorage(): CalendarItem[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
  } catch { /* ignore */ }
  return null;
}

function saveToStorage(items: CalendarItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch { /* quota exceeded — skip */ }
}

function initItems(): CalendarItem[] {
  const stored = loadFromStorage();
  if (stored) return stored;
  return demoSchedule.map((i) => ({
    ...i,
    stages: i.stages?.map((s) => ({ ...s })),
  }));
}

interface DashboardState {
  calendarItems: CalendarItem[];

  getCalendarItems: () => CalendarItem[];
  toggleStage: (itemId: string, stageIdx: number) => void;
  markComplete: (itemId: string) => void;
  resetCalendar: () => void;
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
  calendarItems: initItems(),

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
      saveToStorage(items);
      return { calendarItems: items };
    });
  },

  markComplete: (itemId) => {
    set((s) => {
      const items = s.calendarItems.map((item) => {
        if (item.id !== itemId) return item;
        // Also mark all stages as done
        const stages = (item.stages || []).map((st) => ({ ...st, done: true }));
        return {
          ...item,
          completed: true,
          progress: 1,
          stages: stages.length > 0 ? stages : item.stages,
        };
      });
      saveToStorage(items);
      return { calendarItems: items };
    });
  },

  resetCalendar: () => {
    const fresh = demoSchedule.map((i) => ({
      ...i,
      stages: i.stages?.map((s) => ({ ...s })),
    }));
    saveToStorage(fresh);
    set({ calendarItems: fresh });
  },
}));

// Also persist whenever items change (belt-and-suspenders with individual action saves)
useDashboardStore.subscribe((state) => {
  saveToStorage(state.calendarItems);
});
