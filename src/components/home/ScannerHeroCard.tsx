import React from 'react';
import { Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { OBSIDIAN_COLORS } from '@/constants/colors';

interface ScannerHeroCardProps {
  activeMode: 'entree' | 'sortie' | 'consultation';
  onSelectMode: (mode: 'entree' | 'sortie' | 'consultation') => void;
  onScanPress: () => void;
}

interface ModePillProps {
  mode: 'entree' | 'sortie' | 'consultation';
  activeMode: 'entree' | 'sortie' | 'consultation';
  onSelectMode: (mode: 'entree' | 'sortie' | 'consultation') => void;
}

const actionConfig = {
  entree: {
    icon: 'arrow-down-circle-outline',
    label: 'Entree',
    bg: OBSIDIAN_COLORS.green_subtle,
    color: OBSIDIAN_COLORS.green_light,
  },
  sortie: {
    icon: 'arrow-up-circle-outline',
    label: 'Sortie',
    bg: OBSIDIAN_COLORS.danger_subtle,
    color: OBSIDIAN_COLORS.danger,
  },
  consultation: {
    icon: 'magnify',
    label: 'Consultation',
    bg: OBSIDIAN_COLORS.info_subtle,
    color: OBSIDIAN_COLORS.info,
  },
} as const;

const ModePill: React.FC<ModePillProps> = ({ mode, activeMode, onSelectMode }) => {
  const conf = actionConfig[mode];
  const pressed = useSharedValue(0);

  const pressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(pressed.value, [0, 1], [1, 0.95]) }],
  }));

  return (
    <Animated.View style={[styles.modePillWrap, pressStyle]}>
      <Pressable
        onPress={() => onSelectMode(mode)}
        onPressIn={() => {
          pressed.value = withSpring(1);
        }}
        onPressOut={() => {
          pressed.value = withSpring(0);
        }}
        style={[
          styles.modePill,
          { backgroundColor: conf.bg },
          activeMode === mode && styles.modePillActive,
        ]}
      >
        <Icon name={conf.icon} size={16} color={conf.color} />
        <Text style={[styles.modePillText, { color: conf.color }]}>{conf.label}</Text>
      </Pressable>
    </Animated.View>
  );
};

const ScannerHeroCardComponent: React.FC<ScannerHeroCardProps> = ({
  activeMode,
  onSelectMode,
  onScanPress,
}) => {
  const iconPulse = useSharedValue(0);
  const scanLine = useSharedValue(0);

  React.useEffect(() => {
    iconPulse.value = withRepeat(withTiming(1, { duration: 1300, easing: Easing.inOut(Easing.ease) }), -1, true);
    scanLine.value = withRepeat(withTiming(1, { duration: 2000, easing: Easing.linear }), -1, false);
  }, [iconPulse, scanLine]);

  const iconStyle = useAnimatedStyle(() => ({
    opacity: interpolate(iconPulse.value, [0, 1], [0.7, 1]),
    transform: [{ scale: interpolate(iconPulse.value, [0, 1], [0.96, 1.06]) }],
  }));

  const scanLineStyle = useAnimatedStyle(() => ({
    opacity: 0.6,
    transform: [{ translateY: interpolate(scanLine.value, [0, 1], [8, 42]) }],
  }));

  return (
    <View style={styles.card}>
      <View style={styles.glowOrb} />
      <Text style={styles.title}>Scanner un article</Text>
      <Text style={styles.subtitle}>Touchez pour scanner ou choisissez une action</Text>

      <View style={styles.visualRow}>
        <View style={styles.barcodeWrap}>
          <Animated.View style={iconStyle}>
            <Icon name="barcode-scan" size={40} color={OBSIDIAN_COLORS.green_light} />
          </Animated.View>
          <Animated.View style={[styles.scanLine, scanLineStyle]} />
        </View>

        <TouchableOpacity style={styles.scanButton} activeOpacity={0.85} onPress={onScanPress}>
          <Icon name="barcode" size={26} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.modeRow}>
        <ModePill mode="entree" activeMode={activeMode} onSelectMode={onSelectMode} />
        <ModePill mode="sortie" activeMode={activeMode} onSelectMode={onSelectMode} />
        <ModePill mode="consultation" activeMode={activeMode} onSelectMode={onSelectMode} />
      </View>
    </View>
  );
};

export const ScannerHeroCard = React.memo(ScannerHeroCardComponent);

const styles = StyleSheet.create({
  card: {
    backgroundColor: OBSIDIAN_COLORS.bg_card_elevated,
    borderColor: OBSIDIAN_COLORS.border_card,
    borderRadius: 20,
    borderWidth: 1,
    marginTop: 18,
    overflow: 'hidden',
    padding: 16,
  },
  glowOrb: {
    backgroundColor: OBSIDIAN_COLORS.green_glow,
    borderRadius: 60,
    height: 120,
    position: 'absolute',
    right: -16,
    top: -18,
    width: 120,
  },
  title: {
    color: OBSIDIAN_COLORS.text_primary,
    fontSize: 18,
    fontWeight: '700',
  },
  subtitle: {
    color: OBSIDIAN_COLORS.text_muted,
    fontSize: 13,
    marginTop: 4,
  },
  visualRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
  },
  barcodeWrap: {
    justifyContent: 'center',
    minHeight: 54,
    minWidth: 72,
    position: 'relative',
  },
  scanLine: {
    backgroundColor: OBSIDIAN_COLORS.green_light,
    borderRadius: 4,
    height: 2,
    left: 4,
    position: 'absolute',
    right: 12,
  },
  scanButton: {
    alignItems: 'center',
    backgroundColor: OBSIDIAN_COLORS.green_primary,
    borderRadius: 26,
    elevation: 6,
    height: 52,
    justifyContent: 'center',
    shadowColor: OBSIDIAN_COLORS.green_light,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    width: 52,
  },
  modeRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
  },
  modePillWrap: {
    flex: 1,
  },
  modePill: {
    alignItems: 'center',
    borderRadius: 12,
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    paddingVertical: 10,
  },
  modePillActive: {
    borderColor: OBSIDIAN_COLORS.border_accent,
    borderWidth: 1,
  },
  modePillText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
