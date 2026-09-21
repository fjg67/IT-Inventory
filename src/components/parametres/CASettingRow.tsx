import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { CA_THEME } from '@/constants/caTheme';

export type SettingRowVariant = 'default' | 'danger';

interface CASettingRowProps {
  icon:         string;
  iconVariant:  'green' | 'blue' | 'orange' | 'danger' | 'gray';
  title:        string;
  subtitle?:    string;
  rightElement?: React.ReactNode;
  onPress?:     () => void;
  variant?:     SettingRowVariant;
  showChevron?: boolean;
}

const ICON_STYLES = {
  green:  { bg: CA_THEME.greenBg,   color: CA_THEME.green   },
  blue:   { bg: CA_THEME.infoBg,    color: CA_THEME.info     },
  orange: { bg: CA_THEME.warningBg, color: CA_THEME.warning  },
  danger: { bg: CA_THEME.dangerBg,  color: CA_THEME.danger   },
  gray:   { bg: CA_THEME.lightGray, color: CA_THEME.textMuted},
};

export const CASettingRow = ({
  icon, iconVariant, title, subtitle,
  rightElement, onPress, variant = 'default', showChevron = false,
}: CASettingRowProps) => {
  const iconConf = ICON_STYLES[iconVariant];

  const Wrapper = onPress ? Pressable : View;

  return (
    <Wrapper onPress={onPress} style={styles.row}
      {...(onPress ? { accessibilityRole: 'button' as const } : {})}
      accessibilityLabel={title}
    >
      {/* Icône dans carré teinté */}
      <View style={[styles.iconWrap, { backgroundColor: iconConf.bg }]}>
        <Icon name={icon} size={17} color={iconConf.color} />
      </View>

      {/* Texte */}
      <View style={styles.textBlock}>
        <Text style={[
          styles.title,
          variant === 'danger' && { color: CA_THEME.danger },
        ]}>
          {title}
        </Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>

      {/* Droite */}
      {rightElement && <View style={styles.right}>{rightElement}</View>}
      {showChevron && (
        <Icon name="chevron-right" size={16} color={CA_THEME.textMuted} />
      )}
    </Wrapper>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection:   'row',
    alignItems:      'center',
    gap:             12,
    paddingHorizontal: 13,
    paddingVertical:   11,
  },
  iconWrap: {
    width: 36, height: 36, borderRadius: 9,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  textBlock: { flex: 1, minWidth: 0 },
  title: { fontSize: 13, fontWeight: '600', color: CA_THEME.textPrimary },
  subtitle: { fontSize: 11, color: CA_THEME.textMuted, marginTop: 1 },
  right: { flexShrink: 0 },
});
