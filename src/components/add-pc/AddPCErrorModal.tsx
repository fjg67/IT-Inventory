import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';

interface AddPCErrorModalProps {
  visible: boolean;
  type: 'hostname_duplicate' | 'asset_duplicate' | 'format_invalid';
  message: string;
  onDismiss: () => void;
}

const ERROR_CONFIG: Record<AddPCErrorModalProps['type'], { icon: string; gradient: [string, string]; color: string; title: string }> = {
  hostname_duplicate: {
    icon: 'laptop-off',
    gradient: ['#EF4444', '#DC2626'],
    color: '#EF4444',
    title: 'Hostname déjà existant',
  },
  asset_duplicate: {
    icon: 'tag-off',
    gradient: ['#F59E0B', '#D97706'],
    color: '#F59E0B',
    title: 'Asset déjà existant',
  },
  format_invalid: {
    icon: 'alert-octagon',
    gradient: ['#8B5CF6', '#7C3AED'],
    color: '#8B5CF6',
    title: 'Format invalide',
  },
};

export const AddPCErrorModal: React.FC<AddPCErrorModalProps> = ({
  visible,
  type,
  message,
  onDismiss,
}) => {
  const scaleAnim = useSharedValue(0);
  const config = ERROR_CONFIG[type];

  React.useEffect(() => {
    if (visible) {
      scaleAnim.value = withSpring(1, { damping: 12, stiffness: 200 }, () => {
        setTimeout(() => {
          scaleAnim.value = withTiming(0, { duration: 250 });
        }, 3200);
      });
    } else {
      scaleAnim.value = 0;
    }
  }, [visible, scaleAnim]);

  const scaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleAnim.value }],
    opacity: scaleAnim.value,
  }));

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss}>
      <View style={styles.backdrop}>
        <Animated.View
          entering={FadeIn.duration(180)}
          exiting={FadeOut.duration(150)}
          style={[styles.container, scaleStyle]}
        >
          <View style={[styles.card, { borderColor: `${config.color}40` }]}>
            {/* Top accent line */}
            <LinearGradient
              colors={config.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.topAccent}
            />

            {/* Decorative orbs */}
            <View pointerEvents="none" style={[styles.orbOne, { backgroundColor: `${config.color}12` }]} />
            <View pointerEvents="none" style={[styles.orbTwo, { backgroundColor: `${config.color}08` }]} />

            {/* Icon with gradient bg */}
            <View style={[styles.iconWrap, { backgroundColor: `${config.color}16`, borderColor: `${config.color}30` }]}>
              <LinearGradient
                colors={config.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.iconGradient}
              >
                <Icon name={config.icon} size={28} color="#FFFFFF" />
              </LinearGradient>
            </View>

            {/* Title */}
            <Text style={[styles.title, { color: config.color }]}>{config.title}</Text>

            {/* Message */}
            <Text style={styles.message}>{message}</Text>

            {/* Info box */}
            <View style={[styles.infoBox, { backgroundColor: `${config.color}0A`, borderColor: `${config.color}28` }]}>
              <Icon name="information-outline" size={14} color={config.color} />
              <Text style={[styles.infoText, { color: `${config.color}E6` }]}>
                {type === 'hostname_duplicate'
                  ? 'Cet hostname est déjà utilisé dans la base.'
                  : type === 'asset_duplicate'
                    ? 'Cet asset est déjà utilisé dans la base.'
                    : 'Vérifiez le format du champ.'}
              </Text>
            </View>

            {/* Close button */}
            <Pressable onPress={onDismiss} style={[styles.closeBtn, { borderColor: `${config.color}40` }]}>
              <Text style={[styles.closeBtnText, { color: config.color }]}>Comprendre</Text>
            </Pressable>

            {/* Bottom progress indicator */}
            <View style={[styles.progressTrack, { backgroundColor: `${config.color}14` }]}>
              <Animated.View
                style={[
                  styles.progressBar,
                  { backgroundColor: config.color },
                  useAnimatedStyle(() => ({
                    width: `${scaleAnim.value * 100}%`,
                  })),
                ]}
              />
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.82)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  container: {
    width: '100%',
    maxWidth: 340,
  },
  card: {
    borderRadius: 18,
    borderWidth: 1.5,
    backgroundColor: '#0A0F0D',
    overflow: 'hidden',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 14,
  },
  topAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
  },
  orbOne: {
    position: 'absolute',
    top: -24,
    right: -16,
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  orbTwo: {
    position: 'absolute',
    bottom: 20,
    left: -40,
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    alignSelf: 'center',
    marginBottom: 14,
  },
  iconGradient: {
    width: 56,
    height: 56,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: 13,
    fontWeight: '600',
    color: '#D1D5DB',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 14,
  },
  infoBox: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
    marginBottom: 14,
  },
  infoText: {
    flex: 1,
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 15,
  },
  closeBtn: {
    borderRadius: 11,
    borderWidth: 1.5,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  closeBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  progressTrack: {
    height: 2,
    borderRadius: 1,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
  },
});
