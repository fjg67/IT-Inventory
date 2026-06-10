// hooks/usePCSuccessAnimation.ts
import { useState } from 'react';
import { PCStatus } from '@/types/pc.types';
import { PCCategory } from '@/hooks/useAddPCForm';

export interface PCSuccessData {
  hostname: string;
  model: string;
  asset: string;
  category: PCCategory;
  status: PCStatus;
}

export interface UsePCSuccessAnimationReturn {
  visible: boolean;
  triggered: boolean;
  pcData: PCSuccessData | null;
  show: (data: PCSuccessData) => void;
  hide: () => void;
}

export const usePCSuccessAnimation = (): UsePCSuccessAnimationReturn => {
  const [visible, setVisible] = useState(false);
  const [triggered, setTriggered] = useState(false);
  const [pcData, setPCData] = useState<PCSuccessData | null>(null);

  const show = (data: PCSuccessData) => {
    setPCData(data);
    setVisible(true);
    setTriggered(false);
    // Déclencher les animations après un micro-délai (le temps que l'overlay s'affiche)
    requestAnimationFrame(() => {
      setTimeout(() => setTriggered(true), 50);
    });
  };

  const hide = () => {
    setTriggered(false);
    setTimeout(() => {
      setVisible(false);
      setPCData(null);
    }, 350);
  };

  return { visible, triggered, pcData, show, hide };
};
