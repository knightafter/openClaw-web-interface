'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useConnectionStore } from '@/stores/useConnectionStore';

export function ConnectionStep({ onComplete }: { onComplete: () => void }) {
  const [apiUrl, setApiUrl] = useState('ws://127.0.0.1:18789');
  const [token, setToken] = useState('');
  const [errors, setErrors] = useState({ apiUrl: '', token: '' });
  const setConfig = useConnectionStore((state) => state.setConfig);

  const handleConnect = () => {
    setErrors({ apiUrl: '', token: '' });

    if (!apiUrl.trim()) {
      setErrors((prev) => ({ ...prev, apiUrl: 'Gateway URL is required' }));
      return;
    }

    if (!token.trim()) {
      setErrors((prev) => ({ ...prev, token: 'Gateway token is required' }));
      return;
    }

    setConfig({
      apiUrl: apiUrl.trim(),
      token: token.trim(),
    });

    onComplete();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      className="flex items-center justify-center min-h-screen p-4 bg-gradient-to-br from-neutral-50 via-brand-50/30 to-neutral-100 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950"
    >
      <Card className="p-8 md:p-12 max-w-2xl w-full">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring' }}
          className="mb-6 text-center"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 text-white text-4xl font-bold mb-4 shadow-lg shadow-brand-500/30">
            🔌
          </div>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-3xl md:text-4xl font-bold text-center mb-4 text-neutral-900 dark:text-neutral-100"
        >
          Connect Your Open Claw
        </motion.h2>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-neutral-500 dark:text-neutral-400 text-center mb-8"
        >
          Enter your gateway URL and authentication token
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="space-y-5 mb-8"
        >
          <Input
            label="Gateway URL"
            type="url"
            placeholder="ws://127.0.0.1:18789"
            value={apiUrl}
            onChange={(e) => setApiUrl(e.target.value)}
            error={errors.apiUrl}
          />

          <Input
            label="Gateway Token"
            type="password"
            placeholder="Paste your gateway token here"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            error={errors.token}
          />

          <div className="bg-brand-50 dark:bg-brand-500/10 border border-brand-200 dark:border-brand-500/20 rounded-xl p-4">
            <p className="text-sm text-brand-700 dark:text-brand-400 mb-1">
              <strong>💡 Where to find your token:</strong>
            </p>
            <p className="text-xs text-brand-600 dark:text-brand-500">
              Open <code className="bg-brand-100 dark:bg-brand-500/20 px-1.5 py-0.5 rounded-md text-brand-800 dark:text-brand-300">~/.openclaw/openclaw.json</code> and
              copy <code className="bg-brand-100 dark:bg-brand-500/20 px-1.5 py-0.5 rounded-md text-brand-800 dark:text-brand-300">gateway.auth.token</code>
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="flex justify-center"
        >
          <Button
            onClick={handleConnect}
            size="lg"
            className="min-w-[200px]"
          >
            Connect →
          </Button>
        </motion.div>
      </Card>
    </motion.div>
  );
}
