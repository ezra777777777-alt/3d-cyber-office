import { create } from 'zustand';
import type { Agent, Task, Desk } from '@/core/types';
import type { EventHandler } from '@/core/event-bus';
import { defaultAgents, defaultDesks } from '@/data/defaultLayout';

const STORAGE_KEY = 'cyber-office-data';

interface OfficeState {
  agents: Map<string, Agent>;
  tasks: Map<string, Task>;
  desks: Desk[];

  // Agent actions
  getAgent: (id: string) => Agent | undefined;
  getAllAgents: () => Agent[];
  upsertAgent: (agent: Agent) => void;
  removeAgent: (id: string) => void;

  // Task actions
  getTask: (id: string) => Task | undefined;
  getAllTasks: () => Task[];
  upsertTask: (task: Task) => void;
  removeTask: (id: string) => void;

  // Desk
  getDesk: (id: string) => Desk | undefined;
  getAgentsByDesk: (deskId: string) => Agent[];

  // Event handler
  handleEvent: EventHandler;

  // Reset
  reset: () => void;

  // Persistence
  loadFromStorage: () => void;
}

function initAgents() {
  const m = new Map<string, Agent>();
  for (const a of defaultAgents) m.set(a.id, { ...a });
  return m;
}

function serializeState(agents: Map<string, Agent>, tasks: Map<string, Task>): string {
  return JSON.stringify({
    agents: Array.from(agents.entries()),
    tasks: Array.from(tasks.entries()),
  });
}

function deserializeState(raw: string): { agents: Map<string, Agent>; tasks: Map<string, Task> } | null {
  try {
    const data = JSON.parse(raw);
    return {
      agents: new Map(data.agents),
      tasks: new Map(data.tasks),
    };
  } catch {
    return null;
  }
}

export const useOfficeStore = create<OfficeState>((set, get) => ({
  agents: (() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = deserializeState(raw);
        if (parsed) return parsed.agents;
      }
    } catch { /* ignore */ }
    return initAgents();
  })(),
  tasks: (() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = deserializeState(raw);
        if (parsed) return parsed.tasks;
      }
    } catch { /* ignore */ }
    return new Map<string, Task>();
  })(),
  desks: defaultDesks,

  getAgent: (id) => get().agents.get(id),
  getAllAgents: () => Array.from(get().agents.values()),
  upsertAgent: (agent) =>
    set((s) => {
      const next = new Map(s.agents);
      next.set(agent.id, agent);
      return { agents: next };
    }),
  removeAgent: (id) =>
    set((s) => {
      const next = new Map(s.agents);
      next.delete(id);
      return { agents: next };
    }),

  getTask: (id) => get().tasks.get(id),
  getAllTasks: () => Array.from(get().tasks.values()),
  upsertTask: (task) =>
    set((s) => {
      const next = new Map(s.tasks);
      next.set(task.id, task);
      return { tasks: next };
    }),
  removeTask: (id) =>
    set((s) => {
      const next = new Map(s.tasks);
      next.delete(id);
      return { tasks: next };
    }),

  getDesk: (id) => get().desks.find((d) => d.id === id),
  getAgentsByDesk: (deskId) => Array.from(get().agents.values()).filter((a) => a.deskId === deskId),

  handleEvent: (_event) => {
    // Processed by AppShell's event bus subscriber
  },

  reset: () => set({ agents: initAgents(), tasks: new Map() }),

  loadFromStorage: () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = deserializeState(raw);
        if (parsed) set({ agents: parsed.agents, tasks: parsed.tasks });
      }
    } catch { /* ignore */ }
  },
}));

// Auto-persist on every state change
useOfficeStore.subscribe((state) => {
  try {
    localStorage.setItem(STORAGE_KEY, serializeState(state.agents, state.tasks));
  } catch { /* quota exceeded or similar — silently skip */ }
});
