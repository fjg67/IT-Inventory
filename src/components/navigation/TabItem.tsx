import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { TAB_BAR_COLORS } from '@/constants/tabConfig';
import TabBadge from './TabBadge';

const AnimatedIcon = Animated.createAnimatedComponent(Icon);

interface TabItemProps {
  label: string;
  icon: string;
  iconActive: string;
  isFocused: boolean;
  badgeCount?: number;
  onPress: () => void;
  onLongPress: () => void;
}

const TabItem: React.FC<TabItemProps> = ({
  label,
  icon,
  iconActive,
  isFocused,
  badgeCount = 0,
  onPress,
  onLongPress,
}) => {
  const progress = useSharedValue(isFocused ? 1 : 0);
  const pressScale = useSharedValue(1);

  useEffect(() => {
    progress.value = withTiming(isFocused ? 1 : 0, { duration: 200 });
  }, [isFocused, progress]);

  const handlePress = () => {
    pressScale.value = withSequence(
      withSpring(isFocused ? 0.92 : 0.82, { damping: 10, stiffness: 280 }),
      withSpring(1, { damping: 12, stiffness: 220 }),
    );
    onPress();
  };

  const containerAnim = useAnimatedStyle(() => ({
    transform: [{ scale: pressScale.value }],
  }));

  const iconAnim = useAnimatedStyle(() => ({
    color: interpolateColor(
      progress.value,
      [0, 1],
      [TAB_BAR_COLORS.textDim, TAB_BAR_COLORS.greenLight],
    ) as string,
    textShadowColor: TAB_BAR_COLORS.greenGlow,
    textShadowRadius: progress.value * 10,
  }));

  const topIndicatorAnim = useAnimatedStyle(() => ({
    opacity: withSpring(isFocused ? 1 : 0, { damping: 16, stiffness: 220 }),
    transform: [{ scaleX: withSpring(isFocused ? 1 : 0, { damping: 14, stiffness: 220 }) }],
  }));

  const labelAnim = useAnimatedStyle(() => ({
    opacity: withTiming(isFocused ? 1 : 0, { duration: 150 }),
    transform: [{ translateY: withSpring(isFocused ? 0 : 4, { damping: 15, stiffness: 180 }) }],
  }));

  return (
    <Pressable
      onPress={handlePress}
      onLongPress={onLongPress}
      accessibilityRole="tab"
      accessibilityState={isFocused ? { selected: true } : {}}
      style={styles.pressable}
    >
      <Animated.View style={[styles.content, containerAnim]}>
        <Animated.View style={[styles.topIndicator, topIndicatorAnim]} />

        <View style={styles.iconWrap}>
          <AnimatedIcon
            name={isFocused ? iconActive : icon}
            size={22}
            style={iconAnim}
          />
          <TabBadge count={badgeCount} visible={badgeCount > 0} />
        </View>

        <Animated.View style={labelAnim} pointerEvents="none">
          <Text style={styles.label}>{label}</Text>
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  pressable: {
    flex: 1,
    minHeight: 44,
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  topIndicator: {
    width: 20,
    height: 3,
    borderRadius: 2,
    backgroundColor: TAB_BAR_COLORS.greenLight,
    marginBottom: 6,
  },
  iconWrap: {
    minHeight: 24,
    minWidth: 28,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  label: {
    color: TAB_BAR_COLORS.greenLight,
    fontSize: 10,
    fontWeight: '600',
    marginTop: 3,
    lineHeight: 12,
  },
});

export default TabItem;
