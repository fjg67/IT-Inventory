import type { ReactNode } from 'react';

export function CopyButton({ value, label, onCopy, children }: {
  value: string;
  label: string;
  onCopy: (value: string) => void;
  children?: ReactNode;
}) {
  return (
    <button className="article-reference__copy data-copy-button" type="button" title={`Copier ${label}`}
      aria-label={`Copier ${label} ${value}`} onClick={() => onCopy(value)}>
      {children ?? value}
      <svg viewBox="0 0 16 16" aria-hidden="true"><rect x="5.5" y="5.5" width="8" height="9" rx="1.5" /><path d="M10.5 3.5v-1A1.5 1.5 0 0 0 9 1H3a1.5 1.5 0 0 0-1.5 1.5v7A1.5 1.5 0 0 0 3 11h1" /></svg>
    </button>
  );
}
