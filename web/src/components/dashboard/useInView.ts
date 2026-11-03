import { useEffect, useRef, useState } from 'react';

/** true dès que l'élément entre dans le viewport (une seule fois). */
export function useInView<T extends Element>(threshold = 0.3) {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element || inView) return;
    if (!('IntersectionObserver' in window)) {
      setInView(true);
      return;
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      setInView(true);
      observer.disconnect();
    }, { threshold });
    observer.observe(element);
    return () => observer.disconnect();
  }, [inView, threshold]);

  return [ref, inView] as const;
}

/**
 * Entrée en cascade : chaque `[data-reveal]` du conteneur reçoit `data-revealed` (attribut hors React, survit aux re-rendus)
 * en entrant à l'écran. Le décalage vient de `--reveal-index` (CSS).
 */
export function useRevealGroup<T extends HTMLElement>(deps: readonly unknown[]) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const pending = Array.from(root.querySelectorAll<HTMLElement>('[data-reveal]:not([data-revealed])'));
    if (pending.length === 0) return;
    if (!('IntersectionObserver' in window)) {
      pending.forEach((element) => element.setAttribute('data-revealed', ''));
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.setAttribute('data-revealed', '');
        observer.unobserve(entry.target);
      }
    }, { threshold: 0.08, rootMargin: '0px 0px -4% 0px' });
    pending.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, deps);

  return ref;
}
