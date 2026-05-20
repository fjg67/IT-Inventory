import React from 'react';
import { FullScreenLoading } from '@/components/common/Loading';
import { type InitStep } from '@/hooks/useSplashSequence';

type SplashScreenProps = {
  step?: InitStep;
  message?: string;
  isError?: boolean;
  onRetry?: () => void;
};

export const SplashScreen: React.FC<SplashScreenProps> = ({
  step,
  message,
  isError = false,
  onRetry,
}) => {
  return (
    <FullScreenLoading
      step={step}
      message={message}
      isError={isError}
      onRetry={onRetry}
    />
  );
};

export default SplashScreen;
