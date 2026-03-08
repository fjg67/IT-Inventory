// ============================================
// SITE SLICE - IT-Inventory Application
// Gestion du site actif et multi-sites
// ============================================

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Site } from '@/types';
import { siteRepository } from '@/database';
import { findChildSites } from '@/database/repositories/siteRepository';

const SITE_STORAGE_KEY = '@it-inventory/site';

interface SiteState {
  siteActif: Site | null;
  sitesDisponibles: Site[];
  childSites: Site[];
  /** null = "Tous" (agrégé parent), sinon ID du sous-site spécifique */
  selectedSubSiteId: string | number | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: SiteState = {
  siteActif: null,
  sitesDisponibles: [],
  childSites: [],
  selectedSubSiteId: null,
  isLoading: true,
  error: null,
};

// Thunks
export const loadSites = createAsyncThunk(
  'site/loadSites',
  async () => {
    return await siteRepository.findAll();
  },
);

export const loadStoredSite = createAsyncThunk(
  'site/loadStoredSite',
  async () => {
    const storedData = await AsyncStorage.getItem(SITE_STORAGE_KEY);
    if (storedData) {
      const { siteId } = JSON.parse(storedData);
      const site = await siteRepository.findById(siteId);
      return site;
    }
    // Retourner le premier site par défaut
    const sites = await siteRepository.findAll();
    return sites.length > 0 ? sites[0] : null;
  },
);

export const selectSite = createAsyncThunk(
  'site/selectSite',
  async (siteId: string | number) => {
    const site = await siteRepository.findById(siteId);
    if (!site) {
      throw new Error('Site non trouvé');
    }
    await AsyncStorage.setItem(SITE_STORAGE_KEY, JSON.stringify({ siteId }));
    return site;
  },
);

export const loadChildSites = createAsyncThunk(
  'site/loadChildSites',
  async (parentSiteId: string | number) => {
    return await findChildSites(parentSiteId);
  },
);

// Slice
const siteSlice = createSlice({
  name: 'site',
  initialState,
  reducers: {
    setSiteActif: (state, action: PayloadAction<Site>) => {
      state.siteActif = action.payload;
    },
    setSelectedSubSite: (state, action: PayloadAction<string | number | null>) => {
      state.selectedSubSiteId = action.payload;
    },
    clearSite: (state) => {
      state.siteActif = null;
      state.childSites = [];
      state.selectedSubSiteId = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Load sites
    builder
      .addCase(loadSites.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(loadSites.fulfilled, (state, action) => {
        state.isLoading = false;
        state.sitesDisponibles = action.payload;
        // Si pas de site actif et des sites existent, sélectionner le premier
        if (!state.siteActif && action.payload.length > 0) {
          state.siteActif = action.payload[0];
        }
      })
      .addCase(loadSites.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message ?? 'Erreur de chargement';
      });

    // Load stored site
    builder
      .addCase(loadStoredSite.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(loadStoredSite.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload) {
          state.siteActif = action.payload;
        }
      })
      .addCase(loadStoredSite.rejected, (state) => {
        state.isLoading = false;
      });

    // Select site
    builder
      .addCase(selectSite.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(selectSite.fulfilled, (state, action) => {
        state.isLoading = false;
        state.siteActif = action.payload;
        state.childSites = [];
        state.selectedSubSiteId = null;
      })
      .addCase(selectSite.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message ?? 'Erreur de sélection';
      });

    // Load child sites
    builder
      .addCase(loadChildSites.fulfilled, (state, action) => {
        state.childSites = action.payload;
      });
  },
});

export const { setSiteActif, setSelectedSubSite, clearSite, clearError } = siteSlice.actions;

/** Sélecteur : ID effectif (sous-site sélectionné ou site parent) */
export const selectEffectiveSiteId = (state: { site: SiteState }) => {
  return state.site.selectedSubSiteId ?? state.site.siteActif?.id ?? null;
};

export default siteSlice.reducer;
