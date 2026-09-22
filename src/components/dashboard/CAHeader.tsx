import React from 'react';
import { View, Text, StyleSheet, Pressable, StatusBar, Platform } from 'react-native';
import { CA_THEME } from '@/constants/caTheme';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface CAHeaderProps {
  firstName: string;
  lastName?: string;
  siteName?: string;
  subtitle?: string;
  onPressSite: () => void;
  onPressSettings?: () => void;
}

const formatDateLong = (): string => {
  return new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  });
};

const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Bonjour';
  if (hour < 18) return 'Bon après-midi';
  return 'Bonsoir';
};

const getInitials = (firstName: string, lastName?: string): string => {
  const a = firstName?.[0] ?? 'U';
  const b = lastName?.[0] ?? '';
  return `${a}${b}`.toUpperCase();
};

import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const CAHeader = ({ firstName, lastName, siteName, subtitle, onPressSite, onPressSettings }: CAHeaderProps) => {
  const greeting = getGreeting();
  const insets = useSafeAreaInsets();
  
  return (
    <View style={[styles.header, { paddingTop: insets.top + (Platform.OS === 'android' ? 10 : 12) }]}>
      {/* Ligne logo + avatar + paramètres */}
      <View style={styles.logoRow}>
        {/* Logo CA stylisé */}
        <View style={styles.logoWrap}>
          <View style={styles.logoSquare} accessibilityLabel="Crédit Agricole IT-Inventory">
            <Text style={styles.logoCA}>CA</Text>
          </View>
          <Text style={styles.appName}>IT-Inventory</Text>
        </View>
        
        <View style={styles.rightActions}>
          {/* Bouton Paramètres */}
          <Pressable style={styles.settingsBtn} onPress={onPressSettings} accessibilityRole="button" accessibilityLabel="Réglages">
            <Icon name="cog" size={24} color={CA_THEME.white} />
          </Pressable>

          {/* Avatar technicien */}
          <Pressable style={styles.avatar} accessibilityRole="button"
            accessibilityLabel={`Profil ${getInitials(firstName, lastName)}`}>
            <Text style={styles.avatarText}>{getInitials(firstName, lastName)}</Text>
          </Pressable>
        </View>
      </View>

      {/* Salutation */}
      <View>
        <Text style={styles.greetingDate}>{formatDateLong()}</Text>
        <Text style={styles.greetingName}>
          {greeting}, {firstName}
        </Text>
        {subtitle ? (
          <Animated.Text entering={FadeInDown.delay(150).duration(400)} style={styles.subtitleText}>
            {subtitle}
          </Animated.Text>
        ) : null}
      </View>

      {/* Sélecteur de site */}
      <Pressable onPress={onPressSite} style={styles.sitePill}>
        <Icon name="map-marker" size={14} color={CA_THEME.green} />
        <Text style={styles.siteText}>{siteName ?? 'Sélectionner un stock'}</Text>
        <Icon name="chevron-down" size={16} color={CA_THEME.green} />
      </Pressable>

      {/* Bande tricolore CA en bas du header */}
      <View style={styles.triband} aria-hidden>
        <View style={[styles.tribandItem, { backgroundColor: '#FFD700' }]} />
        <View style={[styles.tribandItem, { backgroundColor: CA_THEME.greenLight }]} />
        <View style={[styles.tribandItem, { backgroundColor: CA_THEME.greenDark }]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    backgroundColor: CA_THEME.green,
    paddingHorizontal: 16,
    paddingBottom:    24,
  },
  logoRow: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    marginBottom:   14,
  },
  logoWrap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoSquare: {
    width: 34, height: 28,
    backgroundColor: CA_THEME.white,
    borderRadius:    3,
    alignItems:      'center',
    justifyContent:  'center',
  },
  logoCA: {
    fontSize:    13,
    fontFamily: CA_THEME.fontFamilyBold, fontWeight: '900',
    color:       CA_THEME.green,
    letterSpacing: -0.5,
  },
  appName: {
    fontSize:   16,
    fontFamily: CA_THEME.fontFamilyBold, fontWeight: '700',
    color:      CA_THEME.white,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingsBtn: {
    width: 34, height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width:           34,
    height:          34,
    borderRadius:    17,
    backgroundColor: CA_THEME.white,
    alignItems:      'center',
    justifyContent:  'center',
  },
  avatarText: {
    fontSize:   13,
    fontFamily: CA_THEME.fontFamilyBold, fontWeight: '700',
    color:      CA_THEME.green,
  },
  greetingDate: {
    fontSize: 12,
    color:    'rgba(255,255,255,0.78)',
    marginBottom: 4,
    textTransform: 'capitalize',
  },
  greetingName: {
    fontSize:   20,
    fontFamily: CA_THEME.fontFamilyBold, fontWeight: '700',
    color:      CA_THEME.white,
    marginBottom: 8,
  },
  subtitleText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
    fontFamily: CA_THEME.fontFamilyMedium,
    marginBottom: 12,
  },
  sitePill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CA_THEME.white,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  siteText: {
    color: CA_THEME.green,
    fontSize: 12,
    fontFamily: CA_THEME.fontFamilySemiBold, fontWeight: '600',
  },
  // Bande tricolore CA (jaune / vert clair / vert foncé)
  triband: {
    position:   'absolute',
    bottom:     0,
    left:       0,
    right:      0,
    height:     4,
    flexDirection: 'row',
  },
  tribandItem: {
    flex: 1,
    height: '100%',
  },
});
