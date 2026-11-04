import type { StockMovementInput } from '../../services/movementService';

export function MovementMascot({ type }: { type: StockMovementInput['type'] }) {
  return (
    <svg
      className="movement-mascot"
      data-movement-mascot={type}
      viewBox="0 0 96 96"
      aria-hidden="true"
      focusable="false"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {type === 'ENTRY' && (
        <g>
          <circle cx="48" cy="48" r="44" fill="#e1f6ec" />
          <path d="M14 23v14m-5-5 5 5 5-5" fill="none" stroke="#38a47d" strokeWidth="3" />
          <path d="M46 20v-8" stroke="#258a6b" strokeWidth="3" />
          <circle cx="46" cy="11" r="4" fill="#ffc969" stroke="#b48127" strokeWidth="1.5" />
          <path d="M30 78v5m28-5v5" stroke="#278f70" strokeWidth="6" />
          <rect x="28" y="54" width="38" height="27" rx="11" fill="#f3fffa" stroke="#77bda3" strokeWidth="2" />
          <rect x="21" y="20" width="50" height="40" rx="16" fill="#41b992" stroke="#218366" strokeWidth="2" />
          <path d="M30 27c5-3 10-4 16-4" fill="none" stroke="#a8f4d8" strokeWidth="2.5" />
          <rect x="27" y="30" width="38" height="22" rx="11" fill="#173f3b" />
          <ellipse cx="38" cy="39" rx="3.3" ry="4.3" fill="#b9ffe2" />
          <ellipse cx="54" cy="39" rx="3.3" ry="4.3" fill="#b9ffe2" />
          <path d="M41 47q5 4 10 0" fill="none" stroke="#b9ffe2" strokeWidth="2" />
          <path d="M28 66 22 70m41-4 7 3" fill="none" stroke="#218366" strokeWidth="5" />
          <rect x="53" y="61" width="27" height="21" rx="3" fill="#e8b87c" stroke="#a46f38" strokeWidth="2" />
          <path d="M66.5 65v10m-4-4 4 4 4-4" fill="none" stroke="#8c5a2c" strokeWidth="2" />
        </g>
      )}
      {type === 'EXIT' && (
        <g>
          <circle cx="48" cy="48" r="44" fill="#fff0e3" />
          <path d="M72 26h13m-5-5 5 5-5 5" fill="none" stroke="#cf7544" strokeWidth="3" />
          <path d="M31 78v5m24-5v5" stroke="#c76c3f" strokeWidth="6" />
          <rect x="27" y="54" width="33" height="27" rx="14" fill="#fff8ef" stroke="#e1a675" strokeWidth="2" />
          <circle cx="42" cy="37" r="23" fill="#f0a16b" stroke="#bd6b40" strokeWidth="2" />
          <circle cx="19" cy="38" r="5" fill="#e88950" />
          <circle cx="65" cy="38" r="5" fill="#e88950" />
          <ellipse cx="42" cy="39" rx="17" ry="12" fill="#4a302c" />
          <circle cx="36" cy="38" r="3" fill="#fff0d9" />
          <circle cx="48" cy="38" r="3" fill="#fff0d9" />
          <path d="M38 45q4 3 8 0" fill="none" stroke="#fff0d9" strokeWidth="2" />
          <path d="M28 65 21 70m36-5 8 3" fill="none" stroke="#c76c3f" strokeWidth="5" />
          <rect x="57" y="59" width="25" height="22" rx="3" fill="#e8b87c" stroke="#a46f38" strokeWidth="2" />
          <path d="M62 70h12m-4-4 4 4-4 4" fill="none" stroke="#8c5a2c" strokeWidth="2" />
        </g>
      )}
      {type === 'ADJUSTMENT' && (
        <g>
          <circle cx="48" cy="48" r="44" fill="#f0edff" />
          <path d="M43 20v-8" stroke="#7566b5" strokeWidth="3" />
          <rect x="38" y="8" width="10" height="6" rx="3" fill="#d2c7ff" stroke="#7566b5" strokeWidth="1.5" />
          <path d="M28 78v5m28-5v5" stroke="#7566b5" strokeWidth="6" />
          <rect x="26" y="54" width="35" height="27" rx="10" fill="#f9f7ff" stroke="#b8abe4" strokeWidth="2" />
          <rect x="19" y="20" width="50" height="40" rx="10" fill="#9689d8" stroke="#6f61b2" strokeWidth="2" />
          <path d="M24 28h40" stroke="#c7bfff" strokeWidth="2" />
          <rect x="25" y="31" width="38" height="21" rx="8" fill="#302b50" />
          <circle cx="36" cy="40" r="6" fill="none" stroke="#c9f1ff" strokeWidth="2" />
          <circle cx="52" cy="40" r="6" fill="none" stroke="#c9f1ff" strokeWidth="2" />
          <path d="M42 40h4m-5 8q3 2 6 0" fill="none" stroke="#c9f1ff" strokeWidth="2" />
          <path d="M27 67 21 70m39-4 5 4" fill="none" stroke="#7566b5" strokeWidth="5" />
          <rect x="57" y="52" width="25" height="31" rx="4" fill="#fff" stroke="#8a80b8" strokeWidth="2" />
          <rect x="64" y="49" width="11" height="6" rx="2" fill="#d8d1f6" stroke="#8a80b8" strokeWidth="1.5" />
          <path d="m62 63 2 2 4-4m-6 10 2 2 4-4m3-5h6m-6 8h6" fill="none" stroke="#42a77a" strokeWidth="1.8" />
        </g>
      )}
      {type === 'TRANSFER' && (
        <g>
          <circle cx="48" cy="48" r="44" fill="#e8f3ff" />
          <path d="M69 24h15m-4-4 4 4-4 4M83 35H68m4-4-4 4 4 4" fill="none" stroke="#4c83c5" strokeWidth="2.5" />
          <rect x="22" y="56" width="52" height="20" rx="7" fill="#d8eaff" stroke="#5891c8" strokeWidth="2" />
          <circle cx="33" cy="77" r="6" fill="#355b8a" />
          <circle cx="63" cy="77" r="6" fill="#355b8a" />
          <circle cx="33" cy="77" r="2" fill="#d8eaff" />
          <circle cx="63" cy="77" r="2" fill="#d8eaff" />
          <rect x="23" y="19" width="46" height="39" rx="14" fill="#64a5e8" stroke="#3b79bc" strokeWidth="2" />
          <path d="M25 25c2-9 10-13 21-13s19 4 21 13Z" fill="#3777be" />
          <path d="M23 25h48" stroke="#2d629e" strokeWidth="4" />
          <rect x="29" y="31" width="34" height="20" rx="10" fill="#233b5d" />
          <circle cx="39" cy="39" r="3" fill="#c4f4ff" />
          <circle cx="53" cy="39" r="3" fill="#c4f4ff" />
          <path d="M42 46q4 3 8 0" fill="none" stroke="#c4f4ff" strokeWidth="2" />
          <path d="M24 64 18 68m55-4 6 4" fill="none" stroke="#4b88c9" strokeWidth="5" />
          <rect x="58" y="59" width="23" height="17" rx="3" fill="#e8b87c" stroke="#a46f38" strokeWidth="2" />
          <path d="M65 59v6h9v-6" fill="none" stroke="#a46f38" strokeWidth="1.5" />
        </g>
      )}
    </svg>
  );
}
