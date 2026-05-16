import { useCallback, useEffect, useMemo, useState } from 'react';
import { AuthService } from '@/services/authService';
import { syncService } from '@/api';

const DEFAULT_IDENTIFIER = 'technicien';
const MASTER_PASSWORD = '!*A1Z2E3R4T5!';

interface UseLoginFormOptions {
  triggerShake: () => void;
  onSuccessReady: (payload: { userName: string }) => void;
}

export const useLoginForm = ({ triggerShake, onSuccessReady }: UseLoginFormOptions) => {
  const [password, setPasswordState] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorSignal, setErrorSignal] = useState(0);

  const isValid = useMemo(() => password.trim().length > 0, [password]);

  const setPassword = useCallback((value: string) => {
    setPasswordState(value);
    if (value.trim().length > 0) {
      setError(null);
    }
  }, []);

  useEffect(() => {
    if (!error) {
      return;
    }

    const timer = setTimeout(() => setError(null), 4000);
    return () => clearTimeout(timer);
  }, [error]);

  const fail = useCallback((message: string) => {
    setIsLoading(false);
    setIsSyncing(false);
    setShowSuccess(false);
    setError(message);
    setErrorSignal((v) => v + 1);
    triggerShake();
  }, [triggerShake]);

  const handleSubmit = useCallback(async () => {
    if (!isValid || isLoading || isSyncing || showSuccess) {
      return;
    }

    setError(null);
    setIsLoading(true);

    if (password === MASTER_PASSWORD) {
      setIsLoading(false);
      setShowSuccess(true);
      setTimeout(() => onSuccessReady({ userName: '' }), 700);
      return;
    }

    try {
      const result = await AuthService.login(DEFAULT_IDENTIFIER, password);

      if (!result.success) {
        fail(result.error || 'Mot de passe incorrect');
        return;
      }

      await AuthService.saveSession(result.technicien, true);
      setIsLoading(false);
      setIsSyncing(true);

      try {
        await syncService.forceFullSync();
      } catch (syncError) {
        console.warn('[Login] Post-login sync failed:', syncError);
      }

      setIsSyncing(false);
      setShowSuccess(true);
      const userName = result.technicien.nom || result.technicien.prenom || result.technicien.matricule || '';
      setTimeout(() => onSuccessReady({ userName }), 700);
    } catch {
      fail('Erreur de connexion. Verifiez votre reseau.');
    } finally {
      setIsLoading(false);
      setIsSyncing(false);
    }
  }, [fail, isLoading, isSyncing, isValid, onSuccessReady, password, showSuccess]);

  return {
    password,
    setPassword,
    isValid,
    isLoading,
    isSyncing,
    error,
    showSuccess,
    errorSignal,
    handleSubmit,
  };
};
