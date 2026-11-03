import { useEffect, useRef, useState } from 'react';
import { usePageMotionReduced } from './usePageMotion';
import { useOnScreenAndVisible } from '../motion/useOnScreenAndVisible';

const numberFormat = new Intl.NumberFormat('fr-FR');
const easeOutExpo = (t: number) => (t >= 1 ? 1 : 1 - 2 ** (-10 * t));

/** Compteur animé (depuis la dernière valeur affichée) lancé quand `start` passe à true. */
export function CountUp({
  value,
  start = true,
  duration = 1100,
  className = '',
}: {
  value: number;
  start?: boolean;
  duration?: number;
  className?: string;
}) {
  const reduced = usePageMotionReduced();
  const ref = useRef<HTMLSpanElement>(null);
  const active = useOnScreenAndVisible(ref);
  const [display, setDisplay] = useState(0);
  const displayRef = useRef(0);

  useEffect(() => {
    if (!start) return;
    const from = displayRef.current;
    if (!active || reduced || duration <= 0 || from === value) {
      displayRef.current = value;
      setDisplay(value);
      return;
    }
    let frame = 0;
    let startTime: number | undefined;
    const tick = (time: number) => {
      startTime ??= time;
      const progress = Math.min((time - startTime) / duration, 1);
      const next = Math.round(from + (value - from) * easeOutExpo(progress));
      displayRef.current = next;
      setDisplay(next);
      if (progress < 1) frame = window.requestAnimationFrame(tick);
    };
    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [value, start, active, reduced, duration]);

  return <span ref={ref} className={`count-up ${className}`}>{numberFormat.format(display)}</span>;
}
