'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useConnectionStore } from '@/stores/useConnectionStore';
import { ConnectionStatus } from '@/components/chat/ConnectionStatus';

interface SkillInfo {
  id: string;
  label: string;
  enabled: boolean;
  hasApiKey: boolean;
  status?: string;
}

interface HealthInfo {
  model?: string;
  uptime?: number;
  version?: string;
}

// Icons for known skills
const skillIcons: Record<string, string> = {
  goplaces: '🗺️',
  'local-places': '📍',
  'nano-banana-pro': '🎨',
  notion: '📝',
  reminders: '✅',
  calendar: '📅',
  contacts: '👥',
  'web-search': '🔍',
  weather: '🌤️',
  'apple-notes': '📒',
  'apple-reminders': '✅',
  clawhub: '🦞',
  healthcheck: '💓',
  'skill-creator': '🛠️',
  summarize: '📋',
  'video-frames': '🎬',
};

/** Best-effort parser for whatever shape skills.status returns */
function parseSkillsResponse(data: unknown): SkillInfo[] {
  if (!data || typeof data !== 'object') return [];

  const makeLabel = (id: string) =>
    id.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  const toSkill = (id: string, v: any): SkillInfo => ({
    id,
    label: v?.label || v?.name || makeLabel(id),
    enabled: v?.enabled !== false,
    hasApiKey: Boolean(v?.hasApiKey || v?.apiKey || v?.configured),
    status: v?.status,
  });

  // Format 1: { entries: { skillId: { ... }, ... } }
  if ('entries' in (data as any) && typeof (data as any).entries === 'object' && !Array.isArray((data as any).entries)) {
    return Object.entries((data as any).entries).map(([id, v]) => toSkill(id, v));
  }

  // Format 2: { skills: [ { id, ... }, ... ] }
  if ('skills' in (data as any) && Array.isArray((data as any).skills)) {
    return ((data as any).skills as any[]).map((s) => toSkill(s.id ?? s.name ?? 'unknown', s));
  }

  // Format 3: plain array [ { id, ... }, ... ]
  if (Array.isArray(data)) {
    return (data as any[]).map((s) => toSkill(s.id ?? s.name ?? 'unknown', s));
  }

  // Format 4: flat object where keys are skill ids and values are skill data
  // e.g. { "weather": { enabled: true, ... }, "notion": { ... } }
  // Heuristic: if object has no "type"/"event"/"ok" keys, treat each key as a skill
  const obj = data as Record<string, any>;
  const reservedKeys = new Set(['type', 'event', 'ok', 'error', 'id', 'payload', 'seq']);
  const keys = Object.keys(obj);
  if (keys.length > 0 && !keys.some(k => reservedKeys.has(k))) {
    return keys.map(k => toSkill(k, obj[k]));
  }

  console.warn('[OC] Could not parse skills.status — returning raw keys as skills. Shape:', Object.keys(obj));
  // Last resort: just list the keys
  return keys.filter(k => !reservedKeys.has(k)).map(k => toSkill(k, obj[k]));
}

interface SidebarProps {
  wsClient: any; // WebSocketClient
  isOpen: boolean;
  onToggle: () => void;
}

