'use client';

import { motion } from 'framer-motion';
import { Card } from '@/components/ui/Card';

export function WelcomeStep({ onNext }: { onNext: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex items-center justify-center min-h-screen p-4 bg-gradient-to-br from-neutral-50 via-brand-50/30 to-neutral-100 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950"
    >
      <Card className="p-8 md:p-12 max-w-2xl w-full">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="mb-6 text-center"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 text-white text-4xl font-bold mb-4 shadow-lg shadow-brand-500/30">
            🤖
          </div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-4xl md:text-5xl font-bold text-center mb-4 bg-gradient-to-r from-brand-500 to-brand-700 dark:from-brand-400 dark:to-brand-600 bg-clip-text text-transparent"
        >
          Welcome to Open Claw
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-neutral-500 dark:text-neutral-400 text-center text-lg mb-8"
        >
          A beautiful, modern interface for your Open Claw assistant
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="space-y-3 mb-8"
        >
          <FeatureItem
            icon="✨"
            title="Beautiful Formatting"
            description="Rich text with markdown, code blocks, and syntax highlighting"
            delay={0.6}
          />
          <FeatureItem
            icon="⚡"
            title="Real-time Streaming"
            description="WebSocket-powered instant responses with live token streaming"
            delay={0.7}
          />
          <FeatureItem
            icon="🎨"
            title="Modern Dark UI"
            description="Sleek glass-effect design that feels native on any device"
            delay={0.8}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="text-center"
        >
          <button
            onClick={onNext}
            className="px-8 py-4 bg-gradient-to-r from-brand-500 to-brand-600 text-white rounded-xl font-semibold text-lg hover:shadow-xl hover:shadow-brand-500/25 transform hover:scale-[1.03] active:scale-[0.98] transition-all duration-200 cursor-pointer"
          >
            Get Started →
          </button>
        </motion.div>
      </Card>
    </motion.div>
  );
}

function FeatureItem({
  icon,
  title,
  description,
  delay,
}: {
  icon: string;
  title: string;
  description: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay }}
      className="flex items-start space-x-4 p-4 rounded-xl bg-white dark:bg-neutral-800/50 hover:bg-brand-50 dark:hover:bg-neutral-800 border border-neutral-200/60 dark:border-transparent hover:border-brand-200 dark:hover:border-brand-500/20 transition-all duration-200 cursor-default shadow-sm"
    >
      <span className="text-2xl mt-0.5">{icon}</span>
      <div>
        <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 mb-0.5">{title}</h3>
        <p className="text-neutral-500 dark:text-neutral-400 text-sm">{description}</p>
      </div>
    </motion.div>
  );
}
