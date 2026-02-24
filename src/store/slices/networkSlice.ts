// ============================================
// NETWORK SLICE - IT-Inventory Application
// Gestion de l'état réseau et synchronisation
// ============================================

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { SyncStatus } from '@/types';

interface NetworkState {
  isConnected: boolean;
  isInternetReachable: boolean;
  connectionType: string | null;
  /** True si une requête Supabase a réussi récemment */
  supabaseReachable: boolean;
  syncStatus: SyncStatus;
  lastSyncDate: string | null;
  pendingCount: number;
  isSyncing: boolean;
  syncError: string | null;
}

const initialState: NetworkState = {
  isConnected: false,
  isInternetReachable: false,
  connectionType: null,
  supabaseReachable: false,
  syncStatus: SyncStatus.PENDING,
  lastSyncDate: null,
  pendingCount: 0,
  isSyncing: false,
  syncError: null,
};

const networkSlice = createSlice({
  name: 'network',
  initialState,
  reducers: {
    setNetworkState: (
      state,
      action: PayloadAction<{
        isConnected: boolean;
        isInternetReachable: boolean;
        type?: string;
      }>,
    ) => {
      state.isConnected = action.payload.isConnected;
      state.isInternetReachable = action.payload.isInternetReachable;
      state.connectionType = action.payload.type ?? null;
    },
    setSupabaseReachable: (state, action: PayloadAction<boolean>) => {
      state.supabaseReachable = action.payload;
    },
    setSyncStatus: (state, action: PayloadAction<SyncStatus>) => {
      state.syncStatus = action.payload;
    },
    setSyncing: (state, action: PayloadAction<boolean>) => {
      state.isSyncing = action.payload;
      if (action.payload) {
        state.syncError = null;
      }
    },
    setSyncError: (state, action: PayloadAction<string | null>) => {
      state.syncError = action.payload;
      state.isSyncing = false;
      if (action.payload) {
        state.syncStatus = SyncStatus.ERROR;
      }
    },
    setSyncComplete: (state) => {
      state.isSyncing = false;
      state.syncStatus = SyncStatus.SYNCED;
      state.lastSyncDate = new Date().toISOString();
      state.pendingCount = 0;
    },
    setPendingCount: (state, action: PayloadAction<number>) => {
      state.pendingCount = action.payload;
      if (action.payload > 0) {
        state.syncStatus = SyncStatus.PENDING;
      }
    },
    incrementPendingCount: (state) => {
      state.pendingCount += 1;
      state.syncStatus = SyncStatus.PENDING;
    },
    decrementPendingCount: (state) => {
      if (state.pendingCount > 0) {
        state.pendingCount -= 1;
      }
      if (state.pendingCount === 0) {
        state.syncStatus = SyncStatus.SYNCED;
      }
    },
  },
});

export const {
  setNetworkState,
  setSupabaseReachable,
  setSyncStatus,
  setSyncing,
  setSyncError,
  setSyncComplete,
  setPendingCount,
  incrementPendingCount,
  decrementPendingCount,
} = networkSlice.actions;
export default networkSlice.reducer;
