import { useCallback, useEffect, useRef, type KeyboardEvent, type RefObject } from 'react';

type KeySequence = { firstAt: number; lastAt: number; count: number };

export function isRapidBarcodeSequence(sequence: KeySequence, enteredAt: number): boolean {
  return sequence.count >= 2 && enteredAt - sequence.firstAt <= 900 && enteredAt - sequence.lastAt <= 250;
}

export function useBarcodeWedge(
  enabled: boolean,
  onScan: (value: string, wasRapid: boolean) => void,
): {
  inputRef: RefObject<HTMLInputElement | null>;
  onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
  focusInput: () => void;
} {
  const inputRef = useRef<HTMLInputElement>(null);
  const sequenceRef = useRef<KeySequence>({ firstAt: 0, lastAt: 0, count: 0 });

  const focusInput = useCallback(() => {
    if (!enabled || document.visibilityState === 'hidden' || document.querySelector('[role="dialog"][aria-modal="true"]')) return;
    inputRef.current?.focus({ preventScroll: true });
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    const frame = window.requestAnimationFrame(focusInput);
    const onWindowFocus = () => focusInput();
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') focusInput();
    };
    window.addEventListener('focus', onWindowFocus);
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('focus', onWindowFocus);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [enabled, focusInput]);

  const onKeyDown = useCallback((event: KeyboardEvent<HTMLInputElement>) => {
    const now = performance.now();
    const sequence = sequenceRef.current;
    if (event.key === 'Enter') {
      event.preventDefault();
      const code = event.currentTarget.value.trim();
      const wasRapid = isRapidBarcodeSequence(sequence, now);
      sequenceRef.current = { firstAt: 0, lastAt: 0, count: 0 };
      if (code.length >= 2) onScan(code, wasRapid);
      return;
    }

    if (event.key === 'Backspace' || event.key.length !== 1 || event.altKey || event.ctrlKey || event.metaKey) {
      sequenceRef.current = { firstAt: 0, lastAt: 0, count: 0 };
      return;
    }
    if (sequence.count > 0 && now - sequence.lastAt > 250) {
      sequenceRef.current = { firstAt: now, lastAt: now, count: 1 };
      return;
    }
    sequenceRef.current = {
      firstAt: sequence.count === 0 ? now : sequence.firstAt,
      lastAt: now,
      count: sequence.count + 1,
    };
  }, [onScan]);

  return { inputRef, onKeyDown, focusInput };
}
