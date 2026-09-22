import React, { useEffect } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Svg, { G, Circle, CircleProps } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  withDelay,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { CA_THEME } from '@/constants/caTheme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface DonutSegment {
  color: string;
  value: number; // The actual count
}

interface PCDonutChartProps {
  segments: DonutSegment[];
  total: number;
  size?: number;
  strokeWidth?: number;
}

export const PCDonutChart = ({
  segments,
  total,
  size = 120,
  strokeWidth = 14,
}: PCDonutChartProps) => {
  const center = size / 2;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Animation progress (0 to 1)
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = 0;
    progress.value = withDelay(
      300,
      withTiming(1, { duration: 1200, easing: Easing.out(Easing.cubic) })
    );
  }, [total]);

  let currentAngle = 0; // Starts from 12 o'clock

  return (
    <View style={[{ width: size, height: size }, styles.container]}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <G rotation="-90" origin={`${center}, ${center}`}>
          {total === 0 && (
            <Circle
              cx={center}
              cy={center}
              r={radius}
              stroke={CA_THEME.borderGray}
              strokeWidth={strokeWidth}
              fill="transparent"
            />
          )}

          {total > 0 &&
            segments.map((seg, index) => {
              if (seg.value === 0) return null;

              const percentage = seg.value / total;
              const strokeDashoffset = circumference - percentage * circumference;
              
              // Angle for the start of this segment
              const startAngle = currentAngle;
              currentAngle += percentage * 360;

              // Use an animated prop to draw the stroke
              const animatedProps = useAnimatedProps<CircleProps>(() => {
                // Scale the dashoffset from empty (circumference) to its target
                const animatedOffset = interpolate(
                  progress.value,
                  [0, 1],
                  [circumference, strokeDashoffset]
                );

                return {
                  strokeDashoffset: animatedOffset,
                };
              });

              return (
                <AnimatedCircle
                  key={index}
                  cx={center}
                  cy={center}
                  r={radius}
                  stroke={seg.color}
                  strokeWidth={strokeWidth}
                  fill="transparent"
                  strokeDasharray={`${circumference} ${circumference}`}
                  animatedProps={animatedProps}
                  strokeLinecap="round"
                  origin={`${center}, ${center}`}
                  rotation={startAngle}
                />
              );
            })}
        </G>
      </Svg>
      <View style={[StyleSheet.absoluteFill, styles.centerContent]}>
        <Text style={styles.totalText}>{total}</Text>
        <Text style={styles.totalLabel}>TOTAL</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  totalText: {
    fontFamily: CA_THEME.fontFamilyBold,
    fontSize: 26,
    color: CA_THEME.textPrimary,
    lineHeight: 30,
  },
  totalLabel: {
    fontFamily: CA_THEME.fontFamilySemiBold,
    fontSize: 10,
    color: CA_THEME.textMuted,
    marginTop: -2,
  },
});
