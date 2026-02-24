// ============================================
// UI SLICE - IT-Inventory Application
// Gestion de l'interface utilisateur
// ============================================

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Alert {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  title?: string;
  duration?: number;
}

interface UIState {
  isLoading: boolean;
  loadingMessage: string | null;
  alerts: Alert[];
  modalVisible: {
    siteSelector: boolean;
    filterArticles: boolean;
    mouvementForm: boolean;
    exportOptions: boolean;
  };
}

const initialState: UIState = {
  isLoading: false,
  loadingMessage: null,
  alerts: [],
  modalVisible: {
    siteSelector: false,
    filterArticles: false,
    mouvementForm: false,
    exportOptions: false,
  },
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean | { isLoading: boolean; message?: string }>) => {
      if (typeof action.payload === 'boolean') {
        state.isLoading = action.payload;
        state.loadingMessage = null;
      } else {
        state.isLoading = action.payload.isLoading;
        state.loadingMessage = action.payload.message ?? null;
      }
    },
    showAlert: (state, action: PayloadAction<Omit<Alert, 'id'>>) => {
      const alert: Alert = {
        ...action.payload,
        id: Date.now().toString(),
      };
      state.alerts.push(alert);
    },
    dismissAlert: (state, action: PayloadAction<string>) => {
      state.alerts = state.alerts.filter((a) => a.id !== action.payload);
    },
    clearAlerts: (state) => {
      state.alerts = [];
    },
    showModal: (state, action: PayloadAction<keyof UIState['modalVisible']>) => {
      state.modalVisible[action.payload] = true;
    },
    hideModal: (state, action: PayloadAction<keyof UIState['modalVisible']>) => {
      state.modalVisible[action.payload] = false;
    },
    toggleModal: (state, action: PayloadAction<keyof UIState['modalVisible']>) => {
      state.modalVisible[action.payload] = !state.modalVisible[action.payload];
    },
  },
});

export const {
  setLoading,
  showAlert,
  dismissAlert,
  clearAlerts,
  showModal,
  hideModal,
  toggleModal,
} = uiSlice.actions;
export default uiSlice.reducer;
