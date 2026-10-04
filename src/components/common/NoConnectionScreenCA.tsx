import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, StatusBar, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import NetInfo from '@react-native-community/netinfo';
import { useAppDispatch, useAppSelector } from '@/store';
import { setNetworkState, setSupabaseReachable } from '@/store/slices/networkSlice';
import { getSupabaseClient, tables } from '@/api/supabase';
import { CA_THEME } from '@/constants/caTheme';

export const NoConnectionScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const { isConnected, isInternetReachable, connectionType } = useAppSelector(state => state.network);
  const [retrying, setRetrying] = useState(false);
  const [retryMessage, setRetryMessage] = useState('');

  const handleRetry = useCallback(async () => {
    if (retrying) return;
    setRetrying(true);
    setRetryMessage('');
    try {
      const network = await NetInfo.fetch();
      const online = Boolean(network.isConnected && network.isInternetReachable !== false);
      dispatch(setNetworkState({
        isConnected: network.isConnected ?? false,
        isInternetReachable: network.isInternetReachable ?? false,
        type: network.type,
      }));

      if (!online) {
        dispatch(setSupabaseReachable(false));
        setRetryMessage('Connexion toujours indisponible. Vérifiez le Wi-Fi ou les données mobiles.');
        return;
      }

      const { error } = await getSupabaseClient().from(tables.sites).select('id').limit(1).maybeSingle();
      dispatch(setSupabaseReachable(!error));
      if (error) setRetryMessage('Internet est revenu, mais le serveur IT-Inventory ne répond pas encore.');
    } catch {
      dispatch(setSupabaseReachable(false));
      setRetryMessage('La connexion au serveur a échoué. Réessayez dans quelques instants.');
    } finally {
      setRetrying(false);
    }
  }, [dispatch, retrying]);

  const hasNetwork = Boolean(isConnected && isInternetReachable !== false);
  const networkLabel = hasNetwork ? 'Réseau disponible' : 'Aucune connexion Internet';
  const connectionLabel = connectionType ? `Dernier réseau détecté : ${connectionType}` : 'Aucun réseau détecté';

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={CA_THEME.lightGray} />
      <View style={styles.page}>
        <View style={styles.brandRow}>
          <View style={styles.brandMark}><Icon name="leaf" size={22} color={CA_THEME.white} /></View>
          <View>
            <Text style={styles.brandName}>IT-Inventory</Text>
            <Text style={styles.brandCaption}>GESTION DES ÉQUIPEMENTS</Text>
          </View>
        </View>

        <View style={styles.main}>
          <View style={styles.statusIcon}>
            <Icon name={hasNetwork ? 'server-network-off' : 'wifi-off'} size={38} color={CA_THEME.warning} />
            <View style={styles.statusDot} />
          </View>

          <View style={styles.headlineGroup}>
            <Text style={styles.eyebrow}>ÉTAT DE LA CONNEXION</Text>
            <Text style={styles.title}>{hasNetwork ? 'Serveur indisponible' : 'Vous êtes hors connexion'}</Text>
            <Text style={styles.description}>
              {hasNetwork
                ? 'Votre téléphone a accès à Internet, mais le service IT-Inventory ne répond pas pour le moment.'
                : 'IT-Inventory a besoin d’une connexion Internet pour charger les stocks et enregistrer vos opérations.'}
            </Text>
          </View>

          <View style={styles.statusPanel}>
            <View style={styles.statusPanelTop}>
              <View style={[styles.statusIndicator, hasNetwork && styles.statusIndicatorOnline]} />
              <Text style={styles.statusLabel}>{networkLabel}</Text>
              <Text style={styles.statusValue}>{hasNetwork ? 'OK' : 'HORS LIGNE'}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.connectionRow}>
              <Icon name="access-point-network" size={16} color={CA_THEME.textMuted} />
              <Text style={styles.connectionLabel}>{connectionLabel}</Text>
            </View>
          </View>

          <View style={styles.guidance}>
            <Text style={styles.guidanceTitle}>À vérifier</Text>
            <GuidanceRow icon="wifi" text="Activez le Wi-Fi ou les données mobiles." />
            <GuidanceRow icon="airplane-off" text="Vérifiez que le mode avion est désactivé." />
            <GuidanceRow icon="refresh" text="Réessayez une fois le réseau rétabli." />
          </View>

          {retryMessage ? <Text accessibilityRole="alert" style={styles.retryMessage}>{retryMessage}</Text> : null}

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Vérifier la connexion Internet"
            disabled={retrying}
            onPress={handleRetry}
            style={({ pressed }) => [styles.retryButton, pressed && styles.retryPressed, retrying && styles.retryDisabled]}
          >
            {retrying ? <ActivityIndicator size="small" color={CA_THEME.white} /> : <Icon name="refresh" size={19} color={CA_THEME.white} />}
            <Text style={styles.retryText}>{retrying ? 'Vérification...' : 'Réessayer'}</Text>
          </Pressable>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Crédit Agricole · IT-Inventory</Text>
          <View style={styles.brandStripes}><View style={styles.goldStripe} /><View style={styles.lightStripe} /><View style={styles.darkStripe} /></View>
        </View>
      </View>
    </SafeAreaView>
  );
};

