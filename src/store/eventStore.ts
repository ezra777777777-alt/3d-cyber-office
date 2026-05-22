import { create } from 'zustand';
import type { OfficeEvent } from '@/core/types';

interface EventState {
  events: OfficeEvent[];
  addEvent: (event: OfficeEvent) => void;
  getRecentEvents: (limit?: number) => OfficeEvent[];
  getEventsByTask: (taskId: string) => OfficeEvent[];
  getEventsByAgent: (agentId: string) => OfficeEvent[];
  clear: () => void;
}

export const useEventStore = create<EventState>((set, get) => ({
  events: [],

  addEvent: (event) =>
    set((s) => ({ events: [...s.events, event].slice(-200) })),

  getRecentEvents: (limit = 20) => {
    const all = get().events;
    return all.slice(-limit).reverse();
  },

  getEventsByTask: (taskId) =>
    get().events.filter((e) => e.taskId === taskId),

  getEventsByAgent: (agentId) =>
    get().events.filter((e) => e.agentId === agentId),

  clear: () => set({ events: [] }),
}));
