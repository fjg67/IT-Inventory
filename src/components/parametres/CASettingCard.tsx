import React from 'react';
import { View, StyleSheet } from 'react-native';
import { CA_THEME } from '@/constants/caTheme';

export const CASettingCard = ({ children }: { children: React.ReactNode }) => (
  <View style={styles.card}>
    {React.Children.map(children, (child, i) => (
      <React.Fragment key={i}>
        {i > 0 && <View style={styles.divider} />}
        {child}
      </React.Fragment>
    ))}
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: CA_THEME.white,
    borderRadius:    10,
    borderWidth:     1,
    borderColor:     CA_THEME.borderGray,
    overflow:        'hidden',
  },
  divider: { height: 1, backgroundColor: CA_THEME.borderGray, marginLeft: 61 },
});