const GuidanceRow = ({ icon, text }: { icon: string; text: string }) => (
  <View style={styles.guidanceRow}><Icon name={icon} size={16} color={CA_THEME.green} /><Text style={styles.guidanceText}>{text}</Text></View>
);

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: CA_THEME.lightGray },
  page: { flex: 1, paddingHorizontal: 22, paddingTop: 18, paddingBottom: 10 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  brandMark: { width: 40, height: 40, borderRadius: 11, backgroundColor: CA_THEME.green, alignItems: 'center', justifyContent: 'center' },
  brandName: { color: CA_THEME.textPrimary, fontSize: 16, fontWeight: '800' },
  brandCaption: { color: CA_THEME.textMuted, fontSize: 9, fontWeight: '800', marginTop: 2 },
  main: { flex: 1, justifyContent: 'center', paddingVertical: 24 },
  statusIcon: { width: 74, height: 74, borderRadius: 20, backgroundColor: CA_THEME.warningBg, borderWidth: 1, borderColor: '#F1D2B5', alignItems: 'center', justifyContent: 'center', marginBottom: 22, position: 'relative' },
  statusDot: { position: 'absolute', width: 12, height: 12, borderRadius: 6, right: 8, bottom: 8, backgroundColor: CA_THEME.warning, borderWidth: 2, borderColor: CA_THEME.white },
  headlineGroup: { gap: 7, marginBottom: 20 },
  eyebrow: { color: CA_THEME.green, fontSize: 10, fontWeight: '800', letterSpacing: 0.7 },
  title: { color: CA_THEME.textPrimary, fontSize: 27, lineHeight: 33, fontWeight: '800' },
  description: { color: CA_THEME.textSecondary, fontSize: 13, lineHeight: 19, marginTop: 2 },
  statusPanel: { backgroundColor: CA_THEME.white, borderRadius: 12, borderWidth: 1, borderColor: CA_THEME.borderGray, paddingHorizontal: 13, paddingVertical: 12, marginBottom: 15 },
  statusPanelTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusIndicator: { width: 8, height: 8, borderRadius: 4, backgroundColor: CA_THEME.danger },
  statusIndicatorOnline: { backgroundColor: CA_THEME.green },
  statusLabel: { flex: 1, color: CA_THEME.textPrimary, fontSize: 12, fontWeight: '700' },
  statusValue: { color: CA_THEME.warning, fontSize: 9, fontWeight: '800' },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: CA_THEME.borderGray, marginVertical: 10 },
  connectionRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  connectionLabel: { color: CA_THEME.textMuted, fontSize: 11 },
  guidance: { gap: 11, padding: 14, borderRadius: 12, backgroundColor: '#EAF4EE', marginBottom: 17 },
  guidanceTitle: { color: CA_THEME.greenText, fontSize: 12, fontWeight: '800', marginBottom: 1 },
  guidanceRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  guidanceText: { flex: 1, color: CA_THEME.textSecondary, fontSize: 11, lineHeight: 15 },
  retryMessage: { color: CA_THEME.warningText, backgroundColor: CA_THEME.warningBg, borderRadius: 9, padding: 10, fontSize: 11, lineHeight: 15, marginBottom: 12 },
  retryButton: { minHeight: 50, borderRadius: 11, backgroundColor: CA_THEME.green, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 },
  retryPressed: { backgroundColor: CA_THEME.greenDark, transform: [{ scale: 0.99 }] },
  retryDisabled: { opacity: 0.72 },
  retryText: { color: CA_THEME.white, fontSize: 14, fontWeight: '800' },
  footer: { alignItems: 'center', gap: 10, paddingTop: 8 },
  footerText: { color: CA_THEME.textMuted, fontSize: 10, fontWeight: '600' },
  brandStripes: { width: 84, height: 3, flexDirection: 'row', overflow: 'hidden', borderRadius: 2 },
  goldStripe: { flex: 1, backgroundColor: '#FFD700' },
  lightStripe: { flex: 1, backgroundColor: CA_THEME.greenLight },
  darkStripe: { flex: 1, backgroundColor: CA_THEME.greenDark },
});

export default NoConnectionScreen;
