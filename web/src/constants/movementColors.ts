import type { MovementFlowType } from '../components/movements/movementInsights';

export const MOVEMENT_COLORS: Record<MovementFlowType, string> = {
  ENTRY: 'var(--movement-entry)',
  EXIT: 'var(--movement-exit)',
  ADJUSTMENT: 'var(--movement-adjustment)',
  TRANSFER: 'var(--movement-transfer)',
};
