import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
  selectedAgentId: string | null;
  selectedTaskId: string | null;
  activeModule: string;
  demoRunning: boolean;
  demoPaused: boolean;
  cameraFocus: [number, number, number] | null;

  selectAgent: (id: string | null) => void;
  selectTask: (id: string | null) => void;
  setActiveModule: (module: string) => void;
  setDemoRunning: (running: boolean) => void;
  setDemoPaused: (paused: boolean) => void;
  setCameraFocus: (pos: [number, number, number] | null) => void;
  clearSelection: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      selectedAgentId: null,
      selectedTaskId: null,
      activeModule: 'office',
      demoRunning: false,
      demoPaused: false,
      cameraFocus: null,

      selectAgent: (id) =>
        set({ selectedAgentId: id, selectedTaskId: null }),
      selectTask: (id) =>
        set({ selectedTaskId: id, selectedAgentId: null }),
      setActiveModule: (module) => set({ activeModule: module }),
      setDemoRunning: (running) => set({ demoRunning: running }),
      setDemoPaused: (paused) => set({ demoPaused: paused }),
      setCameraFocus: (pos) => set({ cameraFocus: pos }),
      clearSelection: () =>
        set({ selectedAgentId: null, selectedTaskId: null, cameraFocus: null }),
    }),
    {
      name: 'cyber-office-ui',
      partialize: (state) => ({
        activeModule: state.activeModule,
      }),
    },
  ),
);
