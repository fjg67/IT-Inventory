import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { AvatarBadge } from './AvatarBadge';
import { RoleBadge } from './RoleBadge';
import { CA_THEME } from '@/constants/caTheme';

type ProfileCardProps = {
  initials: string;
  role: string;
  delay?: number;
  onPress: () => void;
  onLongPress?: () => void;
  delayLongPress?: number;
  disabled?: boolean;
  rightNode?: React.ReactNode;
};

export const ProfileCard: React.FC<ProfileCardProps> = ({
  initials,
  role,
  delay = 0,
  onPress,
  onLongPress,
  delayLongPress,
  disabled,
  rightNode,
}) => {
  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(240)}>
      <Pressable
        onPress={onPress}
        onLongPress={onLongPress}
        delayLongPress={delayLongPress}
        disabled={disabled}
        android_ripple={{ color: CA_THEME.greenBg }}
        style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      >
        <AvatarBadge initials={initials} />

        <View style={styles.main}>
          <Text style={styles.name}>{initials}</Text>
          <RoleBadge role={role} />
        </View>

        <View style={styles.chevronWrap}>
          {rightNode ?? <Icon name="chevron-right" size={18} color={CA_THEME.green} />}
        </View>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    minHeight: 76,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: CA_THEME.borderGray,
    backgroundColor: CA_THEME.white,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardPressed: {
    transform: [{ scale: 0.98 }],
    backgroundColor: '#F3FAF6',
    borderColor: CA_THEME.greenBg2,
  },
  main: {
    flex: 1,
    gap: 6,
  },
  name: {
    color: CA_THEME.textPrimary,
    fontSize: 15,
    fontWeight: '800',
  },
  chevronWrap: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
