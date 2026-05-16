import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { SETTINGS_COLORS } from '@/constants/settingsColors';

interface VersionCardProps {
  version: string;
  onPress: () => void;
}

export const VersionCard: React.FC<VersionCardProps> = ({ version, onPress }) => (
  <Pressable style={styles.card} onPress={onPress}>
    <View>
      <Text style={styles.label}>Version</Text>
      <Text style={styles.value}>{version}</Text>
    </View>

    <View style={styles.iconWrap}>
      <Icon name="information-outline" size={18} color={SETTINGS_COLORS.info} />
    </View>
  </Pressable>
);

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: SETTINGS_COLORS.border_subtle,
    backgroundColor: SETTINGS_COLORS.bg_card,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    color: SETTINGS_COLORS.text_muted,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    fontWeight: '700',
  },
  value: {
    marginTop: 3,
    color: SETTINGS_COLORS.green_light,
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 34,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: SETTINGS_COLORS.info_subtle,
  },
});
