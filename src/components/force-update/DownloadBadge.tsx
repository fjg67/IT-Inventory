import React from 'react';
import { StyleSheet, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

export const DownloadBadge: React.FC = () => {
  return (
    <View style={styles.badge}>
      <Icon name="download" size={18} color="#FEE2E2" />
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: '#B91C1C',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    right: -8,
    bottom: -8,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
});
