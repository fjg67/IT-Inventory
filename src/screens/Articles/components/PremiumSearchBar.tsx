import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Vibration,
  useWindowDimensions,
} from 'react-native';import Animated, {
  FadeIn,
  FadeOut,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  cancelAnimation,
} from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { isTablet as checkIsTablet } from '../../../utils/responsive';
import {
  premiumSpacing,
} from '../../../constants/premiumTheme';
import { useTheme } from '@/theme';

interface PremiumSearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onClear: () => void;
  placeholder?: string;
}

const PremiumSearchBar: React.FC<PremiumSearchBarProps> = ({
  value,
  onChangeText,
  onClear,
  placeholder = 'Rechercher par référence ou nom...',
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [localValue, setLocalValue] = useState(value);
  const previousExternalValueRef = useRef(value);
  const { width } = useWindowDimensions();
  const tablet = checkIsTablet(width);
  const { colors, isDark } = useTheme();
  const iconScale = useSharedValue(1);
  const glowOpacity = useSharedValue(0);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const iconAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
  }));

  const handleFocus = useCallback(() => {
    setIsFocused(true);
    iconScale.value = withTiming(1.15, { duration: 200 });
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 900 }),
        withTiming(0.35, { duration: 900 }),
      ),
      -1,
      false,
    );
  }, [iconScale, glowOpacity]);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    iconScale.value = withTiming(1, { duration: 200 });
    cancelAnimation(glowOpacity);
    glowOpacity.value = withTiming(0, { duration: 300 });
  }, [iconScale, glowOpacity]);

  const handleClear = useCallback(() => {
    Vibration.vibrate(10);
    setLocalValue('');
    onClear();
  }, [onClear]);

  useEffect(() => {
    // Sync only when parent value actually changes (external reset/update).
    if (value !== previousExternalValueRef.current) {
      previousExternalValueRef.current = value;
      setLocalValue(value);
    }
  }, [value]);

  return (
    <View style={styles.glowWrapper}>
      {/* Animated glow ring */}
      <Animated.View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          styles.glowRing,
          { borderColor: colors.primary + '55' },
          glowStyle,
        ]}
      />
      <View
        style={[
          styles.container,
        {
          backgroundColor: isFocused ? colors.backgroundSubtle : colors.surface,
          borderColor: isFocused
            ? colors.primary + '60'
            : isDark ? colors.borderSubtle : colors.borderMedium,
          shadowColor: isFocused
            ? colors.primary
            : '#000',
          shadowOpacity: isFocused ? 0.18 : 0.05,
          shadowRadius: isFocused ? 14 : 5,
        },
        tablet && { height: 58, paddingHorizontal: premiumSpacing.lg },
      ]}
    >
      {/* Search icon with animated container */}
      <Animated.View style={[styles.searchIconWrap, iconAnimStyle]}>
        <View
          style={[
            styles.searchIconCircle,
            {
              backgroundColor: isFocused
                ? colors.primary + '15'
                : isDark
                  ? 'rgba(255,255,255,0.06)'
                  : '#F1F5F9',
            },
          ]}
        >
          <Icon
            name="magnify"
            size={tablet ? 20 : 18}
            color={isFocused ? colors.primary : colors.textMuted}
          />
        </View>
      </Animated.View>

      <TextInput
        style={[
          styles.input,
          { color: colors.textPrimary },
          tablet && { fontSize: 16 },
        ]}
        value={localValue}
        onChangeText={(text) => {
          setLocalValue(text);
          onChangeText(text);
        }}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        onFocus={handleFocus}
        onBlur={handleBlur}
        returnKeyType="search"
        autoCorrect={false}
      />

      {localValue.length > 0 && (
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(150)}
        >
          <TouchableOpacity
            onPress={handleClear}
            style={[
              styles.clearButton,
              {
                backgroundColor: isDark
                  ? 'rgba(255,255,255,0.08)'
                  : '#F1F5F9',
              },
            ]}
            activeOpacity={0.7}
          >
            <Icon
              name="close"
              size={tablet ? 16 : 14}
              color={colors.textMuted}
            />
          </TouchableOpacity>
        </Animated.View>
      )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  glowWrapper: {
    position: 'relative',
  },
  glowRing: {
    borderRadius: 20,
    borderWidth: 2.5,
    margin: -3,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    height: 52,
    gap: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  searchIconWrap: {},
  searchIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    padding: 0,
  },
  clearButton: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default PremiumSearchBar;
