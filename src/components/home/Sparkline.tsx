import React, { useMemo } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, Polyline, Stop } from 'react-native-svg';

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  lineColor: string;
  fillColor: string;
  highlightLast?: boolean;
}

const toPoints = (data: number[], width: number, height: number): string => {
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = Math.max(max - min, 1);
  const stepX = data.length > 1 ? width / (data.length - 1) : width;

  return data
    .map((value, index) => {
      const x = index * stepX;
      const y = height - ((value - min) / range) * height;
      return `${x},${y}`;
    })
    .join(' ');
};

const SparklineComponent: React.FC<SparklineProps> = ({
  data,
  width = 140,
  height = 48,
  lineColor,
  fillColor,
  highlightLast = false,
}) => {
  const safeData = data.length > 1 ? data : [0, ...data];

  const points = useMemo(
    () => toPoints(safeData, width, height - 8),
    [height, safeData, width],
  );

  const areaPath = useMemo(() => {
    const start = `M0,${height}`;
    const line = `L${points.replace(/ /g, ' L')}`;
    const end = `L${width},${height} Z`;
    return `${start} ${line} ${end}`;
  }, [height, points, width]);

  const lastPoint = useMemo(() => {
    const segments = points.split(' ');
    const last = segments[segments.length - 1] ?? '0,0';
    const [x, y] = last.split(',').map(Number);
    return { x, y };
  }, [points]);

  return (
    <View>
      <Svg width={width} height={height}>
        <Defs>
          <LinearGradient id="sparklineFill" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={fillColor} stopOpacity="0.35" />
            <Stop offset="1" stopColor={fillColor} stopOpacity="0.02" />
          </LinearGradient>
        </Defs>
        <Path d={areaPath} fill="url(#sparklineFill)" />
        <Polyline
          fill="none"
          points={points}
          stroke={lineColor}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
        />
        {highlightLast ? (
          <Circle cx={lastPoint.x} cy={lastPoint.y} r={3.8} fill={lineColor} />
        ) : null}
      </Svg>
    </View>
  );
};

export const Sparkline = React.memo(SparklineComponent);
