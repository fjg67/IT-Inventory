import { getSupabaseClient, tables } from '@/api/supabase';

export type PCLoanStatus = 'available' | 'assigned' | 'loaned';
export type PCLifecycleEventType = 'assignment' | 'loan' | 'return' | 'maintenance' | 'check';

export interface PCAssetProfile {
  articleId: string;
  purchaseDate?: string | null;
  warrantyEndDate?: string | null;
  supplier?: string | null;
  assignedTo?: string | null;
  assignedAt?: string | null;
  loanStatus: PCLoanStatus;
  loanedTo?: string | null;
  loanedAt?: string | null;
  dueBackDate?: string | null;
  returnedAt?: string | null;
  nextCheckDate?: string | null;
  notes?: string | null;
  updatedBy?: string | null;
  updatedAt?: string;
}

export interface PCLifecycleEvent {
  id: string;
  articleId: string;
  type: PCLifecycleEventType;
  personName?: string | null;
  description?: string | null;
  eventDate: string;
  nextCheckDate?: string | null;
  performedBy?: string | null;
}

export interface PCProfilePatch {
  purchaseDate?: string | null;
  warrantyEndDate?: string | null;
  supplier?: string | null;
  nextCheckDate?: string | null;
  notes?: string | null;
  updatedBy?: string | null;
}

function cleanDate(value?: string | null): string | null {
  const trimmed = value?.trim() ?? '';
  return trimmed ? trimmed : null;
}

async function addEvent(params: {
  articleId: string;
  type: PCLifecycleEventType;
  personName?: string;
  description?: string;
  nextCheckDate?: string;
  performedBy?: string;
}): Promise<void> {
  const { error } = await getSupabaseClient().from(tables.pcLifecycleEvents).insert({
    articleId: params.articleId,
    type: params.type,
    personName: params.personName?.trim() || null,
    description: params.description?.trim() || null,
    nextCheckDate: cleanDate(params.nextCheckDate),
    performedBy: params.performedBy || null,
  });
  if (error) throw new Error(error.message);
}

export const pcLifecycleService = {
  async getProfile(articleId: string | number): Promise<PCAssetProfile | null> {
    const { data, error } = await getSupabaseClient()
      .from(tables.pcLifecycleAssets)
      .select('*')
      .eq('articleId', String(articleId))
      .maybeSingle();
    if (error) throw new Error(error.message);
    return (data as PCAssetProfile | null) ?? null;
  },

  async getHistory(articleId: string | number): Promise<PCLifecycleEvent[]> {
    const { data, error } = await getSupabaseClient()
      .from(tables.pcLifecycleEvents)
      .select('*')
      .eq('articleId', String(articleId))
      .order('eventDate', { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);
    return (data ?? []) as PCLifecycleEvent[];
  },

  async updateProfile(articleId: string | number, patch: PCProfilePatch): Promise<PCAssetProfile> {
    const current = await this.getProfile(articleId);
    const payload = {
      articleId: String(articleId),
      purchaseDate: patch.purchaseDate !== undefined ? cleanDate(patch.purchaseDate) : current?.purchaseDate ?? null,
      warrantyEndDate: patch.warrantyEndDate !== undefined ? cleanDate(patch.warrantyEndDate) : current?.warrantyEndDate ?? null,
      supplier: patch.supplier !== undefined ? (patch.supplier ?? '').trim() || null : current?.supplier ?? null,
      assignedTo: current?.assignedTo ?? null,
      assignedAt: current?.assignedAt ?? null,
      loanStatus: current?.loanStatus ?? 'available',
      loanedTo: current?.loanedTo ?? null,
      loanedAt: current?.loanedAt ?? null,
      dueBackDate: current?.dueBackDate ?? null,
      returnedAt: current?.returnedAt ?? null,
      nextCheckDate: patch.nextCheckDate !== undefined ? cleanDate(patch.nextCheckDate) : current?.nextCheckDate ?? null,
      notes: patch.notes !== undefined ? (patch.notes ?? '').trim() || null : current?.notes ?? null,
      updatedBy: patch.updatedBy !== undefined ? patch.updatedBy : current?.updatedBy ?? null,
      updatedAt: new Date().toISOString(),
    };
    const { data, error } = await getSupabaseClient()
      .from(tables.pcLifecycleAssets)
      .upsert(payload, { onConflict: 'articleId' })
      .select('*')
      .single();
    if (error) throw new Error(error.message);
    return data as PCAssetProfile;
  },

  async assign(articleId: string | number, personName: string, performedBy?: string): Promise<void> {
    const person = personName.trim();
    if (!person) throw new Error('Le nom de la personne est obligatoire');
    const now = new Date().toISOString();
    const { error } = await getSupabaseClient().from(tables.pcLifecycleAssets).upsert({
      articleId: String(articleId), assignedTo: person, assignedAt: now,
      loanStatus: 'assigned', updatedBy: performedBy || null, updatedAt: now,
    }, { onConflict: 'articleId' });
    if (error) throw new Error(error.message);
    await addEvent({ articleId: String(articleId), type: 'assignment', personName: person, description: 'PC affecté', performedBy });
  },

  async loan(articleId: string | number, personName: string, dueBackDate?: string, performedBy?: string): Promise<void> {
    const person = personName.trim();
    if (!person) throw new Error('Le nom de la personne est obligatoire');
    const now = new Date().toISOString();
    const { error } = await getSupabaseClient().from(tables.pcLifecycleAssets).upsert({
      articleId: String(articleId), loanedTo: person, loanedAt: now,
      dueBackDate: cleanDate(dueBackDate), loanStatus: 'loaned', updatedBy: performedBy || null, updatedAt: now,
    }, { onConflict: 'articleId' });
    if (error) throw new Error(error.message);
    await addEvent({ articleId: String(articleId), type: 'loan', personName: person, description: 'PC prêté', performedBy });
  },

  async returnPC(articleId: string | number, performedBy?: string): Promise<void> {
    const now = new Date().toISOString();
    const { error } = await getSupabaseClient().from(tables.pcLifecycleAssets).upsert({
      articleId: String(articleId), loanStatus: 'available', returnedAt: now,
      loanedTo: null, dueBackDate: null, updatedBy: performedBy || null, updatedAt: now,
    }, { onConflict: 'articleId' });
    if (error) throw new Error(error.message);
    await addEvent({ articleId: String(articleId), type: 'return', description: 'PC restitué', performedBy });
  },

  async addMaintenance(articleId: string | number, description: string, nextCheckDate?: string, performedBy?: string): Promise<void> {
    if (!description.trim()) throw new Error('La description de la maintenance est obligatoire');
    const nextCheck = cleanDate(nextCheckDate);
    if (nextCheck) {
      await this.updateProfile(articleId, { nextCheckDate: nextCheck, updatedBy: performedBy });
    }
    await addEvent({ articleId: String(articleId), type: 'maintenance', description, nextCheckDate: nextCheck ?? undefined, performedBy });
  },
};

export default pcLifecycleService;
