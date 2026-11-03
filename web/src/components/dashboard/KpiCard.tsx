import { useRef, type CSSProperties, type PointerEvent, type ReactNode } from 'react';
import { CountUp } from './CountUp';
import { Sparkline } from './Sparkline';
import { useInView } from './useInView';
import { usePointerEffects } from './usePageMotion';

const numberFormat = new Intl.NumberFormat('fr-FR');
const maxTilt = 6;

export type KpiTone = 'green' | 'amber' | 'purple';

export function KpiCard({
  label,
  value,
  icon,
  arrow,
  tone,
  caption,
  index = 0,
  alert = false,
  pointed = false,
  onClick,
  onLook,
}: {
  label: string;
  value: number;
  icon: ReactNode;
  arrow: ReactNode;
  tone: KpiTone;
  caption: string;
  index?: number;
  /** Bordure en dégradé animée (ex. stocks faibles > 0). */
  alert?: boolean;
  /** Mise en avant pendant que InvenBot pointe la carte. */
  pointed?: boolean;
  onClick?: () => void;
  onLook?: (target: HTMLElement | null) => void;
}) {
  const [ref, inView] = useInView<HTMLButtonElement>(0.35);
  const pointerEffects = usePointerEffects();
  const tilt = useRef({ frame: 0, rect: null as DOMRect | null, x: 0, y: 0 });

  function handleEnter(event: PointerEvent<HTMLButtonElement>) {
    onLook?.(event.currentTarget);
    if (pointerEffects) tilt.current.rect = event.currentTarget.getBoundingClientRect();
  }

  function handleMove(event: PointerEvent<HTMLButtonElement>) {
    const state = tilt.current;
    if (!pointerEffects || !state.rect) return;
    state.x = event.clientX;
    state.y = event.clientY;
    if (state.frame) return;
    const element = event.currentTarget;
    state.frame = window.requestAnimationFrame(() => {
      state.frame = 0;
      const rect = state.rect;
      if (!rect) return;
      const px = (state.x - rect.left) / rect.width;
      const py = (state.y - rect.top) / rect.height;
      element.style.setProperty('--tilt-x', `${((px - 0.5) * 2 * maxTilt).toFixed(2)}deg`);
      element.style.setProperty('--tilt-y', `${((0.5 - py) * 2 * maxTilt).toFixed(2)}deg`);
      element.style.setProperty('--glare-x', `${(state.x - rect.left).toFixed(0)}px`);
      element.style.setProperty('--glare-y', `${(state.y - rect.top).toFixed(0)}px`);
    });
  }

  function handleLeave(event: PointerEvent<HTMLButtonElement>) {
    onLook?.(null);
    const state = tilt.current;
    window.cancelAnimationFrame(state.frame);
    state.frame = 0;
    state.rect = null;
    const style = event.currentTarget.style;
    style.removeProperty('--tilt-x');
    style.removeProperty('--tilt-y');
  }

  const classes = [
    'kpi-card',
    `kpi-card--${tone}`,
    onClick ? '' : 'kpi-card--static',
    alert ? 'kpi-card--alert' : '',
    pointerEffects ? 'kpi-card--tilt' : '',
    pointed ? 'kpi-card--pointed' : '',
    inView ? 'is-in-view' : '',
  ].filter(Boolean).join(' ');

  return (
    <button
      className={classes}
      ref={ref}
      type="button"
      data-reveal=""
      style={{ '--reveal-index': index + 1 } as CSSProperties}
      onClick={onClick}
      disabled={!onClick}
      onPointerEnter={handleEnter}
      onPointerMove={handleMove}
      onPointerLeave={handleLeave}
      aria-label={`${label} : ${numberFormat.format(value)}. ${caption}.`}
    >
      {alert && <span className="kpi-card__border" aria-hidden="true"><i /></span>}
      <span className="kpi-card__glare" aria-hidden="true" />
      <span className={`kpi-card__icon kpi-card__icon--${tone}`} aria-hidden="true">{icon}</span>
      <span className="kpi-card__label">{label}</span>
      <strong className="kpi-card__value"><CountUp value={value} start={inView} /></strong>
      <span className="kpi-card__caption">{caption}</span>
      <Sparkline className={`kpi-card__spark kpi-card__spark--${tone}`} variant={index} />
      <span className="kpi-card__arrow" aria-hidden="true">{arrow}</span>
    </button>
  );
}
