// ============================================
// SCAN SLICE - IT-Inventory Application
// Gestion du scanner de codes-barres
// ============================================

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Article } from '@/types';
import { articleRepository } from '@/database';

const HISTORY_STORAGE_KEY = '@scan_history';

interface ScanState {
  lastBarcode: string | null;
  scannedArticle: Article | null;
  isScanning: boolean;
  history: ScanHistoryItem[];
  error: string | null;
}

export interface ScanHistoryItem {
  barcode: string;
  timestamp: number;
  articleId?: number;
  articleNom?: string;
  found: boolean;
}

const MAX_HISTORY_ITEMS = 50;

const initialState: ScanState = {
  lastBarcode: null,
  scannedArticle: null,
  isScanning: false,
  history: [],
  error: null,
};

// Thunk pour charger l'historique depuis AsyncStorage
export const loadScanHistory = createAsyncThunk(
  'scan/loadHistory',
  async () => {
    try {
      const raw = await AsyncStorage.getItem(HISTORY_STORAGE_KEY);
      if (raw) {
        return JSON.parse(raw) as ScanHistoryItem[];
      }
    } catch { /* ignore */ }
    return [] as ScanHistoryItem[];
  },
);

// Thunk pour ajouter à l'historique ET persister dans AsyncStorage
// Le state est mis à jour via extraReducers.fulfilled, puis on persiste
export const addToHistoryAndSave = createAsyncThunk(
  'scan/addToHistoryAndSave',
  async (item: ScanHistoryItem) => {
    return item;
  },
);

// Thunks
export const handleBarcodeScanned = createAsyncThunk(
  'scan/handleBarcodeScanned',
  async ({ barcode, siteId }: { barcode: string; siteId: string | number }, { rejectWithValue }) => {
    try {
      const article = await articleRepository.findByReference(barcode, siteId);
      return { barcode, article };
    } catch {
      return rejectWithValue('Erreur lors de la recherche');
    }
  },
);

export const searchArticleByBarcode = createAsyncThunk(
  'scan/searchArticleByBarcode',
  async ({ reference, siteId }: { reference: string; siteId: string | number }) => {
    const article = await articleRepository.findByReference(reference, siteId);
    return article;
  },
);

// Slice
const scanSlice = createSlice({
  name: 'scan',
  initialState,
  reducers: {
    setScanning: (state, action: PayloadAction<boolean>) => {
      state.isScanning = action.payload;
    },
    setBarcode: (state, action: PayloadAction<string>) => {
      state.lastBarcode = action.payload;
    },
    addToHistory: (state, action: PayloadAction<ScanHistoryItem>) => {
      state.history = [action.payload, ...state.history].slice(0, MAX_HISTORY_ITEMS);
    },
    clearScannedArticle: (state) => {
      state.scannedArticle = null;
    },
    clearLastBarcode: (state) => {
      state.lastBarcode = null;
    },
    clearHistory: (state) => {
      state.history = [];
      // Nettoyer aussi le storage
      AsyncStorage.removeItem(HISTORY_STORAGE_KEY).catch(() => {});
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Handle barcode scanned
    builder
      .addCase(handleBarcodeScanned.pending, (state) => {
        state.isScanning = true;
        state.error = null;
      })
      .addCase(handleBarcodeScanned.fulfilled, (state, action) => {
        const { barcode, article } = action.payload;
        state.isScanning = false;
        state.lastBarcode = barcode;
        state.scannedArticle = article;

        // Ajouter à l'historique
        const historyItem: ScanHistoryItem = {
          barcode,
          timestamp: Date.now(),
          articleId: article?.id,
          articleNom: article?.nom,
          found: !!article,
        };
        state.history = [historyItem, ...state.history].slice(0, MAX_HISTORY_ITEMS);
      })
      .addCase(handleBarcodeScanned.rejected, (state, action) => {
        state.isScanning = false;
        state.error = action.payload as string;
      });

    // Search article by barcode
    builder
      .addCase(searchArticleByBarcode.pending, (state) => {
        state.isScanning = true;
      })
      .addCase(searchArticleByBarcode.fulfilled, (state, action) => {
        state.isScanning = false;
        state.scannedArticle = action.payload;
      })
      .addCase(searchArticleByBarcode.rejected, (state, action) => {
        state.isScanning = false;
        state.error = action.error.message ?? 'Article non trouvé';
      });

    // Load history from storage
    builder
      .addCase(loadScanHistory.fulfilled, (state, action) => {
        state.history = action.payload;
      });

    // Add to history and save to storage
    builder
      .addCase(addToHistoryAndSave.fulfilled, (state, action) => {
        const item = action.payload;
        state.history = [item, ...state.history].slice(0, MAX_HISTORY_ITEMS);
      });
  },
});

// Middleware-like : persister l'historique après chaque addToHistoryAndSave
// On le fait via un listener dans le store, ou simplement côté composant.
// Pour simplifier, on exporte un helper qui persiste après dispatch.
export async function persistScanHistory(history: ScanHistoryItem[]) {
  try {
    // Copie plain pour éviter tout souci de proxy Immer
    const plain = history.map(h => ({
      barcode: h.barcode,
      timestamp: h.timestamp,
      articleId: h.articleId,
      articleNom: h.articleNom,
      found: h.found,
    }));
    await AsyncStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(plain));
  } catch { /* ignore */ }
}

export const {
  setScanning,
  setBarcode,
  addToHistory,
  clearScannedArticle,
  clearLastBarcode,
  clearHistory,
  clearError,
} = scanSlice.actions;

export default scanSlice.reducer;
