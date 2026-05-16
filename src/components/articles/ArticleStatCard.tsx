import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Animated, { interpolate, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { OBSIDIAN_COLORS } from '@/constants/colors';
import { useCountUp } from '@/hooks/useCountUp';

interface ArticleStatCardProps {
  icon: string;
  value: number;
  label: string;
  caption: string;
  color: string;
  subtle: string;
  onPress?: () => void;
}

const ArticleStatCardComponent: React.FC<ArticleStatCardProps> = ({ icon, value, label, caption, color, subtle, onPress }) => {
  const scale = useSharedValue(0);
  const count = useCountUp(value, { duration: 600 });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(scale.value, [0, 1], [1, 0.95]) }],
  }));

  return (
    <Animated.View style={[styles.wrapper, animatedStyle]}>
      <Pressable
        style={styles.card}
        onPress={onPress}
        onPressIn={() => {
          scale.value = withSpring(1);
        }}
        onPressOut={() => {
          scale.value = withSpring(0);
        }}
      >
        <View style={[styles.iconWrap, { backgroundColor: subtle }]}>
          <Icon name={icon} size={16} color={color} />
        </View>
        <Text style={styles.value}>{count}</Text>
        <Text style={styles.label}>{label}</Text>
        <Text style={[styles.caption, { color }]}>{caption}</Text>
        <View style={[styles.indicator, { backgroundColor: color }]} />
      </Pressable>
    </Animated.View>
  );
};

export const ArticleStatCard = React.memo(ArticleStatCardComponent);

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  card: {
    backgroundColor: OBSIDIAN_COLORS.bg_card,
    borderColor: OBSIDIAN_COLORS.border_subtle,
    borderRadius: 14,
    borderWidth: 1,
    minHeight: 126,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  iconWrap: {
    alignItems: 'center',
    borderRadius: 10,
    height: 22,
    justifyContent: 'center',
    width: 22,
  },
  value: {
    color: OBSIDIAN_COLORS.text_primary,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.8,
    marginTop: 7,
  },
  label: {
    color: OBSIDIAN_COLORS.text_muted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginTop: 2,
    textTransform: 'uppercase',
  },
  caption: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 8,
  },
  indicator: {
    borderRadius: 2,
    height: 3,
    marginTop: 8,
    width: 36,
  },
});
