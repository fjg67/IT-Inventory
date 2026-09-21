import React from 'react';
import { View, Text, StyleSheet, Pressable, Linking, SafeAreaView, Dimensions, Animated } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop, Circle, G } from 'react-native-svg';
import { APP_CONFIG } from '@/constants';
import { typography, shadows } from '@/constants/theme';
import type { VersionCheckResult } from '@/services/versionService';
import LinearGradientComponent from 'react-native-linear-gradient';

const { width } = Dimensions.get('window');

interface Props {
  updateInfo: VersionCheckResult;
}

// ----------------------------------------------------------------------
// Premium Shield Illustration SVG Component
// ----------------------------------------------------------------------
const SafeUpdateIllustration = () => {
  // Animated value for subtle floating effect
  const translateY = React.useRef(new Animated.Value(0)).current;
  const pulseScale = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    // Floating animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(translateY, {
          toValue: -8,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Subtle pulse for the center elements
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseScale, {
          toValue: 1.05,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseScale, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [translateY, pulseScale]);

  return (
    <View style={styles.illustrationContainer}>
      {/* Background glow using LinearGradient from react-native-linear-gradient */}
      <View style={styles.glowContainer}>
        <LinearGradientComponent
          colors={['rgba(0,125,112,0.15)', 'rgba(0,125,112,0)']}
          style={StyleSheet.absoluteFillObject}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        />
      </View>

      <Animated.View
        style={[
          styles.svgWrapper,
          {
            transform: [{ translateY }],
          },
        ]}
      >
        <Svg width="180" height="200" viewBox="0 0 180 200" fill="none">
          <Defs>
            <LinearGradient id="shieldGrad" x1="90" y1="20" x2="90" y2="180" gradientUnits="userSpaceOnUse">
              <Stop offset="0" stopColor="#00A391" />
              <Stop offset="0.5" stopColor="#007D70" />
              <Stop offset="1" stopColor="#005249" />
            </LinearGradient>
            <LinearGradient id="shieldBorderGrad" x1="90" y1="10" x2="90" y2="190" gradientUnits="userSpaceOnUse">
              <Stop offset="0" stopColor="#34D399" />
              <Stop offset="1" stopColor="#006359" />
            </LinearGradient>
            <LinearGradient id="dataGrad" x1="90" y1="70" x2="90" y2="130" gradientUnits="userSpaceOnUse">
              <Stop offset="0" stopColor="#FFFFFF" stopOpacity="1" />
              <Stop offset="1" stopColor="#DCFCE7" stopOpacity="0.8" />
            </LinearGradient>
            
            {/* Soft drop shadow */}
            <LinearGradient id="shadowGrad" x1="90" y1="180" x2="90" y2="200" gradientUnits="userSpaceOnUse">
               <Stop offset="0" stopColor="rgba(0,0,0,0.15)" />
               <Stop offset="1" stopColor="rgba(0,0,0,0)" />
            </LinearGradient>
          </Defs>

          {/* Shadow */}
          <Circle cx="90" cy="190" r="45" fill="url(#shadowGrad)" transform="scale(1, 0.25) translate(0, 570)" />

          {/* Shield Outer Border/Glow */}
          <Path
            d="M90 12L20 40V90C20 135 50 175 90 190C130 175 160 135 160 90V40L90 12Z"
            fill="none"
            stroke="url(#shieldBorderGrad)"
            strokeWidth="4"
            strokeLinejoin="round"
          />

          {/* Main Shield Body */}
          <Path
            d="M90 18L26 44V90C26 130 52 166 90 180C128 166 154 130 154 90V44L90 18Z"
            fill="url(#shieldGrad)"
          />

          {/* Tech/Data Nodes */}
          <G stroke="#A7F3D0" strokeWidth="2" strokeOpacity="0.4">
            <Path d="M40 70 L60 90 L40 110" />
            <Path d="M140 70 L120 90 L140 110" />
            <Path d="M90 35 L90 55" />
            <Path d="M90 125 L90 155" />
          </G>

        </Svg>
        
        {/* Animated Inner Centerpiece */}
        <Animated.View style={[styles.centerpieceWrapper, { transform: [{ scale: pulseScale }] }]}>
          <Svg width="80" height="80" viewBox="0 0 80 80" fill="none">
             {/* Center Arrow representing "Update/Upgrade" */}
            <Circle cx="40" cy="40" r="30" fill="rgba(255,255,255,0.15)" />
            <Circle cx="40" cy="40" r="22" fill="#FFFFFF" />
            <Path
              d="M40 25 V55 M28 37 L40 25 L52 37"
              stroke="#007D70"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </Animated.View>
      </Animated.View>
    </View>
  );
};

