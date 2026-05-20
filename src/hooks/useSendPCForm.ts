import { useMemo, useState } from 'react';
import { Article } from '@/types';
import { useShakeAnimation } from '@/hooks/useShakeAnimation';

export interface SendPCFormState {
  edsNumber: string;
  recipient: string;
}

type UseSendPCFormOptions = {
  pc: Article;
  onSuccess: () => void;
  onSubmit: (payload: SendPCFormState) => Promise<void>;
};

export const useSendPCForm = ({ pc, onSuccess, onSubmit }: UseSendPCFormOptions) => {
  const [form, setForm] = useState<SendPCFormState>({
    edsNumber: '',
    recipient: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { shakeStyle, triggerShake } = useShakeAnimation();

  const isValid = useMemo(
    () => form.edsNumber.trim().length > 0 && form.recipient.trim().length > 0,
    [form.edsNumber, form.recipient],
  );

  const updateField = (key: keyof SendPCFormState, value: string) => {
    if (key === 'edsNumber') {
      const numeric = value.replace(/[^\d]/g, '').slice(0, 3);
      setForm((prev) => ({ ...prev, edsNumber: numeric }));
      if (value !== numeric) {
        triggerShake();
      }
      return;
    }

    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    if (!isValid || isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      await onSubmit({
        edsNumber: form.edsNumber.trim(),
        recipient: form.recipient.trim(),
      });
      setIsLoading(false);
      onSuccess();
    } catch (e) {
      setIsLoading(false);
      setError("Erreur lors de l'envoi, reessayez");
      triggerShake();
      throw e;
    }
  };

  return {
    pc,
    form,
    updateField,
    isValid,
    isLoading,
    error,
    handleSubmit,
    setError,
    shakeStyle,
    triggerShake,
  };
};
