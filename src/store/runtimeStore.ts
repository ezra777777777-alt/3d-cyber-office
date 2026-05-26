import { create } from 'zustand';
import type { GatewayDiagnostic } from '@/core/types';
import type { RuntimeConnectionStatus, RuntimeMode, RuntimeRawMessage } from '@/runtime/runtimeTypes';
import type { RuntimeHealthSnapshot } from '@/runtime/runtimeHealth';

interface RuntimeState {
  mode: RuntimeMode;
  status: RuntimeConnectionStatus;
  diagnostics: GatewayDiagnostic[];
  rawEvents: RuntimeRawMessage[];
  lastHeartbeatAt: string | null;
  endpoint: string;
  health: RuntimeHealthSnapshot | null;
  setMode: (mode: RuntimeMode) => void;
  setStatus: (status: RuntimeConnectionStatus) => void;
  addDiagnostics: (diagnostics: GatewayDiagnostic[]) => void;
  addRawEvent: (event: RuntimeRawMessage) => void;
  setLastHeartbeatAt: (timestamp: string | null) => void;
  setEndpoint: (endpoint: string) => void;
  setHealth: (health: RuntimeHealthSnapshot | null) => void;
  refreshHealth: () => Promise<void>;
  resetRuntime: () => void;
}

export const useRuntimeStore = create<RuntimeState>((set, get) => ({
  mode: 'demo',
  status: 'idle',
  diagnostics: [],
  rawEvents: [],
  lastHeartbeatAt: null,
  endpoint: 'http://127.0.0.1:8765',
  health: null,
  setMode: (mode) => set({ mode }),
  setStatus: (status) => set({ status }),
  addDiagnostics: (diagnostics) =>
    set((state) => ({ diagnostics: [...diagnostics, ...state.diagnostics].slice(0, 20) })),
  addRawEvent: (event) =>
    set((state) => ({ rawEvents: [event, ...state.rawEvents].slice(0, 100) })),
  setLastHeartbeatAt: (lastHeartbeatAt) => set({ lastHeartbeatAt }),
  setEndpoint: (endpoint) => set({ endpoint }),
  setHealth: (health) => set({ health }),
  refreshHealth: async () => {
    const endpoint = get().endpoint.replace(/\/$/, '');
    try {
      const response = await fetch(`${endpoint}/health`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const health = await response.json();
      set({ health, status: health.ok ? 'connected' : 'error' });
    } catch {
      set({ health: null, status: 'disconnected' });
    }
  },
  resetRuntime: () =>
    set({
      status: 'idle',
      diagnostics: [],
      rawEvents: [],
      lastHeartbeatAt: null,
      health: null,
    }),
}));
