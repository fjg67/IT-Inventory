import { useEffect, useState } from 'react';
import type { InvenBotBubbleMessage } from './invenBotContext';

/**
 * Bulle de dialogue d'InvenBot. La région `status` est toujours montée pour que
 * les lecteurs d'écran annoncent le texte complet ; l'effet machine à écrire
 * n'est que visuel (aria-hidden).
 */
export function InvenBotBubble({
  message,
  instant = false,
  className = '',
}: {
  message: InvenBotBubbleMessage | null;
  instant?: boolean;
  className?: string;
}) {
  const [typed, setTyped] = useState(0);
  const text = message?.text ?? '';
  const characters = Array.from(text);

  useEffect(() => {
    if (!message) return;
    const total = Array.from(message.text).length;
    if (instant) {
      setTyped(total);
      return;
    }
    setTyped(0);
    const timer = window.setInterval(() => {
      setTyped((count) => {
        if (count + 1 >= total) window.clearInterval(timer);
        return Math.min(count + 1, total);
      });
    }, 28);
    return () => window.clearInterval(timer);
  }, [message, instant]);

  return (
    <div className={`invenbot-bubble-region ${className}`} role="status" aria-live="polite">
      {message && (
        <span className="invenbot-bubble" key={message.id}>
          <span className="sr-only">{text}</span>
          <span className="invenbot-bubble__text" aria-hidden="true">
            {characters.slice(0, typed).join('')}
            <span className="invenbot-bubble__ghost">{characters.slice(typed).join('')}</span>
          </span>
        </span>
      )}
    </div>
  );
}
