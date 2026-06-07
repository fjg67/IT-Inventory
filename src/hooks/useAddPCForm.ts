import { useMemo, useState } from 'react';
import { getSupabaseClient, tables } from '@/api/supabase';
import { articleRepository, stockRepository } from '@/database';
import { PannePriorite, PanneType } from '@/types/pc.types';

export type PCCategory = 'portable_siege' | 'portable_agence';
export type PCStatus = 'a_chaud' | 'a_reusiner' | 'en_usinage' | 'disponible' | 'envoye' | 'en_panne';

export interface AddPCFormState {
  category: PCCategory | null;
  model: string | null;
  status: PCStatus | null;
  hostname: string;
  asset: string;
  panne_type: PanneType | null;
  panne_priorite: PannePriorite;
  panne_description: string;
}

export interface AddPCSubmitContext {
  effectiveSiteId: string | number | null;
  effectiveSiteName?: string | null;
  presetTypeArticle?: string;
}

export interface AddPCSubmitResult {
  success: boolean;
  error?: string;
  articleId?: number;
}

interface CategoryOption {
  key: PCCategory;
  label: string;
  icon: string;
  models: string[];
}

interface StatusOption {
  key: PCStatus;
  label: string;
  icon: string;
}

export const PC_CATEGORY_OPTIONS: CategoryOption[] = [
  {
    key: 'portable_siege',
    label: 'Portable siège',
    icon: 'laptop',
    models: ['DELL Latitude 5440 tactile', 'DELL Latitude 5440 non tactile'],
  },
  {
    key: 'portable_agence',
    label: 'Portable agence',
    icon: 'laptop',
    models: ['HP EliteBook', 'DELL Latitude 5550'],
  },
];

export const PC_STATUS_OPTIONS: StatusOption[] = [
  { key: 'a_chaud', label: 'À chaud', icon: 'flash-outline' },
  { key: 'a_reusiner', label: 'À reusiner', icon: 'wrench-outline' },
  { key: 'en_usinage', label: 'En usinage', icon: 'cog-outline' },
  { key: 'disponible', label: 'Disponible', icon: 'check-circle-outline' },
  { key: 'envoye', label: 'Envoyé', icon: 'send-outline' },
  { key: 'en_panne', label: 'En panne', icon: 'laptop-off' },
];

const HOSTNAME_REGEX: Record<PCCategory, RegExp> = {
  portable_siege: /^KSAOP(?:STR|EPI)[0-9A-Z]{4}$/,
  portable_agence: /^KSAOP872[0-9A-Z]{4}$/,
};

const STATUS_LABELS: Record<PCStatus, string> = {
  a_chaud: 'À chaud',
  a_reusiner: 'À reusiner',
  en_usinage: 'En usinage',
  disponible: 'Disponible',
  envoye: 'Envoyé',
  en_panne: 'En panne',
};

const CATEGORY_LABELS: Record<PCCategory, string> = {
  portable_siege: 'Portable siège',
  portable_agence: 'Portable agence',
};

const getBrandFromModel = (model: string) => {
  const normalized = model.toLowerCase();
  if (normalized.includes('hp')) return 'HP';
  if (normalized.includes('dell')) return 'DELL';
  return 'DELL';
};

const getModelsForCategory = (category: PCCategory | null): string[] => {
  if (!category) return [];
  return PC_CATEGORY_OPTIONS.find((option) => option.key === category)?.models ?? [];
};

