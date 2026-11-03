import { useEffect, useRef, useState, type RefObject } from 'react';

export function useOnScreenAndVisible(ref: RefObject<HTMLElement | null>) {
  const inViewport = useRef(true);
  const [active, setActive] = useState(typeof document === 'undefined' || !document.hidden);

  useEffect(() => {
    if (typeof document === 'undefined' || typeof window === 'undefined') return;
    const update = () => setActive(!document.hidden && inViewport.current);
    document.addEventListener('visibilitychange', update);
    return () => document.removeEventListener('visibilitychange', update);
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined' || typeof window === 'undefined') return;
    const element = ref.current;
    if (!element || !('IntersectionObserver' in window)) return;
    inViewport.current = false;
    const observer = new IntersectionObserver(([entry]) => {
      inViewport.current = entry.isIntersecting;
      setActive(!document.hidden && inViewport.current);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref]);

  return active;
}
