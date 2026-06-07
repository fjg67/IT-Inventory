import React from 'react';
import {
  Linking,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, { FadeIn, FadeInDown, ZoomIn } from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { APP_CONFIG } from '@/constants';
import {
  AppLogoSquare,
  ChangelogItem,
  DownloadBadge,
  UpdateBackground,
  VersionCard,
} from '@/components/force-update';

const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.itinventory';

interface ForceUpdateScreenProps {
  currentVersion?: string;
  minVersion?: string;
  changelog?: string[];
  updateUrl?: string;
  releaseNotes?: string[];
}

const DEFAULT_CHANGELOG = [
  'Statut En panne dans le formulaire PC',
  'Améliorations du flux mouvement de stock',
  'Corrections de stabilité et recherche filtrée',
];

const ForceUpdateScreen: React.FC<ForceUpdateScreenProps> = ({
  currentVersion,
  minVersion,
  changelog,
  updateUrl,
  releaseNotes,
}) => {
  const storeUrl = updateUrl || APP_CONFIG.playStoreUrl || PLAY_STORE_URL;
  const notes = changelog?.length
    ? changelog
    : releaseNotes?.length
      ? releaseNotes
      : DEFAULT_CHANGELOG;
  const installedVersion = currentVersion || APP_CONFIG.version;

  const handleUpdate = () => {
    Linking.openURL(storeUrl).catch(() => {
      Linking.openURL('market://details?id=com.itinventory').catch(() => {});
    });
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0F0D" />
      <UpdateBackground />

      <ScrollView contentContainerStyle={styles.scroll} bounces={false}>
        <Animated.View entering={ZoomIn.delay(120).duration(320)} style={styles.logosStack}>
          <AppLogoSquare />
          <DownloadBadge />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(180).duration(260)} style={styles.badgeRow}>
          <View style={styles.badge}>
            <Icon name="alert-circle" size={13} color="#EF4444" />
            <Text style={styles.badgeText}>MISE À JOUR REQUISE</Text>
          </View>
        </Animated.View>

        <Animated.Text entering={FadeInDown.delay(240).duration(260)} style={styles.title}>
          Nouvelle version disponible
        </Animated.Text>

        <Animated.Text entering={FadeInDown.delay(300).duration(280)} style={styles.desc}>
          Une mise à jour est nécessaire pour continuer à utiliser
          <Text style={styles.descHighlight}> IT-Inventory</Text>
          {' '}et accéder à toutes les nouvelles fonctionnalités.
        </Animated.Text>

        <Animated.View entering={FadeInDown.delay(360).duration(280)} style={styles.ctaWrapper}>
          <Pressable onPress={handleUpdate} style={({ pressed }) => [styles.ctaButton, pressed && styles.ctaButtonPressed]}>
            <Icon name="google-play" size={20} color="#FFFFFF" />
            <Text style={styles.ctaText}>Ouvrir le Google Play Store</Text>
          </Pressable>
          <Text style={styles.storeUrl}>play.google.com/store/apps/details?id=com.itinventory</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(420).duration(320)} style={styles.changelogCard}>
          <View style={styles.changelogHeader}>
            <Icon name="sparkles" size={16} color="#22C55E" />
            <Text style={styles.changelogTitle}>Nouveautés de cette version</Text>
          </View>

          {notes.map((item, index) => (
            <ChangelogItem key={`${item}-${index}`} text={item} delay={500 + index * 70} />
          ))}
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(520).duration(300)} style={styles.versionsGrid}>
          <VersionCard label="Version actuelle" value={installedVersion} variant="danger" />
          <VersionCard label="Version minimale" value={minVersion || 'N/A'} variant="success" />
        </Animated.View>

        <Animated.View entering={FadeIn.delay(620).duration(260)} style={styles.infoNote}>
          <Icon name="information-outline" size={17} color="#22C55E" />
          <Text style={styles.infoNoteText}>
            Après installation et relance de l'application, l'accès sera rétabli automatiquement.
          </Text>
        </Animated.View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0A0F0D',
  },
  scroll: {
    padding: 20,
    paddingTop: 40,
    alignItems: 'center',
    gap: 14,
    paddingBottom: 40,
  },
  logosStack: {
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  badgeRow: {
    alignItems: 'center',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.28)',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#EF4444',
    letterSpacing: 0.8,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#F0FDF4',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  desc: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 320,
  },
  descHighlight: {
    color: '#86EFAC',
    fontWeight: '700',
  },
  ctaWrapper: {
    width: '100%',
    alignItems: 'center',
    gap: 6,
  },
  ctaButton: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 15,
    borderRadius: 15,
    backgroundColor: '#1B8A3E',
    elevation: 8,
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
  },
  ctaButtonPressed: {
    backgroundColor: '#156B2F',
    transform: [{ scale: 0.97 }],
  },
  ctaText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  storeUrl: {
    fontSize: 11,
    color: '#374151',
    textAlign: 'center',
  },
  changelogCard: {
    width: '100%',
    backgroundColor: '#111A14',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.1)',
    padding: 14,
  },
  changelogHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: 12,
  },
  changelogTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F0FDF4',
  },
  versionsGrid: {
    width: '100%',
    flexDirection: 'row',
    gap: 10,
  },
  infoNote: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(34,197,94,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.12)',
  },
  infoNoteText: {
    flex: 1,
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 19,
  },
});

export default ForceUpdateScreen;
