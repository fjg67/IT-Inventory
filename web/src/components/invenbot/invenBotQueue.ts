/** États affichables par InvenBot (expressions + gestuelle). */
export type InvenBotBaseState = 'idle' | 'checking' | 'warning' | 'sleep' | 'searching' | 'typing' | 'exporting'
  | 'hot' | 'inspecting' | 'repairing' | 'ready' | 'fixing-alert'
  | 'receiving' | 'dispatching' | 'counting' | 'transferring';
export type InvenBotOneShot = 'wave' | 'success' | 'warning' | 'celebrate' | 'laugh' | 'confused' | 'found' | 'shipping' | 'stamping';
export type InvenBotState = InvenBotBaseState | InvenBotOneShot | 'curious';

/** Priorités inspirées de INVENBOT_PRIORITY (mobile). */
export const INVENBOT_PRIORITY: Record<InvenBotOneShot, number> = {
  warning: 6,
  success: 5,
  confused: 4.8,
  found: 4.5,
  shipping: 4.6,
  stamping: 4.3,
  celebrate: 4,
  wave: 3,
  laugh: 2.4,
};

export const INVENBOT_DURATION: Record<InvenBotOneShot, number> = {
  warning: 2200,
  success: 1500,
  confused: 1800,
  found: 1300,
  shipping: 1900,
  stamping: 1000,
  celebrate: 1300,
  wave: 1900,
  laugh: 700,
};

const MAX_DURATION = 2200;
const MAX_PENDING = 8;

export interface InvenBotEvent {
  state: InvenBotOneShot;
  priority: number;
  duration: number;
  id: number;
}

type Scheduler = {
  setTimeout: (fn: () => void, ms: number) => number;
  clearTimeout: (id: number) => void;
};

/**
 * Une animation one-shot à la fois. Un événement de priorité >= à l'actuel
 * l'interrompt ; sinon il attend (tri par priorité, file bornée).
 */
export class InvenBotQueue {
  private current: InvenBotEvent | null = null;
  private pending: InvenBotEvent[] = [];
  private timer: number | null = null;
  private nextId = 1;

  constructor(
    private readonly onChange: (event: InvenBotEvent | null) => void,
    private readonly scheduler: Scheduler = {
      setTimeout: (fn, ms) => window.setTimeout(fn, ms),
      clearTimeout: (id) => window.clearTimeout(id),
    },
  ) {}

  get active() {
    return this.current;
  }

  enqueue(state: InvenBotOneShot, options: { priority?: number; duration?: number } = {}) {
    const event: InvenBotEvent = {
      state,
      priority: options.priority ?? INVENBOT_PRIORITY[state],
      duration: Math.min(options.duration ?? INVENBOT_DURATION[state], MAX_DURATION),
      id: this.nextId++,
    };
    if (!this.current || event.priority >= this.current.priority) {
      this.start(event);
      return;
    }
    this.pending = [...this.pending, event]
      .sort((a, b) => b.priority - a.priority || a.id - b.id)
      .slice(0, MAX_PENDING);
  }

  clear() {
    if (this.timer !== null) this.scheduler.clearTimeout(this.timer);
    this.timer = null;
    this.pending = [];
    if (this.current) {
      this.current = null;
      this.onChange(null);
    }
  }

  private start(event: InvenBotEvent) {
    if (this.timer !== null) this.scheduler.clearTimeout(this.timer);
    this.current = event;
    this.onChange(event);
    this.timer = this.scheduler.setTimeout(() => this.finish(), event.duration);
  }

  private finish() {
    this.timer = null;
    const next = this.pending.shift();
    if (next) {
      this.start(next);
      return;
    }
    this.current = null;
    this.onChange(null);
  }
}
