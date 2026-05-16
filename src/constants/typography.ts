import { TextStyle } from 'react-native';

export const DASHBOARD_TYPOGRAPHY: Record<string, TextStyle> = {
  statNumber: {
    fontFamily: 'System',
    fontWeight: '700',
    letterSpacing: -1,
  },
  sectionTitle: {
    fontFamily: 'System',
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  body: {
    fontFamily: 'System',
    fontWeight: '400',
  },
  label: {
    fontFamily: 'System',
    fontWeight: '500',
    letterSpacing: 0.3,
  },
};
