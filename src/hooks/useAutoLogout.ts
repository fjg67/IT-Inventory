// ============================================
// AUTO LOGOUT HOOK - IT-Inventory Application
// Déconnexion automatique sur inactivité uniquement
// ============================================

import { useEffect, useRef, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useAppDispatch, useAppSelector } from '@/store';
import { logoutTechnicien } from '@/store/slices/authSlice';

const INACTIVITY_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Hook qui gère la déconnexion automatique :
 * - Après 5 minutes d'inactivité (aucun touch) quand l'app est active
 *
 * IMPORTANT:
 * - On NE déconnecte plus lors du passage en arrière-plan/fermeture,
 *   afin de conserver la session utilisateur au prochain lancement.
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

  // --- AppState listener (pause/reprise du timer) ---
  useEffect(() => {
    const handleAppStateChange = (nextState: AppStateStatus) => {
      // Mettre en pause le timer hors écran actif pour conserver la session
      if (appState.current === 'active' && (nextState === 'background' || nextState === 'inactive')) {
        clearTimer();
      }

      // Reprendre le timer au retour en foreground
      if ((appState.current === 'background' || appState.current === 'inactive') && nextState === 'active') {
        resetInactivityTimer();
      }

      appState.current = nextState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [clearTimer, resetInactivityTimer]);

  return { resetInactivityTimer };
};
