import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { OBSIDIAN_COLORS } from '@/constants/colors';

interface QuickActionCardProps {
  title: string;
  icon: string;
  color: string;
  subtleColor: string;
  onPress: () => void;
}

const QuickActionCardComponent: React.FC<QuickActionCardProps> = ({
  title,
  icon,
  color,
  subtleColor,
  onPress,
}) => {
  const press = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(press.value, [0, 1], [1, 0.96]) }],
    borderLeftWidth: interpolate(press.value, [0, 1], [3, 4]),
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPress={onPress}
        onPressIn={() => {
          press.value = withSpring(1);
        }}
        onPressOut={() => {
          press.value = withSpring(0);
        }}
        style={[styles.card, { borderLeftColor: color }]}
      >
        <View style={[styles.iconWrap, { backgroundColor: subtleColor }]}>
          <Icon name={icon} size={22} color={color} />
        </View>
        <Text style={styles.title}>{title}</Text>
      </Pressable>
    </Animated.View>
  );
};

export const QuickActionCard = React.memo(QuickActionCardComponent);

const styles = StyleSheet.create({
  card: {
    backgroundColor: OBSIDIAN_COLORS.bg_card,
    borderColor: OBSIDIAN_COLORS.border_subtle,
    borderLeftWidth: 3,
    borderRadius: 16,
    borderWidth: 1,
    minHeight: 108,
    padding: 20,
  },
  iconWrap: {
    alignItems: 'center',
    borderRadius: 22,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  title: {
    color: OBSIDIAN_COLORS.text_primary,
    fontSize: 14,
    fontWeight: '600',
    marginTop: 14,
  },
});
