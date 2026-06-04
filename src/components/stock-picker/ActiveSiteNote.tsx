import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { OBSIDIAN_COLORS } from '@/constants/colors';

interface ActiveSiteNoteProps {
  activeSiteName?: string;
}

export const ActiveSiteNote: React.FC<ActiveSiteNoteProps> = ({ activeSiteName }) => {
  return (
    <Animated.View entering={FadeInDown.delay(100).duration(250)} style={styles.wrap}>
      <View style={styles.row}>
        <Icon name="information-outline" size={14} color={OBSIDIAN_COLORS.text_muted} />
        <Text style={styles.text}>Vous etes sur {activeSiteName ?? 'un site'}.</Text>
      </View>
      <Text style={styles.subText}>Tapez une autre carte pour changer de site.</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: OBSIDIAN_COLORS.border_card,
    backgroundColor: OBSIDIAN_COLORS.bg_card_elevated,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  text: {
    color: OBSIDIAN_COLORS.text_secondary,
    fontSize: 12,
    fontWeight: '700',
  },
  subText: {
    marginTop: 3,
    color: OBSIDIAN_COLORS.text_muted,
    fontSize: 12,
    fontWeight: '500',
  },
});

export default ActiveSiteNote;
