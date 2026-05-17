import React from 'react';
import { StyleSheet, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

export const TransfertSiteConnector: React.FC = () => {
  return (
    <View style={styles.wrap}>
      <View style={styles.dot} />
      <View style={styles.line} />
      <View style={styles.circle}>
        <Icon name="arrow-down" size={20} color="#FFF" />
      </View>
      <View style={styles.line} />
      <View style={styles.dot} />
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#8B5CF6',
  },
  line: {
    width: 2,
    height: 18,
    backgroundColor: 'rgba(139,92,246,0.25)',
  },
  circle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#8B5CF6',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#8B5CF6',
    shadowOpacity: 0.28,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
});
