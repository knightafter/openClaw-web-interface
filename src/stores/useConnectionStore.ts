import { create } from 'zustand';
import { ConnectionConfig, ConnectionStatus } from '@/types';

interface ConnectionStore extends ConnectionStatus {
  config: ConnectionConfig | null;
  hasCompletedOnboarding: boolean;
  setConfig: (config: ConnectionConfig) => void;
  setConnecting: (isConnecting: boolean) => void;
  setConnected: (isConnected: boolean) => void;
  setError: (error: string | null) => void;
  completeOnboarding: () => void;
  disconnect: () => void;
}

export const useConnectionStore = create<ConnectionStore>((set) => ({
  isConnected: false,
  isConnecting: false,
  error: null,
  config: null,
  hasCompletedOnboarding: false,

  setConfig: (config) => set({ config }),
  
  setConnecting: (isConnecting) => set({ isConnecting, error: null }),
  
  setConnected: (isConnected) => set({ isConnected, isConnecting: false, error: null }),
  
  setError: (error) => set({ error, isConnecting: false, isConnected: false }),
  
  completeOnboarding: () => set({ hasCompletedOnboarding: true }),
  
  disconnect: () => set({ isConnected: false, isConnecting: false, error: null }),
}));
