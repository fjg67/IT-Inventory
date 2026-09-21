import React, { useMemo } from 'react';
import { View } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';

interface CASparklineProps {
  data: number[];
  width?: number;
  height?: number;
  lineColor: string;
  fillColor?: string;
  strokeWidth?: number;
}

const smoothCurve = (points: {x: number, y: number}[]) => {
  if (points.length === 0) return '';
  if (points.length === 1) return `M${points[0].x},${points[0].y}`;

  let d = `M${points[0].x},${points[0].y}`;

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = i > 0 ? points[i - 1] : points[0];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = i !== points.length - 2 ? points[i + 2] : p2;

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;

    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    d += ` C${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
  }
  return d;
};

export const CASparkline: React.FC<CASparklineProps> = ({
  data,
  width = 100,
  height = 36,
  lineColor,
  fillColor,
  strokeWidth = 2.5,
}) => {
  const pathData = useMemo(() => {
    if (!data || data.length === 0) return null;
    const max = Math.max(...data, 1);
    const min = Math.min(...data, 0);
    const range = Math.max(max - min, 1);
    const stepX = data.length > 1 ? width / (data.length - 1) : width;

    const points = data.map((value, index) => {
      const x = index * stepX;
      // Padding so the stroke doesn't get cut off
      const padding = strokeWidth;
      const usableHeight = height - padding * 2;
      const y = padding + usableHeight - ((value - min) / range) * usableHeight;
      return { x, y };
    });

    const d = smoothCurve(points);
    return { d, points };
  }, [data, width, height, strokeWidth]);

  if (!pathData) return null;

  const areaPath = `${pathData.d} L${width},${height} L0,${height} Z`;

  return (
    <View style={{ width, height }}>
      <Svg width={width} height={height}>
        {fillColor && (
          <Defs>
            <LinearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor={fillColor} stopOpacity="0.4" />
              <Stop offset="100%" stopColor={fillColor} stopOpacity="0.0" />
            </LinearGradient>
          </Defs>
        )}
        {fillColor && <Path d={areaPath} fill="url(#gradient)" />}
        <Path
          d={pathData.d}
          fill="none"
          stroke={lineColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  );
};
