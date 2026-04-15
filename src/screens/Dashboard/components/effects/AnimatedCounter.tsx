import React, { useEffect, useRef, useState } from 'react';
import { Text, TextStyle } from 'react-native';
import { premiumAnimation } from '../../../../constants/premiumTheme';

interface AnimatedCounterProps {
  /** Valeur cible du compteur */
  value: number;
  /** Durée de l'animation en ms */
  duration?: number;
  /** Style du texte */
  style?: TextStyle;
  /** Préfixe (ex: "+") */
  prefix?: string;
  /** Suffixe (ex: "%") */
  suffix?: string;
}

/**
 * Compteur animé de 0 à N
 * Utilise reanimated pour une animation fluide sur le thread UI
 */
const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  value,
  duration = premiumAnimation.counterDuration,
  style,
  prefix = '',
  suffix = '',
}) => {
  const [displayValue, setDisplayValue] = useState<number>(value);
  const fromValueRef = useRef<number>(value);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    const start = Date.now();
    const from = fromValueRef.current;
    const to = value;

    if (frameRef.current != null) {
      cancelAnimationFrame(frameRef.current);
    }

    const animate = () => {
      const elapsed = Date.now() - start;
      const t = Math.min(1, elapsed / Math.max(1, duration));
      const eased = 1 - Math.pow(1 - t, 3); // cubic-out
      const next = Math.round(from + (to - from) * eased);

      setDisplayValue(next);

      if (t < 1) {
        frameRef.current = requestAnimationFrame(animate);
      } else {
        frameRef.current = null;
        fromValueRef.current = to;
      }
    };

    frameRef.current = requestAnimationFrame(animate);

    return () => {
      if (frameRef.current != null) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
      fromValueRef.current = value;
    };
  }, [value, duration]);

  return <Text style={style}>{`${prefix}${displayValue}${suffix}`}</Text>;
};

export default AnimatedCounter;
