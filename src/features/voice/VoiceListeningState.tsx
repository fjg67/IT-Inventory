import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming, cancelAnimation } from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const BAR_COUNT = 9;

const WaveformBar = ({ index }: { index: number }) => {
  const height = useSharedValue(6);

  useEffect(() => {
    const randomDuration = 600 + index * 80 + Math.random() * 200;
    height.value = withRepeat(
      withSequence(
        withTiming(15 + Math.random() * 24, { duration: randomDuration }),
        withTiming(6 + Math.random() * 10, { duration: randomDuration })
      ), -1, true
    );
    return () => cancelAnimation(height);
  }, []);

  const barStyle = useAnimatedStyle(() => ({
    height: height.value,
    opacity: 0.5 + (height.value / 30) * 0.5,
  }));

  return (
    <Animated.View style={[styles.bar, barStyle]} />
  );
};

const ListeningRing = ({ size, delay }: { size: number, delay: number }) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.5);

  useEffect(() => {
    setTimeout(() => {
      scale.value = withRepeat(withTiming(1.5, { duration: 1500 }), -1, false);
      opacity.value = withRepeat(withTiming(0, { duration: 1500 }), -1, false);
    }, delay);
    return () => {
      cancelAnimation(scale);
      cancelAnimation(opacity);
    };
  }, []);

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.ring, { width: size, height: size, borderRadius: size/2 }, ringStyle]} />
  );
};

export const VoiceListeningState = ({ transcript }: { transcript: string }) => (
  <View style={styles.container}>
    <View style={styles.ringsContainer}>
      <ListeningRing size={120} delay={0} />
      <ListeningRing size={92}  delay={300} />
      <View style={styles.micCircle}>
        <Icon name="microphone" size={40} color="white" />
      </View>
    </View>

    <Text style={styles.listeningLabel}>Écoute en cours...</Text>

    <View style={styles.waveform}>
      {Array.from({ length: BAR_COUNT }).map((_, i) => (
        <WaveformBar key={i} index={i} />
      ))}
    </View>

    <View style={styles.transcriptZone}>
      <Text style={styles.transcriptText}>
        {transcript || 'En attente de votre commande...'}
      </Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  ringsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 160,
    height: 160,
    marginBottom: 20,
  },
  micCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#1B8A3E',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    elevation: 8,
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },
  ring: {
    position: 'absolute',
    backgroundColor: 'rgba(34,197,94,0.3)',
  },
  listeningLabel: {
    color: '#10B981',
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 30,
  },
  waveform: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
    gap: 6,
    marginBottom: 40,
  },
  bar: {
    width: 6,
    backgroundColor: '#10B981',
    borderRadius: 3,
  },
  transcriptZone: {
    backgroundColor: '#F3F4F6',
    padding: 16,
    borderRadius: 12,
    minWidth: '80%',
    alignItems: 'center',
  },
  transcriptText: {
    fontSize: 16,
    color: '#374151',
    fontStyle: 'italic',
    textAlign: 'center',
  },
});
