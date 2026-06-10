import { useMemo, useState } from 'react';
import { useSharedValue, withTiming } from 'react-native-reanimated';

import { PC_DEFAULT_UI, PC_STATUS_UI } from '@/constants/pcStatusColors';
import { PCStatus } from '@/types/pc.types';

export const useAddPCColors = () => {
  const colorProgress = useSharedValue(1);
  const [currentStatus, setCurrentStatus] = useState<PCStatus | null>(null);
  const [previousStatus, setPreviousStatus] = useState<PCStatus | null>(null);

  const transitionToStatus = (status: PCStatus | null) => {
    setPreviousStatus(currentStatus);
    setCurrentStatus(status);
    colorProgress.value = 0;
    colorProgress.value = withTiming(1, { duration: 350 });
  };

  const fromConfig = useMemo(() => {
    if (previousStatus) return PC_STATUS_UI[previousStatus];
    if (currentStatus) return PC_STATUS_UI[currentStatus];
    return PC_DEFAULT_UI;
  }, [currentStatus, previousStatus]);

  const toConfig = useMemo(() => {
    if (currentStatus) return PC_STATUS_UI[currentStatus];
    return PC_DEFAULT_UI;
  }, [currentStatus]);

  return {
    currentStatus,
    previousStatus,
    transitionToStatus,
    colorProgress,
    fromConfig,
    toConfig,
  };
};
