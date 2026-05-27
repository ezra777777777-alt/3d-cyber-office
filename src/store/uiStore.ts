import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { GuidedCameraShot } from '@/demo/guidedDemoTypes';
import type { ModuleId } from '@/i18n/zh';

interface UIState {
  selectedAgentId: string | null;
  selectedTaskId: string | null;
  activeModule: ModuleId | string;
  demoRunning: boolean;
  demoPaused: boolean;
  cameraFocus: [number, number, number] | null;
  commanderOpen: boolean;
  selectedMissionTaskId: string | null;
  guidedDemoTitle: string | null;
  guidedDemoBody: string | null;
  guidedDemoProgress: number;
  guidedCameraShot: GuidedCameraShot | null;
  visualMode: 'low' | 'normal' | 'showcase';
  officeVisualStyle: 'current' | 'claw3d';

  selectAgent: (id: string | null) => void;
  setVisualMode: (mode: 'low' | 'normal' | 'showcase') => void;
  setOfficeVisualStyle: (style: 'current' | 'claw3d') => void;
  selectTask: (id: string | null) => void;
  setActiveModule: (module: ModuleId | string) => void;
  setDemoRunning: (running: boolean) => void;
  setDemoPaused: (paused: boolean) => void;
  setCameraFocus: (pos: [number, number, number] | null) => void;
  setCommanderOpen: (open: boolean) => void;
  selectMissionTask: (taskId: string | null) => void;
  clearSelection: () => void;
  setGuidedNarration: (title: string | null, body: string | null) => void;
  setGuidedProgress: (progress: number) => void;
  setGuidedCameraShot: (shot: GuidedCameraShot | null) => void;
  clearGuidedDemo: () => void;
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
      commanderOpen: false,
      selectedMissionTaskId: null,
      guidedDemoTitle: null,
      guidedDemoBody: null,
      guidedDemoProgress: 0,
      guidedCameraShot: null,
      visualMode: 'normal',
      officeVisualStyle: 'claw3d',

      selectAgent: (id) =>
        set({ selectedAgentId: id, selectedTaskId: null }),
      setVisualMode: (visualMode) => set({ visualMode }),
      setOfficeVisualStyle: (officeVisualStyle) => set({ officeVisualStyle }),
      selectTask: (id) =>
        set({ selectedTaskId: id, selectedAgentId: null }),
      setActiveModule: (module) => set({ activeModule: module }),
      setDemoRunning: (running) => set({ demoRunning: running }),
      setDemoPaused: (paused) => set({ demoPaused: paused }),
      setCameraFocus: (pos) => set({ cameraFocus: pos }),
      setCommanderOpen: (commanderOpen) => set({ commanderOpen }),
      selectMissionTask: (selectedMissionTaskId) => set({ selectedMissionTaskId }),
      clearSelection: () =>
        set({ selectedAgentId: null, selectedTaskId: null }),
      setGuidedNarration: (guidedDemoTitle, guidedDemoBody) => set({ guidedDemoTitle, guidedDemoBody }),
      setGuidedProgress: (guidedDemoProgress) => set({ guidedDemoProgress }),
      setGuidedCameraShot: (guidedCameraShot) => set({ guidedCameraShot }),
      clearGuidedDemo: () =>
        set({
          guidedDemoTitle: null,
          guidedDemoBody: null,
          guidedDemoProgress: 0,
          guidedCameraShot: null,
        }),
    }),
    {
      name: 'cyber-office-ui',
      partialize: (state) => ({
        activeModule: state.activeModule,
        visualMode: state.visualMode,
      }),
    },
  ),
);
