'use client';

import { useState } from 'react';
import { WelcomeStep } from './WelcomeStep';
import { ConnectionStep } from './ConnectionStep';
import { useConnectionStore } from '@/stores/useConnectionStore';

export function OnboardingFlow() {
  const [step, setStep] = useState<'welcome' | 'connection'>('welcome');
  const completeOnboarding = useConnectionStore((state) => state.completeOnboarding);

  const handleWelcomeNext = () => {
    setStep('connection');
  };

  const handleConnectionComplete = () => {
    completeOnboarding();
  };

  return (
    <>
      {step === 'welcome' && <WelcomeStep onNext={handleWelcomeNext} />}
      {step === 'connection' && <ConnectionStep onComplete={handleConnectionComplete} />}
    </>
  );
}
