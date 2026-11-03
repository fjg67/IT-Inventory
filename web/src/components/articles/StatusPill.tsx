import { memo } from 'react';

export const StatusPill = memo(function StatusPill({
  quantity,
  minimumStock,
}: {
  quantity: number;
  minimumStock: number;
}) {
  const status = quantity <= 0
    ? { label: 'Rupture', tone: 'empty' }
    : quantity < minimumStock
      ? { label: 'Stock faible', tone: 'low' }
      : { label: 'Disponible', tone: 'ok' };

  return (
    <span className={`stock-status stock-status--${status.tone}`}>
      <i aria-hidden="true" />
      {status.label}
    </span>
  );
});
