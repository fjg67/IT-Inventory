import { useCallback, useEffect, useRef } from 'react';

interface QuantityStepperOptions {
  min: number;
  max: number;
  value: number;
  onChange: (next: number) => void;
  onPulse?: () => void;
}

export const useQuantityStepper = ({
  min,
  max,
  value,
  onChange,
  onPulse,
}: QuantityStepperOptions) => {
  const holdTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const holdIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const holdStartRef = useRef<number>(0);

  const step = useCallback(
    (delta: 1 | -1) => {
      const next = Math.max(min, Math.min(max, value + delta));
      if (next !== value) {
        onChange(next);
        onPulse?.();
      }
    },
    [max, min, onChange, onPulse, value],
  );

  const stopHold = useCallback(() => {
    if (holdTimeoutRef.current) {
      clearTimeout(holdTimeoutRef.current);
      holdTimeoutRef.current = null;
    }
    if (holdIntervalRef.current) {
      clearInterval(holdIntervalRef.current);
      holdIntervalRef.current = null;
    }
  }, []);

  const startHold = useCallback(
    (delta: 1 | -1) => {
      stopHold();
      holdStartRef.current = Date.now();

      holdTimeoutRef.current = setTimeout(() => {
        holdIntervalRef.current = setInterval(() => {
          const heldFor = Date.now() - holdStartRef.current;
          const speed = heldFor > 1000 ? 60 : 120;
          if (holdIntervalRef.current) {
            clearInterval(holdIntervalRef.current);
          }
          holdIntervalRef.current = setInterval(() => step(delta), speed);
          step(delta);
        }, 120);
      }, 300);
    },
    [step, stopHold],
  );

  useEffect(() => stopHold, [stopHold]);

  return {
    increment: () => step(1),
    decrement: () => step(-1),
    startIncrementHold: () => startHold(1),
    startDecrementHold: () => startHold(-1),
    stopHold,
  };
};
