import { useEffect, useState } from 'react';
import type { ActiveSite, AvailableSite } from '../types/auth';
import { apiMessage } from '../services/apiClient';
import { siteService } from '../services/siteService';

export function SiteSwitcher({
  activeSite,
  disabled,
  error,
  onSelectSite,
}: {
  activeSite?: ActiveSite | null;
  disabled: boolean;
  error: string | null;
  onSelectSite: (siteId: string) => Promise<boolean>;
}) {
  const [open, setOpen] = useState(false);
  const [sites, setSites] = useState<AvailableSite[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [selecting, setSelecting] = useState(false);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    setLoading(true);
    setLoadingError(null);
    siteService.getAvailableSites(controller.signal)
      .then(setSites)
      .catch((reason: unknown) => {
        if (!controller.signal.aborted) setLoadingError(apiMessage(reason));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [open, reload]);

  useEffect(() => {
    if (!open) return;
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [open]);

  async function selectSite(siteId: string) {
    if (disabled || selecting) return;
    if (siteId === activeSite?.id) {
      setOpen(false);
      return;
    }
    setSelecting(true);
    try {
      if (await onSelectSite(siteId)) setOpen(false);
    } finally {
      setSelecting(false);
    }
  }

  return (
    <div className="site-switcher">
      <button
        className="site-pill"
        type="button"
        title={activeSite?.name ?? 'Aucun site actif dans la session'}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls="site-switcher-menu"
        onClick={() => setOpen((value) => !value)}
        disabled={disabled || selecting}
      >
        <Icon />
        <span>{activeSite?.name ?? 'Aucun site actif'}</span>
        <span className="site-pill__chevron" aria-hidden="true">{open ? '⌃' : '⌄'}</span>
      </button>
      {open && (
        <div className="site-switcher__menu" id="site-switcher-menu" role="menu" aria-label="Changer de site">
          <p className="site-switcher__heading">SITES DISPONIBLES</p>
          {loading && <p className="site-switcher__status" role="status">Chargement des sites…</p>}
          {loadingError && (
            <div className="site-switcher__error" role="alert">
              <span>{loadingError}</span>
              <button type="button" onClick={() => setReload((value) => value + 1)}>Réessayer</button>
            </div>
          )}
          {!loading && !loadingError && sites.length === 0 && (
            <p className="site-switcher__status">Aucun site actif disponible.</p>
          )}
          {!loadingError && sites.map((site) => (
            <button
              className="site-switcher__option"
              type="button"
              role="menuitem"
              key={site.id}
              disabled={selecting || disabled}
              onClick={() => { void selectSite(site.id); }}
            >
              <span className="site-switcher__option-name">{site.name}</span>
              {site.id === activeSite?.id
                ? <span className="site-switcher__current">Site actuel</span>
                : selecting && <span className="site-switcher__current">Ouverture…</span>}
            </button>
          ))}
          {error && <p className="site-switcher__error-message" role="alert">{error}</p>}
        </div>
      )}
    </div>
  );
}

function Icon() {
  return (
    <svg className="icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 20V5l8-3v18m0-12h8v12M2 20h20" />
      <path d="M7 7h2m-2 4h2m-2 4h2m6-3h2m-2 4h2" />
    </svg>
  );
}
