// ============================================
// LOADING COMPONENT - IT-Inventory Application
// ============================================

import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { OBSIDIAN_COLORS } from '@/constants/colors';
import { colors, spacing, typography, borderRadius } from '@/constants/theme';
import { useSplashSequence, type InitStep } from '@/hooks/useSplashSequence';
import {
  SplashBackground,
  SplashLogo,
  SplashProgressBar,
  SplashSecurePill,
  SplashStatusRow,
  SplashStatusText,
  SplashTexts,
} from '@/components/splash';

interface LoadingProps {
  visible?: boolean;
  message?: string;
  overlay?: boolean;
  size?: 'small' | 'large';
}

export const Loading: React.FC<LoadingProps> = ({
  visible = true,
  message,
  overlay = false,
  size = 'large',
}) => {
  if (!visible) return null;

  const content = (
    <View style={overlay ? styles.overlayContainer : styles.inlineContainer}>
      <View style={overlay ? styles.overlayContent : undefined}>
        <ActivityIndicator size={size} color={colors.primary} />
        {message ? <Text style={styles.message}>{message}</Text> : null}
      </View>
    </View>
  );

  if (overlay) {
    return (
      <Modal transparent visible={visible} animationType="fade">
        {content}
      </Modal>
    );
  }

  return content;
};

interface FullScreenLoadingProps {
  message?: string;
  messages?: string[];
  step?: InitStep;
  isError?: boolean;
  onRetry?: () => void;
}

export const FullScreenLoading: React.FC<FullScreenLoadingProps> = ({
  message,
  messages,
  step,
  isError = false,
  onRetry,
}) => {
  const rotatingMessages = useMemo(
    () => (messages && messages.length > 0 ? messages : ['Restauration de votre session...']),
    [messages],
  );
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    if (!messages || messages.length <= 1 || message || isError) return;
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % rotatingMessages.length);
    }, 1800);
    return () => clearInterval(interval);
  }, [isError, message, messages, rotatingMessages.length]);

  useEffect(() => {
    setMessageIndex(0);
  }, [rotatingMessages.length]);

  const activeMessage = message || rotatingMessages[messageIndex];
  const { progressValue, statusText } = useSplashSequence({
    step,
    message: activeMessage,
    isError,
  });

  return (
    <View style={splashStyles.container}>
      <SplashBackground />

      <View style={splashStyles.centerContent}>
        <SplashLogo />
        <SplashTexts />
        <SplashSecurePill offline={isError} />
        <SplashProgressBar progressValue={progressValue} isError={isError} />
        <SplashStatusRow isError={isError} />
        <SplashStatusText statusText={isError ? 'Impossible de se connecter' : statusText} isError={isError} />

        {isError && onRetry ? (
          <Animated.View entering={FadeInUp.delay(220).duration(260)} style={splashStyles.retryWrap}>
            <Pressable onPress={onRetry} style={splashStyles.retryButton}>
              <Text style={splashStyles.retryText}>Reessayer</Text>
            </Pressable>
          </Animated.View>
        ) : null}
      </View>

      <Animated.View entering={FadeIn.delay(1200).duration(420)} style={splashStyles.footer}>
        <Text style={splashStyles.footerText}>v2.26 · IT-Inventory</Text>
      </Animated.View>
    </View>
  );
};

const splashStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: OBSIDIAN_COLORS.bg_primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerContent: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    marginTop: -40,
  },
  retryWrap: {
    marginTop: 16,
  },
  retryButton: {
    minHeight: 40,
    paddingHorizontal: 20,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.4)',
    backgroundColor: 'rgba(127,29,29,0.22)',
  },
  retryText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FCA5A5',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  footer: {
    position: 'absolute',
    bottom: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerText: {
    fontSize: 11,
    color: OBSIDIAN_COLORS.text_dim,
    letterSpacing: 0.4,
  },
});

const styles = StyleSheet.create({
  inlineContainer: {
    padding: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlayContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlayContent: {
    backgroundColor: colors.surface,
    padding: spacing.xl,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    minWidth: 150,
  },
  message: {
    ...typography.body,
    color: colors.text.secondary,
    marginTop: spacing.md,
    textAlign: 'center',
  },
});

export default Loading;
