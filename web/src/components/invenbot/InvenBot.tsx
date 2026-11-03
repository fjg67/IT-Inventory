import { useEffect, useRef, useState, type CSSProperties, type RefObject } from 'react';
import invenBotImage from '../../../../it-inventory-site/assets/invenbot.png';
import { InvenBotSvg } from './InvenBotSvg';
import { useOnScreenAndVisible } from '../motion/useOnScreenAndVisible';
import { isMotionReduced } from './motion';
import type { InvenBotLook } from './invenBotContext';
import type { InvenBotState } from './invenBotQueue';
import './invenbot.css';

export type InvenBotSize = 'mini' | 'small' | 'large';
export type { InvenBotLook, InvenBotState };

export interface InvenBotProps {
  size?: InvenBotSize;
  state?: InvenBotState;
  /** Change pour rejouer le geste d'un état identique (ex. deux succès d'affilée). */
  eventId?: number;
  variant?: 'svg' | 'png';
  /** Les yeux et la tête suivent le curseur (à réserver au bot principal). */
  trackPointer?: boolean;
  /** Cible de regard imposée, normalisée entre -1 et 1. Prioritaire sur le curseur. */
  lookAt?: InvenBotLook;
  workshop?: boolean;
  gearUp?: boolean;
}

export function InvenBot({
  size = 'large',
  state = 'idle',
  eventId = 0,
  variant = 'svg',
  trackPointer = false,
  lookAt = null,
  workshop = false,
  gearUp = false,
}: InvenBotProps) {
  const containerRef = useRef<HTMLSpanElement>(null);
  const animated = useOnScreenAndVisible(containerRef);
  const reduced = useMotionReduced();
  const live = variant === 'svg' && animated && !reduced;
  const effects = variant === 'svg' && !reduced && size !== 'mini';

  useBlink(containerRef, live);
  useLook(containerRef, live, trackPointer, lookAt);
  useGesture(containerRef, live, state, eventId);
  useEffect(() => {
    const head = containerRef.current?.querySelector('.ib-head');
    const cancelNod = () => head?.getAnimations?.().forEach((animation) => {
      if (animation.id === 'invenbot-typing-nod') animation.cancel();
    });
    if (!live) cancelNod();
    return cancelNod;
  }, [live]);

  const className = [
    'invenbot',
    `invenbot--${size}`,
    `invenbot--${state}`,
    `invenbot--${variant}`,
    animated ? '' : 'invenbot--paused',
    workshop ? 'invenbot--workshop' : '',
    gearUp ? 'invenbot--gear-up' : '',
  ].filter(Boolean).join(' ');

  return (
    <span ref={containerRef} className={className} aria-hidden="true">
      <span className="invenbot__halo" />
      {variant === 'png' ? <img src={invenBotImage} alt="" /> : <InvenBotSvg key={state === 'shipping' ? eventId : 0} />}
      <span className="invenbot__spark invenbot__spark--one" />
      <span className="invenbot__spark invenbot__spark--two" />
      {variant === 'svg' && state === 'sleep' && (
        <span className="invenbot__zzz"><i>z</i><i>Z</i><i>z</i></span>
      )}
      {effects && eventId > 0 && (state === 'success' || state === 'celebrate') && (
        <Confetti key={`${state}-${eventId}`} kind={state === 'celebrate' ? 'sparkles' : 'confetti'} />
      )}
    </span>
  );
}

const confettiColors = ['#68ddb2', '#ffd27a', '#6fe6ff', '#00a391', '#ff9f2e', '#e8f5f1'];

/** 12 particules CSS, trajectoires déterministes (pas d'aléatoire au rendu). */
function Confetti({ kind }: { kind: 'confetti' | 'sparkles' }) {
  return (
    <span className={`invenbot__confetti invenbot__confetti--${kind}`}>
      {Array.from({ length: 12 }, (_, index) => {
        const angle = (index / 12) * Math.PI * 2 + (index % 2) * 0.25;
        const distance = 46 + (index % 3) * 16;
        const style = {
          '--dx': `${(Math.cos(angle) * distance * 1.4).toFixed(1)}px`,
          '--dy': `${(Math.sin(angle) * distance * 1.2 - 24).toFixed(1)}px`,
          '--r': `${(index * 47) % 360}deg`,
          '--c': confettiColors[index % confettiColors.length],
          '--d': `${(index % 4) * 40}ms`,
        } as CSSProperties;
        return <i key={index} style={style} />;
      })}
    </span>
  );
}

