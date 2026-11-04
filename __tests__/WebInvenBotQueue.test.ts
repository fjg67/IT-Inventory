import { InvenBotQueue, type InvenBotEvent } from '../web/src/components/invenbot/invenBotQueue';

function createScheduler() {
  let now = 0;
  let nextId = 1;
  const timers = new Map<number, { at: number; fn: () => void }>();
  return {
    scheduler: {
      setTimeout: (fn: () => void, ms: number) => {
        const id = nextId++;
        timers.set(id, { at: now + ms, fn });
        return id;
      },
      clearTimeout: (id: number) => {
        timers.delete(id);
      },
    },
    advance(ms: number) {
      const target = now + ms;
      for (;;) {
        const due = [...timers.entries()].filter(([, t]) => t.at <= target).sort((a, b) => a[1].at - b[1].at)[0];
        if (!due) break;
        timers.delete(due[0]);
        now = due[1].at;
        due[1].fn();
      }
      now = target;
    },
  };
}

describe('InvenBotQueue', () => {
  it('plays one event at a time, then returns to base (null)', () => {
    const clock = createScheduler();
    const changes: Array<InvenBotEvent | null> = [];
    const queue = new InvenBotQueue((event) => changes.push(event), clock.scheduler);

    queue.enqueue('laugh');
    expect(queue.active?.state).toBe('laugh');
    clock.advance(700);
    expect(queue.active).toBeNull();
    expect(changes.map((event) => event?.state ?? null)).toEqual(['laugh', null]);
  });

  it('lets a higher or equal priority event interrupt the current one', () => {
    const clock = createScheduler();
    const queue = new InvenBotQueue(() => undefined, clock.scheduler);

    queue.enqueue('wave');
    queue.enqueue('warning');
    expect(queue.active?.state).toBe('warning');
  });

  it('queues lower priority events by priority and plays them afterwards', () => {
    const clock = createScheduler();
    const played: string[] = [];
    const queue = new InvenBotQueue((event) => { if (event) played.push(event.state); }, clock.scheduler);

    queue.enqueue('warning');
    queue.enqueue('laugh');
    queue.enqueue('success');
    clock.advance(2200);
    expect(queue.active?.state).toBe('success');
    clock.advance(1500);
    expect(queue.active?.state).toBe('laugh');
    clock.advance(700);
    expect(queue.active).toBeNull();
    expect(played).toEqual(['warning', 'success', 'laugh']);
  });

  it('caps durations and clears pending events', () => {
    const clock = createScheduler();
    const queue = new InvenBotQueue(() => undefined, clock.scheduler);

    queue.enqueue('success', { duration: 10_000 });
    expect(queue.active?.duration).toBe(2200);
    queue.enqueue('laugh');
    queue.clear();
    clock.advance(5000);
    expect(queue.active).toBeNull();
  });

  it('finishes shipping without changing the existing reactions', () => {
    const clock = createScheduler();
    const queue = new InvenBotQueue(() => undefined, clock.scheduler);
    queue.enqueue('shipping');
    expect(queue.active?.state).toBe('shipping');
    clock.advance(1900);
    expect(queue.active).toBeNull();
    queue.enqueue('found');
    expect(queue.active?.state).toBe('found');
    clock.advance(1300);
    expect(queue.active).toBeNull();
  });

  it('plays the movement stamping reaction as a bounded one-shot', () => {
    const clock = createScheduler();
    const queue = new InvenBotQueue(() => undefined, clock.scheduler);
    queue.enqueue('stamping');
    expect(queue.active?.state).toBe('stamping');
    clock.advance(1000);
    expect(queue.active).toBeNull();
  });
});
