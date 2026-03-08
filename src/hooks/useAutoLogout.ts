// ============================================
// AUTO LOGOUT HOOK - IT-Inventory Application
// Déconnexion automatique sur inactivité / fermeture
// ============================================

import { useEffect, useRef, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useAppDispatch, useAppSelector } from '@/store';
import { logoutTechnicien } from '@/store/slices/authSlice';

const INACTIVITY_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Hook qui gère la déconnexion automatique :
 * - Quand l'appli passe en arrière-plan (fermeture / changement d'app)
 * - Après 5 minutes d'inactivité (aucun touch)
 *
 * Retourne `resetInactivityTimer` à appeler sur chaque interaction utilisateur.
 */
export const useAutoLogout = () => {
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const inactivityTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const appState = useRef<AppStateStatus>(AppState.currentState);

  const performLogout = useCallback(() => {
    if (isAuthenticated) {
      console.log('[AutoLogout] Déconnexion automatique');
      dispatch(logoutTechnicien());
    }
  }, [dispatch, isAuthenticated]);

  // --- Inactivity timer ---
  const clearTimer = useCallback(() => {
    if (inactivityTimer.current) {
      clearTimeout(inactivityTimer.current);
      inactivityTimer.current = null;
    }
  }, []);

  const resetInactivityTimer = useCallback(() => {
    if (!isAuthenticated) return;
    clearTimer();
    inactivityTimer.current = setTimeout(() => {
      console.log('[AutoLogout] Inactivité de 5 minutes détectée');
      performLogout();
    }, INACTIVITY_TIMEOUT_MS);
  }, [isAuthenticated, clearTimer, performLogout]);

  // Start timer when authenticated, clear when not
  useEffect(() => {
    if (isAuthenticated) {
      resetInactivityTimer();
    } else {
      clearTimer();
    }
    return clearTimer;
  }, [isAuthenticated, resetInactivityTimer, clearTimer]);

  // --- AppState listener (background / inactive) ---
  useEffect(() => {
    const handleAppStateChange = (nextState: AppStateStatus) => {
      // L'app passe en arrière-plan ou devient inactive → déconnexion
      if (appState.current === 'active' && (nextState === 'background' || nextState === 'inactive')) {
        performLogout();
      }
      appState.current = nextState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [performLogout]);

  return { resetInactivityTimer };
};