type Keyframes = Keyframe[];
type Gesture = Array<{ selector: string; keyframes: Keyframes; duration: number; easing?: string }>;

const gestures: Partial<Record<InvenBotState, Gesture>> = {
  wave: [
    {
      selector: '.ib-arm--right',
      duration: 1800,
      easing: 'ease-in-out',
      keyframes: [
        { transform: 'rotate(0deg)' },
        { transform: 'rotate(-150deg)', offset: 0.22 },
        { transform: 'rotate(-122deg)', offset: 0.36 },
        { transform: 'rotate(-152deg)', offset: 0.5 },
        { transform: 'rotate(-122deg)', offset: 0.64 },
        { transform: 'rotate(-150deg)', offset: 0.78 },
        { transform: 'rotate(0deg)' },
      ],
    },
    {
      selector: '.ib-head',
      duration: 1800,
      easing: 'ease-in-out',
      keyframes: [
        { transform: 'rotate(0deg)' },
        { transform: 'rotate(-6deg)', offset: 0.25 },
        { transform: 'rotate(-6deg)', offset: 0.78 },
        { transform: 'rotate(0deg)' },
      ],
    },
  ],
  success: [
    {
      selector: '.ib-actor',
      duration: 900,
      easing: 'cubic-bezier(.3, .7, .4, 1)',
      keyframes: [
        { transform: 'translateY(0) scale(1, 1)' },
        { transform: 'translateY(3px) scale(1.07, .93)', offset: 0.16 },
        { transform: 'translateY(-24px) scale(.95, 1.06)', offset: 0.46 },
        { transform: 'translateY(0) scale(1.05, .95)', offset: 0.76 },
        { transform: 'translateY(0) scale(1, 1)' },
      ],
    },
  ],
  warning: [
    {
      selector: '.ib-arm--right',
      duration: 2200,
      easing: 'ease-in-out',
      keyframes: [
        { transform: 'rotate(0deg)' },
        { transform: 'rotate(-158deg)', offset: 0.14 },
        { transform: 'rotate(-146deg)', offset: 0.22 },
        { transform: 'rotate(-160deg)', offset: 0.3 },
        { transform: 'rotate(-146deg)', offset: 0.38 },
        { transform: 'rotate(-160deg)', offset: 0.46 },
        { transform: 'rotate(0deg)', offset: 0.6 },
        { transform: 'rotate(0deg)' },
      ],
    },
    {
      selector: '.ib-arm--left',
      duration: 2200,
      easing: 'ease-in-out',
      keyframes: [
        { transform: 'rotate(0deg)' },
        { transform: 'rotate(0deg)', offset: 0.55 },
        { transform: 'rotate(48deg)', offset: 0.68 },
        { transform: 'rotate(42deg)', offset: 0.8 },
        { transform: 'rotate(48deg)', offset: 0.9 },
        { transform: 'rotate(0deg)' },
      ],
    },
    {
      selector: '.ib-head',
      duration: 2200,
      easing: 'ease-in-out',
      keyframes: [
        { transform: 'rotate(0deg)' },
        { transform: 'rotate(-7deg)', offset: 0.14 },
        { transform: 'rotate(-7deg)', offset: 0.5 },
        { transform: 'rotate(6deg)', offset: 0.68 },
        { transform: 'rotate(6deg)', offset: 0.9 },
        { transform: 'rotate(0deg)' },
      ],
    },
  ],
  celebrate: [
    {
      selector: '.ib-actor',
      duration: 1050,
      easing: 'cubic-bezier(.45, 0, .25, 1)',
      keyframes: [
        { transform: 'translateY(0) rotate(0deg) scale(1, 1)' },
        { transform: 'translateY(4px) rotate(0deg) scale(1.08, .92)', offset: 0.12 },
        { transform: 'translateY(-38px) rotate(-180deg) scale(1, 1)', offset: 0.5 },
        { transform: 'translateY(0) rotate(-360deg) scale(1.06, .94)', offset: 0.86 },
        { transform: 'translateY(0) rotate(-360deg) scale(1, 1)' },
      ],
    },
  ],
  confused: [
    {
      selector: '.ib-head',
      duration: 1500,
      easing: 'ease-in-out',
      keyframes: [
        { transform: 'rotate(0deg)' },
        { transform: 'rotate(14deg)', offset: 0.25 },
        { transform: 'rotate(7deg)', offset: 0.5 },
        { transform: 'rotate(12deg)', offset: 0.75 },
        { transform: 'rotate(10deg)' },
      ],
    },
    {
      selector: '.ib-arm--left',
      duration: 1500,
      easing: 'ease-in-out',
      keyframes: [
        { transform: 'rotate(0deg)' },
        { transform: 'rotate(62deg)', offset: 0.3 },
        { transform: 'rotate(44deg)', offset: 0.5 },
        { transform: 'rotate(58deg)', offset: 0.7 },
        { transform: 'rotate(52deg)' },
      ],
    },
    {
      selector: '.ib-arm--right',
      duration: 1500,
      easing: 'ease-in-out',
      keyframes: [
        { transform: 'rotate(0deg)' },
        { transform: 'rotate(-62deg)', offset: 0.3 },
        { transform: 'rotate(-44deg)', offset: 0.5 },
        { transform: 'rotate(-58deg)', offset: 0.7 },
        { transform: 'rotate(-52deg)' },
      ],
    },
    {
      selector: '.ib-body',
      duration: 1500,
      easing: 'ease-in-out',
      keyframes: [
        { transform: 'translateY(0)' },
        { transform: 'translateY(-3px)', offset: 0.3 },
        { transform: 'translateY(0)', offset: 0.5 },
        { transform: 'translateY(-3px)', offset: 0.7 },
        { transform: 'translateY(0)' },
      ],
    },
  ],
  found: [
    {
      selector: '.ib-arm--right',
      duration: 900,
      easing: 'cubic-bezier(.3, 1.4, .5, 1)',
      keyframes: [
        { transform: 'rotate(0deg)' },
        { transform: 'rotate(-96deg)', offset: 0.45 },
        { transform: 'rotate(-82deg)' },
      ],
    },
    {
      selector: '.ib-actor',
      duration: 700,
      easing: 'ease-out',
      keyframes: [
        { transform: 'translateY(0) scale(1, 1)' },
        { transform: 'translateY(-8px) scale(.97, 1.04)', offset: 0.4 },
        { transform: 'translateY(0) scale(1.03, .97)', offset: 0.75 },
        { transform: 'translateY(0) scale(1, 1)' },
      ],
    },
  ],
  laugh: [
    {
      selector: '.ib-actor',
      duration: 620,
      easing: 'ease-out',
      keyframes: [
        { transform: 'scale(1, 1)' },
        { transform: 'scale(1.12, .88)', offset: 0.2 },
        { transform: 'scale(.92, 1.1)', offset: 0.45 },
        { transform: 'scale(1.05, .96)', offset: 0.7 },
        { transform: 'scale(1, 1)' },
      ],
    },
    {
      selector: '.ib-head',
      duration: 620,
      keyframes: [
        { transform: 'rotate(0deg)' },
        { transform: 'rotate(-5deg)', offset: 0.25 },
        { transform: 'rotate(5deg)', offset: 0.5 },
        { transform: 'rotate(-3deg)', offset: 0.75 },
        { transform: 'rotate(0deg)' },
      ],
    },
  ],
};

