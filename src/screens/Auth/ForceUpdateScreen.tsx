// ============================================
// FORCE UPDATE SCREEN - IT-Inventory
// Blocks app usage when version is outdated
// ============================================

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Linking,
  TouchableOpacity,
  Image,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Animated, { FadeInUp, FadeInDown, ZoomIn } from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { APP_CONFIG } from '@/constants';
import { useTheme } from '@/theme';

interface ForceUpdateScreenProps {
  minVersion?: string;
}

const ForceUpdateScreen: React.FC<ForceUpdateScreenProps> = ({ minVersion }) => {
  const { colors, isDark } = useTheme();

  const handleUpdate = () => {
    Linking.openURL(APP_CONFIG.playStoreUrl).catch(() => {});
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.backgroundBase }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.backgroundBase} />

      {/* Background blobs */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <LinearGradient
          colors={['rgba(239,68,68,0.06)', 'rgba(239,68,68,0)']}
          style={[styles.blob, { width: 280, height: 280, top: -60, left: -80 }]}
        />
        <LinearGradient
          colors={['rgba(0,122,57,0.05)', 'rgba(99,102,241,0)']}
          style={[styles.blob, { width: 220, height: 220, bottom: 60, right: -60 }]}
        />
      </View>

      <Animated.View entering={FadeInDown.delay(200).duration(500)} style={styles.logoSection}>
        <Image
          source={require('@/assets/images/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </Animated.View>

      <Animated.View entering={ZoomIn.delay(400).duration(400)} style={styles.iconSection}>
        <LinearGradient
          colors={['#EF4444', '#DC2626']}
          style={styles.iconCircle}
        >
          <Icon name="cellphone-arrow-down" size={48} color="#FFF" />
        </LinearGradient>
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(600).duration(500)} style={styles.textSection}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>
          Mise à jour requise
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Une nouvelle version de l'application est disponible. Mettez à jour IT-Inventory via Google Play pour profiter des améliorations et continuer à accéder à l'application.
        </Text>

        <View style={[styles.releasesBox, { backgroundColor: isDark ? 'rgba(15,23,42,0.56)' : '#FFFFFF', borderColor: isDark ? 'rgba(148,163,184,0.22)' : '#E2E8F0' }]}>
          <View style={styles.releasesHeader}>
            <Icon name="sparkles" size={16} color="#007A39" />
            <Text style={[styles.releasesTitle, { color: colors.textPrimary }]}>Nouveautés de cette version</Text>
          </View>
          <View style={styles.releaseItem}>
            <Icon name="check-circle-outline" size={14} color="#007A39" />
            <Text style={[styles.releaseText, { color: colors.textSecondary }]}>Parc PC amélioré avec cartes plus lisibles et meilleure organisation des informations.</Text>
          </View>
          <View style={styles.releaseItem}>
            <Icon name="check-circle-outline" size={14} color="#007A39" />
            <Text style={[styles.releaseText, { color: colors.textSecondary }]}>Message de mise à jour clarifié avec redirection directe vers Google Play.</Text>
          </View>
          <View style={styles.releaseItem}>
            <Icon name="check-circle-outline" size={14} color="#007A39" />
            <Text style={[styles.releaseText, { color: colors.textSecondary }]}>Corrections de stabilité et améliorations globales de l'expérience utilisateur.</Text>
          </View>
        </View>

        <View style={[styles.versionBox, { backgroundColor: isDark ? 'rgba(239,68,68,0.1)' : '#FEF2F2', borderColor: isDark ? 'rgba(239,68,68,0.2)' : '#FECACA' }]}>
          <View style={styles.versionRow}>
            <Text style={[styles.versionLabel, { color: colors.textMuted }]}>Version actuelle</Text>
            <Text style={[styles.versionValue, { color: '#EF4444' }]}>v{APP_CONFIG.version}</Text>
          </View>
          {minVersion && (
            <View style={styles.versionRow}>
              <Text style={[styles.versionLabel, { color: colors.textMuted }]}>Version minimale</Text>
              <Text style={[styles.versionValue, { color: '#10B981' }]}>v{minVersion}</Text>
            </View>
          )}
        </View>

        <View style={[styles.infoBox, { backgroundColor: isDark ? 'rgba(0,122,57,0.14)' : 'rgba(0,122,57,0.08)', borderColor: isDark ? 'rgba(16,185,129,0.22)' : 'rgba(0,122,57,0.14)' }]}>
          <Icon name="information-outline" size={16} color="#007A39" />
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>Après installation de la mise à jour depuis Google Play, vous pourrez accéder à nouveau à l'application automatiquement.</Text>
        </View>
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(800).duration(500)} style={styles.buttonSection}>
        <TouchableOpacity activeOpacity={0.8} onPress={handleUpdate} style={styles.updateBtn}>
          <LinearGradient
            colors={['#007A39', '#007A39']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.updateBtnGradient}
          >
            <Icon name="google-play" size={22} color="#FFF" />
            <Text style={styles.updateBtnText}>Mettre à jour sur Google Play</Text>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>

      <View style={styles.footer}>
        <Icon name="shield-check-outline" size={12} color={colors.textMuted} />
        <Text style={[styles.footerText, { color: colors.textMuted }]}>
          IT-Inventory · Gestion de stock IT
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  blob: {
    position: 'absolute',
    borderRadius: 999,
  },
  logoSection: {
    marginBottom: 24,
  },
  logo: {
    width: 72,
    height: 72,
    borderRadius: 18,
  },
  iconSection: {
    marginBottom: 28,
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 22,
    textAlign: 'center',
    paddingHorizontal: 8,
    marginBottom: 20,
  },
  releasesBox: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 14,
    gap: 10,
  },
  releasesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  releasesTitle: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.1,
  },
  releaseItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  releaseText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
  versionBox: {
    width: '100%',
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 8,
  },
  infoBox: {
    width: '100%',
    marginTop: 14,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '500',
  },
  versionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  versionLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  versionValue: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  buttonSection: {
    width: '100%',
  },
  updateBtn: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  updateBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
  },
  updateBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  footer: {
    position: 'absolute',
    bottom: 28,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  footerText: {
    fontSize: 11,
    fontWeight: '500',
  },
});

export default ForceUpdateScreen;
