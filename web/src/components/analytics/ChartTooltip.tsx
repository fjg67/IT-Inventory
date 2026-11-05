import type { RefObject } from 'react';

export function ChartTooltip({
  id,
  tooltipRef,
}: {
  id: string;
  tooltipRef: RefObject<HTMLDivElement | null>;
}) {
  return (
    <div
      ref={tooltipRef}
      id={id}
      className="analytics-chart-tooltip"
      role="tooltip"
      aria-live="off"
      hidden
    />
  );
}
