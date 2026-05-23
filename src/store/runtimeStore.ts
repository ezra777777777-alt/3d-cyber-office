import { create } from 'zustand';
import type { GatewayDiagnostic } from '@/core/types';
import type { RuntimeConnectionStatus, RuntimeMode, RuntimeRawMessage } from '@/runtime/runtimeTypes';

interface RuntimeState {
  mode: RuntimeMode;
  status: RuntimeConnectionStatus;
  diagnostics: GatewayDiagnostic[];
  rawEvents: RuntimeRawMessage[];
  lastHeartbeatAt: string | null;
  endpoint: string;
  setMode: (mode: RuntimeMode) => void;
  setStatus: (status: RuntimeConnectionStatus) => void;
  addDiagnostics: (diagnostics: GatewayDiagnostic[]) => void;
  addRawEvent: (event: RuntimeRawMessage) => void;
  setLastHeartbeatAt: (timestamp: string | null) => void;
  setEndpoint: (endpoint: string) => void;
  resetRuntime: () => void;
}

export const useRuntimeStore = create<RuntimeState>((set) => ({
  mode: 'demo',
  status: 'idle',
  diagnostics: [],
  rawEvents: [],
  lastHeartbeatAt: null,
  endpoint: 'http://127.0.0.1:8765',
  setMode: (mode) => set({ mode }),
  setStatus: (status) => set({ status }),
  addDiagnostics: (diagnostics) =>
    set((state) => ({ diagnostics: [...diagnostics, ...state.diagnostics].slice(0, 20) })),
  addRawEvent: (event) => set((state) => ({ rawEvents: [event, ...state.rawEvents].slice(0, 100) })),
  setLastHeartbeatAt: (lastHeartbeatAt) => set({ lastHeartbeatAt }),
  setEndpoint: (endpoint) => set({ endpoint }),
  resetRuntime: () => set({ status: 'idle', diagnostics: [], rawEvents: [], lastHeartbeatAt: null }),
}));
