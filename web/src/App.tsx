import { useEffect, useState } from 'react';
import { Brand } from './components/Brand';
import { InvenBot } from './components/InvenBot';
import { LoginForm } from './components/LoginForm';
import { SharedSiteSelection } from './components/SharedSiteSelection';
import { SharedTechnicianSelection } from './components/SharedTechnicianSelection';
import { Workspace } from './components/Workspace';
import { InvenBotPlayground, isInvenBotDebug } from './components/invenbot/InvenBotDebug';
import { authService, AuthServiceError } from './services/authService';
import type { AuthSession } from './types/auth';

type BootState = 'loading' | 'ready';

export default function App() {
  const [bootState, setBootState] = useState<BootState>('loading');
  const [session, setSession] = useState<AuthSession | null>(null);
  const [serviceError, setServiceError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    authService.getSession(controller.signal)
      .then((currentSession) => {
        if (!controller.signal.aborted) {
          setSession(currentSession);
          setServiceError(null);
        }
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          setServiceError(messageFor(error));
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setBootState('ready');
      });
    return () => controller.abort();
  }, []);

  async function handleSignIn(password: string) {
    setBusy(true);
    setFormError(null);
    try {
      const authenticatedSession = await authService.signIn(password);
      setSession(authenticatedSession);
      setServiceError(null);
    } catch (error) {
      setFormError(messageFor(error));
    } finally {
      setBusy(false);
    }
  }

  async function handleSelectSite(siteId: string): Promise<boolean> {
    setBusy(true);
    setFormError(null);
    try {
      const selectedSession = await authService.selectSite(siteId);
      setSession(selectedSession);
      setServiceError(null);
      return true;
    } catch (error) {
      setFormError(messageFor(error));
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function handleSelectTechnician(technicianId: string): Promise<boolean> {
    setBusy(true);
    setFormError(null);
    try {
      const selectedSession = await authService.selectTechnician(technicianId);
      setSession(selectedSession);
      setServiceError(null);
      return true;
    } catch (error) {
      setFormError(messageFor(error));
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function handleSignOut() {
    setSigningOut(true);
    setFormError(null);
    try {
      await authService.signOut();
      setSession(null);
    } catch (error) {
      setFormError(messageFor(error));
    } finally {
      setSigningOut(false);
    }
  }

  if (!session && bootState === 'ready' && isInvenBotDebug()) return <InvenBotPlayground />;

  if (bootState === 'loading') {
    return (
      <main className="boot-screen" aria-live="polite" aria-label="Chargement de la session">
        <Brand />
        <InvenBot size="small" state="checking" />
        <p>Vérification de votre session…</p>
      </main>
    );
  }

  if (session) {
    if (session.authMode === 'shared' && !session.activeSite) {
      return (
        <div className="login-page">
          <section className="brand-panel" aria-label="Présentation IT-Inventory">
            <div className="brand-panel__top">
              <Brand />
              <span className="brand-panel__edition">INVENTORY MANAGEMENT</span>
            </div>
            <div className="brand-panel__hero">
              <div className="brand-panel__glow" />
              <div className="brand-panel__bot"><InvenBot size="large" /></div>
              <div className="brand-panel__message">
                <span className="eyebrow">PILOTEZ VOTRE PARC IT</span>
                <h2>Tout votre inventaire.<br /> <span>En un seul endroit.</span></h2>
                <p>Une vue claire sur vos équipements, vos stocks et les mouvements de vos sites.</p>
              </div>
            </div>
          </section>
          <SharedSiteSelection
            busy={busy || signingOut}
            error={formError}
            serviceError={serviceError}
            onSelectSite={handleSelectSite}
            onSignOut={handleSignOut}
          />
        </div>
      );
    }
    if (session.authMode === 'shared' && session.activeSite && !session.activeTechnician) {
      return (
        <div className="login-page">
          <section className="brand-panel" aria-label="Présentation IT-Inventory">
            <div className="brand-panel__top">
              <Brand />
              <span className="brand-panel__edition">INVENTORY MANAGEMENT</span>
            </div>
            <div className="brand-panel__hero">
              <div className="brand-panel__glow" />
              <div className="brand-panel__bot"><InvenBot size="large" /></div>
              <div className="brand-panel__message">
                <span className="eyebrow">PILOTEZ VOTRE PARC IT</span>
                <h2>Tout votre inventaire.<br /> <span>En un seul endroit.</span></h2>
                <p>Une vue claire sur vos équipements, vos stocks et les mouvements de vos sites.</p>
              </div>
            </div>
          </section>
          <SharedTechnicianSelection
            siteName={session.activeSite.name}
            busy={busy || signingOut}
            error={formError}
            serviceError={serviceError}
            onSelectTechnician={handleSelectTechnician}
            onSignOut={handleSignOut}
          />
        </div>
      );
    }
    return (
      <Workspace
        session={session}
        signingOut={signingOut}
        error={formError}
        onSelectSite={handleSelectSite}
        onSignOut={handleSignOut}
      />
    );
  }

  return (
    <div className="login-page">
      <section className="brand-panel" aria-label="Présentation IT-Inventory">
        <div className="brand-panel__top">
          <Brand />
          <span className="brand-panel__edition">INVENTORY MANAGEMENT</span>
        </div>

        <div className="brand-panel__hero">
          <div className="brand-panel__glow" />
          <div className="brand-panel__bot">
            <InvenBot size="large" />
          </div>
          <div className="brand-panel__message">
            <span className="eyebrow">PILOTEZ VOTRE PARC IT</span>
            <h2>Tout votre inventaire.<br /> <span>En un seul endroit.</span></h2>
            <p>Une vue claire sur vos équipements, vos stocks et les mouvements de vos sites.</p>
          </div>
          <div className="brand-panel__chips" aria-label="Fonctionnalités">
            <span><i className="chip-dot chip-dot--green" /> Stocks multi-sites</span>
            <span><i className="chip-dot chip-dot--blue" /> Parc informatique</span>
            <span><i className="chip-dot chip-dot--amber" /> Suivi des mouvements</span>
          </div>
        </div>

        <footer className="brand-panel__footer">
          <span>Conçu pour les équipes IT</span>
          <span>IT-Inventory <i /> Web</span>
        </footer>
      </section>

      <LoginForm
        onSubmit={handleSignIn}
        busy={busy}
        error={formError}
        serviceError={serviceError}
      />
    </div>
  );
}

function messageFor(error: unknown): string {
  if (error instanceof AuthServiceError) return error.message;
  return 'Une erreur inattendue est survenue. Réessayez.';
}
