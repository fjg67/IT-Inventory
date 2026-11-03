import { useEffect, useState } from 'react';
import type { AvailableSite } from '../types/auth';
import { siteService } from '../services/siteService';
import { ApiError } from '../services/apiClient';
import { Brand } from './Brand';
import { InvenBot } from './InvenBot';

export function SharedSiteSelection({
  busy,
  error,
  serviceError,
  onSelectSite,
  onSignOut,
}: {
  busy: boolean;
  error: string | null;
  serviceError: string | null;
  onSelectSite: (siteId: string) => Promise<boolean>;
  onSignOut: () => Promise<void>;
}) {
  const [sites, setSites] = useState<AvailableSite[]>([]);
  const [parentSite, setParentSite] = useState<AvailableSite | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selecting, setSelecting] = useState<string | null>(null);

  const rootSites = sites
    .filter((site) => site.parentSiteId === null)
    .sort((left, right) => {
      const priority = (site: AvailableSite) => {
        const name = site.name.toLocaleLowerCase();
        if (name.includes('strasbourg') || name.includes('siege')) return 0;
        if (name.includes('agence')) return 1;
        return 2;
      };
      return priority(left) - priority(right) || left.name.localeCompare(right.name, 'fr');
    });
  const visibleSites = parentSite
    ? sites
      .filter((site) => site.parentSiteId === parentSite.id)
      .sort((left, right) => left.name.localeCompare(right.name, 'fr'))
    : rootSites;

  async function selectSite(site: AvailableSite) {
    if (busy || selecting) return;
    const children = sites.filter((candidate) => candidate.parentSiteId === site.id);
    if (children.length > 0) {
      setParentSite(site);
      return;
    }
    setSelecting(site.id);
    try {
      await onSelectSite(site.id);
    } finally {
      setSelecting(null);
    }
  }

  useEffect(() => {
    const controller = new AbortController();
    siteService.getAvailableSites(controller.signal)
      .then(setSites)
      .catch((cause: unknown) => {
        if (!controller.signal.aborted) {
          setLoadError(cause instanceof ApiError ? cause.message : 'Impossible de charger les sites.');
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, []);

  return (
    <main className="login-panel site-selection-panel">
      <div className="login-panel__top">
        <Brand />
        <button className="site-selection__logout" type="button" onClick={onSignOut} disabled={busy}>
          Se déconnecter
        </button>
      </div>

      <div className="login-panel__content site-selection__content">
        <div className="login-intro">
          <InvenBot size="small" state={loading ? 'checking' : loadError ? 'warning' : 'idle'} />
          <p className="eyebrow">
            {parentSite ? `ESPACE · ${parentSite.name}` : 'VOTRE ESPACE DE GESTION'}
          </p>
          <h1>{parentSite ? 'Choisissez votre site.' : 'Choisissez votre espace.'}</h1>
          <p className="login-intro__copy">
            {parentSite
              ? `Sélectionnez un site de ${parentSite.name} pour consulter son stock et son tableau de bord.`
              : 'Commencez par choisir Strasbourg Général ou Agence.'}
          </p>
        </div>

        {parentSite && (
          <button
            className="site-selection__back"
            type="button"
            onClick={() => setParentSite(null)}
            disabled={busy || selecting !== null}
          >
            ‹ Retour aux espaces
          </button>
        )}

        {(error || serviceError || loadError) && (
          <div className="notice notice--error" role="alert">{error || serviceError || loadError}</div>
        )}

        {loading ? (
          <p className="site-selection__status" role="status">Chargement des sites…</p>
        ) : visibleSites.length > 0 ? (
          <div className="site-selection__list" aria-label={parentSite ? `Sites de ${parentSite.name}` : 'Espaces disponibles'}>
            {visibleSites.map((site) => {
              return (
              <button
                className="site-selection__item"
                key={site.id}
                type="button"
                disabled={busy || selecting !== null}
                onClick={() => { void selectSite(site); }}
              >
                <span className="site-selection__icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none">
                    <path d="M4 20V5l8-3v18m0-12h8v12M2 20h20" />
                    <path d="M7 7h2m-2 4h2m-2 4h2m6-3h2m-2 4h2" />
                  </svg>
                </span>
                <span className="site-selection__name">{site.name}</span>
                <span className="site-selection__arrow" aria-hidden="true">
                  {selecting === site.id ? '…' : '›'}
                </span>
              </button>
              );
            })}
          </div>
        ) : (
          <p className="site-selection__status" role="status">
            {parentSite
              ? `Aucun site actif n’est rattaché à ${parentSite.name}.`
              : 'Aucun espace actif n’est disponible pour le moment.'}
          </p>
        )}

        {busy && <p className="site-selection__status" role="status">Ouverture du site…</p>}
      </div>

      <p className="login-panel__foot">© IT-Inventory · Gestion de stock informatique</p>
    </main>
  );
}
