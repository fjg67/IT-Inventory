import { useMemo } from 'react';
import { MovementType } from '@/components/movement/movementTheme';

export const useStockPreview = (
  currentStock: number,
  quantity: number,
  type: MovementType | null,
  stockMin: number = 0,
) => {
  const newStock = useMemo(() => {
    if (!type) return currentStock;
    if (type === 'entree') return currentStock + quantity;
    if (type === 'sortie') return Math.max(0, currentStock - quantity);
    return quantity;
  }, [currentStock, quantity, type]);

  const delta = newStock - currentStock;
  const isSafe = newStock > stockMin;
  const isWarning = newStock <= stockMin && newStock > 0;
  const isDanger = newStock === 0;

  return { newStock, delta, isSafe, isWarning, isDanger };
};
