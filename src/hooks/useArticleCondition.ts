import { useEffect, useMemo, useState } from 'react';
import { articleRepository } from '@/database/repositories/articleRepository';
import { ArticleCondition } from '@/types/article.types';

interface ChangePayload {
  condition: ArticleCondition;
  defectiveCount: number;
  conditionNote?: string;
}

export const useArticleCondition = (
  articleId: string | number | null,
  initialCondition: ArticleCondition,
  initialDefectiveCount: number,
  totalStock: number,
  initialConditionNote?: string,
) => {
  const [condition, setCondition] = useState<ArticleCondition>(initialCondition);
  const [defectiveCount, setDefectiveCount] = useState<number>(initialDefectiveCount);
  const [conditionNote, setConditionNote] = useState<string | undefined>(initialConditionNote);
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    setCondition(initialCondition);
    setDefectiveCount(initialDefectiveCount);
    setConditionNote(initialConditionNote);
    setIsDirty(false);
  }, [articleId, initialCondition, initialDefectiveCount, initialConditionNote]);

  useEffect(() => {
    if (condition !== 'defectueux') return;

    const max = Math.max(0, totalStock);
    if (defectiveCount > max) {
      setDefectiveCount(max);
      setIsDirty(true);
    }
  }, [condition, defectiveCount, totalStock]);

  const normalizedPayload = useMemo(
    () => ({
      condition,
      defectiveCount: condition === 'bon_etat' ? 0 : Math.max(0, Math.min(totalStock, defectiveCount)),
      conditionNote: condition === 'bon_etat' ? undefined : conditionNote,
    }),
    [condition, defectiveCount, totalStock, conditionNote],
  );

  const handleChange = (data: ChangePayload) => {
    const normalizedCount = data.condition === 'bon_etat'
      ? 0
      : Math.max(0, Math.min(totalStock, data.defectiveCount));

    setCondition(data.condition);
    setDefectiveCount(normalizedCount);
    setConditionNote(data.condition === 'bon_etat' ? undefined : data.conditionNote);
    setIsDirty(true);
  };

  const saveCondition = async (): Promise<boolean> => {
    if (!articleId || !isDirty) return false;

    setIsSaving(true);
    try {
      await articleRepository.update(articleId, {
        condition: normalizedPayload.condition,
        defectiveCount: normalizedPayload.defectiveCount,
        conditionNote: normalizedPayload.conditionNote,
      });
      setIsDirty(false);
      return true;
    } catch (error) {
      console.error('Erreur sauvegarde etat article:', error);
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  return {
    condition,
    defectiveCount,
    conditionNote,
    handleChange,
    saveCondition,
    isSaving,
    isDirty,
  };
};
