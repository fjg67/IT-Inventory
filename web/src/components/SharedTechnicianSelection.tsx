import { useEffect, useState } from 'react';
import type { AvailableTechnician } from '../types/auth';
import { ApiError, apiMessage } from '../services/apiClient';
import { technicianService } from '../services/technicianService';
import { Brand } from './Brand';
import { InvenBot } from './InvenBot';

export function SharedTechnicianSelection({
  siteName,
  busy,
  error,
  serviceError,
  onSelectTechnician,
  onSignOut,
}: {
  siteName: string;
  busy: boolean;
  error: string | null;
  serviceError: string | null;
  onSelectTechnician: (technicianId: string) => Promise<boolean>;
  onSignOut: () => Promise<void>;
}) {
  const [technicians, setTechnicians] = useState<AvailableTechnician[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selecting, setSelecting] = useState<string | null>(null);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    technicianService.getForActiveSite(controller.signal)
      .then(setTechnicians)
      .catch((cause: unknown) => {
        if (!controller.signal.aborted) {
          setLoadError(cause instanceof ApiError ? cause.message : apiMessage(cause));
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [reload]);

  async function selectTechnician(technicianId: string) {
    if (busy || selecting) return;
    setSelecting(technicianId);
    try {
      await onSelectTechnician(technicianId);
    } finally {
      setSelecting(null);
    }
  }

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
          <p className="eyebrow">SITE ACTIF · {siteName}</p>
          <h1>Qui êtes-vous ?</h1>
          <p className="login-intro__copy">
            Choisissez votre profil technicien pour associer les opérations à votre nom.
          </p>
        </div>

        {(error || serviceError || loadError) && (
          <div className="notice notice--error" role="alert">{error || serviceError || loadError}</div>
        )}

        {loading ? (
          <p className="site-selection__status" role="status">Chargement des profils…</p>
        ) : loadError ? (
          <div className="site-selection__error" role="alert">
            <span>{loadError}</span>
            <button type="button" onClick={() => { setLoading(true); setLoadError(null); setReload((value) => value + 1); }}>
              Réessayer
            </button>
          </div>
        ) : technicians.length > 0 ? (
          <div className="site-selection__list" aria-label="Profils techniciens">
            {technicians.map((technician) => (
              <button
                className="site-selection__item"
                key={technician.id}
                type="button"
                disabled={busy || selecting !== null}
                onClick={() => { void selectTechnician(technician.id); }}
              >
                <span className="site-selection__icon site-selection__icon--technician" aria-hidden="true">
                  {technician.name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase()}
                </span>
                <span className="site-selection__name">{technician.name}</span>
                <span className="site-selection__arrow" aria-hidden="true">
                  {selecting === technician.id ? '…' : '›'}
                </span>
              </button>
            ))}
          </div>
        ) : (
          <p className="site-selection__status" role="status">
            Aucun profil technicien actif n’est associé à ce site.
          </p>
        )}
      </div>

      <p className="login-panel__foot">© IT-Inventory · Gestion de stock informatique</p>
    </main>
  );
}
