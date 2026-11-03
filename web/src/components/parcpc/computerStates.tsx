import type { PCState } from '../../types/inventory';

export const lifecycleStates: PCState[] = ['a_chaud', 'a_reusiner', 'en_usinage', 'disponible', 'envoye'];
export const computerStates: PCState[] = [...lifecycleStates, 'en_panne'];
export const computerStateLabels: Record<PCState, string> = {
  a_chaud: 'À chaud',
  a_reusiner: 'À reusiner',
  en_usinage: 'En usinage',
  disponible: 'Disponible',
  envoye: 'Envoyés',
  en_panne: 'En panne',
};

export function ComputerStateIcon({ state, gear = false }: { state: PCState; gear?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      {state === 'a_chaud' && <path d="M13 3c1 5-4 5-2 9 2-1 3-3 3-3 4 3 6 6 3 10-2 3-8 3-10-1C3 12 9 9 13 3Z" />}
      {state === 'a_reusiner' && <><circle cx="10" cy="10" r="6" /><path d="m15 15 6 6M7 10h6" /></>}
      {state === 'en_usinage' && (gear
        ? <><path d="m10 3-.8 3-2 .9-2.8-.8-2 3.5 2.2 2.1v2.6l-2.2 2.1 2 3.5 2.8-.8 2 .9.8 3h4l.8-3 2-.9 2.8.8 2-3.5-2.2-2.1v-2.6l2.2-2.1-2-3.5-2.8.8-2-.9-.8-3Z" transform="translate(0 -1) scale(1 .96)" /><circle cx="12" cy="12" r="3" /></>
        : <path d="M14 4a5 5 0 0 0-5.8 6.8L3 16a3 3 0 0 0 4 4l5.2-5.2A5 5 0 0 0 19 9l-3 3-4-4 3-3Z" />)}
      {state === 'disponible' && <><circle cx="12" cy="12" r="9" /><path d="m7.5 12 3 3 6-6" /></>}
      {state === 'envoye' && <><path d="m3 4 19 8-19 8 4-8-4-8Zm4 8h15" /></>}
      {state === 'en_panne' && <><rect x="3" y="3" width="18" height="18" rx="5" /><path d="M12 7v10M7 12h10" /></>}
    </svg>
  );
}
