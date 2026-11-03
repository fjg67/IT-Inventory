import { useLayoutEffect, useRef } from 'react';
import './data.css';

export function useStickyTable(enabled: boolean) {
  const panelRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const panel = panelRef.current;
    if (!enabled || !panel) return;
    const toolbar = panel.querySelector<HTMLElement>('.articles-toolbar');
    const topbar = panel.closest('.workspace__main')?.querySelector<HTMLElement>('.topbar');
    if (!toolbar) return;

    const measure = () => {
      panel.style.setProperty('--data-toolbar-height', `${toolbar.getBoundingClientRect().height}px`);
      panel.style.setProperty('--data-sticky-top', `${topbar?.getBoundingClientRect().height ?? 0}px`);
    };
    measure();
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure);
    observer?.observe(toolbar);
    if (topbar) observer?.observe(topbar);
    window.addEventListener('resize', measure);
    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [enabled]);

  return panelRef;
}
