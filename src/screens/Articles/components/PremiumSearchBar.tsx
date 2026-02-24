import React, { useState, useCallback } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, Vibration, useWindowDimensions } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { isTablet as checkIsTablet } from '../../../utils/responsive';
import {
  premiumColors,
  premiumTypography,
  premiumShadows,
  premiumSpacing,
  premiumBorderRadius,
} from '../../../constants/premiumTheme';

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

  const handleClear = useCallback(() => {
    Vibration.vibrate(10);
    onClear();
  }, [onClear]);

  return (
    <View
      style={[
        styles.container,
        isFocused && styles.containerFocused,
        tablet && { height: 58, paddingHorizontal: premiumSpacing.lg },
      ]}
    >
      <Icon
        name="magnify"
        size={tablet ? 24 : 20}
        color={isFocused ? premiumColors.primary.base : premiumColors.text.tertiary}
      />
      <TextInput
        style={[styles.input, tablet && { fontSize: 16 }]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={premiumColors.text.tertiary}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        returnKeyType="search"
        autoCorrect={false}
      />
      {value.length > 0 && (
        <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(150)}>
          <TouchableOpacity
            onPress={handleClear}
            style={styles.clearButton}
            activeOpacity={0.7}
          >
            <Icon name="close-circle" size={tablet ? 22 : 18} color={premiumColors.text.tertiary} />
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
    backgroundColor: premiumColors.surface,
    borderRadius: premiumBorderRadius.lg,
    borderWidth: 1.5,
    borderColor: premiumColors.border,
    paddingHorizontal: premiumSpacing.md,
    height: 52,
    ...premiumShadows.xs,
    gap: premiumSpacing.sm,
  },
  containerFocused: {
    borderColor: premiumColors.primary.base,
    borderWidth: 2,
    ...premiumShadows.sm,
  },
  input: {
    flex: 1,
    ...premiumTypography.body,
    color: premiumColors.text.primary,
    padding: 0,
  },
  clearButton: {
    padding: 4,
  },
});

export default PremiumSearchBar;
