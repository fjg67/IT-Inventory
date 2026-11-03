import { useEffect, useRef } from 'react';
import { InvenBot, useMotionReduced, type InvenBotSize } from './InvenBot';
import { InvenBotBubble } from './InvenBotBubble';
import { useInvenBot } from './useInvenBot';

/**
 * InvenBot branché sur le Provider : état, regard, bulle et easter eggs
 * (1 clic = rire, 5 clics rapprochés = salto).
 */
export function InvenBotStage({
  size = 'large',
  className = '',
  bubbleClassName = '',
  workshop = false,
  gearUp = false,
}: {
  size?: InvenBotSize;
  className?: string;
  bubbleClassName?: string;
  workshop?: boolean;
  gearUp?: boolean;
}) {
  const bot = useInvenBot();
  const reduced = useMotionReduced();
  const clicks = useRef({ count: 0, timer: 0 });

  useEffect(() => () => {
    if (typeof window !== 'undefined') window.clearTimeout(clicks.current.timer);
  }, []);

  function handleClick() {
    const tracker = clicks.current;
    window.clearTimeout(tracker.timer);
    tracker.count += 1;
    if (tracker.count >= 5) {
      tracker.count = 0;
      bot.play('celebrate');
      bot.say('Youpi ! Salto réussi 🎉', { priority: 2 });
      return;
    }
    bot.play('laugh');
    tracker.timer = window.setTimeout(() => {
      tracker.count = 0;
    }, 1400);
  }

  const off = bot.motion === 'off';

  return (
    <span className={`invenbot-stage ${className}`}>
      <InvenBotBubble message={bot.bubble} instant={reduced} className={bubbleClassName} />
      <span className="invenbot-stage__hit" onClick={handleClick}>
        <InvenBot
          size={size}
          state={off ? bot.base : bot.state}
          eventId={bot.eventId}
          lookAt={off ? null : bot.look}
          trackPointer={!off && size === 'large'}
          workshop={workshop}
          gearUp={gearUp}
        />
      </span>
    </span>
  );
}
