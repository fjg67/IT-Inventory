import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSupabaseClient, tables } from '@/api/supabase';

async function fetchRows(table: string): Promise<any[]> {
  const { data, error } = await getSupabaseClient().from(table).select('*').limit(10000);
  if (error) throw new Error(error.message);
  return data ?? [];
}

export const remoteBackupService = {
  async create(userId: string): Promise<string> {
    const [sites, articles, stocks, movements, localEntries] = await Promise.all([
      fetchRows(tables.sites), fetchRows(tables.articles), fetchRows(tables.stocksSites), fetchRows(tables.mouvements), AsyncStorage.getAllKeys().then(keys => AsyncStorage.multiGet(keys)),
    ]);
    const payload = { version: 1, exportedAt: new Date().toISOString(), sites, articles, stocks, movements, local: Object.fromEntries(localEntries) };
    const id = `backup-${userId}-${Date.now()}`;
    const { error } = await getSupabaseClient().from(tables.appBackups).insert({ id, userId, payload });
    if (error) throw new Error(error.message);
    return id;
  },
  async list(userId: string): Promise<Array<{ id: string; createdAt: string }>> {
    const { data, error } = await getSupabaseClient().from(tables.appBackups).select('id, createdAt').eq('userId', userId).order('createdAt', { ascending: false }).limit(20);
    if (error) throw new Error(error.message);
    return data ?? [];
  },
  async restoreLatest(userId: string): Promise<void> {
    const { data, error } = await getSupabaseClient().from(tables.appBackups).select('payload').eq('userId', userId).order('createdAt', { ascending: false }).limit(1).maybeSingle();
    if (error) throw new Error(error.message);
    const local = (data?.payload as any)?.local as Record<string, string | null> | undefined;
    if (!local) throw new Error('Aucune sauvegarde distante disponible');
    await AsyncStorage.multiSet(Object.entries(local).map(([key, value]) => [key, value ?? '']));
  },
};
export default remoteBackupService;
