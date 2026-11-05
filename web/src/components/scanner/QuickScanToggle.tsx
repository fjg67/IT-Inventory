export function QuickScanToggle({
  enabled,
  onChange,
  descriptionId,
}: {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  descriptionId: string;
}) {
  return (
    <button
      className={`scanner-quick-scan${enabled ? ' is-enabled' : ''}`}
      type="button"
      aria-pressed={enabled}
      aria-describedby={descriptionId}
      onClick={() => onChange(!enabled)}
    >
      <span>Scan rapide</span>
      <strong>{enabled ? 'ON' : 'OFF'}</strong>
    </button>
  );
}
