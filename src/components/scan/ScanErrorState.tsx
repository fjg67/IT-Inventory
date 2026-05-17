import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { SCAN_COLORS } from './tokens';

type ScanErrorStateProps = {
  message: string;
  onRetry: () => void;
  onReset: () => void;
};

export const ScanErrorState: React.FC<ScanErrorStateProps> = ({ message, onRetry, onReset }) => {
  return (
    <View style={styles.wrap}>
      <View style={styles.iconWrap}>
        <Icon name="alert-circle-outline" size={26} color={SCAN_COLORS.danger} />
      </View>
      <Text style={styles.title}>Scan non reconnu</Text>
      <Text style={styles.message}>{message}</Text>

      <TouchableOpacity activeOpacity={0.85} onPress={onRetry} style={styles.primaryBtn}>
        <LinearGradient colors={[SCAN_COLORS.green_primary, SCAN_COLORS.green_light]} style={styles.primaryGradient}>
          <Icon name="refresh" size={18} color="#FFFFFF" />
          <Text style={styles.primaryText}>Reessayer</Text>
        </LinearGradient>
      </TouchableOpacity>

      <TouchableOpacity activeOpacity={0.82} onPress={onReset} style={styles.secondaryBtn}>
        <View style={styles.secondaryInner}>
          <Icon name="barcode-scan" size={18} color={SCAN_COLORS.text_primary} />
          <Text style={styles.secondaryText}>Scanner a nouveau</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    marginTop: 28,
    marginHorizontal: 20,
    borderRadius: 26,
    padding: 22,
    backgroundColor: 'rgba(17,26,20,0.96)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.2)',
    alignItems: 'center',
  },
  iconWrap: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: SCAN_COLORS.danger_subtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  title: {
    color: SCAN_COLORS.text_primary,
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 8,
  },
  message: {
    color: '#D1D5DB',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 20,
  },
  primaryBtn: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  primaryGradient: {
    height: 54,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  primaryText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  secondaryBtn: {
    width: '100%',
    marginTop: 10,
    borderRadius: 16,
    overflow: 'hidden',
  },
  secondaryInner: {
    height: 54,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  secondaryText: {
    color: SCAN_COLORS.text_primary,
    fontSize: 15,
    fontWeight: '700',
  },
});
