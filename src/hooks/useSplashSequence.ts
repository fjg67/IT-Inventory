import { useEffect, useMemo, useState } from 'react';
import {
  useSharedValue,
  withTiming,
  Easing,
  type SharedValue,
} from 'react-native-reanimated';

export type InitStep =
  | 'connecting'
  | 'auth_check'
  | 'config_load'
  | 'session_restore'
  | 'ready';

const STEP_PROGRESS: Record<InitStep, number> = {
  connecting: 0.2,
  auth_check: 0.45,
  config_load: 0.7,
  session_restore: 0.9,
  ready: 1,
};

const STEP_STATUS: Record<InitStep, string> = {
  connecting: 'Connexion au serveur...',
  auth_check: 'Verification des identifiants...',
  config_load: 'Chargement de la configuration...',
  session_restore: 'Restauration de votre session...',
  ready: 'Pret !',
};

type UseSplashSequenceParams = {
  step?: InitStep;
  message?: string;
  isError?: boolean;
};

type UseSplashSequenceResult = {
  currentStep: InitStep;
  statusText: string;
  progressValue: SharedValue<number>;
};

export const useSplashSequence = ({
  step,
  message,
  isError = false,
}: UseSplashSequenceParams): UseSplashSequenceResult => {
  const progressValue = useSharedValue(0.08);
  const [currentStep, setCurrentStep] = useState<InitStep>(step ?? 'connecting');

  useEffect(() => {
    if (step) {
      setCurrentStep(step);
    }
  }, [step]);

  useEffect(() => {
    if (isError) {
      progressValue.value = withTiming(0.4, {
        duration: 260,
        easing: Easing.out(Easing.quad),
      });
      return;
    }

    const target = STEP_PROGRESS[currentStep];
    progressValue.value = withTiming(target, {
      duration: currentStep === 'ready' ? 260 : 520,
      easing: Easing.out(Easing.cubic),
    });
  }, [currentStep, isError, progressValue]);

  const statusText = useMemo(() => {
    if (message && message.trim().length > 0) return message;
    return STEP_STATUS[currentStep];
  }, [message, currentStep]);

  return {
    currentStep,
    statusText,
    progressValue,
  };
};
