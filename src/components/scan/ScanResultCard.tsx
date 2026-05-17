import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import Animated, { FadeInUp } from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Article } from '@/types';
import { useSwipeDismiss } from '@/hooks/useSwipeDismiss';
import { ScanActionGrid, ScanActionItem } from './ScanActionGrid';
import { ScanArticleInfo } from './ScanArticleInfo';
import { ScanStockDisplay } from './ScanStockDisplay';
import { SCAN_COLORS } from './tokens';

type ScanResultCardProps = {
  article: Article;
  siteName?: string;
  actions: ScanActionItem[];
  onClose: () => void;
  onNewScan: () => void;
};

export const ScanResultCard: React.FC<ScanResultCardProps> = ({ article, siteName, actions, onClose, onNewScan }) => {
  const { gesture, animatedStyle } = useSwipeDismiss(onClose);

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View entering={FadeInUp.duration(420)} style={[styles.shell, animatedStyle]}>
        <LinearGradient
          colors={['rgba(17,26,20,0.98)', 'rgba(10,15,13,0.98)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.card}
        >
          <View style={styles.accentLine} />
          <View style={styles.headerRow}>
            <View style={styles.badge}>
              <Icon name="check-decagram" size={13} color={SCAN_COLORS.green_light} />
              <Text style={styles.badgeText}>Article trouve</Text>
            </View>
            <View style={styles.siteBadge}>
              <Icon name="map-marker-outline" size={12} color={SCAN_COLORS.text_muted} />
              <Text numberOfLines={1} style={styles.siteText}>{siteName || 'Site inconnu'}</Text>
            </View>
          </View>

          <ScanArticleInfo article={article} onClose={onClose} />

          <View style={styles.divider} />

          <ScanStockDisplay
            quantity={article.quantiteActuelle ?? 0}
            unit={article.unite}
            minStock={article.stockMini}
          />

          <View style={styles.divider} />

          <ScanActionGrid actions={actions} />

          <TouchableOpacity activeOpacity={0.84} onPress={onNewScan} style={styles.newScanBtn}>
            <View style={styles.newScanInner}>
              <Icon name="barcode-scan" size={19} color={SCAN_COLORS.green_light} />
              <Text style={styles.newScanText}>Nouveau scan</Text>
            </View>
          </TouchableOpacity>
        </LinearGradient>
      </Animated.View>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  shell: {
    marginTop: 22,
    paddingHorizontal: 16,
  },
  card: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: SCAN_COLORS.border_card,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowRadius: 24,
    shadowOpacity: 0.28,
    elevation: 16,
  },
  accentLine: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: SCAN_COLORS.green_light,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 14,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: SCAN_COLORS.green_subtle,
    borderWidth: 1,
    borderColor: SCAN_COLORS.border_card,
  },
  badgeText: {
    color: SCAN_COLORS.green_light,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  siteBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: SCAN_COLORS.bg_card,
  },
  siteText: {
    maxWidth: 120,
    color: SCAN_COLORS.text_muted,
    fontSize: 12,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    borderRadius: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginVertical: 16,
  },
  newScanBtn: {
    marginTop: 16,
    borderRadius: 18,
    overflow: 'hidden',
  },
  newScanInner: {
    height: 56,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  newScanText: {
    color: SCAN_COLORS.text_primary,
    fontSize: 15,
    fontWeight: '800',
  },
});
