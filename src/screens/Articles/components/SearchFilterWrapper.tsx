import React from 'react';
import {
  View,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { useTheme } from '@/theme';
import { isTablet as checkIsTablet } from '../../../utils/responsive';
import { premiumSpacing } from '../../../constants/premiumTheme';

interface SearchFilterWrapperProps {
  children: React.ReactNode;
  maxWidth?: number;
}

const SearchFilterWrapper: React.FC<SearchFilterWrapperProps> = ({
  children,
  maxWidth,
}) => {
  const { width } = useWindowDimensions();
  const tablet = checkIsTablet(width);
  const { colors, isDark } = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark ? 'rgba(15, 23, 42, 0.3)' : 'rgba(255, 255, 255, 0.4)',
          paddingHorizontal: premiumSpacing.md,
          paddingVertical: premiumSpacing.md,
        },
        tablet && styles.tablet,
        maxWidth && {
          maxWidth,
          alignSelf: 'center',
          width: '100%',
        },
      ]}
    >
      <View style={styles.innerContainer}>
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    marginHorizontal: premiumSpacing.md,
    marginVertical: premiumSpacing.sm,
    backdropFilter: 'blur(10px)',
  },
  tablet: {
    marginHorizontal: premiumSpacing.lg,
    borderRadius: 24,
  },
  innerContainer: {
    gap: premiumSpacing.md,
  },
});

export default SearchFilterWrapper;
