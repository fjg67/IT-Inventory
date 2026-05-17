import { useCallback, useMemo, useState } from 'react';
import { Article } from '@/types';
import { MovementType } from '@/components/movement/movementTheme';

export type MovementStep = 'article' | 'type' | 'details';

export interface MovementState {
  step: MovementStep;
  article: Article | null;
  stockSite: string | number | null;
  type: MovementType | null;
  quantity: number;
  comment: string;
}

const STEP_INDEX: Record<MovementStep, number> = {
  article: 0,
  type: 1,
  details: 2,
};

export const useMovementFlow = (defaultType?: MovementType) => {
  const [state, setState] = useState<MovementState>({
    step: 'article',
    article: null,
    stockSite: null,
    type: defaultType ?? null,
    quantity: 1,
    comment: '',
  });

  const goToStep = useCallback((step: MovementStep) => {
    setState((prev) => ({ ...prev, step }));
  }, []);

  const selectArticle = useCallback((article: Article) => {
    setState((prev) => ({ ...prev, article, step: 'type' }));
  }, []);

  const clearArticle = useCallback(() => {
    setState((prev) => ({ ...prev, article: null, step: 'article' }));
  }, []);

  const updateField = useCallback(<K extends keyof MovementState>(key: K, value: MovementState[K]) => {
    setState((prev) => ({ ...prev, [key]: value }));
  }, []);

  const isStepValid = useCallback((step: MovementStep): boolean => {
    if (step === 'article') return !!state.article;
    if (step === 'type') return !!state.stockSite && !!state.type && state.quantity > 0;
    return true;
  }, [state.article, state.quantity, state.stockSite, state.type]);

  const currentStepIndex = useMemo(() => STEP_INDEX[state.step], [state.step]);

  return {
    state,
    setState,
    goToStep,
    selectArticle,
    clearArticle,
    updateField,
    isStepValid,
    currentStepIndex,
  };
};
