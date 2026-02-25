// ============================================
// PREMIUM TAB BAR - IT-Inventory Application
// Tab bar avec bouton Scan central surélevé
// ============================================

import React, { useCallback, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Vibration, Platform, useWindowDimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import {
  premiumTypography,
  premiumShadows,
  premiumSpacing,
} from '../../constants/premiumTheme';
import { useTheme } from '@/theme';
import { isTablet as checkIsTablet } from '../../utils/responsive';

// ==================== CONFIG ====================
type TabCfg = { icon: string; iconFocused: string; label: string };

const TAB_CONFIG: Record<string, TabCfg> = {
  Dashboard:  { icon: 'home-outline',       iconFocused: 'home',                    label: 'Accueil' },
  Articles:   { icon: 'package-variant',     iconFocused: 'package-variant-closed',  label: 'Articles' },
  Scan:       { icon: 'barcode-scan',        iconFocused: 'barcode-scan',            label: 'Scan' },
  Mouvements: { icon: 'swap-horizontal',     iconFocused: 'swap-horizontal',         label: 'Mouvements' },
  Settings:   { icon: 'cog-outline',         iconFocused: 'cog',                     label: 'Réglages' },
};

// ==================== TAB ITEM STANDARD ====================
interface TabItemProps {
  routeName: string;
  isFocused: boolean;
  onPress: () => void;
  onLongPress: () => void;
}

const TabItem: React.FC<TabItemProps> = ({ routeName, isFocused, onPress, onLongPress }) => {
  const config = TAB_CONFIG[routeName] ?? { icon: 'circle-outline', iconFocused: 'circle', label: routeName };
  const { width } = useWindowDimensions();
  const tablet = checkIsTablet(width);
  const { colors } = useTheme();

  const iconScale = useSharedValue(1);
  const dotOpacity = useSharedValue(0);
  const dotScale = useSharedValue(0);

  useEffect(() => {
    if (isFocused) {
      iconScale.value = withSpring(1.12, { damping: 12, stiffness: 150 });
      dotOpacity.value = withTiming(1, { duration: 200 });
      dotScale.value = withSpring(1, { damping: 10, stiffness: 200 });
    } else {
      iconScale.value = withTiming(1, { duration: 200 });
      dotOpacity.value = withTiming(0, { duration: 200 });
      dotScale.value = withTiming(0, { duration: 150 });
    }
  }, [isFocused, iconScale, dotOpacity, dotScale]);

  const iconAnim = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
  }));

  const dotAnim = useAnimatedStyle(() => ({
    opacity: dotOpacity.value,
    transform: [{ scale: dotScale.value }],
  }));

  const handlePress = useCallback(() => {
    Vibration.vibrate(10);
    onPress();
  }, [onPress]);

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityState={isFocused ? { selected: true } : {}}
      onPress={handlePress}
      onLongPress={onLongPress}
      style={[s.tabItem, tablet && s.tabItemTablet]}
      activeOpacity={0.7}
    >
      <Animated.View style={iconAnim}>
        <Icon
          name={isFocused ? config.iconFocused : config.icon}
          size={tablet ? 28 : 23}
          color={isFocused ? colors.tabBarActive : colors.tabBarInactive}
        />
      </Animated.View>

      <Text style={[s.tabLabel, { color: colors.tabBarInactive }, tablet && s.tabLabelTablet, isFocused && { color: colors.tabBarActive, fontWeight: '600' as const }]} numberOfLines={1}>
        {config.label}
      </Text>

      <Animated.View style={[s.activeDot, { backgroundColor: colors.tabBarActive }, tablet && s.activeDotTablet, dotAnim]} />
    </TouchableOpacity>
  );
};

// ==================== SCAN CENTER BUTTON ====================
interface ScanBtnProps {
  isFocused: boolean;
  onPress: () => void;
  onLongPress: () => void;
}

