import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { PARC_PC_COLORS } from './tokens';

export interface PCStateBarSegment {
  key: string;
  value: number;
  total: number;
  color: string;
}

interface PCStateBarProps {
  segments: PCStateBarSegment[];
  height?: number;
}

const SegmentFill: React.FC<{ segment: PCStateBarSegment; index: number; height: number }> = ({ segment, index, height }) => {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(index * 90, withTiming(1, { duration: 420 }));
  }, [index, progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: progress.value }],
    opacity: progress.value,
  }));

  return (
    <View style={[styles.segmentWrap, { flex: segment.total > 0 ? segment.value / segment.total : 0 }]}>
      <Animated.View style={[styles.segment, { height, backgroundColor: segment.color }, animatedStyle]} />
    </View>
  );
};

export const PCStateBar: React.FC<PCStateBarProps> = ({ segments, height = 8 }) => {
  const total = Math.max(segments.reduce((sum, segment) => sum + segment.value, 0), 1);

  return (
    <View style={[styles.rail, { height, borderRadius: height / 2 }]}>
      {segments.filter((segment) => segment.value > 0).map((segment, index) => (
        <SegmentFill
          key={segment.key}
          segment={{ ...segment, total }}
          index={index}
          height={height}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  rail: {
    flexDirection: 'row',
    overflow: 'hidden',
    backgroundColor: PARC_PC_COLORS.bg_card,
  },
  segmentWrap: {
    height: '100%',
    overflow: 'hidden',
  },
  segment: {
    width: '100%',
    transform: [{ scaleX: 0 }],
  },
});
