import { useEffect, useState } from 'react';

const reducedQuery = '(prefers-reduced-motion: reduce)';

/** Animations décoratives de page coupées (préférence système ou réglage « Réduites »). */
export function isPageMotionReduced(): boolean {
  if (typeof window === 'undefined' || typeof document === 'undefined') return true;
  if (document.documentElement.classList.contains('reduce-motion')) return true;
  return window.matchMedia?.(reducedQuery).matches ?? false;
}

export function usePageMotionReduced(): boolean {
  const [reduced, setReduced] = useState(isPageMotionReduced);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    const update = () => setReduced(isPageMotionReduced());
    const media = window.matchMedia?.(reducedQuery);
    media?.addEventListener('change', update);
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    update();
    return () => {
      media?.removeEventListener('change', update);
      observer.disconnect();
    };
  }, []);

  return reduced;
}

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => typeof window !== 'undefined' && (window.matchMedia?.(query).matches ?? false));

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const media = window.matchMedia?.(query);
    if (!media) return;
    const update = () => setMatches(media.matches);
    media.addEventListener('change', update);
    update();
    return () => media.removeEventListener('change', update);
  }, [query]);

  return matches;
}

/** Effets au pointeur (tilt, parallax) : souris fine, ≥ 900px, mouvements non réduits. */
export function usePointerEffects(): boolean {
  const reduced = usePageMotionReduced();
  const fine = useMediaQuery('(hover: hover) and (pointer: fine)');
  const wide = useMediaQuery('(min-width: 900px)');
  return !reduced && fine && wide;
}
