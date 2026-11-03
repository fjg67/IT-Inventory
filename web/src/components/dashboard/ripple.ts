import type { PointerEvent } from 'react';
import { isPageMotionReduced } from './usePageMotion';

/** Onde au clic : un span positionné au point de contact, animé en scale + opacity. */
export function spawnRipple(event: PointerEvent<HTMLElement>) {
  if (event.button !== 0 || isPageMotionReduced()) return;
  const host = event.currentTarget;
  const rect = host.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height) * 2;
  const ripple = document.createElement('span');
  ripple.className = 'ripple';
  ripple.setAttribute('aria-hidden', 'true');
  ripple.style.width = `${size}px`;
  ripple.style.height = `${size}px`;
  ripple.style.left = `${event.clientX - rect.left - size / 2}px`;
  ripple.style.top = `${event.clientY - rect.top - size / 2}px`;
  ripple.addEventListener('animationend', () => ripple.remove(), { once: true });
  host.appendChild(ripple);
  window.setTimeout(() => ripple.remove(), 900);
}
