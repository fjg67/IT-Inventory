export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <a className={`brand${compact ? ' brand--compact' : ''}`} href="/" aria-label="IT-Inventory, accueil">
      <span className="brand__mark" aria-hidden="true">
        <svg viewBox="0 0 32 32" fill="none">
          <path d="m16 3 12 6.5v13L16 29 4 22.5v-13L16 3Z" />
          <path d="M16 16v13M4.5 10 16 16l11.5-6M10 6.3l12 6.5v6" />
        </svg>
      </span>
      <span className="brand__name">IT-Inventory<span>.</span></span>
    </a>
  );
}
