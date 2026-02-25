// ============================================
// AUTH SLICE - IT-Inventory Application
// Gestion de l'authentification technicien
// ============================================

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Technicien } from '@/types';
import { technicienRepository } from '@/database';

const AUTH_STORAGE_KEY = '@it-inventory/auth';

interface AuthState {
  currentTechnicien: Technicien | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  techniciens: Technicien[];
  error: string | null;
  /** Après déconnexion depuis Paramètres → afficher l'écran choix technicien (Auth) au lieu de Login */
  redirectToTechnicianChoiceAfterLogout: boolean;
}

const initialState: AuthState = {
  currentTechnicien: null,
  isAuthenticated: false,
  isLoading: true,
  techniciens: [],
  error: null,
  redirectToTechnicianChoiceAfterLogout: false,
};

// Thunks
export const loadStoredAuth = createAsyncThunk(
  'auth/loadStoredAuth',
  async () => {
    const storedData = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
    if (storedData) {
      const { technicienId } = JSON.parse(storedData);
      const technicien = await technicienRepository.findById(technicienId);
      return technicien;
    }
    return null;
  },
);

export const loadTechniciens = createAsyncThunk(
  'auth/loadTechniciens',
  async () => {
    return await technicienRepository.findAll();
  },
);

export const loginTechnicien = createAsyncThunk(
  'auth/loginTechnicien',
  async (payload: { technicienId: string | number; persist?: boolean }) => {
    const { technicienId, persist = true } = typeof payload === 'number' ? { technicienId: payload, persist: true } : payload;
    const technicien = await technicienRepository.findById(technicienId);
    if (!technicien) {
      throw new Error('Technicien non trouvé');
    }
    if (persist) {
      await AsyncStorage.setItem(
        AUTH_STORAGE_KEY,
        JSON.stringify({ technicienId: technicien.id }),
      );
    }
    return technicien;
  },
);

export const logoutTechnicien = createAsyncThunk(
  'auth/logoutTechnicien',
  async () => {
    await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
  },
);

export const createTechnicien = createAsyncThunk(
  'auth/createTechnicien',
  async (data: { nom: string; prenom: string; matricule?: string }, { dispatch }) => {
    await technicienRepository.create(data);
    dispatch(loadTechniciens());
  },
);

// Slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    selectTechnicien: (state, action: PayloadAction<Technicien>) => {
      state.currentTechnicien = action.payload;
      state.isAuthenticated = true;
      state.error = null;
    },
    logout: (state) => {
      state.currentTechnicien = null;
      state.isAuthenticated = false;
    },
    clearError: (state) => {
      state.error = null;
    },
    setRedirectToTechnicianChoiceAfterLogout: (state, action: PayloadAction<boolean>) => {
      state.redirectToTechnicianChoiceAfterLogout = action.payload;
    },
  },
  extraReducers: (builder) => {
    // Load stored auth
    builder
      .addCase(loadStoredAuth.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(loadStoredAuth.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload) {
          state.currentTechnicien = action.payload;
          state.isAuthenticated = true;
        }
      })
      .addCase(loadStoredAuth.rejected, (state) => {
        state.isLoading = false;
      });

    // Load techniciens
    builder
      .addCase(loadTechniciens.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(loadTechniciens.fulfilled, (state, action) => {
        state.isLoading = false;
        state.techniciens = action.payload;
      })
      .addCase(loadTechniciens.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message ?? 'Erreur de chargement';
      });

    // Login
    builder
      .addCase(loginTechnicien.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginTechnicien.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentTechnicien = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(loginTechnicien.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message ?? 'Erreur de connexion';
      });

    // Logout
    builder
      .addCase(logoutTechnicien.fulfilled, (state) => {
        state.currentTechnicien = null;
        state.isAuthenticated = false;
      })
      .addCase(logoutTechnicien.rejected, (state) => {
        // Force logout even if AsyncStorage removal fails
        state.currentTechnicien = null;
        state.isAuthenticated = false;
      });
  },
});

export const { selectTechnicien, logout, clearError, setRedirectToTechnicianChoiceAfterLogout } = authSlice.actions;
export default authSlice.reducer;
