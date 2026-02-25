import React, { useState, useCallback } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Vibration,
  useWindowDimensions,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { isTablet as checkIsTablet } from '../../../utils/responsive';
import {
  premiumTypography,
  premiumShadows,
  premiumSpacing,
  premiumBorderRadius,
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
  const { width } = useWindowDimensions();
  const tablet = checkIsTablet(width);
  const { colors, isDark } = useTheme();
  const iconScale = useSharedValue(1);

  const iconAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
  }));

  const handleFocus = useCallback(() => {
    setIsFocused(true);
    iconScale.value = withTiming(1.15, { duration: 200 });
  }, [iconScale]);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    iconScale.value = withTiming(1, { duration: 200 });
  }, [iconScale]);

  const handleClear = useCallback(() => {
    Vibration.vibrate(10);
    onClear();
  }, [onClear]);

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark
            ? 'rgba(255,255,255,0.04)'
            : '#FFFFFF',
          borderColor: isFocused
            ? colors.primary + '60'
            : colors.borderSubtle,
          shadowColor: isFocused
            ? colors.primary
            : '#000',
          shadowOpacity: isFocused ? 0.15 : 0.04,
          shadowRadius: isFocused ? 12 : 4,
        },
        tablet && { height: 56, paddingHorizontal: premiumSpacing.lg },
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
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        onFocus={handleFocus}
        onBlur={handleBlur}
        returnKeyType="search"
        autoCorrect={false}
      />

      {value.length > 0 && (
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
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    height: 50,
    gap: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  searchIconWrap: {},
  searchIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontWeight: '400',
    padding: 0,
  },
  clearButton: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default PremiumSearchBar;
