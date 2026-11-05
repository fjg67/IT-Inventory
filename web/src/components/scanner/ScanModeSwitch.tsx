import { useRef, type KeyboardEvent } from 'react';
import type { ScanMode } from './scanMode';

const modes: { value: ScanMode; label: string }[] = [
  { value: 'camera', label: 'Caméra' },
  { value: 'wedge', label: 'Douchette' },
  { value: 'manual', label: 'Saisie manuelle' },
];

export function ScanModeSwitch({ value, onChange }: { value: ScanMode; onChange: (mode: ScanMode) => void }) {
  const buttons = useRef<Array<HTMLButtonElement | null>>([]);

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    const currentIndex = modes.findIndex((mode) => mode.value === value);
    let nextIndex = currentIndex;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') nextIndex = (currentIndex + 1) % modes.length;
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') nextIndex = (currentIndex - 1 + modes.length) % modes.length;
    else if (event.key === 'Home') nextIndex = 0;
    else if (event.key === 'End') nextIndex = modes.length - 1;
    else return;

    event.preventDefault();
    const nextMode = modes[nextIndex];
    onChange(nextMode.value);
    buttons.current[nextIndex]?.focus();
  }

  return (
    <div className="scan-mode-switch" role="radiogroup" aria-label="Mode de scan">
      {modes.map((mode, index) => (
        <button
          key={mode.value}
          ref={(element) => { buttons.current[index] = element; }}
          className={`scan-mode-switch__option${value === mode.value ? ' is-selected' : ''}`}
          type="button"
          role="radio"
          aria-checked={value === mode.value}
          tabIndex={value === mode.value ? 0 : -1}
          onClick={() => onChange(mode.value)}
          onKeyDown={handleKeyDown}
        >
          <ModeIcon mode={mode.value} />
          <span>{mode.label}</span>
        </button>
      ))}
    </div>
  );
}

function ModeIcon({ mode }: { mode: ScanMode }) {
  if (mode === 'camera') {
    return <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3 6.5h3l1.2-2h5.6l1.2 2h3v9H3z" /><circle cx="10" cy="11" r="3" /></svg>;
  }
  if (mode === 'wedge') {
    return <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3 4v3m3-3v3m3-3v3m3-3v3m3-3v3m2 2H3v7h14z" /><path d="M7 12h6" /></svg>;
  }
  return <svg viewBox="0 0 20 20" aria-hidden="true"><rect x="3" y="3.5" width="14" height="13" rx="2" /><path d="M6 7h8M6 10h2m2 0h1m2 0h1M6 13h8" /></svg>;
}
