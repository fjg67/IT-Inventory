import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Animated, { FadeIn, SlideInDown, interpolate, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { OBSIDIAN_COLORS } from '@/constants/colors';

interface ArticleFABProps {
  onPress: () => void;
}

const ArticleFABComponent: React.FC<ArticleFABProps> = ({ onPress }) => {
  const scale = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(scale.value, [0, 1], [1, 0.9]) }],
  }));

  return (
    <Animated.View entering={FadeIn.delay(300).duration(300)} style={styles.wrap}>
      <Animated.View entering={SlideInDown.delay(300).duration(500)} style={animatedStyle}>
        <Pressable
          onPress={onPress}
          onPressIn={() => {
            scale.value = withSpring(1);
          }}
          onPressOut={() => {
            scale.value = withSpring(0);
          }}
          style={styles.fab}
        >
          <Icon name="plus" size={28} color="#FFFFFF" />
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
};

export const ArticleFAB = React.memo(ArticleFABComponent);

const styles = StyleSheet.create({
  wrap: {
    bottom: 24,
    position: 'absolute',
    right: 16,
    zIndex: 20,
  },
  fab: {
    alignItems: 'center',
    backgroundColor: OBSIDIAN_COLORS.green_primary,
    borderRadius: 16,
    elevation: 8,
    height: 56,
    justifyContent: 'center',
    shadowColor: OBSIDIAN_COLORS.green_light,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    width: 56,
  },
});
