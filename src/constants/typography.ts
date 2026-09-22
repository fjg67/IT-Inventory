import { TextStyle } from 'react-native';

import { CA_THEME } from './caTheme';

export const DASHBOARD_TYPOGRAPHY: Record<string, TextStyle> = {
  statNumber: {
    fontFamily: CA_THEME.fontFamilyBold,
    fontWeight: '700',
    letterSpacing: -1,
  },
  sectionTitle: {
    fontFamily: CA_THEME.fontFamilySemiBold,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  body: {
    fontFamily: CA_THEME.fontFamilyRegular,
    fontWeight: '400',
  },
  label: {
    fontFamily: CA_THEME.fontFamilyMedium,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
};

export const TYPOGRAPHY = {
  h1: {
    fontFamily: CA_THEME.fontFamilyBold,
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '700' as const,
  },
  h2: {
    fontFamily: CA_THEME.fontFamilyBold,
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '700' as const,
  },
  h3: {
    fontFamily: CA_THEME.fontFamilyBold,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700' as const,
  },
  body: {
    fontFamily: CA_THEME.fontFamilyRegular,
    fontSize: 14,
    lineHeight: 20,
  },
  caption: {
    fontFamily: CA_THEME.fontFamilyMedium,
    fontSize: 12,
    lineHeight: 16,
  },
} as const;