export function Sidebar({ wsClient, isOpen, onToggle }: SidebarProps) {
  const { isConnected } = useConnectionStore();
  const [skills, setSkills] = useState<SkillInfo[]>([]);
  const [health, setHealth] = useState<HealthInfo | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch status from gateway
  useEffect(() => {
    if (!wsClient || !isConnected) return;

    const fetchStatus = async () => {
      setLoading(true);
      try {
        // Fetch skills status from the actual server
        const skillsResult = await wsClient.call('skills.status', {});
        console.log('[OC] skills.status raw response:', JSON.stringify(skillsResult, null, 2));
        
        const parsed = parseSkillsResponse(skillsResult);
        setSkills(parsed);
      } catch (err) {
        console.log('[OC] skills.status failed:', err);
        setSkills([]);
      }

      try {
        // Fetch health
        const healthResult = await wsClient.call('health', {});
        console.log('[OC] health:', healthResult);
        setHealth({
          model: healthResult?.model?.id || healthResult?.model,
          uptime: healthResult?.uptime,
          version: healthResult?.version,
        });
      } catch (err) {
        console.log('[OC] health failed:', err);
      }
      setLoading(false);
    };

    fetchStatus();
    // Refresh every 60s — less frequent to avoid interfering with chat
    const interval = setInterval(fetchStatus, 60000);
    return () => clearInterval(interval);
  }, [wsClient, isConnected]);

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={onToggle}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ x: isOpen ? 0 : -280 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="fixed left-0 top-0 bottom-0 w-[280px] z-50 flex flex-col bg-neutral-900 border-r border-neutral-800/60"
      >
        {/* Brand header */}
        <div className="p-4 border-b border-neutral-800/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 text-white flex items-center justify-center text-xl shadow-lg shadow-brand-500/20">
              🤖
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-base font-bold text-neutral-100 leading-tight">Open Claw</h1>
              <p className="text-xs text-neutral-500">AI Assistant</p>
            </div>
            {/* Close button on mobile */}
            <button
              onClick={onToggle}
              className="lg:hidden w-8 h-8 rounded-lg flex items-center justify-center text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors"
            >
              ✕
            </button>
          </div>
          <div className="mt-3">
            <ConnectionStatus />
          </div>
        </div>

        {/* Health / Model info */}
        {health && (
          <div className="px-4 py-3 border-b border-neutral-800/60">
            <h3 className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500 mb-2">System</h3>
            {health.model && (
              <div className="flex items-center gap-2 text-sm text-neutral-300 mb-1">
                <span className="text-neutral-500">🧠</span>
                <span className="truncate">{health.model}</span>
              </div>
            )}
            {health.version && (
              <div className="flex items-center gap-2 text-sm text-neutral-400">
                <span className="text-neutral-500">📦</span>
                <span>v{health.version}</span>
              </div>
            )}
          </div>
        )}

        {/* Connected apps / skills */}
        <div className="flex-1 overflow-y-auto px-4 py-3">
          <h3 className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500 mb-3">Connected Skills</h3>

          {loading && skills.length === 0 ? (
            <div className="flex items-center gap-2 text-sm text-neutral-500">
              <div className="w-3 h-3 border-2 border-neutral-600 border-t-brand-500 rounded-full animate-spin" />
              Loading...
            </div>
          ) : skills.length === 0 ? (
            <p className="text-xs text-neutral-600">No skills configured</p>
          ) : (
            <div className="space-y-1">
              {skills.map((skill) => (
                <SkillItem key={skill.id} skill={skill} />
              ))}
            </div>
          )}

          {/* Web interface — always show as connected */}
          <div className="mt-1">
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-neutral-800/40 border border-neutral-800/60">
              <span className="text-base">🌐</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-neutral-200 truncate">Web Interface</p>
                <p className="text-[11px] text-green-400">Connected</p>
              </div>
              <div className="w-2 h-2 rounded-full bg-green-500 shadow-sm shadow-green-500/50" />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-800/60">
          <p className="text-[10px] text-neutral-600 text-center">
            Open Claw Web Interface
          </p>
        </div>
      </motion.aside>
    </>
  );
}

function SkillItem({ skill }: { skill: SkillInfo }) {
  const icon = skillIcons[skill.id] || '⚙️';

  let statusText = skill.hasApiKey ? 'Configured' : 'No API Key';
  let statusColor = skill.hasApiKey ? 'text-green-400' : 'text-yellow-500';
  let dotColor = skill.hasApiKey ? 'bg-green-500 shadow-sm shadow-green-500/50' : 'bg-yellow-500';

  if (!skill.enabled) {
    statusText = 'Disabled';
    statusColor = 'text-neutral-600';
    dotColor = 'bg-neutral-700';
  }

  return (
    <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-neutral-800/60 transition-colors">
      <span className="text-base">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-neutral-200 truncate">{skill.label}</p>
        <p className={`text-[11px] ${statusColor}`}>{statusText}</p>
      </div>
      <div className={`w-2 h-2 rounded-full ${dotColor}`} />
    </div>
  );
}
