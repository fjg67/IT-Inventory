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
          colors={['rgba(99,102,241,0.05)', 'rgba(99,102,241,0)']}
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
          Une nouvelle version de l'application est disponible. Veuillez mettre à jour pour continuer à utiliser IT-Inventory.
        </Text>

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
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(800).duration(500)} style={styles.buttonSection}>
        <TouchableOpacity activeOpacity={0.8} onPress={handleUpdate} style={styles.updateBtn}>
          <LinearGradient
            colors={['#6366F1', '#4F46E5']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.updateBtnGradient}
          >
            <Icon name="google-play" size={22} color="#FFF" />
            <Text style={styles.updateBtnText}>Mettre à jour</Text>
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
  versionBox: {
    width: '100%',
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 8,
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
