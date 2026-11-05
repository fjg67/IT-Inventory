import type { KeyboardEvent, RefObject } from 'react';

export function WedgeScanner({
  value,
  inputRef,
  onKeyDown,
  onChange,
  onSearch,
  submitLabel,
}: {
  value: string;
  inputRef: RefObject<HTMLInputElement | null>;
  onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
  onChange: (value: string) => void;
  onSearch: () => void;
  submitLabel: string;
}) {
  return (
    <form className="scan-entry scan-entry--wedge" onSubmit={(event) => { event.preventDefault(); onSearch(); }}>
      <div className="scan-entry__heading">
        <span className="scan-ready"><i aria-hidden="true" />Prêt à scanner</span>
        <span>La douchette envoie le code puis Entrée.</span>
      </div>
      <label htmlFor="scanner-wedge-code">Lecteur code-barres</label>
      <div className="scan-entry__controls">
        <input
          ref={inputRef}
          id="scanner-wedge-code"
          autoComplete="off"
          inputMode="none"
          value={value}
          onChange={(event) => onChange(event.currentTarget.value)}
          onKeyDown={onKeyDown}
          placeholder="En attente du prochain scan"
        />
        <button className="button button--primary" type="submit">{submitLabel}</button>
      </div>
    </form>
  );
}
