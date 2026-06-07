import { useState } from 'react';
import { Article } from '@/types';

export const useRenamePC = (onSuccess: () => void) => {
  const [pcToRename, setPcToRename] = useState<Article | null>(null);

  const openRenameModal = (pc: Article) => setPcToRename(pc);
  const closeRenameModal = () => setPcToRename(null);

  const handleRenameSuccess = (_newDisplayName: string | null) => {
    closeRenameModal();
    onSuccess();
  };

  return {
    pcToRename,
    openRenameModal,
    closeRenameModal,
    handleRenameSuccess,
  };
};
