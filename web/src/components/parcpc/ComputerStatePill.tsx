import { memo } from 'react';
import type { PCState } from '../../types/inventory';
import { ComputerStateIcon, computerStateLabels } from './computerStates';

export const ComputerStatePill = memo(function ComputerStatePill({ state }: { state: PCState }) {
  return (
    <span className={`pc-state-pill pc-state--${state}`}>
      <span className={state === 'en_usinage' ? 'pc-state-gear' : undefined}><ComputerStateIcon state={state} gear /></span>
      {computerStateLabels[state]}
      {state === 'en_panne' && <i aria-hidden="true" />}
    </span>
  );
});
