import React from 'react';
import { View, StatusBar } from 'react-native';
import { CA_THEME } from '@/constants/caTheme';

export const CAScreenWrapper = ({ children }: { children: React.ReactNode }) => (
  <View style={{ flex: 1, backgroundColor: CA_THEME.lightGray }}>
    <StatusBar translucent barStyle="light-content" backgroundColor="transparent" />
    {children}
  </View>
);
