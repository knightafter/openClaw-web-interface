'use client';

import { useConnectionStore } from '@/stores/useConnectionStore';

export function ConnectionStatus() {
  const { isConnected, isConnecting, error } = useConnectionStore();

  if (error) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 border border-red-500/20 rounded-xl">
        <div className="w-2 h-2 rounded-full bg-red-500" />
        <span className="text-xs text-red-400">{error}</span>
      </div>
    );
  }

  if (isConnecting) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-brand-500/10 border border-brand-500/20 rounded-xl">
        <div className="w-2 h-2 rounded-full bg-brand-500 animate-pulse" />
        <span className="text-xs text-brand-400">Connecting...</span>
      </div>
    );
  }

  if (isConnected) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-xl">
        <div className="w-2 h-2 rounded-full bg-green-500" />
        <span className="text-xs text-green-400">Connected</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-neutral-500/10 border border-neutral-500/20 rounded-xl">
      <div className="w-2 h-2 rounded-full bg-neutral-400" />
      <span className="text-xs text-neutral-500">Disconnected</span>
    </div>
  );
}
