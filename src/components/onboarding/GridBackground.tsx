import React, { useMemo } from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import Svg, { Line } from 'react-native-svg';

const GRID_SIZE = 40;
const GRID_STROKE = 'rgba(34,197,94,0.025)';

export const GridBackground: React.FC = () => {
  const { width, height } = useWindowDimensions();

  const horizontal = useMemo(() => Math.ceil(height / GRID_SIZE), [height]);
  const vertical = useMemo(() => Math.ceil(width / GRID_SIZE), [width]);

  return (
    <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
      {Array.from({ length: horizontal }).map((_, i) => {
        const y = i * GRID_SIZE;
        return <Line key={`h-${i}`} x1={0} y1={y} x2={width} y2={y} stroke={GRID_STROKE} strokeWidth={1} />;
      })}

      {Array.from({ length: vertical }).map((_, i) => {
        const x = i * GRID_SIZE;
        return <Line key={`v-${i}`} x1={x} y1={0} x2={x} y2={height} stroke={GRID_STROKE} strokeWidth={1} />;
      })}
    </Svg>
  );
};
