// ============================================
// SLICES INDEX - IT-Inventory Application
// ============================================

// Default reducers
export { default as authReducer } from './authSlice';
export { default as siteReducer } from './siteSlice';
export { default as scanReducer } from './scanSlice';
export { default as networkReducer } from './networkSlice';
export { default as uiReducer } from './uiSlice';

// Auth slice exports
export {
  selectTechnicien,
  logout,
  clearError as clearAuthError,
  loadStoredAuth,
  loadTechniciens,
  loginTechnicien,
  logoutTechnicien,
} from './authSlice';

// Site slice exports
export {
  setSiteActif,
  clearSite,
  clearError as clearSiteError,
  loadSites,
  loadStoredSite,
  selectSite,
} from './siteSlice';

// Scan slice exports
export {
  setScanning,
  setBarcode,
  addToHistory,
  addToHistoryAndSave,
  persistScanHistory,
  clearScannedArticle,
  clearLastBarcode,
  clearHistory,
  clearError as clearScanError,
  handleBarcodeScanned,
  searchArticleByBarcode,
  loadScanHistory,
} from './scanSlice';
export type { ScanHistoryItem } from './scanSlice';

// Network slice exports
export {
  setNetworkState,
  setSyncStatus,
  setSyncing,
  setSyncError,
  setSyncComplete,
  setPendingCount,
  incrementPendingCount,
  decrementPendingCount,
} from './networkSlice';

// UI slice exports
export {
  showAlert,
  dismissAlert,
  clearAlerts,
  setLoading,
  showModal,
  hideModal,
  toggleModal,
} from './uiSlice';
