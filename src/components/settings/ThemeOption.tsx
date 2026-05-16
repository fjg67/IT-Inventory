import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { SETTINGS_COLORS } from '@/constants/settingsColors';

interface ThemeOptionProps {
  icon: string;
  label: string;
  color: string;
  bg: string;
  active: boolean;
  onPress: () => void;
}

export const ThemeOption: React.FC<ThemeOptionProps> = ({ icon, label, color, bg, active, onPress }) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPress={onPress}
        onPressIn={() => {
          scale.value = withSpring(0.95, { damping: 16, stiffness: 260 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 16, stiffness: 260 });
        }}
        style={[
          styles.option,
          active && {
            backgroundColor: bg,
            borderColor: color,
          },
        ]}
      >
        <View style={[styles.iconWrap, { backgroundColor: bg }]}> 
          <Icon name={icon} size={16} color={color} />
        </View>
        <Text style={[styles.label, active ? { color, fontWeight: '700' } : undefined]}>{label}</Text>
        {active ? <View style={[styles.indicator, { backgroundColor: color }]} /> : null}
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  option: {
    flex: 1,
    minHeight: 96,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: SETTINGS_COLORS.border_subtle,
    paddingVertical: 12,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    position: 'relative',
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 12,
    color: SETTINGS_COLORS.text_muted,
    fontWeight: '500',
  },
  indicator: {
    position: 'absolute',
    bottom: 8,
    width: 16,
    height: 3,
    borderRadius: 3,
  },
});
