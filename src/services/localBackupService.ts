import AsyncStorage from '@react-native-async-storage/async-storage';
import RNFS from 'react-native-fs';
import Share from 'react-native-share';
import DocumentPicker from 'react-native-document-picker';

const BACKUP_VERSION = 1;
const BACKUP_DIR = RNFS.DocumentDirectoryPath;

export const localBackupService = {
  async exportBackup(): Promise<string> {
    const keys = await AsyncStorage.getAllKeys();
    const entries = await AsyncStorage.multiGet(keys);
    const payload = { version: BACKUP_VERSION, exportedAt: new Date().toISOString(), data: Object.fromEntries(entries) };
    const path = `${BACKUP_DIR}/it-inventory-backup-${Date.now()}.json`;
    await RNFS.writeFile(path, JSON.stringify(payload, null, 2), 'utf8');
    await Share.open({ url: `file://${path}`, title: 'Sauvegarde IT-Inventory', type: 'application/json' });
    return path;
  },

  async importBackup(): Promise<void> {
    const file = await DocumentPicker.pickSingle({ type: [DocumentPicker.types.json, DocumentPicker.types.plainText], copyTo: 'cachesDirectory' });
    const path = (file.fileCopyUri ?? file.uri).replace(/^file:\/\//, '');
    const raw = await RNFS.readFile(path, 'utf8');
    const backup = JSON.parse(raw) as { version: number; data: Record<string, string | null> };
    if (backup.version !== BACKUP_VERSION || !backup.data) throw new Error('Format de sauvegarde non reconnu');
    await AsyncStorage.multiSet(Object.entries(backup.data).map(([key, value]) => [key, value ?? '']));
  },
};

export default localBackupService;
