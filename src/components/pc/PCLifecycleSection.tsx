import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import pcLifecycleService, { PCAssetProfile, PCLifecycleEvent } from '@/services/pcLifecycleService';

type ModalKind = 'profile' | 'assign' | 'loan' | 'maintenance' | null;

interface Props {
  articleId: string | number;
  technicianId?: string | number;
}

const eventLabels: Record<PCLifecycleEvent['type'], string> = {
  assignment: 'Affectation',
  loan: 'Prêt',
  return: 'Restitution',
  maintenance: 'Maintenance',
  check: 'Vérification',
};

export const PCLifecycleSection: React.FC<Props> = ({ articleId, technicianId }) => {
  const [profile, setProfile] = useState<PCAssetProfile | null>(null);
  const [history, setHistory] = useState<PCLifecycleEvent[]>([]);
  const [modal, setModal] = useState<ModalKind>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [personName, setPersonName] = useState('');
  const [dueBackDate, setDueBackDate] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [warrantyEndDate, setWarrantyEndDate] = useState('');
  const [supplier, setSupplier] = useState('');
  const [nextCheckDate, setNextCheckDate] = useState('');
  const [description, setDescription] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [loadedProfile, loadedHistory] = await Promise.all([
        pcLifecycleService.getProfile(articleId),
        pcLifecycleService.getHistory(articleId),
      ]);
      setProfile(loadedProfile);
      setHistory(loadedHistory);
      setPurchaseDate(loadedProfile?.purchaseDate ?? '');
      setWarrantyEndDate(loadedProfile?.warrantyEndDate ?? '');
      setSupplier(loadedProfile?.supplier ?? '');
      setNextCheckDate(loadedProfile?.nextCheckDate ?? '');
    } catch (error) {
      Alert.alert('Cycle de vie indisponible', (error as Error).message);
    } finally {
      setLoading(false);
    }
  }, [articleId]);

  useEffect(() => { load().catch(() => {}); }, [load]);

  const closeModal = () => {
    if (!saving) {
      setModal(null);
      setPersonName('');
      setDueBackDate('');
      setDescription('');
    }
  };

  const perform = async () => {
    setSaving(true);
    try {
      const performedBy = technicianId == null ? undefined : String(technicianId);
      if (modal === 'profile') {
        const updated = await pcLifecycleService.updateProfile(articleId, { purchaseDate, warrantyEndDate, supplier, nextCheckDate, updatedBy: performedBy });
        setProfile(updated);
      } else if (modal === 'assign') {
        await pcLifecycleService.assign(articleId, personName, performedBy);
      } else if (modal === 'loan') {
        await pcLifecycleService.loan(articleId, personName, dueBackDate, performedBy);
      } else if (modal === 'maintenance') {
        await pcLifecycleService.addMaintenance(articleId, description, nextCheckDate, performedBy);
      }
      setModal(null);
      setPersonName('');
      setDueBackDate('');
      setDescription('');
      await load();
    } catch (error) {
      Alert.alert('Enregistrement impossible', (error as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const returnPC = () => {
    Alert.alert('Confirmer la restitution', 'Le PC sera marqué comme disponible.', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Confirmer', onPress: async () => {
        try {
          await pcLifecycleService.returnPC(articleId, technicianId == null ? undefined : String(technicianId));
          await load();
        } catch (error) {
          Alert.alert('Restitution impossible', (error as Error).message);
        }
      } },
    ]);
  };

  const openProfile = () => {
    setPurchaseDate(profile?.purchaseDate ?? '');
    setWarrantyEndDate(profile?.warrantyEndDate ?? '');
    setSupplier(profile?.supplier ?? '');
    setNextCheckDate(profile?.nextCheckDate ?? '');
    setModal('profile');
  };

  return <View style={styles.section}>
    <View style={styles.sectionHeader}><View><Text style={styles.eyebrow}>PARC PC</Text><Text style={styles.title}>Cycle de vie</Text></View><Pressable onPress={openProfile} style={styles.editButton} accessibilityLabel="Modifier les informations du cycle de vie"><Icon name="pencil-outline" size={17} color="#007A55" /></Pressable></View>
    {loading ? <Text style={styles.muted}>Chargement...</Text> : <>
      <View style={styles.summaryCard}>
        <InfoRow icon="account-outline" label="Affecté à" value={profile?.assignedTo ?? 'Non affecté'} />
        <InfoRow icon="calendar-start" label="Achat" value={profile?.purchaseDate ?? 'Non renseigné'} />
        <InfoRow icon="shield-check-outline" label="Garantie jusqu’au" value={profile?.warrantyEndDate ?? 'Non renseigné'} />
        <InfoRow icon="store-outline" label="Fournisseur" value={profile?.supplier ?? 'Non renseigné'} />
        <InfoRow icon="calendar-clock" label="Prochaine vérification" value={profile?.nextCheckDate ?? 'Non planifiée'} />
        <InfoRow icon="laptop-account" label="Statut prêt" value={profile?.loanStatus === 'loaned' ? `Prêté à ${profile.loanedTo ?? 'inconnu'}` : profile?.loanStatus === 'assigned' ? 'Affecté' : 'Disponible'} />
        {profile?.dueBackDate ? <InfoRow icon="calendar-alert" label="Retour prévu" value={profile.dueBackDate} /> : null}
      </View>
      <View style={styles.actions}><ActionButton icon="account-plus-outline" label="Affecter" onPress={() => setModal('assign')} /><ActionButton icon="briefcase-upload-outline" label="Prêter" onPress={() => setModal('loan')} /><ActionButton icon="wrench-outline" label="Maintenance" onPress={() => setModal('maintenance')} />{profile?.loanStatus === 'loaned' ? <ActionButton icon="keyboard-return" label="Restituer" onPress={returnPC} danger /> : null}</View>
      {history.length > 0 ? <View style={styles.historyCard}><Text style={styles.historyTitle}>Historique utilisateurs et interventions</Text>{history.slice(0, 8).map(event => <View key={event.id} style={styles.historyRow}><View style={styles.historyIcon}><Icon name={event.type === 'maintenance' ? 'wrench-outline' : event.type === 'return' ? 'keyboard-return' : 'account-clock-outline'} size={15} color="#007A55" /></View><View style={styles.historyBody}><Text style={styles.historyLabel}>{eventLabels[event.type]}{event.personName ? ` · ${event.personName}` : ''}</Text><Text style={styles.historyDescription}>{event.description ?? 'Événement enregistré'}</Text></View><Text style={styles.historyDate}>{new Date(event.eventDate).toLocaleDateString('fr-FR')}</Text></View>)}</View> : <Text style={styles.muted}>Aucun événement de cycle de vie enregistré.</Text>}
    </>}

    <Modal visible={modal !== null} transparent animationType="slide" onRequestClose={closeModal}><View style={styles.backdrop}><View style={styles.modalCard}><Text style={styles.modalTitle}>{modal === 'profile' ? 'Informations du PC' : modal === 'assign' ? 'Affecter le PC' : modal === 'loan' ? 'Prêter le PC' : 'Ajouter une maintenance'}</Text>{modal === 'profile' ? <><Field label="Date d’achat" value={purchaseDate} onChangeText={setPurchaseDate} placeholder="AAAA-MM-JJ" /><Field label="Fin de garantie" value={warrantyEndDate} onChangeText={setWarrantyEndDate} placeholder="AAAA-MM-JJ" /><Field label="Fournisseur" value={supplier} onChangeText={setSupplier} placeholder="Nom du fournisseur" /><Field label="Prochaine vérification" value={nextCheckDate} onChangeText={setNextCheckDate} placeholder="AAAA-MM-JJ" /></> : null}{modal === 'assign' ? <Field label="Personne affectée" value={personName} onChangeText={setPersonName} placeholder="Nom et prénom" /> : null}{modal === 'loan' ? <><Field label="Emprunteur" value={personName} onChangeText={setPersonName} placeholder="Nom et prénom" /><Field label="Date de retour prévue" value={dueBackDate} onChangeText={setDueBackDate} placeholder="AAAA-MM-JJ" /></> : null}{modal === 'maintenance' ? <><Field label="Intervention" value={description} onChangeText={setDescription} placeholder="Description de la maintenance" multiline /><Field label="Prochaine vérification" value={nextCheckDate} onChangeText={setNextCheckDate} placeholder="AAAA-MM-JJ" /></> : null}<View style={styles.modalActions}><Pressable onPress={closeModal} style={styles.cancel}><Text style={styles.cancelText}>Annuler</Text></Pressable><Pressable onPress={perform} disabled={saving} style={styles.confirm}>{saving ? <Text style={styles.confirmText}>Enregistrement...</Text> : <Text style={styles.confirmText}>Enregistrer</Text>}</Pressable></View></View></View></Modal>
  </View>;
};