export const useAddPCForm = () => {
  const [form, setForm] = useState<AddPCFormState>({
    category: null,
    model: null,
    status: null,
    hostname: '',
    asset: '',
    panne_type: null,
    panne_priorite: 'moyenne',
    panne_description: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const updateField = <K extends keyof AddPCFormState>(
    key: K,
    value: AddPCFormState[K],
  ) => {
    if (key === 'hostname' || key === 'asset') {
      setForm((prev) => ({ ...prev, [key]: String(value).toUpperCase() }));
      return;
    }

    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleStatusChange = (status: PCStatus) => {
    setForm((prev) => {
      if (status === 'en_panne') {
        return {
          ...prev,
          status,
        };
      }

      return {
        ...prev,
        status,
        panne_type: null,
        panne_priorite: 'moyenne',
        panne_description: '',
      };
    });
  };

  const availableModels = useMemo(() => getModelsForCategory(form.category), [form.category]);

  const hostnameFormat =
    form.category === 'portable_siege'
      ? 'KSAOPSTRXXXX ou KSAOPEPIXXXX'
      : form.category === 'portable_agence'
        ? 'KSAOP872XXXX'
        : null;

  const isValid =
    form.category !== null
    && form.model !== null
    && form.status !== null
    && form.hostname.trim().length > 0
    && form.asset.trim().length > 0;

  const isPanneValid =
    form.status !== 'en_panne'
    || (form.panne_type !== null && form.panne_description.trim().length >= 10);

  const validateHostnameByCategory = (value: string) => {
    if (!form.category) return { valid: true };
    const regex = HOSTNAME_REGEX[form.category];
    const valid = regex.test(value.trim().toUpperCase());
    return {
      valid,
      expected: form.category === 'portable_siege' ? 'KSAOPSTRXXXX ou KSAOPEPIXXXX' : 'KSAOP872XXXX',
    };
  };

  const reset = () => {
    setForm({
      category: null,
      model: null,
      status: null,
      hostname: '',
      asset: '',
      panne_type: null,
      panne_priorite: 'moyenne',
      panne_description: '',
    });
    setSubmitError(null);
  };

  const handleSubmit = async (context: AddPCSubmitContext): Promise<AddPCSubmitResult> => {
    if (!isValid || !isPanneValid) {
      return { success: false, error: 'Veuillez remplir tous les champs obligatoires.' };
    }

    if (!context.effectiveSiteId) {
      return { success: false, error: 'Aucun site actif selectionne.' };
    }

    if (!form.category || !form.model || !form.status) {
      return { success: false, error: 'Le formulaire est incomplet.' };
    }

    const normalizedHostname = form.hostname.trim().toUpperCase();
    const normalizedAsset = form.asset.trim().toUpperCase();
    const hostnameCheck = validateHostnameByCategory(normalizedHostname);

    if (!hostnameCheck.valid) {
      return { success: false, error: `Format attendu: ${hostnameCheck.expected}` };
    }

    setSubmitError(null);
    setIsSubmitting(true);

    try {
      const existingHostname = await articleRepository.findByReference(normalizedHostname);
      if (existingHostname) {
        return { success: false, error: `Hostname deja utilise: ${normalizedHostname}` };
      }

      const existingAsset = await articleRepository.findByReferenceOrBarcode(normalizedAsset);
      const existingBarcode = String(existingAsset?.barcode ?? '').trim().toUpperCase();
      if (existingAsset && existingBarcode === normalizedAsset) {
        return { success: false, error: `Asset deja utilise: ${normalizedAsset}` };
      }

      const articleId = await articleRepository.create({
        reference: normalizedHostname,
        nom: normalizedHostname,
        description: `Statut: ${STATUS_LABELS[form.status]}`,
        barcode: normalizedAsset,
        famille: 'PC portable',
        typeArticle: context.presetTypeArticle ?? 'PC',
        sousType: CATEGORY_LABELS[form.category],
        marque: getBrandFromModel(form.model),
        modele: form.model,
        stockMini: 0,
        unite: 'unite',
        ...(context.effectiveSiteName ? { emplacement: context.effectiveSiteName } : {}),
      });

      await stockRepository.createOrUpdate(articleId, context.effectiveSiteId, 1);

      if (form.status === 'en_panne') {
        const supabase = getSupabaseClient();
        const { error: panneError } = await supabase.from(tables.pcPannes).insert({
          pc_id: articleId,
          type_panne: form.panne_type,
          description: form.panne_description.trim(),
          priorite: form.panne_priorite,
          statut_reparation: 'en_attente',
        });

        if (panneError) {
          throw new Error(panneError.message);
        }
      }

      return { success: true, articleId };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur inconnue';
      setSubmitError(message);
      return { success: false, error: message };
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    form,
    updateField,
    handleStatusChange,
    reset,
    isSubmitting,
    submitError,
    availableModels,
    isValid,
    isPanneValid,
    hostnameFormat,
    validateHostnameByCategory,
    handleSubmit,
  };
};
