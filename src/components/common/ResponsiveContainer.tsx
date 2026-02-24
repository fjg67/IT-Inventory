// ============================================
// RESPONSIVE CONTAINER COMPONENT
// Wrapper qui centre le contenu et limite la largeur sur tablette
// ============================================

import React from 'react';
import { View, ViewStyle, StyleSheet } from 'react-native';
import { useResponsive } from '@/utils/responsive';

interface ResponsiveContainerProps {
  children: React.ReactNode;
  style?: ViewStyle;
  /** Pas de max-width, juste les paddings adaptés */
  fluid?: boolean;
}

/**
 * Conteneur responsive : centre le contenu avec un maxWidth sur tablette,
 * et applique des paddings adaptés automatiquement.
 */
export const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({
  children,
  style,
  fluid = false,
}) => {
  const { contentMaxWidth, spacing } = useResponsive();

  const containerStyle: ViewStyle[] = [
    { paddingHorizontal: spacing.screenPadding },
    !fluid && contentMaxWidth
      ? ({
          maxWidth: contentMaxWidth,
          alignSelf: 'center',
          width: '100%',
        } as ViewStyle)
      : {},
    style as ViewStyle,
  ].filter(Boolean);

  return <View style={containerStyle}>{children}</View>;
};

/**
 * ScrollView content wrapper pour tablette
 * Applique maxWidth + padding automatiquement
 */
export const ResponsiveScrollContent: React.FC<ResponsiveContainerProps> = ({
  children,
  style,
  fluid = false,
}) => {
  const { contentMaxWidth, spacing } = useResponsive();

  return (
    <View
      style={[
        styles.scrollContent,
        { paddingHorizontal: spacing.screenPadding },
        !fluid && contentMaxWidth
          ? { maxWidth: contentMaxWidth, alignSelf: 'center', width: '100%' }
          : {},
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
  },
});

export default ResponsiveContainer;