const ScanCenterButton: React.FC<ScanBtnProps> = ({ isFocused, onPress, onLongPress }) => {
  const { width } = useWindowDimensions();
  const tablet = checkIsTablet(width);
  const scale = useSharedValue(1);
  const glowOpacity = useSharedValue(0);
  const { colors, gradients } = useTheme();

  useEffect(() => {
    if (isFocused) {
      scale.value = withSpring(1.05, { damping: 12, stiffness: 120 });
      glowOpacity.value = withTiming(1, { duration: 300 });
    } else {
      scale.value = withTiming(1, { duration: 200 });
      glowOpacity.value = withTiming(0, { duration: 200 });
    }
  }, [isFocused, scale, glowOpacity]);

  const btnAnim = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const glowAnim = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const handlePress = useCallback(() => {
    Vibration.vibrate(15);
    onPress();
  }, [onPress]);

  return (
    <View style={[s.scanBtnWrapper, tablet && s.scanBtnWrapperTablet]}>
      {/* Glow ring (visible quand actif) */}
      <Animated.View style={[s.scanGlow, tablet && s.scanGlowTablet, glowAnim]} />

      <Animated.View style={btnAnim}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityState={isFocused ? { selected: true } : {}}
          onPress={handlePress}
          onLongPress={onLongPress}
          activeOpacity={0.8}
          style={[s.scanBtnOuter, { borderColor: colors.tabBarBackground }, tablet && s.scanBtnOuterTablet]}
        >
          <LinearGradient
            colors={isFocused ? [...gradients.scanButton.slice(0, 2)] : [...gradients.scanButton]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={s.scanBtnGrad}
          >
            <Icon name="barcode-scan" size={tablet ? 32 : 26} color="#FFFFFF" />
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>

      <Text style={[s.scanLabel, { color: colors.tabBarInactive }, tablet && s.scanLabelTablet, isFocused && { color: colors.tabBarActive, fontWeight: '600' as const }]}>Scan</Text>
    </View>
  );
};

// ==================== MAIN TAB BAR ====================
const PremiumTabBar: React.FC<BottomTabBarProps> = ({ state, descriptors, navigation }) => {
  const { width } = useWindowDimensions();
  const tablet = checkIsTablet(width);
  const { colors } = useTheme();

  return (
    <View style={[s.container, { backgroundColor: colors.tabBarBackground, borderTopColor: colors.tabBarBorder }]}>
      <View style={[s.tabBar, tablet && s.tabBarTablet]}>
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          const onLongPress = () => {
            navigation.emit({ type: 'tabLongPress', target: route.key });
          };

          // Bouton Scan central surélevé
          if (route.name === 'Scan') {
            return (
              <ScanCenterButton
                key={route.key}
                isFocused={isFocused}
                onPress={onPress}
                onLongPress={onLongPress}
              />
            );
          }

          return (
            <TabItem
              key={route.key}
              routeName={route.name}
              isFocused={isFocused}
              onPress={onPress}
              onLongPress={onLongPress}
            />
          );
        })}
      </View>
    </View>
  );
};

// ==================== STYLES ====================
const s = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    ...premiumShadows.md,
  },
  tabBar: {
    flexDirection: 'row',
    height: 68,
    alignItems: 'flex-end',
    paddingBottom: Platform.OS === 'ios' ? 4 : 6,
    paddingHorizontal: premiumSpacing.xs,
  },
  tabBarTablet: {
    height: 80,
    paddingBottom: Platform.OS === 'ios' ? 6 : 8,
    paddingHorizontal: premiumSpacing.lg,
    maxWidth: 720,
    alignSelf: 'center',
    width: '100%',
  },

  // === Tab Item standard ===
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: premiumSpacing.sm,
    gap: 2,
  },
  tabItemTablet: {
    gap: 4,
    paddingVertical: premiumSpacing.md,
  },
  tabLabel: {
    ...premiumTypography.small,
    fontSize: 10.5,
    marginTop: 2,
  },
  tabLabelTablet: {
    fontSize: 13,
    marginTop: 4,
  },
  tabLabelActive: {
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 2,
    ...premiumShadows.glowBlue,
  },
  activeDotTablet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 4,
  },

  // === Scan center button ===
  scanBtnWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginTop: -22,
  },
  scanBtnWrapperTablet: {
    marginTop: -28,
  },
  scanGlow: {
    position: 'absolute',
    top: -4,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(59,130,246,0.15)',
  },
  scanGlowTablet: {
    width: 80,
    height: 80,
    borderRadius: 40,
    top: -6,
  },
  scanBtnOuter: {
    width: 56,
    height: 56,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  scanBtnOuterTablet: {
    width: 68,
    height: 68,
    borderRadius: 24,
    borderWidth: 4,
  },
  scanBtnGrad: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanLabel: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 4,
  },
  scanLabelTablet: {
    fontSize: 13,
    marginTop: 6,
  },
  scanLabelActive: {
  },
});

export default PremiumTabBar;
