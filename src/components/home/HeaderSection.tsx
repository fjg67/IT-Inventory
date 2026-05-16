import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { OBSIDIAN_COLORS } from '@/constants/colors';

interface HeaderSectionProps {
  firstName: string;
  lastName?: string;
  siteName?: string;
  onPressSite: () => void;
}

const formatToday = (): string => {
  return new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  });
};

const getDayGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) {
    return 'Bon matin';
  }
  if (hour < 18) {
    return 'Bon apres-midi';
  }
  return 'Bonsoir';
};

const getInitials = (firstName: string, lastName?: string): string => {
  const a = firstName?.[0] ?? 'U';
  const b = lastName?.[0] ?? '';
  return `${a}${b}`.toUpperCase();
};

const HeaderSectionComponent: React.FC<HeaderSectionProps> = ({
  firstName,
  lastName,
  siteName,
  onPressSite,
}) => {
  const greeting = getDayGreeting();

  return (
    <Animated.View entering={FadeIn.duration(300)}>
      <Animated.View style={styles.container} entering={FadeInDown.duration(300)}>
        <View style={styles.leftColumn}>
          <View style={styles.dateRow}>
            <Icon name="calendar-month-outline" size={14} color={OBSIDIAN_COLORS.text_muted} />
            <Text style={styles.dateText}>{formatToday()}</Text>
          </View>

          <Text style={styles.greetingText}>
            {`${greeting}, `}
            <Text style={styles.greetingName}>{firstName}</Text>
            {' '} 
            {'\uD83D\uDC4B'}
          </Text>

          <TouchableOpacity onPress={onPressSite} activeOpacity={0.8} style={styles.sitePill}>
            <Icon name="map-marker-outline" size={14} color={OBSIDIAN_COLORS.green_light} />
            <Text style={styles.siteText}>{siteName ?? 'Selectionner un stock'}</Text>
            <Icon name="chevron-down" size={16} color={OBSIDIAN_COLORS.green_light} />
          </TouchableOpacity>
        </View>

        <View style={styles.avatarWrap}>
          <View style={styles.statusRing} />
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getInitials(firstName, lastName)}</Text>
          </View>
        </View>
      </Animated.View>
    </Animated.View>
  );
};

export const HeaderSection = React.memo(HeaderSectionComponent);

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  leftColumn: {
    flex: 1,
    paddingRight: 12,
  },
  dateRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 5,
  },
  dateText: {
    color: OBSIDIAN_COLORS.text_muted,
    fontSize: 12,
    textTransform: 'capitalize',
  },
  greetingText: {
    color: OBSIDIAN_COLORS.text_primary,
    fontSize: 24,
    fontWeight: '600',
    marginTop: 6,
  },
  greetingName: {
    color: OBSIDIAN_COLORS.green_light,
    fontWeight: '700',
  },
  sitePill: {
    alignItems: 'center',
    backgroundColor: OBSIDIAN_COLORS.green_subtle,
    borderColor: OBSIDIAN_COLORS.border_accent,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignSelf: 'flex-start',
  },
  siteText: {
    color: OBSIDIAN_COLORS.text_secondary,
    fontSize: 12,
    fontWeight: '500',
  },
  avatarWrap: {
    position: 'relative',
  },
  statusRing: {
    backgroundColor: OBSIDIAN_COLORS.green_light,
    borderRadius: 26,
    height: 52,
    opacity: 0.22,
    position: 'absolute',
    width: 52,
  },
  avatar: {
    alignItems: 'center',
    backgroundColor: OBSIDIAN_COLORS.green_primary,
    borderRadius: 22,
    height: 44,
    justifyContent: 'center',
    margin: 4,
    width: 44,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
