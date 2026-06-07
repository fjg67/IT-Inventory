import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Animated, { cancelAnimation, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { OnboardingSlide } from '../components/OnboardingSlide';
import { ScanCorners } from '../components/ScanCorners';
import { SlideContent } from '../components/SlideContent';

type SlideScanProps = {
  isActive: boolean;
};

export const SlideScan: React.FC<SlideScanProps> = ({ isActive }) => {
  const scanLineY = useSharedValue(-40);

  useEffect(() => {
    cancelAnimation(scanLineY);
    if (!isActive) {
      scanLineY.value = -40;
      return;
    }

    scanLineY.value = withRepeat(
      withSequence(
        withTiming(40, { duration: 1400 }),
        withTiming(-40, { duration: 0 }),
      ),
      -1,
      false,
    );

    return () => {
      cancelAnimation(scanLineY);
    };
  }, [isActive, scanLineY]);

  const scanLineStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: scanLineY.value }],
  }));

  return (
    <OnboardingSlide>
      <View style={styles.illustrationWrap}>
        <View style={styles.scanFrame}>
          <ScanCorners color="#22C55E" size={140} cornerLength={34} />

          <View style={styles.barcodeIcon}>
            <Icon name="barcode-scan" size={44} color="#22C55E" />
          </View>

          <Animated.View style={[styles.scanLine, scanLineStyle]} />
        </View>

        <View style={styles.tc22Badge}>
          <Icon name="cellphone-cog" size={12} color="#86EFAC" />
          <Text style={styles.tc22Text}>TC22 · Zebra Ready</Text>
        </View>
      </View>

      <SlideContent
        title="Scan en un instant"
        description="Scannez codes-barres et QR en quelques secondes, même en environnement intensif."
      />
    </OnboardingSlide>
  );
};

const styles = StyleSheet.create({
  illustrationWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
  },
  scanFrame: {
    width: 140,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  barcodeIcon: {
    position: 'absolute',
  },
  scanLine: {
    position: 'absolute',
    width: 100,
    height: 2,
    borderRadius: 1,
    backgroundColor: '#22C55E',
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 4,
  },
  tc22Badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: 'rgba(34,197,94,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.2)',
  },
  tc22Text: {
    fontSize: 11,
    fontWeight: '600',
    color: '#86EFAC',
  },
});