const InfoRow = ({ icon, label, value }: { icon: string; label: string; value: string }) => <View style={styles.infoRow}><Icon name={icon} size={17} color="#007A55" /><Text style={styles.infoLabel}>{label}</Text><Text style={styles.infoValue} numberOfLines={1}>{value}</Text></View>;
const ActionButton = ({ icon, label, onPress, danger }: { icon: string; label: string; onPress: () => void; danger?: boolean }) => <Pressable onPress={onPress} style={[styles.actionButton, danger && styles.actionDanger]}><Icon name={icon} size={17} color={danger ? '#B4233E' : '#007A55'} /><Text style={[styles.actionText, danger && styles.actionTextDanger]}>{label}</Text></Pressable>;
const Field = ({ label, value, onChangeText, placeholder, multiline }: { label: string; value: string; onChangeText: (value: string) => void; placeholder: string; multiline?: boolean }) => <View style={styles.field}><Text style={styles.fieldLabel}>{label}</Text><TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor="#82948A" style={[styles.input, multiline && styles.multiline]} multiline={multiline} /></View>;

const styles = StyleSheet.create({ section: { gap: 12, padding: 16, backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#DCE8DF' }, sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, eyebrow: { color: '#007A55', fontSize: 10, fontWeight: '800', letterSpacing: 1 }, title: { color: '#17352A', fontSize: 19, fontWeight: '800', marginTop: 3 }, editButton: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#EAF4EE', alignItems: 'center', justifyContent: 'center' }, summaryCard: { gap: 9, padding: 12, borderRadius: 12, backgroundColor: '#F5FAF6' }, infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 }, infoLabel: { color: '#617068', fontSize: 12, width: 136 }, infoValue: { flex: 1, color: '#17352A', fontSize: 12, fontWeight: '700' }, actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 }, actionButton: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 9, borderRadius: 10, backgroundColor: '#EAF4EE' }, actionDanger: { backgroundColor: '#FCECEF' }, actionText: { color: '#007A55', fontSize: 12, fontWeight: '800' }, actionTextDanger: { color: '#B4233E' }, historyCard: { gap: 9 }, historyTitle: { color: '#17352A', fontSize: 13, fontWeight: '800' }, historyRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 7, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#E1EAE4' }, historyIcon: { width: 28, height: 28, borderRadius: 8, backgroundColor: '#EAF4EE', alignItems: 'center', justifyContent: 'center' }, historyBody: { flex: 1 }, historyLabel: { color: '#28563F', fontSize: 12, fontWeight: '800' }, historyDescription: { color: '#718078', fontSize: 11, marginTop: 2 }, historyDate: { color: '#82948A', fontSize: 10 }, muted: { color: '#718078', fontSize: 12 }, backdrop: { flex: 1, backgroundColor: 'rgba(10,25,18,0.52)', justifyContent: 'flex-end' }, modalCard: { backgroundColor: '#FFFFFF', padding: 20, gap: 12, borderTopLeftRadius: 22, borderTopRightRadius: 22 }, modalTitle: { color: '#17352A', fontSize: 20, fontWeight: '800' }, field: { gap: 5 }, fieldLabel: { color: '#426151', fontSize: 12, fontWeight: '700' }, input: { height: 46, borderWidth: 1, borderColor: '#C9D9CF', borderRadius: 10, paddingHorizontal: 12, color: '#17352A' }, multiline: { height: 86, paddingTop: 12, textAlignVertical: 'top' }, modalActions: { flexDirection: 'row', gap: 9, marginTop: 4 }, cancel: { flex: 1, height: 48, borderRadius: 11, backgroundColor: '#EEF3EF', alignItems: 'center', justifyContent: 'center' }, cancelText: { color: '#345343', fontWeight: '700' }, confirm: { flex: 1, height: 48, borderRadius: 11, backgroundColor: '#007A55', alignItems: 'center', justifyContent: 'center' }, confirmText: { color: '#FFFFFF', fontWeight: '800' },
});

export default PCLifecycleSection;