export const UpdateBlockingScreen: React.FC<Props> = ({ updateInfo }) => {
  const handleUpdate = () => {
    const url = updateInfo.updateUrl || APP_CONFIG.playStoreUrl;
    Linking.openURL(url).catch(() => {
      // Fallback
      Linking.openURL('market://details?id=com.itinventory').catch(console.error);
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Background Gradient */}
      <LinearGradientComponent
        colors={['#FFFFFF', '#F5F5F0']}
        style={StyleSheet.absoluteFillObject}
      />

      <View style={styles.content}>
        
        {/* Header - Branding */}
        <View style={styles.header}>
          <Text style={styles.brandTitle}>
            <Text style={styles.brandTitleCA}>CRÉDIT AGRICOLE</Text>{'\n'}
            <Text style={styles.brandTitleApp}>IT Inventory</Text>
          </Text>
        </View>

        {/* Central Graphic */}
        <SafeUpdateIllustration />

        {/* Text Content */}
        <View style={styles.textContent}>
          <Text style={styles.title}>Mise à Jour Obligatoire</Text>
          <Text style={styles.description}>
            Une nouvelle version de l'application est disponible.{'\n'}
            Cette mise à jour est critique pour garantir la sécurité et accéder aux dernières fonctionnalités de gestion d'inventaire.
          </Text>

          {/* Version Info Box */}
          <View style={styles.versionBox}>
            <View style={styles.versionRow}>
              <Text style={styles.versionLabel}>Version actuelle</Text>
              <Text style={styles.versionValueOld}>{APP_CONFIG.version}</Text>
            </View>
            <View style={styles.versionDivider} />
            <View style={styles.versionRow}>
              <Text style={styles.versionLabel}>Version à installer</Text>
              <Text style={styles.versionValueNew}>{updateInfo.latestVersion || updateInfo.minVersion || 'Requise'}</Text>
            </View>
          </View>
        </View>

        {/* Call to Action */}
        <View style={styles.footer}>
          <Pressable
            style={({ pressed }) => [
              styles.updateButton,
              pressed && styles.updateButtonPressed
            ]}
            onPress={handleUpdate}
          >
            <LinearGradientComponent
              colors={['#00A391', '#007D70']}
              style={styles.buttonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.buttonText}>Mettre à jour maintenant</Text>
            </LinearGradientComponent>
          </Pressable>
          <Text style={styles.legalText}>
            © Crédit Agricole • IT Inventory App
          </Text>
        </View>
        
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F0',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    paddingTop: 40,
    paddingBottom: 24,
  },
  header: {
    alignItems: 'center',
    marginTop: 20,
  },
  brandTitle: {
    textAlign: 'center',
  },
  brandTitleCA: {
    ...typography.h3,
    color: '#007D70',
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  brandTitleApp: {
    ...typography.h4,
    color: '#1A1A1A',
    fontWeight: '600',
  },
  illustrationContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 240,
    marginTop: 20,
  },
  glowContainer: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
    overflow: 'hidden',
    backgroundColor: 'rgba(0,125,112,0.03)',
  },
  svgWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerpieceWrapper: {
    position: 'absolute',
    top: 60, // Adjusted to visually center on the shield
    left: 50,
  },
  textContent: {
    alignItems: 'center',
  },
  title: {
    ...typography.h1,
    color: '#1A1A1A',
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    ...typography.body,
    color: '#5A5A55',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
    paddingHorizontal: 10,
  },
  versionBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    width: '100%',
    ...shadows.sm,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,125,112,0.1)',
  },
  versionRow: {
    alignItems: 'center',
    flex: 1,
  },
  versionLabel: {
    ...typography.caption,
    color: '#888880',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontSize: 11,
  },
  versionValueOld: {
    ...typography.h3,
    color: '#5A5A55',
    textDecorationLine: 'line-through',
  },
  versionValueNew: {
    ...typography.h3,
    color: '#007D70',
    fontWeight: '700',
  },
  versionDivider: {
    width: 1,
    height: '80%',
    backgroundColor: '#E0E0D8',
  },
  footer: {
    alignItems: 'center',
    marginTop: 20,
  },
  updateButton: {
    width: '100%',
    borderRadius: 14,
    overflow: 'hidden',
    ...shadows.lg,
    shadowColor: '#007D70',
  },
  updateButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  buttonGradient: {
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    ...typography.h4,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  legalText: {
    marginTop: 20,
    ...typography.small,
    color: '#A0A0A0',
  }
});
