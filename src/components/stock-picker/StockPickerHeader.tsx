import React, { useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Animated, {
  FadeInDown,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { OBSIDIAN_COLORS } from '@/constants/colors';

interface StockPickerHeaderProps {
  currentSiteName?: string;
  onBack?: () => void;
}

export const StockPickerHeader: React.FC<StockPickerHeaderProps> = ({ currentSiteName, onBack }) => {
  const pulse = useSharedValue(0);

  useEffect(() => {
    pulse.value = withRepeat(withTiming(1, { duration: 1200 }), -1, true);
    return () => {
      pulse.value = 0;
    };
  }, [pulse]);

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: interpolate(pulse.value, [0, 1], [0.45, 1]),
    transform: [{ scale: interpolate(pulse.value, [0, 1], [0.84, 1.08]) }],
  }));

  return (
    <Animated.View entering={FadeInDown.duration(250)} style={styles.wrap}>
      <View style={styles.row}>
        {onBack ? (
          <TouchableOpacity onPress={onBack} activeOpacity={0.85} style={styles.backBtn}>
            <Icon name="arrow-left" size={19} color={OBSIDIAN_COLORS.text_primary} />
          </TouchableOpacity>
        ) : (
          <View style={styles.backPlaceholder} />
        )}

        <View style={styles.titleWrap}>
          <Text style={styles.title}>Changer de site</Text>
          <Text style={styles.subTitle}>Selectionnez votre espace de travail</Text>
        </View>

        <View style={styles.badge}>
          <Animated.View style={[styles.dot, pulseStyle]} />
          <Text numberOfLines={1} style={styles.badgeText}>{currentSiteName ?? 'Site actif'}</Text>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: OBSIDIAN_COLORS.bg_card,
    borderWidth: 1,
    borderColor: OBSIDIAN_COLORS.border_subtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backPlaceholder: {
    width: 40,
    height: 40,
  },
  titleWrap: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    color: OBSIDIAN_COLORS.text_primary,
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  subTitle: {
    marginTop: 2,
    color: OBSIDIAN_COLORS.text_muted,
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  badge: {
    maxWidth: 124,
    minHeight: 30,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: OBSIDIAN_COLORS.border_accent,
    backgroundColor: OBSIDIAN_COLORS.green_subtle,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 99,
    backgroundColor: OBSIDIAN_COLORS.green_light,
  },
  badgeText: {
    color: OBSIDIAN_COLORS.green_light,
    fontSize: 11,
    fontWeight: '700',
    flexShrink: 1,
  },
});

export default StockPickerHeader;
