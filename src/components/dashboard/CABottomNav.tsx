import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Platform, Dimensions } from 'react-native';
import { CA_THEME } from '@/constants/caTheme';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppSelector } from '@/store';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

const TabItem = ({ route, index, isFocused, descriptors, navigation }: any) => {
  const scale = useSharedValue(isFocused ? 1.1 : 1);
  const opacity = useSharedValue(isFocused ? 1 : 0.6);

  useEffect(() => {
    scale.value = withSpring(isFocused ? 1.1 : 1, { damping: 12, stiffness: 150 });
    opacity.value = withTiming(isFocused ? 1 : 0.6, { duration: 200 });
  }, [isFocused, scale, opacity]);

  const animatedIconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const animatedTextStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const onPress = () => {
    ReactNativeHapticFeedback.trigger('impactLight');
    const event = navigation.emit({
      type: 'tabPress',
      target: route.key,
      canPreventDefault: true,
    });

    if (!isFocused && !event.defaultPrevented) {
      navigation.navigate(route.name);
    }
  };

  let iconName = 'home';
  let label = route.name;

  if (route.name === 'Dashboard') { iconName = 'home'; label = 'Accueil'; }
  else if (route.name === 'Articles') { iconName = 'package-variant'; label = 'Articles'; }
  else if (route.name === 'Scan') { iconName = 'qrcode-scan'; label = 'Scanner'; }
  else if (route.name === 'PC') { iconName = 'laptop'; label = 'PC'; }
  else if (route.name === 'Mouvements') { iconName = 'swap-horizontal'; label = 'Flux'; }
  else if (route.name === 'StockMap') { iconName = 'map-outline'; label = 'Plan'; }

  return (
    <Pressable
      onPress={onPress}
      style={styles.navItem}
      accessibilityRole="tab"
      accessibilityState={{ selected: isFocused }}
    >
      <Animated.View style={[styles.navIcon, isFocused && styles.navIconActive, animatedIconStyle]}>
        <Icon
          name={iconName}
          size={isFocused ? 20 : 24}
          color={isFocused ? CA_THEME.white : CA_THEME.textMuted}
        />
      </Animated.View>
      {isFocused && (
        <Animated.Text style={[styles.navLabel, styles.navLabelActive, animatedTextStyle]}>
          {label}
        </Animated.Text>
      )}
    </Pressable>
  );
};

export const CABottomNav = ({ state, descriptors, navigation }: any) => {
  const siteActif = useAppSelector(state => state.site.siteActif);
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.floatingNavContainer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
      <View style={styles.nav}>
        {state.routes.map((route: any, index: number) => {
          if (route.name === 'StockMap' && siteActif?.nom !== 'Stock 1er') {
            return null;
          }
          return (
            <TabItem
              key={route.key}
              route={route}
              index={index}
              isFocused={state.index === index}
              descriptors={descriptors}
              navigation={navigation}
            />
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  floatingNavContainer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  nav: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    width: width - 32,
    borderRadius: 24,
    paddingVertical: 8,
    paddingHorizontal: 8,
    shadowColor: CA_THEME.green,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
  },
  navItem: { 
    flex: 1, 
    alignItems: 'center', 
    justifyContent: 'center',
    height: 48,
  },
  navIcon: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  navIconActive: { 
    backgroundColor: CA_THEME.green,
    shadowColor: CA_THEME.green,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  navLabel: { 
    fontSize: 10, 
    fontFamily: CA_THEME.fontFamilyMedium, 
    color: CA_THEME.textMuted,
    marginTop: 2,
    position: 'absolute',
    bottom: -16,
  },
  navLabelActive: { 
    color: CA_THEME.green, 
    fontFamily: CA_THEME.fontFamilyBold, 
  },
});
