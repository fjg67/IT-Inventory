import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { PCCategory } from '@/hooks/useAddPCForm';
import { OBSIDIAN_COLORS } from '@/constants/colors';

interface HostnameHelperProps {
  category: PCCategory | null;
  format: string | null;
}

const HostnameHelper: React.FC<HostnameHelperProps> = ({ category, format }) => {
  const categoryLabel = category === 'portable_agence' ? 'agence' : category === 'portable_siege' ? 'siège' : 'sélection';

  return (
    <View style={styles.box}>
      <Icon name="information-outline" size={11} color={OBSIDIAN_COLORS.text_dim} />
      <Text style={styles.text}>
        Format {categoryLabel} conseillé: {format ?? 'KSAOPSTRXXXX, KSAOPEPIXXXX ou KSAOP872XXXX'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  box: {
    minHeight: 30,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: OBSIDIAN_COLORS.bg_card_elevated,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.06)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
  },
  text: {
    color: OBSIDIAN_COLORS.text_dim,
    fontSize: 11,
    fontWeight: '500',
  },
});

export default HostnameHelper;
