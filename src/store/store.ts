// ============================================
// REDUX STORE - IT-Inventory Application
// ============================================

import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import {
  authReducer,
  siteReducer,
  scanReducer,
  networkReducer,
  uiReducer,
} from './slices';

// Root reducer
const rootReducer = combineReducers({
  auth: authReducer,
  site: siteReducer,
  scan: scanReducer,
  network: networkReducer,
  ui: uiReducer,
});

// Store
export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignorer les vérifications de sérialisation pour certaines actions
        ignoredActions: [
          'auth/loadStoredAuth/fulfilled',
          'auth/loginTechnicien/fulfilled',
          'auth/createTechnicien/fulfilled',
          'site/loadStoredSite/fulfilled',
          'site/loadSites/fulfilled',
          'site/selectSite/fulfilled',
          'auth/loadTechniciens/fulfilled',
          'scan/handleBarcodeScanned/fulfilled',
          'scan/searchArticleByBarcode/fulfilled',
        ],
        ignoredPaths: [
          'auth.currentTechnicien.dateCreation',
          'site.siteActif.dateCreation',
          'site.sitesDisponibles',
          'auth.techniciens',
          'scan.scannedArticle.dateCreation',
          'scan.scannedArticle.dateModification',
        ],
      },
    }),
  devTools: __DEV__,
});

// Types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Hooks typés
export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

// Selectors
export const selectCurrentTechnicien = (state: RootState) => state.auth.currentTechnicien;
export const selectIsAuthenticated = (state: RootState) => state.auth.isAuthenticated;
export const selectTechniciens = (state: RootState) => state.auth.techniciens;

export const selectSiteActif = (state: RootState) => state.site.siteActif;
export const selectSitesDisponibles = (state: RootState) => state.site.sitesDisponibles;

export const selectScannedArticle = (state: RootState) => state.scan.scannedArticle;
export const selectLastBarcode = (state: RootState) => state.scan.lastBarcode;
export const selectIsScanning = (state: RootState) => state.scan.isScanning;

export const selectIsConnected = (state: RootState) => state.network.isConnected;
export const selectSupabaseReachable = (state: RootState) => state.network.supabaseReachable;
export const selectSyncStatus = (state: RootState) => state.network.syncStatus;
export const selectIsSyncing = (state: RootState) => state.network.isSyncing;
export const selectPendingCount = (state: RootState) => state.network.pendingCount;

export const selectIsLoading = (state: RootState) => state.ui.isLoading;
export const selectAlerts = (state: RootState) => state.ui.alerts;

export default store;
