import { useId } from 'react';

// Courbes stylisées purement décoratives : l'API ne fournit pas d'historique.
const shapes = [
  [0.62, 0.55, 0.6, 0.42, 0.48, 0.34, 0.38, 0.26, 0.3, 0.22],
  [0.4, 0.5, 0.38, 0.56, 0.44, 0.6, 0.48, 0.52, 0.42, 0.46],
  [0.7, 0.58, 0.64, 0.5, 0.56, 0.44, 0.5, 0.36, 0.42, 0.3],
];

const width = 120;
const height = 36;

function buildPath(points: number[]): { line: string; area: string } {
  const step = width / (points.length - 1);
  const coords = points.map((p, i) => [i * step, 4 + p * (height - 8)] as const);
  let line = `M${coords[0][0]},${coords[0][1]}`;
  for (let i = 1; i < coords.length; i += 1) {
    const [x0, y0] = coords[i - 1];
    const [x1, y1] = coords[i];
    const mid = (x0 + x1) / 2;
    line += ` C${mid},${y0} ${mid},${y1} ${x1},${y1}`;
  }
  return { line, area: `${line} L${width},${height} L0,${height} Z` };
}

const paths = shapes.map(buildPath);

export function Sparkline({ variant = 0, className = '' }: { variant?: number; className?: string }) {
  const id = useId().replace(/:/g, '');
  const { line, area } = paths[variant % paths.length];
  return (
    <svg className={`sparkline ${className}`} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={`spark-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="currentColor" stopOpacity=".22" />
          <stop offset="1" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
        <clipPath id={`spark-clip-${id}`}>
          <rect className="sparkline__reveal" x="0" y="0" width={width} height={height} />
        </clipPath>
      </defs>
      <g clipPath={`url(#spark-clip-${id})`}>
        <path className="sparkline__area" d={area} fill={`url(#spark-${id})`} />
        <path className="sparkline__line" d={line} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      </g>
    </svg>
  );
}
