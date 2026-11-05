import type { ReactNode } from 'react';
import type { ScanMode } from './scanMode';

export type ScanVisualState = 'idle' | 'scanning' | 'success' | 'error';

export function ScanViewport({
  mode,
  state,
  children,
}: {
  mode: ScanMode;
  state: ScanVisualState;
  children: ReactNode;
}) {
  return (
    <div className={`scan-viewport scan-viewport--${mode}`} data-scan-state={state}>
      <div className="scan-viewport__grid" aria-hidden="true" />
      {children}
      <div className="scan-viewport__frame" aria-hidden="true">
        <i className="scan-viewport__corner scan-viewport__corner--top-left" />
        <i className="scan-viewport__corner scan-viewport__corner--top-right" />
        <i className="scan-viewport__corner scan-viewport__corner--bottom-left" />
        <i className="scan-viewport__corner scan-viewport__corner--bottom-right" />
        <i className="scan-viewport__laser" />
      </div>
      <span className="scan-viewport__state" aria-live="polite">
        {state === 'success' ? 'Code détecté' : state === 'error' ? 'Lecture interrompue' : state === 'scanning' ? 'Lecture en cours' : 'Zone de scan'}
      </span>
    </div>
  );
}