/** Petit hochement de tête (frappe au clavier). À limiter côté appelant (≥ 250 ms). */
export function nodInvenBot(root: HTMLElement | null) {
  const head = root?.querySelector('.ib-head');
  if (!head || document.hidden || head.closest('.invenbot--paused') || isMotionReduced() || typeof head.animate !== 'function') return;
  const rest = getComputedStyle(head).transform;
  const base = rest && rest !== 'none' ? rest : 'none';
  const animation = head.animate(
    [
      { transform: base },
      { transform: `${base === 'none' ? '' : base} translateY(3px) rotate(-3deg)` },
      { transform: base },
    ],
    { duration: 220, easing: 'ease-out' },
  );
  animation.id = 'invenbot-typing-nod';
}

/** Gestes one-shot via Web Animations API, annulés si l'état change. */
function useGesture(ref: RefObject<HTMLElement | null>, live: boolean, state: InvenBotState, eventId: number) {
  useEffect(() => {
    const root = ref.current;
    const gesture = gestures[state];
    // Seuls les événements one-shot (eventId > 0) déclenchent un geste.
    if (!live || !root || !gesture || eventId === 0 || typeof Element.prototype.animate !== 'function') return;
    const animations = gesture.flatMap(({ selector, keyframes, duration, easing }) => {
      const target = root.querySelector(selector);
      return target ? [target.animate(keyframes, { duration, easing: easing ?? 'ease', fill: 'none' })] : [];
    });
    return () => animations.forEach((animation) => animation.cancel());
  }, [ref, live, state, eventId]);
}

