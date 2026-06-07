import React from 'react';
import { StyleSheet, View } from 'react-native';

export const AppLogoSquare: React.FC = () => {
  return (
    <View style={styles.box}>
      <View style={styles.iconWrap}>
        <View style={styles.drawerLine} />
        <View style={styles.drawerLine} />
        <View style={styles.drawerLine} />
        <View style={styles.stem} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  box: {
    width: 78,
    height: 78,
    borderRadius: 22,
    backgroundColor: '#1B8A3E',
    borderWidth: 1.5,
    borderColor: 'rgba(34,197,94,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
    elevation: 10,
  },
  iconWrap: {
    width: 34,
    height: 34,
    justifyContent: 'space-between',
    position: 'relative',
  },
  drawerLine: {
    height: 6,
    borderRadius: 2,
    backgroundColor: '#DCFCE7',
  },
  stem: {
    position: 'absolute',
    right: -3,
    top: 2,
    width: 3,
    height: 30,
    borderRadius: 2,
    backgroundColor: '#86EFAC',
  },
});
