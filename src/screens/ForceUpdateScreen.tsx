import React from 'react';
import { View, Text, StyleSheet, Linking, StatusBar, TouchableOpacity } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import { CA_THEME } from '@/constants/caTheme';
import { APP_CONFIG } from '@/constants/config';
import type { VersionCheckResult } from '@/services/versionService';

interface Props {
  updateInfo: VersionCheckResult;
}

export const ForceUpdateScreen: React.FC<Props> = ({ updateInfo }) => {
  const handleUpdate = () => {
    const updateUrl = updateInfo.updateUrl || APP_CONFIG.playStoreUrl;
    Linking.openURL(updateUrl).catch(() => {
      Linking.openURL('market://details?id=com.itinventory').catch(() => {});
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={CA_THEME.obsidian} />
      
      {/* Background Gradient */}
      <LinearGradient
        colors={[CA_THEME.obsidian, '#0f172a']}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Decorative Blur / Glow */}
      <View style={styles.glowOrb} />

      <View style={styles.content}>
        <Animated.View entering={FadeInDown.duration(600).springify()} style={styles.iconWrap}>
          <Icon name="rocket-launch" size={60} color={CA_THEME.white} />
        </Animated.View>

        <Animated.Text entering={FadeInUp.duration(600).delay(200)} style={styles.title}>
          Mise à jour requise
        </Animated.Text>
        
        <Animated.Text entering={FadeInUp.duration(600).delay(300)} style={styles.description}>
          Une nouvelle version de {APP_CONFIG.appName} est disponible ! {'\n\n'}
          Pour continuer à utiliser l'application avec les dernières fonctionnalités et correctifs de sécurité, veuillez la mettre à jour.
        </Animated.Text>
      </View>

      <Animated.View entering={FadeInUp.duration(600).delay(500)} style={styles.footer}>
        <TouchableOpacity style={styles.updateButton} onPress={handleUpdate} activeOpacity={0.8}>
          <LinearGradient
            colors={[CA_THEME.greenLight, CA_THEME.green]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradientButton}
          >
            <Text style={styles.updateButtonText}>Mettre à jour maintenant</Text>
            <Icon name="arrow-right" size={20} color={CA_THEME.white} />
          </LinearGradient>
        </TouchableOpacity>
        <Text style={styles.versionText}>
          Version actuelle : {APP_CONFIG.version} · Version requise : {updateInfo.latestVersion || updateInfo.minVersion || 'plus récente'}
        </Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CA_THEME.obsidian,
  },
  glowOrb: {
    position: 'absolute',
    top: '15%',
    left: '20%',
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: CA_THEME.green,
    opacity: 0.15,
    transform: [{ scale: 1.5 }],
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  iconWrap: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(16, 185, 129, 0.2)', // green with opacity
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
    borderWidth: 2,
    borderColor: 'rgba(16, 185, 129, 0.4)',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: CA_THEME.white,
    marginBottom: 16,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  description: {
    fontSize: 15,
    color: CA_THEME.textMuted,
    textAlign: 'center',
    lineHeight: 24,
  },
  footer: {
    padding: 32,
    paddingBottom: 48,
  },
  updateButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: CA_THEME.greenLight,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  gradientButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 24,
    gap: 12,
  },
  updateButtonText: {
    color: CA_THEME.white,
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  versionText: {
    textAlign: 'center',
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
    marginTop: 20,
  },
});
