import { memo } from 'react';
import type { CSSProperties } from 'react';

export const StockGauge = memo(function StockGauge({
  quantity,
  minimumStock,
}: {
  quantity: number;
  minimumStock: number;
}) {
  const ratio = minimumStock > 0
    ? Math.max(0, Math.min(1, quantity / minimumStock))
    : quantity > 0 ? 1 : 0;
  const tone = quantity <= 0 ? 'empty' : quantity < minimumStock ? 'low' : 'ok';
  const style = { '--stock-fill': ratio } as CSSProperties;

  return (
    <span
      className={`stock-gauge stock-gauge--${tone}`}
      role="img"
      aria-label={`Stock : ${quantity}, seuil minimum : ${minimumStock}`}
    >
      <i style={style} />
    </span>
  );
});
