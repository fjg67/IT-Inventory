import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  InvenBotActionsContext,
  InvenBotContext,
  type InvenBotActions,
  type InvenBotBubbleMessage,
  type InvenBotContextValue,
  type InvenBotLook,
} from './invenBotContext';
import { InvenBotQueue, type InvenBotBaseState, type InvenBotEvent, type InvenBotOneShot } from './invenBotQueue';
import {
  applyInvenBotMotionPreference,
  invenBotMotionEvent,
  readInvenBotMotionPreference,
  type InvenBotMotionPreference,
} from './motion';

const BUBBLE_DURATION = 4000;

export function InvenBotProvider({ userName, children }: { userName?: string | null; children: ReactNode }) {
  const [event, setEvent] = useState<InvenBotEvent | null>(null);
  const [base, setBase] = useState<InvenBotBaseState>('idle');
  const [look, setLookState] = useState<InvenBotLook>(null);
  const [bubble, setBubble] = useState<InvenBotBubbleMessage | null>(null);
  const [motion, setMotion] = useState<InvenBotMotionPreference>(readInvenBotMotionPreference);
  const queueRef = useRef<InvenBotQueue | null>(null);
  const motionRef = useRef(motion);
  motionRef.current = motion;
  const bubbleRef = useRef<{ priority: number; id: number; duration: number }>({ priority: 0, id: 0, duration: BUBBLE_DURATION });

  if (!queueRef.current) queueRef.current = new InvenBotQueue(setEvent);

  useEffect(() => {
    applyInvenBotMotionPreference(readInvenBotMotionPreference());
    const update = (e: Event) => {
      const detail = (e as CustomEvent<InvenBotMotionPreference>).detail;
      setMotion(detail);
    };
    window.addEventListener(invenBotMotionEvent, update);
    return () => window.removeEventListener(invenBotMotionEvent, update);
  }, []);

  useEffect(() => {
    if (motion === 'off') queueRef.current?.clear();
  }, [motion]);

  // Expiration pilotée par un effet : elle se réarme si le composant est remonté (StrictMode).
  useEffect(() => {
    if (!bubble) return;
    const timer = window.setTimeout(() => {
      if (bubbleRef.current.id === bubble.id) bubbleRef.current.priority = 0;
      setBubble((current) => (current?.id === bubble.id ? null : current));
    }, bubbleRef.current.duration);
    return () => window.clearTimeout(timer);
  }, [bubble]);

  const play = useCallback((state: InvenBotOneShot, options?: { priority?: number; duration?: number }) => {
    if (motionRef.current === 'off') return;
    queueRef.current?.enqueue(state, options);
  }, []);

  const dismissBubble = useCallback(() => {
    bubbleRef.current.priority = 0;
    setBubble(null);
  }, []);
  const stop = useCallback(() => queueRef.current?.clear(), []);

  const say = useCallback((text: string, options?: { priority?: number; duration?: number }) => {
    const priority = options?.priority ?? 1;
    // Une seule bulle : une bulle moins prioritaire n'écrase pas celle affichée.
    if (bubbleRef.current.priority > priority) return;
    const id = bubbleRef.current.id + 1;
    bubbleRef.current = { id, priority, duration: options?.duration ?? BUBBLE_DURATION };
    setBubble({ id, text });
  }, []);

  const setLook = useCallback((next: InvenBotLook) => {
    setLookState((current) => {
      if (current === next) return current;
      if (current && next && current.curious === next.curious && Math.abs(current.x - next.x) < 0.01 && Math.abs(current.y - next.y) < 0.01) return current;
      return next;
    });
  }, []);

  const firstName = useMemo(() => {
    const first = userName?.trim().split(/\s+/)[0];
    return first ? first.charAt(0).toUpperCase() + first.slice(1).toLowerCase() : null;
  }, [userName]);

  const value = useMemo<InvenBotContextValue>(() => ({
    state: event?.state ?? (look && look.curious !== false ? 'curious' : base),
    eventId: event?.id ?? 0,
    base,
    look,
    bubble,
    motion,
    firstName,
    play,
    setBase,
    setLook,
    say,
    dismissBubble,
    stop,
  }), [event, look, base, bubble, motion, firstName, play, setLook, say, dismissBubble, stop]);

  const actions = useMemo<InvenBotActions>(
    () => ({ play, setBase, setLook, say, dismissBubble, stop }),
    [play, setLook, say, dismissBubble, stop],
  );

  return (
    <InvenBotActionsContext.Provider value={actions}>
      <InvenBotContext.Provider value={value}>{children}</InvenBotContext.Provider>
    </InvenBotActionsContext.Provider>
  );
}
