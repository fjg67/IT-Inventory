import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { OBSIDIAN_COLORS } from '@/constants/colors';
import { resolveStockPickerSiteConfig } from '@/constants/siteConfig';
import { ActiveSiteNote } from './ActiveSiteNote';
import { SiteCard } from './SiteCard';
import { StockPickerHeader } from './StockPickerHeader';

interface SiteLike {
  id: string | number;
  nom: string;
}

interface SiteStats {
  articles: number;
  pcs: number;
}

interface StockPickerSheetProps {
  sites: SiteLike[];
  activeSiteId?: string | number | null;
  activeSiteName?: string;
  statsBySiteId?: Record<string, SiteStats>;
  onSelectSite: (siteId: string | number) => void;
  onClose: () => void;
  showBackButton?: boolean;
  showFooterCancel?: boolean;
}

export const StockPickerSheet: React.FC<StockPickerSheetProps> = ({
  sites,
  activeSiteId,
  activeSiteName,
  statsBySiteId,
  onSelectSite,
  onClose,
  showBackButton = true,
  showFooterCancel = true,
}) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.wrap}>
      <View style={styles.handle} />

      <StockPickerHeader
        currentSiteName={activeSiteName}
        onBack={showBackButton ? onClose : undefined}
      />

      <ActiveSiteNote activeSiteName={activeSiteName} />

      <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
        {sites.map((site, index) => {
          const config = resolveStockPickerSiteConfig(site.nom);
          const isActive = String(site.id) === String(activeSiteId);
          return (
            <SiteCard
              key={String(site.id)}
              index={index}
              site={{ ...config, label: site.nom }}
              isActive={isActive}
              stats={statsBySiteId?.[String(site.id)]}
              onPress={() => onSelectSite(site.id)}
            />
          );
        })}

        <Animated.View entering={FadeIn.delay(180).duration(260)} style={styles.footerSpace}>
          <Text style={styles.footerHint}>Tous les mouvements seront rattaches au stock actif choisi.</Text>
        </Animated.View>
      </ScrollView>

      {showFooterCancel ? (
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={onClose}
          style={[styles.cancelBtn, { marginBottom: Math.max(10, insets.bottom + 4) }]}
        >
          <Text style={styles.cancelText}>Annuler</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: OBSIDIAN_COLORS.bg_card,
    borderTopWidth: 1,
    borderTopColor: OBSIDIAN_COLORS.border_card,
    paddingHorizontal: 16,
    paddingTop: 10,
    minHeight: 430,
    maxHeight: '88%',
  },
  handle: {
    alignSelf: 'center',
    width: 44,
    height: 4,
    borderRadius: 99,
    backgroundColor: OBSIDIAN_COLORS.text_dim,
    marginBottom: 12,
  },
  list: {
    flexGrow: 0,
  },
  footerSpace: {
    marginTop: 8,
    marginBottom: 8,
  },
  footerHint: {
    color: OBSIDIAN_COLORS.text_muted,
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  cancelBtn: {
    marginTop: 8,
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: OBSIDIAN_COLORS.border_card,
    backgroundColor: OBSIDIAN_COLORS.bg_card_elevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    color: OBSIDIAN_COLORS.text_muted,
    fontSize: 14,
    fontWeight: '700',
  },
});

export default StockPickerSheet;
