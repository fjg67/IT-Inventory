import { useEffect, useState } from 'react';
import type { AuthSession } from '../types/auth';
import {
  readInvenBotMotionPreference,
  saveInvenBotMotionPreference,
  type InvenBotMotionPreference,
} from '../components/invenbot/motion';

type MotionPreference = 'system' | 'reduce';

const motionStorageKey = 'it-inventory-web-motion-preference';

const permissionLabels: Record<string, string> = {
  'dashboard:read': 'Consulter le tableau de bord',
  'articles:read': 'Consulter le catalogue des articles',
  'movements:read': 'Consulter les mouvements',
  'computers:read': 'Consulter le parc PC',
  'scanner:use': 'Rechercher un article avec le scanner',
  'stock-map:read': 'Consulter la cartographie du stock',
  'analytics:read': 'Consulter les analyses',
  'settings:read': 'Consulter les paramètres',
  'movements:write': 'Enregistrer des mouvements de stock',
};

export function SettingsPage({
  session,
  signingOut,
  onSignOut,
}: {
  session: AuthSession;
  signingOut: boolean;
  onSignOut: () => Promise<void>;
}) {
  const [motionPreference, setMotionPreference] = useState<MotionPreference>('system');
  const [storageError, setStorageError] = useState<string | null>(null);
  const [botMotion, setBotMotion] = useState<InvenBotMotionPreference>(readInvenBotMotionPreference);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(motionStorageKey);
      if (stored === 'system' || stored === 'reduce') setMotionPreference(stored);
    } catch {
      setStorageError('Le navigateur ne permet pas de lire les préférences locales.');
    }
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('reduce-motion', motionPreference === 'reduce');
  }, [motionPreference]);

  function updateMotionPreference(value: MotionPreference) {
    try {
      window.localStorage.setItem(motionStorageKey, value);
      setMotionPreference(value);
      setStorageError(null);
    } catch {
      setStorageError('Impossible d’enregistrer cette préférence dans le navigateur.');
    }
  }

  function updateBotMotion(value: InvenBotMotionPreference) {
    setBotMotion(value);
    if (saveInvenBotMotionPreference(value)) setStorageError(null);
    else setStorageError('Impossible d’enregistrer cette préférence dans le navigateur.');
  }

  const permissionNames = session.user.permissions.map((permission) =>
    permissionLabels[permission] ?? permission,
  );

  return (
    <section className="data-page" aria-labelledby="settings-heading">
      <div className="page-heading">
        <div>
          <span className="eyebrow">VOTRE ESPACE WEB</span>
          <h2 id="settings-heading">Paramètres</h2>
          <p>Consultez les informations de votre session et réglez l’accessibilité de cette interface.</p>
        </div>
        <span className="data-source"><span /> Session active</span>
      </div>

      <section className="panel settings-panel" aria-labelledby="session-heading">
        <div className="panel__heading">
          <div><span className="eyebrow">CONNEXION</span><h3 id="session-heading">Session actuelle</h3></div>
          <span className="settings-session-badge"><i /> Active</span>
        </div>
        <div className="settings-details">
          <SettingDetail label="Mode d’accès" value={session.authMode === 'shared' ? 'Mot de passe partagé' : 'Compte utilisateur'} />
          <SettingDetail label="Nom de session" value={session.user.name} />
          <SettingDetail label="Rôle" value={session.user.role} />
          <SettingDetail label="Site actif" value={session.activeSite?.name ?? 'Aucun site sélectionné'} />
        </div>
        {session.authMode === 'shared' && (
          <div className="settings-info" role="note">
            Le profil sélectionné sert à attribuer les mouvements, mais son identité n’est pas vérifiée individuellement par cette session partagée.
          </div>
        )}
        <div className="settings-panel__footer">
          <button className="button button--subtle settings-logout" type="button" disabled={signingOut} onClick={() => void onSignOut()}>
            {signingOut ? 'Déconnexion…' : 'Se déconnecter'}
          </button>
        </div>
      </section>

      <section className="panel settings-panel" aria-labelledby="permissions-heading">
        <div className="panel__heading">
          <div><span className="eyebrow">ACCÈS WEB</span><h3 id="permissions-heading">Modules disponibles</h3></div>
          <span className="panel__meta">{permissionNames.length} accès</span>
        </div>
        {permissionNames.length > 0 ? (
          <ul className="settings-permissions">
            {permissionNames.map((permission) => <li key={permission}><span aria-hidden="true">✓</span>{permission}</li>)}
          </ul>
        ) : (
          <p className="settings-empty">Aucun module n’est associé à cette session.</p>
        )}
        <p className="settings-caption">L’accès effectif à chaque donnée est toujours vérifié par le serveur et limité au site actif.</p>
      </section>

      <section className="panel settings-panel" aria-labelledby="accessibility-heading">
        <div className="panel__heading">
          <div><span className="eyebrow">CONFORT D’UTILISATION</span><h3 id="accessibility-heading">Animations</h3></div>
        </div>
        <div className="settings-preference">
          <div>
            <strong>Réduire les animations</strong>
            <span>La préférence système de réduction des animations est respectée par défaut.</span>
          </div>
          <div className="settings-choice" role="group" aria-label="Préférence d’animation">
            <button type="button" aria-pressed={motionPreference === 'system'} onClick={() => updateMotionPreference('system')}>Système</button>
            <button type="button" aria-pressed={motionPreference === 'reduce'} onClick={() => updateMotionPreference('reduce')}>Réduites</button>
          </div>
        </div>
        <div className="settings-preference">
          <div>
            <strong>Animations d’InvenBot</strong>
            <span>Réduites : expressions sans mouvement. Désactivées : mascotte immobile.</span>
          </div>
          <div className="settings-choice" role="group" aria-label="Animations d’InvenBot">
            <button type="button" aria-pressed={botMotion === 'full'} onClick={() => updateBotMotion('full')}>Complètes</button>
            <button type="button" aria-pressed={botMotion === 'reduced'} onClick={() => updateBotMotion('reduced')}>Réduites</button>
            <button type="button" aria-pressed={botMotion === 'off'} onClick={() => updateBotMotion('off')}>Désactivées</button>
          </div>
        </div>
        {storageError && <p className="settings-storage-error" role="alert">{storageError}</p>}
      </section>
    </section>
  );
}

function SettingDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="settings-detail">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
