import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { CA_THEME } from '@/constants/caTheme';

interface PCParcFABProps {
  onAddPC: () => void;
  onBulkScan: () => void;
  onExport: () => void;
}

export const PCParcFAB = ({ onAddPC, onBulkScan, onExport }: PCParcFABProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const openProgress = useSharedValue(0);

  const toggleOpen = () => {
    const nextState = !isOpen;
    setIsOpen(nextState);
    openProgress.value = withSpring(nextState ? 1 : 0, {
      damping: 15,
      stiffness: 150,
    });
  };

  const actionStyle1 = useAnimatedStyle(() => {
    return {
      transform: [
        { translateY: interpolate(openProgress.value, [0, 1], [0, -60], Extrapolate.CLAMP) },
        { scale: interpolate(openProgress.value, [0, 1], [0, 1], Extrapolate.CLAMP) },
      ],
      opacity: openProgress.value,
    };
  });

  const actionStyle2 = useAnimatedStyle(() => {
    return {
      transform: [
        { translateY: interpolate(openProgress.value, [0, 1], [0, -115], Extrapolate.CLAMP) },
        { scale: interpolate(openProgress.value, [0, 1], [0, 1], Extrapolate.CLAMP) },
      ],
      opacity: openProgress.value,
    };
  });

  const actionStyle3 = useAnimatedStyle(() => {
    return {
      transform: [
        { translateY: interpolate(openProgress.value, [0, 1], [0, -170], Extrapolate.CLAMP) },
        { scale: interpolate(openProgress.value, [0, 1], [0, 1], Extrapolate.CLAMP) },
      ],
      opacity: openProgress.value,
    };
  });

  const fabIconStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { rotate: `${interpolate(openProgress.value, [0, 1], [0, 45])}deg` },
      ],
    };
  });

  const bgStyle = useAnimatedStyle(() => {
    return {
      backgroundColor: interpolate(openProgress.value, [0, 1], [0, 1]) > 0.5 ? CA_THEME.greenBg : CA_THEME.green,
    };
  });

  return (
    <View style={styles.container} pointerEvents="box-none">
      
      {isOpen && (
        <TouchableOpacity style={styles.backdrop} onPress={toggleOpen} activeOpacity={1} />
      )}

      {/* Action 3: Export */}
      <Animated.View style={[styles.actionBtnWrap, actionStyle3]} pointerEvents={isOpen ? 'auto' : 'none'}>
        <Text style={styles.actionLabel}>Exporter</Text>
        <TouchableOpacity style={styles.actionBtn} activeOpacity={0.8} onPress={() => { toggleOpen(); onExport(); }}>
          <Icon name="file-export-outline" size={20} color={CA_THEME.textPrimary} />
        </TouchableOpacity>
      </Animated.View>

      {/* Action 2: Bulk Scan */}
      <Animated.View style={[styles.actionBtnWrap, actionStyle2]} pointerEvents={isOpen ? 'auto' : 'none'}>
        <Text style={styles.actionLabel}>Scan Multiples</Text>
        <TouchableOpacity style={styles.actionBtn} activeOpacity={0.8} onPress={() => { toggleOpen(); onBulkScan(); }}>
          <Icon name="barcode-scan" size={20} color={CA_THEME.textPrimary} />
        </TouchableOpacity>
      </Animated.View>

      {/* Action 1: Add PC */}
      <Animated.View style={[styles.actionBtnWrap, actionStyle1]} pointerEvents={isOpen ? 'auto' : 'none'}>
        <Text style={styles.actionLabel}>Ajouter un PC</Text>
        <TouchableOpacity style={styles.actionBtn} activeOpacity={0.8} onPress={() => { toggleOpen(); onAddPC(); }}>
          <Icon name="laptop" size={20} color={CA_THEME.textPrimary} />
        </TouchableOpacity>
      </Animated.View>

      {/* Main FAB */}
      <Animated.View style={[styles.mainFabWrap, bgStyle]}>
        <TouchableOpacity style={styles.mainFab} activeOpacity={0.8} onPress={toggleOpen}>
          <Animated.View style={fabIconStyle}>
            <Icon name="plus" size={28} color={isOpen ? CA_THEME.green : CA_THEME.white} />
          </Animated.View>
        </TouchableOpacity>
      </Animated.View>

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 110,
    right: 20,
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
    zIndex: 9999,
  },
  backdrop: {
    position: 'absolute',
    top: -1000,
    bottom: -1000,
    left: -1000,
    right: -1000,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  mainFabWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    elevation: 6,
    shadowColor: CA_THEME.green,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  mainFab: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnWrap: {
    position: 'absolute',
    right: 8,
    bottom: 8, // So it overlaps the main fab before animation
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionLabel: {
    backgroundColor: CA_THEME.white,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 12,
    fontSize: 14,
    fontFamily: CA_THEME.fontFamilySemiBold,
    color: CA_THEME.textPrimary,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  actionBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: CA_THEME.white,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
});
