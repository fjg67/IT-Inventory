import { useEffect } from 'react';

export function DataToast({
  message,
  onDismiss,
}: {
  message: string | null;
  onDismiss: () => void;
}) {
  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(onDismiss, 2400);
    return () => window.clearTimeout(timer);
  }, [message, onDismiss]);

  return (
    <div className="articles-toast-region" role="status" aria-live="polite" aria-atomic="true">
      {message && <span className="articles-toast">{message}</span>}
    </div>
  );
}
