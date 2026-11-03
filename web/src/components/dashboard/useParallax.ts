import { useRef, type PointerEvent } from 'react';

/**
 * Parallax 3D léger : écrit --hero-px / --hero-py (-1…1) sur l'élément,
 * au plus une fois par frame. Le lissage est assuré par une transition CSS.
 */
export function useParallax<T extends HTMLElement>(enabled: boolean) {
  const ref = useRef<T>(null);
  const state = useRef({ frame: 0, rect: null as DOMRect | null, x: 0, y: 0 });

  function onPointerEnter(event: PointerEvent<T>) {
    if (enabled) state.current.rect = event.currentTarget.getBoundingClientRect();
  }

  function onPointerMove(event: PointerEvent<T>) {
    const current = state.current;
    if (!enabled) return;
    current.rect ??= event.currentTarget.getBoundingClientRect();
    current.x = event.clientX;
    current.y = event.clientY;
    if (current.frame) return;
    current.frame = window.requestAnimationFrame(() => {
      current.frame = 0;
      const element = ref.current;
      const rect = current.rect;
      if (!element || !rect) return;
      const px = ((current.x - rect.left) / rect.width) * 2 - 1;
      const py = ((current.y - rect.top) / rect.height) * 2 - 1;
      element.style.setProperty('--hero-px', px.toFixed(3));
      element.style.setProperty('--hero-py', py.toFixed(3));
    });
  }

  function onPointerLeave() {
    const current = state.current;
    window.cancelAnimationFrame(current.frame);
    current.frame = 0;
    current.rect = null;
    ref.current?.style.removeProperty('--hero-px');
    ref.current?.style.removeProperty('--hero-py');
  }

  return { ref, handlers: { onPointerEnter, onPointerMove, onPointerLeave } };
}