export function useMotionReduced() {
  const [reduced, setReduced] = useState(isMotionReduced);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    const update = () => setReduced(isMotionReduced());
    const media = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    media?.addEventListener('change', update);
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class', 'data-invenbot-motion'],
    });
    update();
    return () => {
      media?.removeEventListener('change', update);
      observer.disconnect();
    };
  }, []);

  return reduced;
}

/** Clignement à intervalle aléatoire (2–6 s), parfois double. */
function useBlink(ref: RefObject<HTMLElement | null>, active: boolean) {
  useEffect(() => {
    const element = ref.current;
    if (!active || !element) return;
    const timers = new Set<number>();
    const later = (fn: () => void, ms: number) => {
      const timer = window.setTimeout(() => {
        timers.delete(timer);
        fn();
      }, ms);
      timers.add(timer);
    };
    const blinkOnce = (then?: () => void) => {
      element.classList.add('is-blinking');
      later(() => {
        element.classList.remove('is-blinking');
        then?.();
      }, 120);
    };
    const schedule = () => {
      later(() => {
        if (Math.random() < 0.25) blinkOnce(() => later(() => blinkOnce(schedule), 140));
        else blinkOnce(schedule);
      }, 2000 + Math.random() * 4000);
    };
    schedule();
    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
      element.classList.remove('is-blinking');
    };
  }, [ref, active]);
}

/**
 * Regard lissé (lerp) écrit dans --ib-look-x / --ib-look-y.
 * La boucle rAF ne tourne que pendant un mouvement et s'arrête une fois stabilisée.
 */
function useLook(
  ref: RefObject<HTMLElement | null>,
  active: boolean,
  trackPointer: boolean,
  lookAt: InvenBotLook,
) {
  const lookAtRef = useRef<InvenBotLook>(lookAt);
  const kickRef = useRef<() => void>(() => undefined);

  useEffect(() => {
    lookAtRef.current = lookAt;
    kickRef.current();
  }, [lookAt?.x, lookAt?.y]);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const reset = () => {
      element.style.removeProperty('--ib-look-x');
      element.style.removeProperty('--ib-look-y');
    };
    if (!active) {
      reset();
      return;
    }

    const current = { x: 0, y: 0 };
    let pointer: { x: number; y: number } | null = null;
    let rect: DOMRect | null = null;
    let raf = 0;
    let idleTimer = 0;

    const clamp = (value: number) => Math.max(-1, Math.min(1, value));
    const target = () => {
      if (lookAtRef.current) return lookAtRef.current;
      if (!pointer || !trackPointer) return { x: 0, y: 0 };
      if (!rect) rect = element.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height * 0.38;
      return {
        x: clamp((pointer.x - cx) / (window.innerWidth * 0.4)),
        y: clamp((pointer.y - cy) / (window.innerHeight * 0.4)),
      };
    };
    const tick = () => {
      raf = 0;
      const goal = target();
      current.x += (goal.x - current.x) * 0.14;
      current.y += (goal.y - current.y) * 0.14;
      element.style.setProperty('--ib-look-x', current.x.toFixed(3));
      element.style.setProperty('--ib-look-y', current.y.toFixed(3));
      if (Math.abs(goal.x - current.x) > 0.002 || Math.abs(goal.y - current.y) > 0.002) schedule();
    };
    const schedule = () => {
      if (!raf) raf = window.requestAnimationFrame(tick);
    };
    const invalidateRect = () => {
      rect = null;
    };
    const onPointerMove = (event: PointerEvent) => {
      pointer = { x: event.clientX, y: event.clientY };
      window.clearTimeout(idleTimer);
      idleTimer = window.setTimeout(() => {
        pointer = null;
        schedule();
      }, 3000);
      schedule();
    };

    kickRef.current = schedule;
    if (trackPointer) {
      window.addEventListener('pointermove', onPointerMove, { passive: true });
      window.addEventListener('scroll', invalidateRect, { passive: true, capture: true });
      window.addEventListener('resize', invalidateRect, { passive: true });
    }
    schedule();

    return () => {
      kickRef.current = () => undefined;
      window.cancelAnimationFrame(raf);
      window.clearTimeout(idleTimer);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('scroll', invalidateRect, { capture: true });
      window.removeEventListener('resize', invalidateRect);
      reset();
    };
  }, [ref, active, trackPointer]);
}
