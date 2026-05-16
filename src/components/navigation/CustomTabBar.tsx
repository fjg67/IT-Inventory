import React, { useEffect, useMemo } from 'react';
import { Dimensions, Pressable, StyleSheet, Vibration, View } from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { useAppSelector } from '@/store';
import { TAB_BAR_COLORS, TAB_CONFIG } from '@/constants/tabConfig';
import ScanButton from './ScanButton';
import TabItem from './TabItem';

let BlurViewComponent: React.ComponentType<any> | null = null;
try {
  const blur = require('@react-native-community/blur');
  BlurViewComponent = blur.BlurView;
} catch {
  BlurViewComponent = null;
}

const CustomTabBar: React.FC<BottomTabBarProps> = ({ state, navigation }) => {
  const insets = useSafeAreaInsets();
  const { width } = Dimensions.get('window');

  const alerts = useAppSelector((s) => s.ui.alerts);
  const pendingCount = useAppSelector((s) => s.network.pendingCount);

  const stockAlerts = alerts.filter((a) => a.type === 'warning' || a.type === 'error').length;
  const badgeMap = useMemo(
    () => ({
      stockAlerts,
      newMovements: Math.max(0, pendingCount),
    }),
    [pendingCount, stockAlerts],
  );

  const containerOpacity = useSharedValue(0);
  const containerTranslateY = useSharedValue(18);
  const indicatorX = useSharedValue(0);

  const tabCount = state.routes.length;
  const innerWidth = width - 24 - 16;
  const tabWidth = innerWidth / Math.max(tabCount, 1);

  useEffect(() => {
    containerOpacity.value = withTiming(1, { duration: 280 });
    containerTranslateY.value = withSpring(0, { damping: 18, stiffness: 180 });
  }, [containerOpacity, containerTranslateY]);

  useEffect(() => {
    indicatorX.value = withSpring(state.index * tabWidth + tabWidth / 2 - 2, {
      damping: 20,
      stiffness: 200,
    });
  }, [indicatorX, state.index, tabWidth]);

  const barAnim = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
    transform: [{ translateY: containerTranslateY.value }],
  }));

  const indicatorAnim = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorX.value }],
  }));

  return (
    <Animated.View
      style={[
        styles.outer,
        {
          bottom: insets.bottom + 12,
        },
        barAnim,
      ]}
    >
      <View style={styles.shell}>
        {BlurViewComponent ? (
          <BlurViewComponent
            style={StyleSheet.absoluteFillObject}
            blurType="dark"
            blurAmount={10}
            reducedTransparencyFallbackColor="rgba(17, 26, 20, 0.97)"
          />
        ) : null}

        <View
          style={[
            styles.inner,
            {
              backgroundColor: BlurViewComponent
                ? 'rgba(17, 26, 20, 0.95)'
                : 'rgba(17, 26, 20, 0.97)',
            },
          ]}
        >
          {state.routes.map((route, index) => {
            const isFocused = state.index === index;
            const cfg = TAB_CONFIG.find((item) => item.routeName === route.name);

            if (!cfg) {
              return null;
            }

            const onPress = () => {
              Vibration.vibrate(isFocused ? 8 : 12);

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
              Vibration.vibrate(18);
              navigation.emit({ type: 'tabLongPress', target: route.key });
            };

            if (cfg.isScan) {
              return (
                <ScanButton
                  key={route.key}
                  isFocused={isFocused}
                  onPress={onPress}
                  onLongPress={onLongPress}
                />
              );
            }

            const badgeCount = cfg.badgeKey ? badgeMap[cfg.badgeKey] : 0;

            return (
              <TabItem
                key={route.key}
                label={cfg.label}
                icon={cfg.icon}
                iconActive={cfg.iconActive}
                isFocused={isFocused}
                badgeCount={badgeCount}
                onPress={onPress}
                onLongPress={onLongPress}
              />
            );
          })}

          <Pressable pointerEvents="none" style={styles.bottomTrack}>
            <Animated.View style={[styles.bottomDot, indicatorAnim]} />
          </Pressable>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  outer: {
    position: 'absolute',
    left: 12,
    right: 12,
  },
  shell: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  inner: {
    flexDirection: 'row',
    height: 64,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.12)',
    alignItems: 'center',
    paddingHorizontal: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 16,
  },
  bottomTrack: {
    position: 'absolute',
    left: 8,
    right: 8,
    bottom: 6,
    height: 4,
  },
  bottomDot: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: TAB_BAR_COLORS.greenLight,
  },
});

export default CustomTabBar;
