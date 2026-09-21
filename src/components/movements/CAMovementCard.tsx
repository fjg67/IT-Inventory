import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Mouvement } from '@/types';
import { CA_THEME } from '@/constants/caTheme';
import { formatDateTimeParis } from '@/utils/dateUtils';
import { toAbbreviation } from '@/utils/abbreviation';
import { CAMovementQtyBadge } from './CAMovementQtyBadge';

const MOVEMENT_LEFT_BORDER = {
  entree:     CA_THEME.green,
  sortie:     CA_THEME.danger,
  ajustement: CA_THEME.warning,
  transfert:  CA_THEME.purple,
};

const MOVEMENT_ICON_STYLE = {
  entree:     { bg: CA_THEME.greenBg,   color: CA_THEME.green,   icon: 'arrow-down-circle'  },
  sortie:     { bg: CA_THEME.dangerBg,  color: CA_THEME.danger,  icon: 'arrow-up-circle'    },
  ajustement: { bg: CA_THEME.warningBg, color: CA_THEME.warning, icon: 'swap-vertical'        },
  transfert:  { bg: CA_THEME.purpleBg,  color: CA_THEME.purple,  icon: 'swap-horizontal'  },
};

const MOVEMENT_TYPE_LABEL = {
  entree:     'Entrée',
  sortie:     'Sortie',
  ajustement: 'Ajustement',
  transfert:  'Transfert',
};

const MOVEMENT_TYPE_BADGE_STYLE = {
  entree:     { bg: CA_THEME.greenBg,   color: CA_THEME.greenText,   iconColor: CA_THEME.green   },
  sortie:     { bg: CA_THEME.dangerBg,  color: CA_THEME.dangerText,  iconColor: CA_THEME.danger  },
  ajustement: { bg: CA_THEME.warningBg, color: CA_THEME.warningText, iconColor: CA_THEME.warning },
  transfert:  { bg: CA_THEME.purpleBg,  color: CA_THEME.purpleText,  iconColor: CA_THEME.purple  },
};

export const CAMovementCard = ({
  movement,
  onPress,
}: {
  movement: Mouvement;
  onPress:  () => void;
}) => {
  const normalizedType = movement.type.startsWith('transfert') ? 'transfert' : movement.type as keyof typeof MOVEMENT_LEFT_BORDER;
  const iconConf  = MOVEMENT_ICON_STYLE[normalizedType];
  const badgeConf = MOVEMENT_TYPE_BADGE_STYLE[normalizedType];

  return (
    <Pressable
      onPress={onPress}
      style={[styles.card, { borderLeftColor: MOVEMENT_LEFT_BORDER[normalizedType] }]}
      accessibilityRole="button"
      accessibilityLabel={`${MOVEMENT_TYPE_LABEL[normalizedType]} : ${movement.article?.nom || 'Article inconnu'}, quantité ${movement.quantite}`}
    >
      {/* Chevron */}
      <Icon name="chevron-right" size={16} color={CA_THEME.textMuted} style={styles.chev} />

      <View style={styles.row}>

        {/* Icône type */}
        <View style={[styles.iconWrap, { backgroundColor: iconConf.bg }]}>
          <Icon name={iconConf.icon} size={20} color={iconConf.color} />
        </View>

        {/* Infos */}
        <View style={styles.info}>

          {/* Nom article */}
          <Text style={styles.name} numberOfLines={1}>
            {movement.article?.nom || 'Article inconnu'}
          </Text>

          {/* Référence */}
          <View style={styles.refRow}>
            <Icon name="barcode" size={10} color={CA_THEME.textMuted} />
            <Text style={styles.refText}>{movement.article?.reference || 'N/A'}</Text>
          </View>

          {/* Méta : type + date + user */}
          <View style={styles.metaRow}>
            {/* Badge type */}
            <View style={[styles.typeBadge, { backgroundColor: badgeConf.bg }]}>
              <Icon name={iconConf.icon} size={10} color={badgeConf.iconColor} />
              <Text style={[styles.typeText, { color: badgeConf.color }]}>
                {MOVEMENT_TYPE_LABEL[normalizedType]}
              </Text>
            </View>

            {/* Date + heure */}
            <View style={styles.dateRow}>
              <Icon name="clock-outline" size={10} color={CA_THEME.textMuted} />
              <Text style={styles.dateText}>
                {formatDateTimeParis(movement.dateMouvement)}
              </Text>
            </View>

            {/* Initiales technicien */}
            <Text style={styles.userText}>
              {movement.technicien ? toAbbreviation(`${movement.technicien.prenom || ''} ${movement.technicien.nom || ''}`, 3, 'N/A') : 'N/A'}
            </Text>
          </View>

        </View>

        {/* Badge quantité */}
        <CAMovementQtyBadge quantity={movement.quantite} type={movement.type} />

      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: CA_THEME.white,
    borderRadius:    10,
    borderWidth:     1,
    borderColor:     CA_THEME.borderGray,
    borderLeftWidth: 4,
    padding:         12,
    position:        'relative',
    marginBottom:    8,
  },
  chev: {
    position: 'absolute', top: 12, right: 10,
  },
  row: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
  },
  iconWrap: {
    width: 38, height: 38, borderRadius: 9,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  info:   { flex: 1, minWidth: 0 },
  name: {
    fontSize:   14,
    fontFamily: CA_THEME.fontFamilyBold,
    fontWeight: '700',
    color:      CA_THEME.textPrimary,
    marginBottom: 4,
    paddingRight: 20, // Leave space for chevron
  },
  refRow: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: CA_THEME.lightGray,
    borderWidth: 1, borderColor: CA_THEME.borderGray,
    paddingHorizontal: 7, paddingVertical: 2,
    borderRadius: 5, marginBottom: 5,
    alignSelf: 'flex-start',
  },
  refText: { fontSize: 10, fontFamily: CA_THEME.fontFamilyMedium, color: CA_THEME.textSecondary },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 7, flexWrap: 'wrap' },
  typeBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 7, paddingVertical: 2, borderRadius: 4,
  },
  typeText:  { fontSize: 10, fontFamily: CA_THEME.fontFamilySemiBold, fontWeight: '600' },
  dateRow:   { flexDirection: 'row', alignItems: 'center', gap: 3 },
  dateText:  { fontSize: 10, fontFamily: CA_THEME.fontFamilyMedium, color: CA_THEME.textMuted },
  userText:  { fontSize: 10, fontFamily: CA_THEME.fontFamilyBold, fontWeight: '700', color: CA_THEME.green },
});
