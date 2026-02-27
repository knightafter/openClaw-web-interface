'use client';

import { OnboardingFlow } from '@/components/onboarding/OnboardingFlow';
import { ChatInterface } from '@/components/chat/ChatInterface';
import { useConnectionStore } from '@/stores/useConnectionStore';

export default function Home() {
  const hasCompletedOnboarding = useConnectionStore((state) => state.hasCompletedOnboarding);

  return (
    <main className="min-h-screen bg-neutral-50 dark:bg-neutral-950 transition-colors duration-200">
      {!hasCompletedOnboarding ? <OnboardingFlow /> : <ChatInterface />}
    </main>
  );
}
